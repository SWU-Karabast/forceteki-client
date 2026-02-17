# Image Scripts

Scripts for downloading and processing SWU card images. Images are converted to WebP format in multiple sizes for use in the client.

## Requirements

- Python 3
- `pip install pillow requests`

## Quick Start

Run all steps for a set with a single command:

```sh
python generate-images.py SOR
```

This downloads, resizes, and truncates all card images for the given set code.

## Scripts

### generate-images.py

Orchestrator that runs all the other scripts in order. This is the main entry point.

```sh
python generate-images.py <set_code>
```

### get-card-images.py

Downloads card images (PNGs) from swudb.com. For early card numbers it also attempts to download leader portrait/back variants.

```sh
python get-card-images.py <set_code>
```

- Output: `downloaded_images/<set_code>/`
- Skips images that already exist locally (set `OVERWRITE = True` to re-download)
- `MAX_ATTEMPTS` controls how many card numbers to try (default 300)
- `LEADER_ATTEMPTS` controls how many card numbers to check for leader variants (default 30)

### resize-images.py

Resizes downloaded images to WebP while preserving aspect ratio and applying a sharpening filter.

```sh
python resize-images.py <set_code> --size large   # max 400px (default)
python resize-images.py <set_code> --size small   # max 200px
```

- Input: `downloaded_images/<set_code>/`
- Output: `<set_code>/standard/large/` or `<set_code>/standard/small/`

### truncate-cards.py

Creates truncated card images by keeping only the top 255px and bottom 32px of each card, then joining and resizing them. This produces compact card previews. Landscape (wider than tall) images are skipped.

```sh
python truncate-cards.py <set_code> --size large   # max 180px (default)
python truncate-cards.py <set_code> --size small   # max 100px
```

- Input: `<set_code>/standard/large/`
- Output: `<set_code>/truncated/large/` or `<set_code>/truncated/small/`

## Output Directory Structure

```
downloaded_images/<set_code>/    # Raw PNGs from swudb.com
<set_code>/
  standard/
    large/                       # 400px WebP
    small/                       # 200px WebP
  truncated/
    large/                       # 180px truncated WebP
    small/                       # 100px truncated WebP
```
