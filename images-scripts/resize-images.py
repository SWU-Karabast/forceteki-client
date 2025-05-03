import os
import cv2
import numpy as np
from PIL import Image, ImageFilter

# === CONFIGURATION ===
INPUT_DIR = "downloaded_images\LOF"  # Adjust per set
OUTPUT_DIR = "processed_images/LOF/large"
MAX_DIMENSION = 400  # Maximum width or height
WEBP_QUALITY = 90

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def resize_image(image):
    """Resizes an image while maintaining its aspect ratio, ensuring the longest side is MAX_DIMENSION."""
    width, height = image.size

    # Determine scale factor to make the longest side MAX_DIMENSION
    scale_factor = MAX_DIMENSION / max(width, height)
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)

    return image.resize((new_width, new_height), Image.LANCZOS)

def process_image(file_path, output_path):
    """Resizes and sharpens an image, then saves it as WebP."""
    # Open image using OpenCV
    image = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)

    if image is None:
        print(f"❌ Error opening image: {file_path}")
        return

    # Convert to PIL for processing
    pil_img = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    # Resize while preserving aspect ratio
    pil_img = resize_image(pil_img)

    # Apply Unsharp Mask for sharpening
    pil_img = pil_img.filter(ImageFilter.UnsharpMask(radius=1, percent=50, threshold=10))

    # Save as WebP with quality setting
    pil_img.save(output_path, "WEBP", quality=WEBP_QUALITY)

    print(f"✅ Processed & saved: {output_path} ({pil_img.size[0]}x{pil_img.size[1]})")

def process_all_images():
    """Processes all images in INPUT_DIR and saves to OUTPUT_DIR."""
    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
            input_path = os.path.join(INPUT_DIR, filename)
            output_filename = os.path.splitext(filename)[0] + ".webp"
            output_path = os.path.join(OUTPUT_DIR, output_filename)

            process_image(input_path, output_path)

    print("🚀 All images processed!")

# Run the script
if __name__ == "__main__":
    process_all_images()
