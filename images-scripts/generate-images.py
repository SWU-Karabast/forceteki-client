"""Cross-platform runner that downloads, resizes, and truncates card images for a given set."""

import argparse
import subprocess
import sys
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

STEPS = [
    ["get-card-images.py"],
    ["resize-images.py", "--size", "small"],
    ["resize-images.py", "--size", "large"],
    ["truncate-cards.py", "--size", "small"],
    ["truncate-cards.py", "--size", "large"],
]

def main():
    parser = argparse.ArgumentParser(description="Generate all card images for a set.")
    parser.add_argument("set_code", help="Set code (e.g. LAW, SOR)")
    args = parser.parse_args()

    for step in STEPS:
        script = step[0]
        extra_args = step[1:]
        cmd = [sys.executable, os.path.join(SCRIPTS_DIR, script), args.set_code] + extra_args
        print(f"\n{'='*60}")
        print(f"Running: {' '.join(cmd)}")
        print(f"{'='*60}\n")
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"ERROR: {script} failed with exit code {result.returncode}")
            sys.exit(result.returncode)

    print(f"\nAll images generated for set {args.set_code}!")

if __name__ == "__main__":
    main()
