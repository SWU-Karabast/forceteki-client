import os
import requests

# === CONFIGURATION ===
BASE_URL = "https://swudb.com/images/cards/{set_code}/{card_number}.png"
SET_CODE = "LAW"  # Change this manually when switching sets
OUTPUT_DIR = f"downloaded_images/{SET_CODE}"
MAX_ATTEMPTS = 265  # Safety limit (adjust if needed)
LEADER_ATTEMPTS = 30
OVERWRITE = False

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_image(card_number):
    """Downloads an image with a given card number."""
    url = BASE_URL.format(set_code=SET_CODE, card_number=str(card_number).zfill(3))
    save_path = os.path.join(OUTPUT_DIR, f"{str(card_number).zfill(3)}.png")
    leader_url = BASE_URL.format(set_code=SET_CODE, card_number=f"{str(card_number).zfill(3)}-portrait")
    leader_url_alt = BASE_URL.format(set_code=SET_CODE, card_number=f"{str(card_number).zfill(3)}-back")
    leader_save_path = os.path.join(OUTPUT_DIR, f"{str(card_number).zfill(3)}-base.png")

    # Check if the file already exists
    if os.path.exists(save_path) and not OVERWRITE:
        print(f"✅ Already exists: {save_path}")
        return

    try:
        response = requests.get(url, stream=True, timeout=10)
        leader_response = None
        
        if card_number <= LEADER_ATTEMPTS:
            leader_response = requests.get(leader_url, stream=True, timeout=10)
            if leader_response.status_code == 200:
                with open(save_path, "wb") as file:
                    for chunk in leader_response.iter_content(1024):
                        file.write(chunk)
                print(f"✅ Saved: {save_path}")
            else:
                print(f"❌ Leader image not found at: {leader_url} (Status: {leader_response.status_code})")
                leader_response = requests.get(leader_url_alt, stream=True, timeout=10)
                if leader_response.status_code == 200:
                    with open(save_path, "wb") as file:
                        for chunk in leader_response.iter_content(1024):
                            file.write(chunk)
                    print(f"✅ Saved: {save_path}")
                else:
                    print(f"❌ Leader image not found at: {leader_url_alt} (Status: {leader_response.status_code})")

        if response.status_code == 200:
            if leader_response and leader_response.status_code == 200:
                with open(leader_save_path, "wb") as file:
                    for chunk in response.iter_content(1024):
                        file.write(chunk)
                print(f"✅ Saved Leader: {leader_save_path}")
            else:
                with open(save_path, "wb") as file:
                    for chunk in response.iter_content(1024):
                        file.write(chunk)
                print(f"✅ Saved: {save_path}")
        else:
            print(f"❌ Image not found at: {url} (Status: {response.status_code})")



    except requests.RequestException as e:
        print(f"⚠️ Error downloading {url}: {e}")

def collect_set_images():
    """Iterates through card numbers until an image fails to download."""
    for card_number in range(1, MAX_ATTEMPTS):
        download_image(card_number)

# Run the script
if __name__ == "__main__":
    collect_set_images()
