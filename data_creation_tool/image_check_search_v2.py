import requests
import json
from urllib.parse import quote

UNSPLASH_ACCESS_KEY = 'yC0POz9tOmg6UUFNXZ2_MLU3jDPyoUPM1_eWc1-LEtY'

def check_image_url(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        response = requests.head(url, headers=headers, timeout=10)
        return response.status_code == 200
    except:
        return False

def find_replacement_image(car_data):
    query = f"{car_data['brand']} {car_data['carModel']}"
    url = f"https://api.unsplash.com/search/photos?query={quote(query)}&client_id={UNSPLASH_ACCESS_KEY}&orientation=landscape&per_page=1"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        results = data.get('results')
        if results:
            image_url = results[0]['urls']['regular']
            if check_image_url(image_url):
                return image_url
    except:
        pass
    return None

def process_car_data(car_data):
    if not check_image_url(car_data['image']):
        print(f"Missing image for {car_data['brand']} {car_data['carModel']}. Searching...")
        replacement = find_replacement_image(car_data)
        if replacement:
            car_data['image'] = replacement
            print(f"✅ Found: {replacement}")
        else:
            print(f"❌ No image found. Leaving image empty.")
            car_data['image'] = ""
    return car_data

# Load JSON
with open('cars_draft.json', 'r') as f:
    cars_data = json.load(f)

# Process
processed_cars = [process_car_data(car) for car in cars_data]

# Save
with open('cars_processed.json', 'w') as f:
    json.dump(processed_cars, f, indent=2)

print("✅ Done. Output saved to cars_processed.json")
