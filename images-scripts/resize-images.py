import argparse
import os
from PIL import Image, ImageFilter

# === CONFIGURATION ===
WEBP_QUALITY = 90

SIZES = {
    "large": 400,
    "small": 200,
}

def resize_image(image, max_dimension):
    """Resizes an image while maintaining its aspect ratio, ensuring the longest side is max_dimension."""
    width, height = image.size
    scale_factor = max_dimension / max(width, height)
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)
    return image.resize((new_width, new_height), Image.LANCZOS)

def process_image(file_path, output_path, max_dimension):
    """Resizes and sharpens an image, then saves it as WebP."""
    image = Image.open(file_path)

    image = resize_image(image, max_dimension)
    image = image.filter(ImageFilter.UnsharpMask(radius=1, percent=50, threshold=10))

    image.save(output_path, "WEBP", quality=WEBP_QUALITY)
    print(f"Processed & saved: {output_path} ({image.size[0]}x{image.size[1]})")

def process_all_images(input_dir, output_dir, max_dimension):
    """Processes all images in input_dir and saves to output_dir."""
    os.makedirs(output_dir, exist_ok=True)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            input_path = os.path.join(input_dir, filename)
            output_filename = os.path.splitext(filename)[0] + ".webp"
            output_path = os.path.join(output_dir, output_filename)
            process_image(input_path, output_path, max_dimension)

    print("All images processed!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Resize card images to WebP format.")
    parser.add_argument("set_code", help="Set code (e.g. LAW, SOR)")
    parser.add_argument("--size", choices=["large", "small"], default="large", help="Output size (default: large)")
    args = parser.parse_args()

    max_dimension = SIZES[args.size]
    input_dir = f"downloaded_images/{args.set_code}"
    output_dir = f"{args.set_code}/standard/{args.size}"

    process_all_images(input_dir, output_dir, max_dimension)
