import os
from PIL import Image

# === CONFIGURATION ===
INPUT_DIR = "LOF/standard/large"  # Folder with original processed images
OUTPUT_DIR = "LOF/truncated/small"
TOP_CROP_HEIGHT = 255   # Keep the top 200px
BOTTOM_CROP_HEIGHT = 32 # Keep the bottom 15px and move it up
FINAL_SIZE = 100        # Target size (max width or height)
WEBP_QUALITY = 90       # WebP compression quality

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def resize_image(image):
    """Resizes image while maintaining aspect ratio, fitting within FINAL_SIZE x FINAL_SIZE."""
    width, height = image.size

    # Determine scaling factor
    scale_factor = FINAL_SIZE / max(width, height)
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)

    return image.resize((new_width, new_height), Image.LANCZOS)

def truncate_and_resize_image(file_path, output_path):
    """Creates a truncated version of the card and resizes it to ~150x150."""
    image = Image.open(file_path)
    width, height = image.size

    if width > height:
        print(f"⚠️ Skipping {file_path}: Image wider than tall (width={width}, height={height})")
        return

    # Ensure the image is tall enough
    if height < TOP_CROP_HEIGHT + BOTTOM_CROP_HEIGHT:
        print(f"⚠️ Skipping {file_path}: Image too short (height={height})")
        return

    # Crop the top and bottom parts
    top_part = image.crop((0, 0, width, TOP_CROP_HEIGHT))
    bottom_part = image.crop((0, height - BOTTOM_CROP_HEIGHT, width, height))

    # Create new truncated image (Top + Bottom)
    new_height = TOP_CROP_HEIGHT + BOTTOM_CROP_HEIGHT
    truncated_image = Image.new(image.mode, (width, new_height))
    truncated_image.paste(top_part, (0, 0))
    truncated_image.paste(bottom_part, (0, TOP_CROP_HEIGHT))

    # Resize to fit within 150x150 while keeping aspect ratio
    resized_image = resize_image(truncated_image)

    # Save as WebP
    resized_image.save(output_path, "WEBP", quality=WEBP_QUALITY)
    print(f"✅ Processed & saved: {output_path} ({resized_image.size[0]}x{resized_image.size[1]})")

def process_all_images():
    """Processes all images in INPUT_DIR and saves to OUTPUT_DIR."""
    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            input_path = os.path.join(INPUT_DIR, filename)
            output_filename = os.path.splitext(filename)[0] + ".webp"
            output_path = os.path.join(OUTPUT_DIR, output_filename)
            truncate_and_resize_image(input_path, output_path)
    
    print("🚀 All images processed!")

if __name__ == "__main__":
    process_all_images()
