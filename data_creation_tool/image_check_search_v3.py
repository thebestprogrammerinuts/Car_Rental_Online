import requests
import json
import time
from bs4 import BeautifulSoup
from urllib.parse import quote

def check_image_url(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        response = requests.head(url, headers=headers, timeout=10)
        return response.status_code == 200 and "gstatic" not in url
    except:
        return False

def google_image_search(query):
    try:
        search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch"
        headers = {
            'User-Agent': 'Mozilla/5.0'
        }
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        images = soup.find_all('img')
        for img in images:
            img_url = img.get('src')
            if img_url and img_url.startswith('http') and check_image_url(img_url):
                return img_url
    except:
        pass
    return None

def fallback_wikimedia(query):
    try:
        url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={quote(query)}&format=json"
        response = requests.get(url, timeout=10)
        data = response.json()
        if data.get('query', {}).get('search'):
            page_title = data['query']['search'][0]['title']
            image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(page_title)}"
            if check_image_url(image_url):
                return image_url
    except:
        pass
    return None

def find_replacement_image(car_data):
    base_query = f"{car_data['brand']} {car_data['carModel']} {car_data['yearOfManufacture']}"
    variations = [
        base_query,
        f"{car_data['brand']} {car_data['carModel']}",
        f"{car_data['brand']} {car_data['carModel']} car"
    ]
    for query in variations:
        img_url = google_image_search(query)
        if img_url:
            return img_url
        time.sleep(1)  # be polite to servers
    return fallback_wikimedia(base_query)

def process_car_data(car_data):
    if not check_image_url(car_data['image']):
        print(f"Missing or invalid image for {car_data['brand']} {car_data['carModel']}. Searching...")
        replacement = find_replacement_image(car_data)
        if replacement:
            car_data['image'] = replacement
            print(f"→ Found: {replacement}")
        else:
            print(f"→ Not found.")
    return car_data

# Load your JSON data
with open('cars_draft.json', 'r') as f:
    cars_data = json.load(f)

# Process each car
processed_cars = [process_car_data(car) for car in cars_data]

# Save the updated JSON
with open('cars_processed.json', 'w') as f:
    json.dump(processed_cars, f, indent=2)

print("Done. Saved to cars_processed.json.")
