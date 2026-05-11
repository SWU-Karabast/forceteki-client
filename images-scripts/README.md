# Card image pipeline

A single script that downloads SWU card images from swudb.com, generates the
resized / truncated WebP variants used by the site, and uploads them to S3
(`karabast-data` bucket under `cards/{SET}/...`). Supports skipping unchanged
files via S3 ETag (MD5) comparison.

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
# Full pipeline for the default set
python process_cards.py

# Override set
python process_cards.py --set ASH

# Stop after a stage (intermediate files remain for inspection)
python process_cards.py --to download
python process_cards.py --to resize
python process_cards.py --to truncate
python process_cards.py --to upload      # default

# Skip earlier stages (e.g. re-upload an already-processed set)
python process_cards.py --from upload
python process_cards.py --from resize --to truncate

# Dry-run upload to preview changes
python process_cards.py --dry-run

# Common tunables
python process_cards.py --max-attempts 280 --leader-attempts 35 --webp-quality 92

# Token mode (separate; --to still applies)
python process_cards.py --set TWI --tokens T01=3941784506,T03=7268926664
```

Run `python process_cards.py --help` for the full list of options.

## Stages

1. **download** – fetches `NNN.png` from swudb into `downloaded_images/{SET}/`.
   For card numbers within `--leader-attempts`, also fetches `-portrait` /
   `-back` and stores it as `NNN.png`, while the regular card image is stored
   as `NNN-base.png`.

   > **Do not "fix" the leader filename inversion** without also updating
   > `src/app/_utils/s3Utils.ts` — the site's URL builder expects this
   > convention.

2. **resize** – produces `{SET}/standard/large/*.webp` (max 400 px) and
   `{SET}/standard/small/*.webp` (max 200 px).

3. **truncate** – produces `{SET}/truncated/large/*.webp` (max 180 px) and
   `{SET}/truncated/small/*.webp` (max 100 px) by cropping the top 255 px and
   bottom 32 px of each card and stitching them together.

4. **upload** – syncs the four output folders to
   `s3://karabast-data/cards/{SET}/{format}/{size}/`. For each file:
   - `HEAD` the object; compare ETag (MD5) to the local file's MD5.
   - Skip if identical, otherwise upload with
     `Content-Type: image/webp` and a 1-year immutable `Cache-Control`.

## Set rotation

When the set rotates, bump `DEFAULT_SET_CODE` near the top of
`process_cards.py`. Until then, override per-invocation with `--set XYZ`.

## Tokens

Tokens live under `cards/_tokens/{standard,truncated}/{numeric_id}.webp` (no
large/small split). Because swudb identifies tokens by a code like `T01` but
the site references them by a numeric id, the `--tokens` flag takes a
comma-separated `swudbId=s3Id` mapping. The numeric ids currently in use are
listed in `s3Utils.ts`.
