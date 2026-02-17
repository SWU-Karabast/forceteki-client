import argparse
import os
from PIL import Image

# === CONFIGURATION ===
TOP_CROP_HEIGHT = 255   # Keep the top 255px
BOTTOM_CROP_HEIGHT = 32 # Keep the bottom 32px and move it up
WEBP_QUALITY = 90

SIZES = {
    "large": 180,
    "small": 100,
}

def resize_image(image, final_size):
    """Resizes image while maintaining aspect ratio, fitting within final_size x final_size."""
    width, height = image.size
    scale_factor = final_size / max(width, height)
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)
    return image.resize((new_width, new_height), Image.LANCZOS)

def truncate_and_resize_image(file_path, output_path, final_size):
    """Creates a truncated version of the card and resizes it to fit within final_size x final_size."""
    image = Image.open(file_path)
    width, height = image.size

    if width > height:
        print(f"Skipping {file_path}: Image wider than tall (width={width}, height={height})")
        return

    if height < TOP_CROP_HEIGHT + BOTTOM_CROP_HEIGHT:
        print(f"Skipping {file_path}: Image too short (height={height})")
        return

    # Crop the top and bottom parts
    top_part = image.crop((0, 0, width, TOP_CROP_HEIGHT))
    bottom_part = image.crop((0, height - BOTTOM_CROP_HEIGHT, width, height))

    # Create new truncated image (Top + Bottom)
    new_height = TOP_CROP_HEIGHT + BOTTOM_CROP_HEIGHT
    truncated_image = Image.new(image.mode, (width, new_height))
    truncated_image.paste(top_part, (0, 0))
    truncated_image.paste(bottom_part, (0, TOP_CROP_HEIGHT))

    resized_image = resize_image(truncated_image, final_size)

    resized_image.save(output_path, "WEBP", quality=WEBP_QUALITY)
    print(f"Processed & saved: {output_path} ({resized_image.size[0]}x{resized_image.size[1]})")

def process_all_images(input_dir, output_dir, final_size):
    """Processes all images in input_dir and saves to output_dir."""
    os.makedirs(output_dir, exist_ok=True)

    for filename in os.listdir(input_dir):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            input_path = os.path.join(input_dir, filename)
            output_filename = os.path.splitext(filename)[0] + ".webp"
            output_path = os.path.join(output_dir, output_filename)
            truncate_and_resize_image(input_path, output_path, final_size)

    print("All images processed!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Truncate card images (keep top and bottom) and resize.")
    parser.add_argument("set_code", help="Set code (e.g. LAW, SOR)")
    parser.add_argument("--size", choices=["large", "small"], default="large", help="Output size (default: large)")
    args = parser.parse_args()

    final_size = SIZES[args.size]
    input_dir = f"{args.set_code}/standard/large"
    output_dir = f"{args.set_code}/truncated/{args.size}"

    process_all_images(input_dir, output_dir, final_size)
