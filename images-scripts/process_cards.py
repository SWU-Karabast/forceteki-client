"""End-to-end card image pipeline: download -> resize -> truncate -> upload.

See README.md for usage. Run `python process_cards.py --help` for CLI reference.
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import hashlib
import os
import shutil
import subprocess
import sys
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

# ─────────────────────────── Config / Defaults ────────────────────────────

# Bumped at set rotation. Override per-invocation with --set.
DEFAULT_SET_CODE = "ASH"

DEFAULT_SOURCE_URL = "https://swudb.com/images/cards/{set}/{n}.png"
DEFAULT_TOKEN_SOURCE_URL = "https://swudb.com/images/cards/T{set}/{n}.png"

DEFAULT_BUCKET = "karabast-data"
DEFAULT_KEY_PREFIX = "cards/{set}/"
TOKEN_KEY_PREFIX = "cards/_tokens/"

# Pipeline stages, ordered. --to STAGE runs all stages up to and including STAGE.
STAGES = ("download", "resize", "truncate", "upload")

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

# Parallelism for download, resize, truncate, and upload stages.
# Override with --workers N. Default chosen to be friendly to swudb.com and
# to local CPU/disk while still being meaningfully faster than serial.
DEFAULT_WORKERS = 8

# Repo-relative working directory (this script's directory)
SCRIPT_DIR = Path(__file__).resolve().parent


# ───────────────────────────── Path helpers ───────────────────────────────

def downloads_dir(set_code: str, *, tokens: bool = False) -> Path:
    name = f"T{set_code}" if tokens else set_code
    return SCRIPT_DIR / "downloaded_images" / name


def standard_dir(set_code: str, size: str, *, tokens: bool = False) -> Path:
    name = f"T{set_code}" if tokens else set_code
    return SCRIPT_DIR / name / "standard" / size


def truncated_dir(set_code: str, size: str) -> Path:
    return SCRIPT_DIR / set_code / "truncated" / size


def token_format_dir(set_code: str, fmt: str) -> Path:
    """Tokens use cards/_tokens/{standard,truncated}/{id}.webp — no size split."""
    return SCRIPT_DIR / f"T{set_code}" / fmt


# ──────────────────────────── Stage: Download ─────────────────────────────

def _save_response(response: requests.Response, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("wb") as f:
        for chunk in response.iter_content(1024):
            f.write(chunk)


def _download_card(
    session: requests.Session,
    cfg: "Config",
    card_number: int,
) -> bool:
    """Download a single card. Returns True if any file was written."""
    n = str(card_number).zfill(3)
    out = downloads_dir(cfg.set_code)
    save_path = out / f"{n}.png"

    if save_path.exists() and not cfg.overwrite_downloads:
        print(f"= exists: {save_path.name}")
        return True

    url = cfg.source_url.format(set=cfg.set_code, n=n)
    leader_url = cfg.source_url.format(set=cfg.set_code, n=f"{n}-portrait")
    leader_url_alt = cfg.source_url.format(set=cfg.set_code, n=f"{n}-back")
    leader_save_path = out / f"{n}-base.png"

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
                print(f"+ leader portrait: {save_path.name}")
            else:
                leader_response = session.get(leader_url_alt, stream=True, timeout=HTTP_TIMEOUT)
                if leader_response.status_code == 200:
                    _save_response(leader_response, save_path)
                    print(f"+ leader back: {save_path.name}")
                else:
                    leader_response = None

        if response.status_code == 200:
            if leader_response is not None:
                _save_response(response, leader_save_path)
                print(f"+ leader base: {leader_save_path.name}")
            else:
                _save_response(response, save_path)
                print(f"+ {save_path.name}")
            return True

        print(f"- 404: {url}")
        return False

    except requests.RequestException as e:
        print(f"! download error {url}: {e}")
        return False


def stage_download(cfg: "Config") -> None:
    print(f"\n── Stage: Download (set={cfg.set_code}, max={cfg.max_attempts}) ──")
    out = downloads_dir(cfg.set_code)
    out.mkdir(parents=True, exist_ok=True)

    # `requests.Session` is safe to share across threads for plain GETs.
    session = requests.Session()
    try:
        numbers = list(range(1, cfg.max_attempts + 1))
        with cf.ThreadPoolExecutor(max_workers=cfg.workers) as ex:
            futures = [ex.submit(_download_card, session, cfg, n) for n in numbers]
            for fut in cf.as_completed(futures):
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

    print(f"+ resize {src.name} -> {large.size}, {small.size}")


def _run_in_parallel(fn, items: list, *, workers: int) -> None:
    """Run fn(item) for each item in a thread pool, surfacing any exception.

    Prints results in completion order (so logs may interleave between files,
    but each line is atomic). Fast-fails on the first unhandled exception.
    """
    if not items:
        return
    with cf.ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(fn, item) for item in items]
        for fut in cf.as_completed(futures):
            fut.result()


def stage_resize(cfg: "Config") -> None:
    print(f"\n── Stage: Resize (set={cfg.set_code}) ──")
    src_dir = downloads_dir(cfg.set_code)
    if not src_dir.exists():
        print(f"! no source dir: {src_dir}")
        return
    large_dir = standard_dir(cfg.set_code, "large")
    small_dir = standard_dir(cfg.set_code, "small")
    large_dir.mkdir(parents=True, exist_ok=True)
    small_dir.mkdir(parents=True, exist_ok=True)
    entries = [e for e in sorted(src_dir.iterdir())
               if e.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
    _run_in_parallel(
        lambda e: _resize_one(e, large_dir / (e.stem + ".webp"), small_dir / (e.stem + ".webp"), cfg),
        entries,
        workers=cfg.workers,
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
    print(f"+ token resize {src.name} -> {out.size}")


def stage_resize_tokens(cfg: "Config") -> None:
    print(f"\n── Stage: Resize tokens (set=T{cfg.set_code}) ──")
    src_dir = downloads_dir(cfg.set_code, tokens=True)
    if not src_dir.exists():
        print(f"! no source dir: {src_dir}")
        return
    out_dir = token_format_dir(cfg.set_code, "standard")
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = [e for e in sorted(src_dir.iterdir())
               if e.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")]
    _run_in_parallel(
        lambda e: _resize_token_one(e, out_dir / (e.stem + ".webp"), cfg),
        entries,
        workers=cfg.workers,
    )


# ──────────────────────── Stage: Truncate (cards) ─────────────────────────

def _truncate_one(src: Path, dest_large: Path, dest_small: Path, cfg: "Config") -> None:
    img = Image.open(src)
    w, h = img.size

    if w > h:
        print(f"= skip wide: {src.name} ({w}x{h})")
        return
    if h < cfg.top_crop + cfg.bottom_crop:
        print(f"= skip short: {src.name} (h={h})")
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

    print(f"+ truncate {src.name} -> {large.size}, {small.size}")


def stage_truncate(cfg: "Config") -> None:
    print(f"\n── Stage: Truncate (set={cfg.set_code}) ──")
    src_dir = standard_dir(cfg.set_code, "large")
    if not src_dir.exists():
        print(f"! no source dir: {src_dir}")
        return
    large_dir = truncated_dir(cfg.set_code, "large")
    small_dir = truncated_dir(cfg.set_code, "small")
    large_dir.mkdir(parents=True, exist_ok=True)
    small_dir.mkdir(parents=True, exist_ok=True)
    entries = [e for e in sorted(src_dir.iterdir()) if e.suffix.lower() == ".webp"]
    _run_in_parallel(
        lambda e: _truncate_one(e, large_dir / e.name, small_dir / e.name, cfg),
        entries,
        workers=cfg.workers,
    )


def _truncate_token_one(src: Path, dest: Path, cfg: "Config") -> None:
    """Token truncated variant: single cropped+resized WebP at trunc-large dimension."""
    img = Image.open(src)
    w, h = img.size
    if w > h:
        print(f"= skip wide token: {src.name} ({w}x{h})")
        return
    if h < cfg.top_crop + cfg.bottom_crop:
        print(f"= skip short token: {src.name} (h={h})")
        return
    top = img.crop((0, 0, w, cfg.top_crop))
    bottom = img.crop((0, h - cfg.bottom_crop, w, h))
    composite = Image.new(img.mode, (w, cfg.top_crop + cfg.bottom_crop))
    composite.paste(top, (0, 0))
    composite.paste(bottom, (0, cfg.top_crop))
    out = _resize_to_max(composite, cfg.trunc_large_dimension)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "WEBP", quality=cfg.webp_quality)
    print(f"+ token truncate {src.name} -> {out.size}")


def stage_truncate_tokens(cfg: "Config") -> None:
    print(f"\n── Stage: Truncate tokens (set=T{cfg.set_code}) ──")
    src_dir = token_format_dir(cfg.set_code, "standard")
    if not src_dir.exists():
        print(f"! no source dir: {src_dir}")
        return
    out_dir = token_format_dir(cfg.set_code, "truncated")
    out_dir.mkdir(parents=True, exist_ok=True)
    entries = [e for e in sorted(src_dir.iterdir()) if e.suffix.lower() == ".webp"]
    _run_in_parallel(
        lambda e: _truncate_token_one(e, out_dir / e.name, cfg),
        entries,
        workers=cfg.workers,
    )


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
    prefix = cfg.key_prefix.format(set=cfg.set_code).rstrip("/")
    for fmt, base in (
        ("standard", SCRIPT_DIR / cfg.set_code / "standard"),
        ("truncated", SCRIPT_DIR / cfg.set_code / "truncated"),
    ):
        if not base.exists():
            continue
        for size in ("large", "small"):
            d = base / size
            if not d.exists():
                continue
            for entry in sorted(d.iterdir()):
                if entry.suffix.lower() != ".webp":
                    continue
                key = f"{prefix}/{fmt}/{size}/{entry.name}"
                jobs.append(UploadJob(entry, key))
    return jobs


def _collect_token_jobs(cfg: "Config") -> list[UploadJob]:
    """Token files upload to cards/_tokens/{standard,truncated}/{s3Id}.webp.

    The on-disk filename is already the desired numeric S3 id (per the
    swudbId=s3Id mapping resolved at download time). Only files matching the
    s3Ids in the current --tokens mapping are uploaded; previously-processed
    tokens left over in the local folder are ignored.
    """
    allowed = {f"{s3_id}.webp" for _, s3_id in (cfg.tokens or [])}
    jobs: list[UploadJob] = []
    for fmt in ("standard", "truncated"):
        d = token_format_dir(cfg.set_code, fmt)
        if not d.exists():
            continue
        for entry in sorted(d.iterdir()):
            if entry.suffix.lower() != ".webp":
                continue
            if entry.name not in allowed:
                continue
            key = f"{TOKEN_KEY_PREFIX}{fmt}/{entry.name}"
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
    print(f"\n── Stage: Upload ({label}, dry_run={cfg.dry_run}) ──")

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
        for fut in cf.as_completed(futures):
            status, msg = fut.result()
            counts[status] = counts.get(status, 0) + 1
            print(msg)

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


def stage_tokens_download(cfg: "Config", mapping: list[tuple[str, str]]) -> None:
    print(f"\n── Stage: Download tokens (set=T{cfg.set_code}, count={len(mapping)}) ──")
    out = downloads_dir(cfg.set_code, tokens=True)
    out.mkdir(parents=True, exist_ok=True)
    session = requests.Session()

    def fetch(pair: tuple[str, str]) -> None:
        swu_id, s3_id = pair
        # Local filename uses the S3 id so the resize stage produces output
        # already named correctly for upload.
        dest = out / f"{s3_id}.png"
        if dest.exists() and not cfg.overwrite_downloads:
            print(f"= exists: {dest.name}")
            return
        url = cfg.token_source_url.format(set=cfg.set_code, n=swu_id)
        try:
            r = session.get(url, stream=True, timeout=HTTP_TIMEOUT)
            if r.status_code == 200:
                _save_response(r, dest)
                print(f"+ {swu_id} -> {dest.name}")
            else:
                print(f"- 404 {url}")
        except requests.RequestException as e:
            print(f"! download error {url}: {e}")

    try:
        _run_in_parallel(fetch, mapping, workers=min(cfg.workers, len(mapping)))
    finally:
        session.close()


# ───────────────────────────────── CLI ────────────────────────────────────

@dataclass
class Config:
    set_code: str
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


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Download, process, and upload SWU card images.")
    p.add_argument("--set", default=DEFAULT_SET_CODE, help=f"3-letter set code (default: {DEFAULT_SET_CODE}).")
    p.add_argument("--from", dest="from_stage", choices=STAGES, default="download",
                   help="Run stages starting from this one (default: download).")
    p.add_argument("--to", choices=STAGES, default="upload",
                   help="Run stages up to and including this one (default: upload).")
    p.add_argument("--source-url", default=DEFAULT_SOURCE_URL,
                   help="URL template; supports {set} and {n}.")
    p.add_argument("--token-source-url", default=DEFAULT_TOKEN_SOURCE_URL,
                   help="Token URL template; supports {set} and {n}.")
    p.add_argument("--bucket", default=DEFAULT_BUCKET)
    p.add_argument("--key-prefix", default=DEFAULT_KEY_PREFIX,
                   help="S3 key prefix; supports {set}.")
    p.add_argument("--aws-profile", default=None, help="boto3 profile name (optional).")
    p.add_argument("--no-auto-login", action="store_true",
                   help="Disable automatic 'aws sso login' if the SSO token has expired.")
    p.add_argument("--dry-run", action="store_true",
                   help="Plan uploads but do not write to S3.")
    p.add_argument("--overwrite-downloads", action="store_true",
                   help="Re-download even if the local file exists.")
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
    return p


def cfg_from_args(args: argparse.Namespace) -> Config:
    tokens = parse_token_mapping(args.tokens) if args.tokens else None
    return Config(
        set_code=args.set.upper(),
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
        max_attempts=args.max_attempts,
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
    )


def stage_index(name: str) -> int:
    return STAGES.index(name)


def main(argv: Optional[list[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = cfg_from_args(args)

    first = stage_index(cfg.from_stage)
    last = stage_index(cfg.to_stage)
    if first > last:
        print(f"! --from {cfg.from_stage} comes after --to {cfg.to_stage}; nothing to do.")
        return 2

    def should_run(stage: str) -> bool:
        idx = stage_index(stage)
        return first <= idx <= last

    if cfg.tokens is not None:
        # Token pipeline: download -> resize (standard) -> truncate -> upload.
        # Produces cards/_tokens/standard/{id}.webp and cards/_tokens/truncated/{id}.webp.
        if should_run("download"):
            stage_tokens_download(cfg, cfg.tokens)
        if should_run("resize"):
            stage_resize_tokens(cfg)
        if should_run("truncate"):
            stage_truncate_tokens(cfg)
        if should_run("upload"):
            stage_upload(cfg, tokens=True)
        return 0

    if should_run("download"):
        stage_download(cfg)
    if should_run("resize"):
        stage_resize(cfg)
    if should_run("truncate"):
        stage_truncate(cfg)
    if should_run("upload"):
        stage_upload(cfg)
    return 0


if __name__ == "__main__":
    sys.exit(main())
