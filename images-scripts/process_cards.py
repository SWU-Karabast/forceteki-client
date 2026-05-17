"""End-to-end card image pipeline: download -> resize -> truncate -> fallback -> upload.

See README.md for usage. Run `python process_cards.py --help` for CLI reference.
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import hashlib
import os
import random
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import boto3
import botocore
import cv2
import requests
from botocore.exceptions import (
    ClientError,
    NoCredentialsError,
    PartialCredentialsError,
    SSOTokenLoadError,
    TokenRetrievalError,
    UnauthorizedSSOTokenError,
)
from PIL import Image, ImageFilter
from tqdm import tqdm

# ─────────────────────────── Output verbosity ─────────────────────────────
#
# When False (the default), per-item status lines like "+ resize ...",
# "= skip ...", "+ upload ..." are suppressed and each stage shows a single
# tqdm progress bar instead. Stage headers, warnings (lines starting with
# "!"), and per-stage summaries are always shown. Set via --verbose on the
# command line; flipped once in main() before any stages run.
VERBOSE: bool = False


def vprint(*args, **kwargs) -> None:
    """Print only when --verbose is set. Use for per-item success/skip lines."""
    if VERBOSE:
        print(*args, **kwargs)


def _maybe_progress(iterable, *, total: int, desc: str, unit: str = "item"):
    """Wrap `iterable` in a tqdm bar unless verbose mode is on.

    In verbose mode we return the iterable unchanged so per-item prints can
    interleave normally. In quiet mode tqdm renders a single self-updating
    line per stage; we use leave=False so finished bars are removed and the
    final on-screen output is the always-on stage summary.
    """
    if VERBOSE:
        return iterable
    return tqdm(iterable, total=total, desc=desc, unit=unit, leave=False, dynamic_ncols=True)

# ─────────────────────────── Config / Defaults ────────────────────────────

# Bumped at set rotation. Override per-invocation with --set.
DEFAULT_SET_CODE = "ASH"

# swudb hosts only English images. Non-English locales are pulled from FFG.
DEFAULT_SOURCE_URL = "https://swudb.com/images/cards/{set}/{n}.png"
DEFAULT_TOKEN_SOURCE_URL = "https://swudb.com/images/cards/T{set}/{n}.png"

# FFG card data API. Used to look up localized image URLs by (set, cardNumber)
# for non-English locales. English never queries this.
FFG_API_BASE = "https://admin.starwarsunlimited.com/api/cards"

DEFAULT_BUCKET = "karabast-data"
# `{set}` and `{locale}` are filled in at job-collection time.
DEFAULT_KEY_PREFIX = "cards/{set}/{locale}/"
TOKEN_KEY_PREFIX = "cards/_tokens/{locale}/"

# Locales supported in S3. English is the canonical fallback for cards that
# are not yet present in FFG (preview cards lag FFG by weeks/months).
DEFAULT_LOCALES = ("en", "fr", "de", "es", "it")

# Pipeline stages, ordered. --to STAGE runs all stages up to and including STAGE.
# `fallback` copies any missing per-locale webps from the `en` working tree
# before upload, so the S3 layout is "complete" for every locale even when
# FFG has no localized image for a card yet.
STAGES = ("download", "resize", "truncate", "fallback", "upload")

# Sizes / quality
LARGE_DIMENSION = 400
SMALL_DIMENSION = 200
TRUNC_LARGE_DIMENSION = 180
TRUNC_SMALL_DIMENSION = 100
TOP_CROP_HEIGHT = 255
BOTTOM_CROP_HEIGHT = 32
WEBP_QUALITY = 90

# Download tuning
MAX_ATTEMPTS = 265
LEADER_ATTEMPTS = 30
HTTP_TIMEOUT = 10

# Per-set override of MAX_ATTEMPTS. Applied only when the user did not
# pass --max-attempts on the command line. TS26 only ships 84 cards, so
# probing all the way to 265 wastes ~180 swudb GETs (each tried at 2
# widths by the TS26 branch in `_download_card_swudb`).
PER_SET_MAX_ATTEMPTS: dict[str, int] = {
    "TS26": 100,
}

# Retry tuning for flaky upstreams (matches fetchdata.js policy).
HTTP_RETRY_ATTEMPTS = 3
HTTP_RETRY_BASE_DELAY = 1.0  # seconds
HTTP_RETRY_JITTER = 2.0      # seconds

# Parallelism for download, resize, truncate, and upload stages.
# Override with --workers N. Default chosen to be friendly to swudb.com and
# to local CPU/disk while still being meaningfully faster than serial.
DEFAULT_WORKERS = 8

# Repo-relative working directory (this script's directory)
SCRIPT_DIR = Path(__file__).resolve().parent

# Single top-level cache root for everything the script reads/writes locally.
# Layout:
#   card-images/downloaded/{SET or T{SET}}/{locale}/...png   (raw PNGs)
#   card-images/processed/{SET}/{locale}/{standard,truncated}/{large,small}/...webp
#   card-images/processed/T{SET}/{locale}/{standard,truncated}/...webp
CACHE_ROOT = SCRIPT_DIR / "card-images"
DOWNLOADS_ROOT = CACHE_ROOT / "downloaded"
PROCESSED_ROOT = CACHE_ROOT / "processed"


# ───────────────────────────── Path helpers ───────────────────────────────
#
# Every helper takes a `locale`. Working tree shape:
#   card-images/downloaded/{SET}/{locale}/{NNN}.png
#   card-images/downloaded/T{SET}/{locale}/{id}.png
#   card-images/processed/{SET}/{locale}/standard/{large,small}/{NNN}.webp
#   card-images/processed/{SET}/{locale}/truncated/{large,small}/{NNN}.webp
#   card-images/processed/T{SET}/{locale}/{standard,truncated}/{id}.webp  (no size split)
#
# S3 keys mirror the processed shape:
#   cards/{SET}/{locale}/{standard,truncated}/{large,small}/{NNN}.webp
#   cards/_tokens/{locale}/{standard,truncated}/{id}.webp


def downloads_dir(set_code: str, locale: str, *, tokens: bool = False) -> Path:
    name = f"T{set_code}" if tokens else set_code
    return DOWNLOADS_ROOT / name / locale


def standard_dir(set_code: str, locale: str, size: str) -> Path:
    return PROCESSED_ROOT / set_code / locale / "standard" / size


def truncated_dir(set_code: str, locale: str, size: str) -> Path:
    return PROCESSED_ROOT / set_code / locale / "truncated" / size


def token_format_dir(set_code: str, locale: str, fmt: str) -> Path:
    """Tokens: cards/_tokens/{locale}/{standard,truncated}/{id}.webp — no size split."""
    return PROCESSED_ROOT / f"T{set_code}" / locale / fmt


# ─────────────────────── HTTP retry helper (FFG / swudb) ──────────────────

def _get_with_retry(
    session: requests.Session,
    url: str,
    *,
    stream: bool = False,
    timeout: int = HTTP_TIMEOUT,
) -> Optional[requests.Response]:
    """GET with bounded retries on transient failures.

    Returns the final response (which may be non-2xx; caller inspects
    status_code) or None if every attempt raised. 5xx and connection errors
    are retried; 2xx/3xx/4xx are returned immediately.
    """
    last_exc: Optional[BaseException] = None
    for attempt in range(1, HTTP_RETRY_ATTEMPTS + 1):
        try:
            r = session.get(url, stream=stream, timeout=timeout)
            if r.status_code < 500:
                return r
            # 5xx: drain and retry
            r.close()
            last_exc = RuntimeError(f"HTTP {r.status_code}")
        except requests.RequestException as e:
            last_exc = e
        if attempt < HTTP_RETRY_ATTEMPTS:
            time.sleep(HTTP_RETRY_BASE_DELAY + random.random() * HTTP_RETRY_JITTER)
    if last_exc is not None:
        print(f"! giving up on {url} after {HTTP_RETRY_ATTEMPTS} attempts: {last_exc}")
    return None


# ──────────────────────── FFG localized image index ───────────────────────

# Module-level cache: {(set_code, locale): {card_number: {"front_url", "back_url"}}}.
_FFG_INDEX_CACHE: dict[tuple[str, str], dict[int, dict[str, Optional[str]]]] = {}


def _ffg_index(session: requests.Session, set_code: str, locale: str) -> dict[int, dict[str, Optional[str]]]:
    """Fetch (and cache) `{cardNumber -> {front_url, back_url}}` for (set, locale).

    Only called for non-English locales. Hits the FFG API filtered by
    `expansion.code` and `locale`. Uses pageSize=100 so most sets fit in
    one or two pages.
    """
    key = (set_code, locale)
    if key in _FFG_INDEX_CACHE:
        return _FFG_INDEX_CACHE[key]

    index: dict[int, dict[str, Optional[str]]] = {}
    page = 1
    while True:
        url = (
            f"{FFG_API_BASE}"
            f"?filters[expansion][code]={set_code}"
            f"&locale={locale}"
            f"&pagination[page]={page}"
            f"&pagination[pageSize]=100"
        )
        r = _get_with_retry(session, url)
        if r is None or r.status_code != 200:
            print(f"! FFG index fetch failed for set={set_code} locale={locale} page={page}"
                  f" (status={getattr(r, 'status_code', '?')}); index will be partial")
            break
        body = r.json()
        for entry in body.get("data", []) or []:
            attrs = entry.get("attributes", {}) or {}
            card_number = attrs.get("cardNumber")
            if not isinstance(card_number, int):
                continue
            # Skip non-original printings. The FFG API returns variants
            # alongside the base printing they're derived from
            # (Hyperspace, Showcase, Prerelease Promo, Weekly Play / OP /
            # event, Reprint, and the "token variants of upgrades" that
            # ship with newer sets like JTL's TIE Fighter / X-Wing
            # tokens). Variant subsets renumber from 1, so e.g. a Luke
            # Skywalker prerelease promo with cardNumber=1 collides with
            # the real cardNumber=1 leader of every set (Director Krennic
            # in SOR, etc.) and last-write-wins clobbers it. The
            # schema-canonical "is this the original?" signal is
            # variantOf: originals have variantOf.data == null; every
            # variant points back at its parent via
            # variantOf.data.attributes.cardNumber.
            variant_of = ((attrs.get("variantOf") or {}).get("data"))
            if variant_of is not None:
                continue
            # Belt-and-braces: skip standalone Token-typed entries too.
            # LOF's "Force" token is type.value="Token" with
            # variantOf=null (it isn't a variant of anything), and within
            # a set its cardNumber collides with a real card (LOF #3
            # Ahsoka). JTL's TIE Fighter / X-Wing tokens are caught by
            # the variantOf check above (they're typed Upgrade and
            # variantOf a real upgrade card), so this branch handles only
            # the LOF-style case.
            type_value = (((attrs.get("type") or {}).get("data") or {}).get("attributes") or {}).get("value")
            if type_value == "Token":
                continue
            front = (((attrs.get("artFront") or {}).get("data") or {}).get("attributes") or {}).get("url")
            back = (((attrs.get("artBack") or {}).get("data") or {}).get("attributes") or {}).get("url")
            if not front:
                continue
            index[card_number] = {"front_url": front, "back_url": back}
        pagination = (body.get("meta") or {}).get("pagination") or {}
        page_count = pagination.get("pageCount", 1)
        if page >= page_count:
            break
        page += 1

    _FFG_INDEX_CACHE[key] = index
    print(f"… FFG index built: set={set_code} locale={locale} cards={len(index)}")
    return index


# ──────────────────────────── Stage: Download ─────────────────────────────

def _save_response(response: requests.Response, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as f:
        for chunk in response.iter_content(1024):
            f.write(chunk)


# TS26 (2026 Twin Suns) is the only set whose swudb image filenames don't
# follow the standard 3-digit zero-padding convention. Most TS26 cards use
# 2 digits (e.g. "03.png", "84.png"), but leaders #01 and #02 are uploaded
# with NO padding at all ("1.png", "2.png"). Page URLs on swudb are
# uniformly 2-digit for TS26. The local filename and S3 key are ALWAYS
# 3-digit padded (the client URL builder at
# forceteki-client/src/app/_utils/s3Utils.ts L64 calls padStart(3,'0')),
# so this only affects the GET URL — never where the file is saved.
#
# Order: 2-digit first because it covers ~99% of TS26; 1-digit handles
# leaders #1 and #2 (and any future single-digit anomalies in the set).
_TS26_SWUDB_WIDTHS: tuple[int, ...] = (2, 1)


def _download_card_swudb_ts26(
    session: requests.Session,
    cfg: "Config",
    card_number: int,
    save_path: Path,
    leader_save_path: Path,
) -> bool:
    """TS26-only swudb fetch with per-card padding fallback.

    Branched into from `_download_card_swudb` when `cfg.set_code == 'TS26'`;
    every other set follows the standard single-width 3-digit path below
    unchanged. See `_TS26_SWUDB_WIDTHS` for the rationale.
    """
    response: Optional[requests.Response] = None
    chosen_width: Optional[int] = None
    for w in _TS26_SWUDB_WIDTHS:
        n_url = str(card_number).zfill(w)
        url = cfg.source_url.format(set=cfg.set_code, n=n_url)
        r = session.get(url, stream=True, timeout=HTTP_TIMEOUT)
        if r.status_code == 200:
            response = r
            chosen_width = w
            break
        r.close()

    if response is None:
        vprint(f"- 404 (TS26 widths {list(_TS26_SWUDB_WIDTHS)}): card {card_number}")
        return False

    leader_response: Optional[requests.Response] = None
    if card_number <= cfg.leader_attempts:
        # Probe the width that worked for the front first, then the other
        # width — TS26 mixes widths even within its leader range. Suffix
        # order matches the standard path: -portrait, then -back.
        widths_in_order = (
            chosen_width,
            *(w for w in _TS26_SWUDB_WIDTHS if w != chosen_width),
        )
        for w in widths_in_order:
            n_url = str(card_number).zfill(w)
            for suffix in ("-portrait", "-back"):
                leader_url = cfg.source_url.format(set=cfg.set_code, n=f"{n_url}{suffix}")
                lr = session.get(leader_url, stream=True, timeout=HTTP_TIMEOUT)
                if lr.status_code == 200:
                    _save_response(lr, save_path)
                    vprint(f"+ leader {suffix.lstrip('-')}: en/{save_path.name}")
                    leader_response = lr
                    break
                lr.close()
            if leader_response is not None:
                break

    if leader_response is not None:
        _save_response(response, leader_save_path)
        vprint(f"+ leader base: en/{leader_save_path.name}")
    else:
        _save_response(response, save_path)
        vprint(f"+ en/{save_path.name}")
    return True


def _download_card_swudb(
    session: requests.Session,
    cfg: "Config",
    card_number: int,
) -> bool:
    """English: download from swudb.com. Returns True if any file was written."""
    n = str(card_number).zfill(3)
    out = downloads_dir(cfg.set_code, "en")
    save_path = out / f"{n}.png"
    leader_save_path = out / f"{n}-base.png"

    if save_path.exists() and not cfg.overwrite_downloads:
        vprint(f"= exists: en/{save_path.name}")
        return True

    if cfg.set_code == "TS26":
        try:
            return _download_card_swudb_ts26(
                session, cfg, card_number, save_path, leader_save_path,
            )
        except requests.RequestException as e:
            print(f"! download error TS26/{card_number}: {e}")
            return False

    url = cfg.source_url.format(set=cfg.set_code, n=n)
    leader_url = cfg.source_url.format(set=cfg.set_code, n=f"{n}-portrait")
    leader_url_alt = cfg.source_url.format(set=cfg.set_code, n=f"{n}-back")

    try:
        response = session.get(url, stream=True, timeout=HTTP_TIMEOUT)
        leader_response: Optional[requests.Response] = None

        if card_number <= cfg.leader_attempts:
            # Try -portrait first, then -back. The portrait/back is saved as
            # the primary file (NNN.png); the regular card image is saved
            # as the "base" file (NNN-base.png). Do not "fix" this without
            # also updating the site's URL builder (s3Utils.ts).
            leader_response = session.get(leader_url, stream=True, timeout=HTTP_TIMEOUT)
            if leader_response.status_code == 200:
                _save_response(leader_response, save_path)
                vprint(f"+ leader portrait: en/{save_path.name}")
            else:
                leader_response = session.get(leader_url_alt, stream=True, timeout=HTTP_TIMEOUT)
                if leader_response.status_code == 200:
                    _save_response(leader_response, save_path)
                    vprint(f"+ leader back: en/{save_path.name}")
                else:
                    leader_response = None

        if response.status_code == 200:
            if leader_response is not None:
                _save_response(response, leader_save_path)
                vprint(f"+ leader base: en/{leader_save_path.name}")
            else:
                _save_response(response, save_path)
                vprint(f"+ en/{save_path.name}")
            return True

        vprint(f"- 404: {url}")
        return False

    except requests.RequestException as e:
        print(f"! download error {url}: {e}")
        return False


def _download_card_ffg(
    session: requests.Session,
    cfg: "Config",
    locale: str,
    card_number: int,
    ffg_index: dict[int, dict[str, Optional[str]]],
) -> bool:
    """Non-English: download from FFG using the prebuilt locale index.

    Returns False (silently) if FFG doesn't have this card yet; the fallback
    stage will copy the English webp into the locale folder.
    """
    n = str(card_number).zfill(3)
    out = downloads_dir(cfg.set_code, locale)
    save_path = out / f"{n}.png"
    leader_save_path = out / f"{n}-base.png"

    if save_path.exists() and not cfg.overwrite_downloads:
        vprint(f"= exists: {locale}/{save_path.name}")
        return True

    entry = ffg_index.get(card_number)
    if entry is None:
        # No FFG image yet for this card in this locale; fallback handles it.
        return False

    front_url = entry.get("front_url")
    back_url = entry.get("back_url")
    if not front_url:
        return False

    try:
        front_resp = _get_with_retry(session, front_url, stream=True)
        if front_resp is None or front_resp.status_code != 200:
            print(f"! FFG front fetch failed {locale}/{n}: status="
                  f"{getattr(front_resp, 'status_code', '?')}")
            return False

        if back_url:
            # Leader: artFront is the deployed/unit side, artBack is the
            # portrait/leader side — opposite to swudb's convention. The S3
            # contract (which the client URL builder in
            # forceteki-client/src/app/_utils/s3Utils.ts depends on) follows
            # swudb: NNN.webp = portrait/leader side, NNN-base.webp = unit
            # side. So we map FFG -> swudb here by swapping destinations.
            back_resp = _get_with_retry(session, back_url, stream=True)
            if back_resp is None or back_resp.status_code != 200:
                print(f"! FFG back fetch failed {locale}/{n}: status="
                      f"{getattr(back_resp, 'status_code', '?')}; skipping card")
                front_resp.close()
                return False
            _save_response(back_resp, save_path)          # NNN.png      <- artBack (portrait)
            _save_response(front_resp, leader_save_path)  # NNN-base.png <- artFront (unit)
            vprint(f"+ leader portrait: {locale}/{save_path.name}")
            vprint(f"+ leader base:     {locale}/{leader_save_path.name}")
        else:
            _save_response(front_resp, save_path)
            vprint(f"+ {locale}/{save_path.name}")
        return True

    except requests.RequestException as e:
        print(f"! download error {locale}/{n}: {e}")
        return False


def stage_download(cfg: "Config") -> None:
    print(f"\n── Stage: Download (set={cfg.set_code}, locales={','.join(cfg.locales)}, "
          f"max={cfg.max_attempts}) ──")
    session = requests.Session()
    try:
        numbers = list(range(1, cfg.max_attempts + 1))
        for locale in cfg.locales:
            out = downloads_dir(cfg.set_code, locale)
            out.mkdir(parents=True, exist_ok=True)
            if locale == "en":
                print(f"  · Downloading en from swudb ({len(numbers)} candidates)")
                with cf.ThreadPoolExecutor(max_workers=cfg.workers) as ex:
                    futures = [ex.submit(_download_card_swudb, session, cfg, n) for n in numbers]
                    iterator = _maybe_progress(
                        cf.as_completed(futures), total=len(futures),
                        desc=f"download {cfg.set_code}/en", unit="card",
                    )
                    for fut in iterator:
                        fut.result()
            else:
                print(f"  · Downloading {locale} from FFG (building index…)")
                index = _ffg_index(session, cfg.set_code, locale)
                if not index:
                    print(f"  · FFG index for {locale} is empty; relying on fallback stage")
                    continue
                with cf.ThreadPoolExecutor(max_workers=cfg.workers) as ex:
                    futures = [
                        ex.submit(_download_card_ffg, session, cfg, locale, n, index)
                        for n in numbers
                    ]
                    iterator = _maybe_progress(
                        cf.as_completed(futures), total=len(futures),
                        desc=f"download {cfg.set_code}/{locale}", unit="card",
                    )
                    for fut in iterator:
                        fut.result()
    finally:
        session.close()


# ───────────────────────── Stage: Resize (standard) ───────────────────────

def _resize_to_max(img: Image.Image, max_dim: int) -> Image.Image:
    w, h = img.size
    scale = max_dim / max(w, h)
    return img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)


def _load_as_pil(path: Path) -> Optional[Image.Image]:
    raw = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if raw is None:
        print(f"! cannot open: {path}")
        return None
    return Image.fromarray(cv2.cvtColor(raw, cv2.COLOR_BGR2RGB))


def _resize_one(src: Path, dest_large: Path, dest_small: Path, cfg: "Config") -> None:
    pil = _load_as_pil(src)
    if pil is None:
        return
    sharpen = ImageFilter.UnsharpMask(radius=1, percent=50, threshold=10)

    large = _resize_to_max(pil, cfg.large_dimension).filter(sharpen)
    dest_large.parent.mkdir(parents=True, exist_ok=True)
    large.save(dest_large, "WEBP", quality=cfg.webp_quality)

    small = _resize_to_max(pil, cfg.small_dimension).filter(sharpen)
    dest_small.parent.mkdir(parents=True, exist_ok=True)
    small.save(dest_small, "WEBP", quality=cfg.webp_quality)

    vprint(f"+ resize {src.parent.name}/{src.name} -> {large.size}, {small.size}")


def _run_in_parallel(fn, items: list, *, workers: int, desc: Optional[str] = None) -> None:
    """Run fn(item) for each item in a thread pool, surfacing any exception.

    Prints results in completion order (so logs may interleave between files,
    but each line is atomic). Fast-fails on the first unhandled exception.

    When `desc` is provided and we're not in verbose mode, a tqdm progress
    bar labeled `desc` is shown for completion of these futures.
    """
    if not items:
        return
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(fn, item) for item in items]
        iterator = _maybe_progress(cf.as_completed(futures), total=len(futures),
                                   desc=desc or "working")
        for fut in iterator:
            fut.result()


def stage_resize(cfg: "Config") -> None:
    print(f"\n── Stage: Resize (set={cfg.set_code}, locales={','.join(cfg.locales)}) ──")
    for locale in cfg.locales:
        src_dir = downloads_dir(cfg.set_code, locale)
        if not src_dir.exists():
            print(f"  · {locale}: no source dir ({src_dir}); skipping")
            continue
        large_dir = standard_dir(cfg.set_code, locale, "large")
        small_dir = standard_dir(cfg.set_code, locale, "small")
        large_dir.mkdir(parents=True, exist_ok=True)
        small_dir.mkdir(parents=True, exist_ok=True)
        entries = [e for e in sorted(src_dir.iterdir())
                   if e.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
        _run_in_parallel(
            lambda e: _resize_one(e, large_dir / (e.stem + ".webp"), small_dir / (e.stem + ".webp"), cfg),
            entries,
            workers=cfg.workers,
            desc=f"resize {cfg.set_code}/{locale}",
        )


def _resize_token_one(src: Path, dest: Path, cfg: "Config") -> None:
    """Token standard variant: single resized WebP at the large dimension."""
    pil = _load_as_pil(src)
    if pil is None:
        return
    sharpen = ImageFilter.UnsharpMask(radius=1, percent=50, threshold=10)
    out = _resize_to_max(pil, cfg.large_dimension).filter(sharpen)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=cfg.webp_quality)
    vprint(f"+ token resize {src.parent.name}/{src.name} -> {out.size}")


def stage_resize_tokens(cfg: "Config") -> None:
    print(f"\n── Stage: Resize tokens (set=T{cfg.set_code}, locales={','.join(cfg.locales)}) ──")
    for locale in cfg.locales:
        src_dir = downloads_dir(cfg.set_code, locale, tokens=True)
        if not src_dir.exists():
            print(f"  · {locale}: no source dir ({src_dir}); skipping")
            continue
        out_dir = token_format_dir(cfg.set_code, locale, "standard")
        out_dir.mkdir(parents=True, exist_ok=True)
        entries = [e for e in sorted(src_dir.iterdir())
                   if e.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
        _run_in_parallel(
            lambda e: _resize_token_one(e, out_dir / (e.stem + ".webp"), cfg),
            entries,
            workers=cfg.workers,
            desc=f"resize T{cfg.set_code}/{locale}",
        )


# ──────────────────────── Stage: Truncate (cards) ─────────────────────────

def _truncate_one(src: Path, dest_large: Path, dest_small: Path, cfg: "Config") -> None:
    img = Image.open(src)
    w, h = img.size

    if w > h:
        vprint(f"= skip wide: {src.parent.name}/{src.name} ({w}x{h})")
        return
    if h < cfg.top_crop + cfg.bottom_crop:
        vprint(f"= skip short: {src.parent.name}/{src.name} (h={h})")
        return

    top = img.crop((0, 0, w, cfg.top_crop))
    bottom = img.crop((0, h - cfg.bottom_crop, w, h))
    new_h = cfg.top_crop + cfg.bottom_crop
    composite = Image.new(img.mode, (w, new_h))
    composite.paste(top, (0, 0))
    composite.paste(bottom, (0, cfg.top_crop))

    large = _resize_to_max(composite, cfg.trunc_large_dimension)
    dest_large.parent.mkdir(parents=True, exist_ok=True)
    large.save(dest_large, "WEBP", quality=cfg.webp_quality)

    small = _resize_to_max(composite, cfg.trunc_small_dimension)
    dest_small.parent.mkdir(parents=True, exist_ok=True)
    small.save(dest_small, "WEBP", quality=cfg.webp_quality)

    vprint(f"+ truncate {src.parent.name}/{src.name} -> {large.size}, {small.size}")


def stage_truncate(cfg: "Config") -> None:
    print(f"\n── Stage: Truncate (set={cfg.set_code}, locales={','.join(cfg.locales)}) ──")
    for locale in cfg.locales:
        src_dir = standard_dir(cfg.set_code, locale, "large")
        if not src_dir.exists():
            print(f"  · {locale}: no source dir ({src_dir}); skipping")
            continue
        large_dir = truncated_dir(cfg.set_code, locale, "large")
        small_dir = truncated_dir(cfg.set_code, locale, "small")
        large_dir.mkdir(parents=True, exist_ok=True)
        small_dir.mkdir(parents=True, exist_ok=True)
        entries = [e for e in sorted(src_dir.iterdir()) if e.suffix.lower() == ".webp"]
        _run_in_parallel(
            lambda e: _truncate_one(e, large_dir / e.name, small_dir / e.name, cfg),
            entries,
            workers=cfg.workers,
            desc=f"truncate {cfg.set_code}/{locale}",
        )


def _truncate_token_one(src: Path, dest: Path, cfg: "Config") -> None:
    """Token truncated variant: single cropped+resized WebP at trunc-large dimension."""
    img = Image.open(src)
    w, h = img.size
    if w > h:
        vprint(f"= skip wide token: {src.parent.name}/{src.name} ({w}x{h})")
        return
    if h < cfg.top_crop + cfg.bottom_crop:
        vprint(f"= skip short token: {src.parent.name}/{src.name} (h={h})")
        return
    top = img.crop((0, 0, w, cfg.top_crop))
    bottom = img.crop((0, h - cfg.bottom_crop, w, h))
    composite = Image.new(img.mode, (w, cfg.top_crop + cfg.bottom_crop))
    composite.paste(top, (0, 0))
    composite.paste(bottom, (0, cfg.top_crop))
    out = _resize_to_max(composite, cfg.trunc_large_dimension)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=cfg.webp_quality)
    vprint(f"+ token truncate {src.parent.name}/{src.name} -> {out.size}")


def stage_truncate_tokens(cfg: "Config") -> None:
    print(f"\n── Stage: Truncate tokens (set=T{cfg.set_code}, locales={','.join(cfg.locales)}) ──")
    for locale in cfg.locales:
        src_dir = token_format_dir(cfg.set_code, locale, "standard")
        if not src_dir.exists():
            print(f"  · {locale}: no source dir ({src_dir}); skipping")
            continue
        out_dir = token_format_dir(cfg.set_code, locale, "truncated")
        out_dir.mkdir(parents=True, exist_ok=True)
        entries = [e for e in sorted(src_dir.iterdir()) if e.suffix.lower() == ".webp"]
        _run_in_parallel(
            lambda e: _truncate_token_one(e, out_dir / e.name, cfg),
            entries,
            workers=cfg.workers,
            desc=f"truncate T{cfg.set_code}/{locale}",
        )


# ─────────────────── Stage: Fallback (English fill for locales) ───────────
#
# For each non-`en` locale being processed, copy any English webp that has no
# corresponding locale webp on disk into the locale's working tree. Existing
# locale webps are NEVER overwritten — a real FFG-sourced image always wins,
# and so does a previous run's fallback copy (which the next download cycle
# will replace if FFG catches up and the md5 changes).

def _fallback_fill_dir(
    en_dir: Path,
    locale_dir: Path,
    *,
    allowed: Optional[set[str]] = None,
    filled_names: Optional[set[str]] = None,
) -> int:
    """Copy any .webp present in `en_dir` but missing in `locale_dir`. Returns count copied.

    If `filled_names` is provided, the basenames of files copied are added
    to it — used by the caller to count unique cards/tokens across the
    multiple format/size axes that share a basename.
    """
    if not en_dir.exists():
        return 0
    copied = 0
    locale_dir.mkdir(parents=True, exist_ok=True)
    for src in sorted(en_dir.iterdir()):
        if src.suffix.lower() != ".webp":
            continue
        if allowed is not None and src.name not in allowed:
            continue
        dest = locale_dir / src.name
        if dest.exists():
            continue
        shutil.copy2(src, dest)
        try:
            rel = dest.relative_to(CACHE_ROOT)
        except ValueError:
            rel = dest
        vprint(f"+ fallback copy en -> {rel}")
        copied += 1
        if filled_names is not None:
            filled_names.add(src.name)
    return copied


def stage_fill_locale_fallbacks(cfg: "Config") -> None:
    non_en = [l for l in cfg.locales if l != "en"]
    if not non_en:
        print(f"\n── Stage: Fallback (skipped: only en in --locales) ──")
        return
    print(f"\n── Stage: Fallback (set={cfg.set_code}, locales={','.join(non_en)}) ──")

    # Per-locale set of unique basenames that received an en fallback copy.
    # A card has 4 webps (standard/truncated × large/small), a token has 2
    # (standard/truncated), so file counts overstate the number of distinct
    # cards/tokens that fell back. Dedup by basename for the summary.
    per_locale_filled: dict[str, set[str]] = {locale: set() for locale in non_en}

    if cfg.tokens is not None:
        # Token mode: 2 axes, no size split, restricted to the s3Ids in the
        # current --tokens mapping (mirrors _collect_token_jobs filtering).
        allowed = {f"{s3_id}.webp" for _, s3_id in cfg.tokens}
        total = 0
        for fmt in ("standard", "truncated"):
            en_dir = token_format_dir(cfg.set_code, "en", fmt)
            for locale in non_en:
                total += _fallback_fill_dir(
                    en_dir,
                    token_format_dir(cfg.set_code, locale, fmt),
                    allowed=allowed,
                    filled_names=per_locale_filled[locale],
                )
        print(f"  · {total} token webps copied from en")
        _print_fallback_summary(per_locale_filled, kind="token", denom_label="(standard+truncated)")
        _enforce_strict_locales(cfg, per_locale_filled, kind="token")
        return

    # Card mode: 4 axes (standard/truncated × large/small).
    total = 0
    for fmt, size_fn in (
        ("standard", standard_dir),
        ("truncated", truncated_dir),
    ):
        for size in ("large", "small"):
            en_dir = size_fn(cfg.set_code, "en", size)
            for locale in non_en:
                total += _fallback_fill_dir(
                    en_dir,
                    size_fn(cfg.set_code, locale, size),
                    filled_names=per_locale_filled[locale],
                )
    print(f"  · {total} card webps copied from en")
    _print_fallback_summary(per_locale_filled, kind="card", denom_label="(standard+truncated × large+small)")
    _enforce_strict_locales(cfg, per_locale_filled, kind="card")


def _print_fallback_summary(
    per_locale_filled: dict[str, set[str]],
    *,
    kind: str,
    denom_label: str,
) -> None:
    """Emit a per-locale breakdown of how many distinct cards/tokens received
    an English fallback copy. Run at the end of the fallback stage so it's
    easy to see at a glance how much localized data FFG is currently
    missing.
    """
    total_filled = sum(len(names) for names in per_locale_filled.values())
    print(f"\n  Fallback summary — {kind}s temporarily served with EN variant:")
    if total_filled == 0:
        print(f"    (none — all locales fully populated)")
        return
    for locale in sorted(per_locale_filled):
        names = per_locale_filled[locale]
        if not names:
            print(f"    {locale}: 0")
            continue
        print(f"    {locale}: {len(names)} {kind}{'s' if len(names) != 1 else ''}"
              f" filled with EN copy {denom_label}")
        # List each basename so the operator can see exactly which cards or
        # tokens FFG is still missing in this locale. Always shown, even in
        # non-verbose mode.
        for name in sorted(names):
            print(f"      - {name}")


def _enforce_strict_locales(
    cfg: "Config",
    per_locale_filled: dict[str, set[str]],
    *,
    kind: str,
) -> None:
    """Abort with a non-zero exit if --strict-locales is set and any locale
    fell back to the English variant. Run at the end of the fallback stage
    so the operator gets the full per-locale list of missing items printed
    above before the process halts (and before the upload stage runs).
    """
    if not cfg.strict_locales:
        return
    deficient = {loc: names for loc, names in per_locale_filled.items() if names}
    if not deficient:
        return
    total_missing = sum(len(n) for n in deficient.values())
    print(
        f"\n! --strict-locales: aborting before upload — {len(deficient)} locale(s) "
        f"missing {total_missing} unique {kind}(s) that would be substituted with EN."
    )
    for locale in sorted(deficient):
        print(f"    {locale}: {len(deficient[locale])} missing {kind}(s)")
    raise SystemExit(3)


# ───────────────────────────── Stage: Upload ──────────────────────────────

@dataclass
class UploadJob:
    local_path: Path
    s3_key: str


def _md5_hex(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _s3_etag_md5(client, bucket: str, key: str) -> Optional[str]:
    """Return the local-md5 equivalent of the S3 object ETag, or None if missing.

    For single-part uploads (which all our small webps are), the ETag is the
    hex MD5 of the object wrapped in quotes. Multi-part uploads use a
    different format with a `-N` suffix; in that case we return None to force
    re-upload. We do not use SSE-KMS, so this is reliable.
    """
    try:
        head = client.head_object(Bucket=bucket, Key=key)
    except botocore.exceptions.ClientError as e:
        if e.response.get("Error", {}).get("Code") in ("404", "NoSuchKey", "NotFound"):
            return None
        raise
    etag = head.get("ETag", "").strip('"')
    if "-" in etag:
        return None  # multipart; cannot compare
    return etag


def _upload_one(client, bucket: str, job: UploadJob, *, dry_run: bool) -> tuple[str, str]:
    """Upload (or skip) a single file. Returns (status, message).

    Status is one of: 'skipped', 'uploaded_new', 'uploaded_changed', 'failed',
    'planned_new', 'planned_changed'.
    """
    try:
        local_md5 = _md5_hex(job.local_path)
        remote_md5 = _s3_etag_md5(client, bucket, job.s3_key)
    except Exception as e:
        return ("failed", f"! error checking {job.s3_key}: {e}")

    if remote_md5 == local_md5:
        return ("skipped", f"= skip (unchanged): {job.s3_key}")

    detail = "new" if remote_md5 is None else "changed"
    if dry_run:
        return (f"planned_{detail}", f"~ would upload {detail}: {job.s3_key}")

    try:
        with job.local_path.open("rb") as body:
            client.put_object(
                Bucket=bucket,
                Key=job.s3_key,
                Body=body,
                ContentType="image/webp",
                CacheControl="public, max-age=31536000, immutable",
            )
    except Exception as e:
        return ("failed", f"! upload failed {job.s3_key}: {e}")
    return (f"uploaded_{detail}", f"+ upload {detail}: {job.s3_key}")


def _collect_set_jobs(cfg: "Config") -> list[UploadJob]:
    jobs: list[UploadJob] = []
    for locale in cfg.locales:
        prefix = cfg.key_prefix.format(set=cfg.set_code, locale=locale).rstrip("/")
        for fmt, size_fn in (
            ("standard", standard_dir),
            ("truncated", truncated_dir),
        ):
            for size in ("large", "small"):
                d = size_fn(cfg.set_code, locale, size)
                if not d.exists():
                    continue
                for entry in sorted(d.iterdir()):
                    if entry.suffix.lower() != ".webp":
                        continue
                    key = f"{prefix}/{fmt}/{size}/{entry.name}"
                    jobs.append(UploadJob(entry, key))
    return jobs


def _collect_token_jobs(cfg: "Config") -> list[UploadJob]:
    """Token files upload to cards/_tokens/{locale}/{standard,truncated}/{s3Id}.webp.

    The on-disk filename is already the desired numeric S3 id (per the
    swudbId=s3Id mapping resolved at download time). Only files matching the
    s3Ids in the current --tokens mapping are uploaded; previously-processed
    tokens left over in the local folder are ignored.
    """
    allowed = {f"{s3_id}.webp" for _, s3_id in (cfg.tokens or [])}
    jobs: list[UploadJob] = []
    for locale in cfg.locales:
        prefix = TOKEN_KEY_PREFIX.format(locale=locale).rstrip("/")
        for fmt in ("standard", "truncated"):
            d = token_format_dir(cfg.set_code, locale, fmt)
            if not d.exists():
                continue
            for entry in sorted(d.iterdir()):
                if entry.suffix.lower() != ".webp":
                    continue
                if entry.name not in allowed:
                    continue
                key = f"{prefix}/{fmt}/{entry.name}"
                jobs.append(UploadJob(entry, key))
    return jobs


# ─── AWS credential preflight (with optional inline SSO re-login) ──

_SSO_ERRORS = (TokenRetrievalError, UnauthorizedSSOTokenError, SSOTokenLoadError)


def _build_session(profile: Optional[str]) -> boto3.Session:
    return boto3.Session(profile_name=profile) if profile else boto3.Session()


def _profile_is_sso(session: boto3.Session) -> bool:
    """True if the active profile is configured for SSO (sso_session or sso_start_url)."""
    try:
        scoped = session._session.get_scoped_config()  # type: ignore[attr-defined]
    except Exception:
        return False
    return any(k in scoped for k in ("sso_session", "sso_start_url"))


def _try_sso_login(profile: Optional[str]) -> bool:
    """Run `aws sso login [--profile X]`. Returns True if it appears to succeed."""
    aws_cli = shutil.which("aws")
    if not aws_cli:
        print("! Cannot auto-login: `aws` CLI not found on PATH.")
        print("  Install the AWS CLI v2 or run `aws sso login` manually, then retry.")
        return False
    cmd = [aws_cli, "sso", "login"] + (["--profile", profile] if profile else [])
    print(f"\n! AWS SSO token expired. Launching: {' '.join(cmd)}")
    print("  (a browser window will open for you to confirm)")
    try:
        result = subprocess.run(cmd, check=False)
    except OSError as e:
        print(f"! Failed to invoke aws CLI: {e}")
        return False
    if result.returncode != 0:
        print(f"! aws sso login exited with code {result.returncode}.")
        return False
    return True


def _explain_and_exit(err: Exception, cfg: "Config") -> None:
    profile_note = f" (profile: {cfg.aws_profile})" if cfg.aws_profile else ""
    if isinstance(err, NoCredentialsError):
        print("! No AWS credentials found.")
        print("  Searched: env vars (AWS_ACCESS_KEY_ID/...), ~/.aws/credentials, IAM role.")
        print("  Set credentials, run `aws sso login`, or pass --aws-profile NAME.")
    elif isinstance(err, PartialCredentialsError):
        print(f"! Incomplete AWS credentials{profile_note}: {err}")
    elif isinstance(err, _SSO_ERRORS):
        print(f"! AWS SSO token unavailable or expired{profile_note}: {err}")
        print("  Run `aws sso login` and retry, or pass --no-auto-login if you")
        print("  prefer to handle this yourself.")
    elif isinstance(err, ClientError):
        code = err.response.get("Error", {}).get("Code", "?")
        print(f"! AWS auth failed{profile_note} (code: {code}): {err}")
        if code in ("ExpiredToken", "ExpiredTokenException"):
            print("  Your STS session token has expired. Refresh it and retry.")
        elif code in ("InvalidClientTokenId", "SignatureDoesNotMatch", "AuthFailure"):
            print("  Credentials appear invalid. Check ~/.aws/credentials.")
        elif code in ("AccessDenied", "AccessDeniedException"):
            print(f"  Authenticated but lacks permission to call sts:GetCallerIdentity")
            print(f"  (or to access s3://{cfg.bucket}/). Check IAM policy.")
    else:
        print(f"! AWS preflight failed{profile_note}: {err}")
    sys.exit(2)


def ensure_aws_credentials(cfg: "Config") -> boto3.Session:
    """Verify credentials work; offer inline SSO re-login on expiry.

    Returns a usable boto3 Session. Exits with code 2 on unrecoverable failure.
    """
    session = _build_session(cfg.aws_profile)
    try:
        session.client("sts").get_caller_identity()
        return session
    except _SSO_ERRORS as e:
        if cfg.no_auto_login:
            _explain_and_exit(e, cfg)
        if not _profile_is_sso(session):
            _explain_and_exit(e, cfg)
        if not _try_sso_login(cfg.aws_profile):
            _explain_and_exit(e, cfg)
        # Rebuild after login so the refreshed token is picked up.
        session = _build_session(cfg.aws_profile)
        try:
            session.client("sts").get_caller_identity()
            print("✓ AWS SSO login succeeded.")
            return session
        except Exception as e2:
            _explain_and_exit(e2, cfg)
    except (NoCredentialsError, PartialCredentialsError, ClientError) as e:
        _explain_and_exit(e, cfg)
    # Unreachable, but satisfies type checkers.
    raise SystemExit(2)


def stage_upload(cfg: "Config", *, tokens: bool = False) -> None:
    label = "tokens" if tokens else f"set={cfg.set_code}"
    print(f"\n── Stage: Upload ({label}, locales={','.join(cfg.locales)}, "
          f"dry_run={cfg.dry_run}) ──")

    session = ensure_aws_credentials(cfg)
    client = session.client("s3")

    jobs = _collect_token_jobs(cfg) if tokens else _collect_set_jobs(cfg)
    if not jobs:
        print("! nothing to upload")
        return
    print(f"… {len(jobs)} candidate files in s3://{cfg.bucket}/")
    counts: dict[str, int] = {}
    with cf.ThreadPoolExecutor(max_workers=cfg.workers) as ex:
        futures = [ex.submit(_upload_one, client, cfg.bucket, j, dry_run=cfg.dry_run) for j in jobs]
        iterator = _maybe_progress(
            cf.as_completed(futures), total=len(futures),
            desc=f"upload {label}", unit="file",
        )
        for fut in iterator:
            status, msg = fut.result()
            counts[status] = counts.get(status, 0) + 1
            vprint(msg)

    print(f"\n── Upload summary ({label}) ──")
    if cfg.dry_run:
        print(f"  would upload (new):     {counts.get('planned_new', 0)}")
        print(f"  would upload (changed): {counts.get('planned_changed', 0)}")
    else:
        print(f"  uploaded (new):         {counts.get('uploaded_new', 0)}")
        print(f"  uploaded (changed):     {counts.get('uploaded_changed', 0)}")
    print(f"  skipped (unchanged):    {counts.get('skipped', 0)}")
    failed = counts.get('failed', 0)
    if failed:
        print(f"  failed:                 {failed}")
    print(f"  total:                  {len(jobs)}")


# ──────────────────────────────── Tokens ──────────────────────────────────

def parse_token_mapping(raw: str) -> list[tuple[str, str]]:
    """Parse 'T01=3941784506,T03=7268926664' -> [('T01','3941784506'), ...]."""
    out: list[tuple[str, str]] = []
    for piece in raw.split(","):
        piece = piece.strip()
        if not piece:
            continue
        if "=" not in piece:
            raise ValueError(f"--tokens entry must be 'swudbId=s3Id', got '{piece}'")
        swu, s3 = (p.strip() for p in piece.split("=", 1))
        if not swu or not s3:
            raise ValueError(f"--tokens entry has empty side: '{piece}'")
        out.append((swu, s3))
    if not out:
        raise ValueError("--tokens requires at least one mapping")
    return out


def _download_token_ffg(
    session: requests.Session,
    numeric_id: str,
    locale: str,
    dest_dir: Path,
    *,
    overwrite: bool,
) -> bool:
    """Download a single token's localized art from the FFG API.

    Tokens are keyed by `cardUid` on the FFG side (their `cardId` field is
    always null — see `forceteki/scripts/fetchdata.js` which falls back to
    `cardUid` for tokens). One HTTP call per (token, locale) returns the
    localized record with `artFront.data.attributes.url` pointing at the
    full-resolution PNG on the FFG CDN.

    Returns True if the file was downloaded (or already exists), False if
    FFG has no localized art for this token yet — in which case the
    fallback stage will copy the English webp into this locale.
    """
    dest = dest_dir / f"{numeric_id}.png"
    if dest.exists() and not overwrite:
        vprint(f"= exists: {locale}/{dest.name}")
        return True

    url = (
        f"{FFG_API_BASE}"
        f"?filters[cardUid][$eq]={numeric_id}"
        f"&locale={locale}"
    )
    r = _get_with_retry(session, url)
    if r is None or r.status_code != 200:
        print(f"! FFG token lookup failed: id={numeric_id} locale={locale}"
              f" (status={getattr(r, 'status_code', '?')})")
        return False

    body = r.json()
    data = body.get("data") or []
    if not data:
        # Token genuinely not in FFG for this locale; fallback stage handles it.
        return False
    attrs = data[0].get("attributes") or {}
    front = (((attrs.get("artFront") or {}).get("data") or {}).get("attributes") or {}).get("url")
    if not front:
        return False

    art_resp = _get_with_retry(session, front, stream=True)
    if art_resp is None or art_resp.status_code != 200:
        print(f"! FFG token art download failed: id={numeric_id} locale={locale} url={front}")
        return False
    _save_response(art_resp, dest)
    vprint(f"+ {numeric_id} ({locale}) -> {locale}/{dest.name}")
    return True


def stage_tokens_download(cfg: "Config", mapping: list[tuple[str, str]]) -> None:
    """Download tokens.

    - English: from swudb (the only token source swudb exposes), keyed by
      the swudb id on the left of each `--tokens` entry.
    - Non-English locales: from the FFG API, keyed by the S3 numeric id
      (which equals the FFG `cardUid`).

    Anything missing from FFG (e.g. brand-new spoilers) is left absent
    here; the fallback stage will copy the English webp into the locale
    folder before upload.
    """
    print(f"\n── Stage: Download tokens (set=T{cfg.set_code}, count={len(mapping)},"
          f" locales={','.join(cfg.locales)}) ──")
    session = requests.Session()

    en_out = downloads_dir(cfg.set_code, "en", tokens=True)
    en_out.mkdir(parents=True, exist_ok=True)

    def fetch_en(pair: tuple[str, str]) -> None:
        swu_id, s3_id = pair
        # Local filename uses the S3 id so the resize stage produces output
        # already named correctly for upload.
        dest = en_out / f"{s3_id}.png"
        if dest.exists() and not cfg.overwrite_downloads:
            vprint(f"= exists: en/{dest.name}")
            return
        url = cfg.token_source_url.format(set=cfg.set_code, n=swu_id)
        try:
            r = session.get(url, stream=True, timeout=HTTP_TIMEOUT)
            if r.status_code == 200:
                _save_response(r, dest)
                vprint(f"+ {swu_id} -> en/{dest.name}")
            else:
                vprint(f"- 404 {url}")
        except requests.RequestException as e:
            print(f"! download error {url}: {e}")

    non_en_locales = [loc for loc in cfg.locales if loc != "en"]

    def fetch_locale(locale: str) -> None:
        out = downloads_dir(cfg.set_code, locale, tokens=True)
        out.mkdir(parents=True, exist_ok=True)

        def fetch_one(pair: tuple[str, str]) -> None:
            _, s3_id = pair
            _download_token_ffg(
                session,
                s3_id,
                locale,
                out,
                overwrite=cfg.overwrite_downloads,
            )

        _run_in_parallel(
            fetch_one,
            mapping,
            workers=min(cfg.workers, len(mapping)),
            desc=f"download T{cfg.set_code}/{locale}",
        )

    try:
        if "en" in cfg.locales:
            _run_in_parallel(
                fetch_en,
                mapping,
                workers=min(cfg.workers, len(mapping)),
                desc=f"download T{cfg.set_code}/en",
            )
        for locale in non_en_locales:
            fetch_locale(locale)
    finally:
        session.close()


# ───────────────────────────────── CLI ────────────────────────────────────

@dataclass
class Config:
    set_code: str
    locales: list[str]
    from_stage: str
    to_stage: str
    source_url: str
    token_source_url: str
    bucket: str
    key_prefix: str
    aws_profile: Optional[str]
    no_auto_login: bool
    dry_run: bool
    overwrite_downloads: bool
    max_attempts: int
    leader_attempts: int
    workers: int
    large_dimension: int
    small_dimension: int
    trunc_large_dimension: int
    trunc_small_dimension: int
    top_crop: int
    bottom_crop: int
    webp_quality: int
    tokens: Optional[list[tuple[str, str]]]
    strict_locales: bool


def parse_locales(raw: str) -> list[str]:
    """Parse '--locales' value: 'all' or comma-separated list."""
    raw = (raw or "").strip().lower()
    if not raw or raw == "all":
        return list(DEFAULT_LOCALES)
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    if not parts:
        raise ValueError("--locales requires at least one locale")
    unknown = [p for p in parts if p not in DEFAULT_LOCALES]
    if unknown:
        raise ValueError(f"--locales has unknown value(s): {','.join(unknown)} "
                         f"(allowed: {','.join(DEFAULT_LOCALES)} or 'all')")
    # Preserve order but dedupe; ensure 'en' is first when present so
    # the fallback stage's English source exists before non-en locales
    # are checked.
    seen: set[str] = set()
    deduped: list[str] = []
    for p in parts:
        if p in seen:
            continue
        seen.add(p)
        deduped.append(p)
    if "en" in deduped and deduped[0] != "en":
        deduped.remove("en")
        deduped.insert(0, "en")
    return deduped


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Download, process, and upload SWU card images.")
    p.add_argument("--set", default=DEFAULT_SET_CODE,
                   help=(f"3-letter set code, or comma-separated list of set codes to process "
                         f"sequentially (default: {DEFAULT_SET_CODE})."))
    p.add_argument("--locales", default="all",
                   help=(f"Locales to process. 'all' (default) = {','.join(DEFAULT_LOCALES)}, "
                         "or a comma-separated subset like 'en,fr'."))
    p.add_argument("--from", dest="from_stage", choices=STAGES, default="download",
                   help="Run stages starting from this one (default: download).")
    p.add_argument("--to", choices=STAGES, default="upload",
                   help="Run stages up to and including this one (default: upload).")
    p.add_argument("--source-url", default=DEFAULT_SOURCE_URL,
                   help="URL template for English (swudb); supports {set} and {n}.")
    p.add_argument("--token-source-url", default=DEFAULT_TOKEN_SOURCE_URL,
                   help="Token URL template; supports {set} and {n}.")
    p.add_argument("--bucket", default=DEFAULT_BUCKET)
    p.add_argument("--key-prefix", default=DEFAULT_KEY_PREFIX,
                   help="S3 key prefix; supports {set} and {locale}.")
    p.add_argument("--aws-profile", default=None, help="boto3 profile name (optional).")
    p.add_argument("--no-auto-login", action="store_true",
                   help="Disable automatic 'aws sso login' if the SSO token has expired.")
    p.add_argument("--dry-run", action="store_true",
                   help="Plan uploads but do not write to S3.")
    p.add_argument("--overwrite-downloads", action="store_true",
                   help=("Ignore the local download cache and re-fetch every source "
                         "image, as if the on-disk copies did not exist. "
                         "(Resize/truncate stages always overwrite their outputs, "
                         "so this also causes the full pipeline to regenerate "
                         "every processed webp.)"))
    p.add_argument("--max-attempts", type=int, default=MAX_ATTEMPTS)
    p.add_argument("--leader-attempts", type=int, default=LEADER_ATTEMPTS)
    p.add_argument("--workers", type=int, default=DEFAULT_WORKERS,
                   help=f"Parallelism for download / resize / truncate / upload stages (default: {DEFAULT_WORKERS}).")
    p.add_argument("--large-dimension", type=int, default=LARGE_DIMENSION)
    p.add_argument("--small-dimension", type=int, default=SMALL_DIMENSION)
    p.add_argument("--trunc-large-dimension", type=int, default=TRUNC_LARGE_DIMENSION)
    p.add_argument("--trunc-small-dimension", type=int, default=TRUNC_SMALL_DIMENSION)
    p.add_argument("--top-crop", type=int, default=TOP_CROP_HEIGHT)
    p.add_argument("--bottom-crop", type=int, default=BOTTOM_CROP_HEIGHT)
    p.add_argument("--webp-quality", type=int, default=WEBP_QUALITY)
    p.add_argument("--tokens", default=None,
                   help="Token mode. Comma-separated swudbId=s3Id pairs, e.g. 'T01=3941784506,T03=7268926664'.")
    p.add_argument("--strict-locales", action="store_true",
                   help=("Halt with a non-zero exit code before upload if any non-en locale "
                         "is missing card/token images that would otherwise be substituted "
                         "with the English variant by the fallback stage. Useful for CI / "
                         "release runs where you want to guarantee fully-localized coverage."))
    p.add_argument("--verbose", action="store_true",
                   help="Show per-item logs (default: stage headers + progress bars only).")
    return p


def parse_set_codes(raw: str) -> list[str]:
    seen: list[str] = []
    for part in raw.split(","):
        code = part.strip().upper()
        if not code or code in seen:
            continue
        seen.append(code)
    if not seen:
        raise ValueError("--set must contain at least one non-empty set code")
    return seen


def cfg_from_args(args: argparse.Namespace, set_code: str) -> Config:
    tokens = parse_token_mapping(args.tokens) if args.tokens else None
    locales = parse_locales(args.locales)
    # Honor a per-set max-attempts override only when the user hasn't
    # explicitly passed --max-attempts (i.e. it's still the default).
    max_attempts = args.max_attempts
    if max_attempts == MAX_ATTEMPTS and set_code in PER_SET_MAX_ATTEMPTS:
        max_attempts = PER_SET_MAX_ATTEMPTS[set_code]
    return Config(
        set_code=set_code,
        locales=locales,
        from_stage=args.from_stage,
        to_stage=args.to,
        source_url=args.source_url,
        token_source_url=args.token_source_url,
        bucket=args.bucket,
        key_prefix=args.key_prefix,
        aws_profile=args.aws_profile,
        no_auto_login=args.no_auto_login,
        dry_run=args.dry_run,
        overwrite_downloads=args.overwrite_downloads,
        max_attempts=max_attempts,
        leader_attempts=args.leader_attempts,
        workers=args.workers,
        large_dimension=args.large_dimension,
        small_dimension=args.small_dimension,
        trunc_large_dimension=args.trunc_large_dimension,
        trunc_small_dimension=args.trunc_small_dimension,
        top_crop=args.top_crop,
        bottom_crop=args.bottom_crop,
        webp_quality=args.webp_quality,
        tokens=tokens,
        strict_locales=bool(args.strict_locales),
    )


def stage_index(name: str) -> int:
    return STAGES.index(name)


def main(argv: Optional[list[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    global VERBOSE
    VERBOSE = bool(args.verbose)
    set_codes = parse_set_codes(args.set)

    overall_rc = 0
    for i, set_code in enumerate(set_codes):
        if len(set_codes) > 1:
            banner = f" SET {i + 1}/{len(set_codes)}: {set_code} "
            bar = "=" * max(8, (60 - len(banner)) // 2)
            print(f"\n{bar}{banner}{bar}")
        rc = run_one_set(args, set_code)
        if rc != 0:
            overall_rc = rc
    return overall_rc


def run_one_set(args: argparse.Namespace, set_code: str) -> int:
    cfg = cfg_from_args(args, set_code)

    first = stage_index(cfg.from_stage)
    last = stage_index(cfg.to_stage)
    if first > last:
        print(f"! --from {cfg.from_stage} comes after --to {cfg.to_stage}; nothing to do.")
        return 2

    def should_run(stage: str) -> bool:
        idx = stage_index(stage)
        return first <= idx <= last

    if cfg.tokens is not None:
        # Token pipeline: download -> resize (standard) -> truncate -> fallback -> upload.
        # Produces cards/_tokens/{locale}/standard/{id}.webp and
        # cards/_tokens/{locale}/truncated/{id}.webp.
        if should_run("download"):
            stage_tokens_download(cfg, cfg.tokens)
        if should_run("resize"):
            stage_resize_tokens(cfg)
        if should_run("truncate"):
            stage_truncate_tokens(cfg)
        if should_run("fallback"):
            stage_fill_locale_fallbacks(cfg)
        if should_run("upload"):
            stage_upload(cfg, tokens=True)
        return 0

    if should_run("download"):
        stage_download(cfg)
    if should_run("resize"):
        stage_resize(cfg)
    if should_run("truncate"):
        stage_truncate(cfg)
    if should_run("fallback"):
        stage_fill_locale_fallbacks(cfg)
    if should_run("upload"):
        stage_upload(cfg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
