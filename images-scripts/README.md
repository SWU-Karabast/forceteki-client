# Card image pipeline

A single script that downloads SWU card images, generates the resized /
truncated WebP variants used by the site, and uploads them to S3
(`karabast-data` bucket under `cards/{SET}/{locale}/...`). English images
come from swudb.com (high quality); non-English locales come from the FFG
card data API. When FFG has no localized image for a card yet (e.g. recent
preview cards that swudb has but FFG hasn't published), the script copies
the English webp into the locale folder so the S3 layout stays complete
for every locale. Supports skipping unchanged files via S3 ETag (MD5)
comparison.

## Setup

```powershell
# from repo root
cd images-scripts

python -m venv .venv
.\.venv\Scripts\Activate.ps1     # Windows PowerShell
# source .venv/bin/activate      # macOS / Linux

pip install -r requirements.txt
```

AWS credentials use the standard boto3 chain (env vars, `~/.aws/credentials`,
instance role, etc.). Use `--aws-profile NAME` to pick a named profile.

Before the upload stage runs, the script verifies your credentials with a
`sts:GetCallerIdentity` call. If you use AWS SSO and your token has expired,
it will automatically run `aws sso login` (opening a browser) — pass
`--no-auto-login` to disable this. Other auth failures (no credentials,
invalid keys, permission denied) print an actionable error and exit with
code 2 before any S3 traffic is attempted.

## Usage

```powershell
# Full pipeline for the default set, all locales (en,fr,de,es,it)
python process_cards.py

# Override set
python process_cards.py --set ASH

# Process only a subset of locales
python process_cards.py --locales en,fr
python process_cards.py --locales all     # explicit; same as default

# Stop after a stage (intermediate files remain for inspection)
python process_cards.py --to download
python process_cards.py --to resize
python process_cards.py --to truncate
python process_cards.py --to fallback
python process_cards.py --to upload       # default

# Skip earlier stages (e.g. re-upload an already-processed set)
python process_cards.py --from upload
python process_cards.py --from resize --to truncate

# Dry-run upload to preview changes
python process_cards.py --dry-run

# Fill swudb gaps with FFG's English images (off by default; FFG English
# art is typically lower-res than swudb's, so this is a 'make do' for
# preview cards that swudb has not ingested yet). Also applies to tokens
# when --tokens is used. Re-run with --overwrite-downloads once swudb
# publishes the real image.
python process_cards.py --set ASH --ffg-en-fallback

# Common tunables
python process_cards.py --max-attempts 280 --leader-attempts 35 --webp-quality 92

# Token mode (separate; --to still applies). English tokens come from
# swudb; non-English tokens come from the FFG API (by cardUid). Missing
# localized tokens fall back to English copies via the fallback stage.
python process_cards.py --set TWI --tokens T01=3941784506,T03=7268926664
```

Run `python process_cards.py --help` for the full list of options.

## Stages

1. **download** – fetches `NNN.png` into `card-images/downloaded/{SET}/{locale}/`.
   - `en`: from swudb. For card numbers within `--leader-attempts`, also
     fetches `-portrait` / `-back` and stores it as `NNN.png`, while the
     regular card image is stored as `NNN-base.png`. If
     `--ffg-en-fallback` is set, any card swudb didn't supply is
     additionally probed against the FFG `en` API and substituted when
     available (see [FFG English fallback](#ffg-english-fallback) below).
   - other locales: from the FFG card data API. The script fetches a
     per-(set, locale) index from
     `https://admin.starwarsunlimited.com/api/cards?filters[expansion][code]={SET}&locale={LANG}`
     and downloads each card's full-resolution `artFront` (and `artBack`
     for leaders) by `cardNumber`. Cards not yet present in FFG are simply
     skipped at this stage; the fallback stage fills the gaps.

   > **Do not "fix" the leader filename inversion** without also updating
   > `src/app/_utils/s3Utils.ts` — the site's URL builder expects this
   > convention.

2. **resize** – produces `card-images/processed/{SET}/{locale}/standard/large/*.webp` (max 400 px)
   and `card-images/processed/{SET}/{locale}/standard/small/*.webp` (max 200 px).

3. **truncate** – produces `card-images/processed/{SET}/{locale}/truncated/large/*.webp` (max 180 px)
   and `card-images/processed/{SET}/{locale}/truncated/small/*.webp` (max 100 px) by cropping the
   top 255 px and bottom 32 px of each card and stitching them together.

4. **fallback** – for each non-`en` locale, copies any `en/*.webp` that has
   no corresponding locale webp into the locale's working tree. Never
   overwrites an existing locale webp. This ensures every locale's S3
   subtree is complete even when FFG lags swudb on preview cards. When FFG
   later publishes the localized image, the next pipeline run downloads
   it, resize/truncate overwrite the webp, the md5 changes, and the upload
   stage replaces the S3 object automatically.

5. **upload** – syncs the per-locale output folders to
   `s3://karabast-data/cards/{SET}/{locale}/{format}/{size}/`. For each file:
   - `HEAD` the object; compare ETag (MD5) to the local file's MD5 *and*
     compare the live `Cache-Control` header to the desired value for
     this set (see [Preview-set caching](#preview-set-caching) below).
   - If bytes differ → full PUT with the desired `Cache-Control`.
   - If bytes match but `Cache-Control` differs → in-place
     `CopyObject` with `MetadataDirective=REPLACE` rewrites the headers
     without re-transferring the body.
   - Otherwise skip.

## FFG English fallback

By default the English download stage treats a swudb 404 as "card not
yet published" and moves on; the locale fallback stage then propagates
the (missing) English to no one, leaving the card absent from every
locale. Pass `--ffg-en-fallback` to instead query the FFG API's
`locale=en` index for any card swudb didn't supply and substitute its
`artFront` (and `artBack` for leaders, with the same FFG→swudb
orientation swap used for non-English locales).

Caveats:

- FFG English images are typically lower resolution than swudb's. This
  flag is a "make do" substitute intended for preview cards that swudb
  has not ingested yet, not a permanent replacement.
- Substituted PNGs are cached on disk like any other download. To
  re-attempt swudb on the next run (e.g. after swudb publishes the real
  image), pass `--overwrite-downloads`.
- When `--tokens` is used, the flag also routes a missing-from-swudb
  token through the same FFG English path (`cardUid` lookup) instead of
  aborting with the standard "token not found on swudb" error.
- The download stage prints both per-card substitution lines and a
  summary count at the end, so substitutions are never silent.

## Preview-set caching

Stable sets are uploaded with `Cache-Control: public, max-age=31536000,
immutable` (1 year). Preview sets are uploaded with `public,
max-age=604800, immutable` (1 week) so browsers naturally pick up any
mid-preview image updates (low-res replacements, locale fill-ins as FFG
catches up to swudb) within a week of the change.

The list of preview sets lives in `PREVIEW_SETS` near the top of
`process_cards.py`. To rotate a set:

1. **Promoting to preview**: add the set code to `PREVIEW_SETS` and run
   the pipeline. New objects upload with the 1-week header; any existing
   objects with the 1-year header are detected as `header-changed` and
   their `Cache-Control` is rewritten in place via `CopyObject` (no body
   re-upload, no bandwidth cost).
2. **During preview**: ongoing pipeline runs continue normally. Any
   image whose bytes change still does a full PUT — the bytes-vs-header
   check is ordered so a content change always wins over a header
   change.
3. **Demoting after stabilization**: remove the set from `PREVIEW_SETS`
   and run the pipeline once. Every object reclassifies as
   `header-changed` and the headers are rewritten back to the 1-year
   immutable value.

The client-side `?v=N` cache-buster in `src/app/_utils/s3Utils.ts`
remains the global escape hatch if a coarser cache invalidation is ever
needed.

## Set rotation

When the set rotates, bump `DEFAULT_SET_CODE` near the top of
`process_cards.py`. Until then, override per-invocation with `--set XYZ`.

## Tokens

Tokens live under `cards/_tokens/{locale}/{standard,truncated}/{numeric_id}.webp`
(no large/small split). Because swudb identifies tokens by a code like `T01`
but the site references them by a numeric id, the `--tokens` flag takes a
comma-separated `swudbId=ffgId` mapping. The numeric ids currently in use are
listed in `s3Utils.ts`.

English tokens come from swudb (keyed by the left side of each `=`). For
each non-English locale, the script then queries the FFG admin API by
`cardUid` (the numeric id on the right side of each `=` — tokens have a
null `cardId` and use `cardUid` instead, mirroring
[`forceteki/scripts/fetchdata.js`](../../forceteki/scripts/fetchdata.js)) and
downloads `artFront` per (token, locale). Tokens not yet present in FFG
for a given locale are filled with English copies by the fallback stage.
