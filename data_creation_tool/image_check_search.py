import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import quote

def check_image_url(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.head(url, headers=headers, timeout=10)
        return response.status_code == 200
    except:
        return False

def find_replacement_image(car_data):
    search_query = f"{car_data['brand']} {car_data['carModel']} {car_data['yearOfManufacture']}"
    try:
        url = f"https://www.google.com/search?q={quote(search_query)}&tbm=isch"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        images = soup.find_all('img')
        
        for img in images:
            img_url = img.get('src')
            if img_url and img_url.startswith('http') and check_image_url(img_url):
                return img_url
    except:
        pass
    
    # Fallback to Wikimedia Commons search
    try:
        url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={quote(search_query)}&format=json"
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

def process_car_data(car_data):
    if not check_image_url(car_data['image']):
        print(f"Image not available for {car_data['brand']} {car_data['carModel']}. Searching for replacement...")
        replacement = find_replacement_image(car_data)
        if replacement:
            car_data['image'] = replacement
            print(f"Found replacement image: {replacement}")
        else:
            print(f"Could not find replacement image for {car_data['brand']} {car_data['carModel']}")
    return car_data

# Load your JSON data
with open('cars_draft.json', 'r') as f:
    cars_data = json.load(f)

# Process each car
processed_cars = [process_car_data(car) for car in cars_data]

# Save the updated JSON
with open('cars_processed.json', 'w') as f:
    json.dump(processed_cars, f, indent=2)

print("Processing complete. Updated JSON saved to cars_processed.json")