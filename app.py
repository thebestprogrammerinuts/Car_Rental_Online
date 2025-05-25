import os
import json
from flask import Flask, jsonify, request, render_template, session
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = os.urandom(24)  # For session management

# Load car data
def load_cars():
    """
    Load car data from JSON file
    Returns: List of car dictionaries
    """
    with open('json_data/cars_processed_v1.json', 'r') as f:
        return json.load(f)

# Load orders data
def load_orders():
    """
    Load orders data from JSON file
    Returns: Dictionary containing orders list
    """
    with open('json_data/orders.json', 'r') as f:
        return json.load(f)

# Save orders data
def save_orders(orders_data):
    """
    Save orders data to JSON file
    Args:
        orders_data: Dictionary containing orders list
    """
    with open('json_data/orders.json', 'w') as f:
        json.dump(orders_data, f, indent=2)

@app.route('/')
def home():
    """Render the homepage"""
    return render_template('index.html')

@app.route('/reservation')
def reservation():
    """Render the reservation page"""
    return render_template('reservation.html')

@app.route('/api/cars')
def get_cars():
    """
    Get all cars or filter by search query and filters
    Query parameters:
        search: Search query string
        type: Car type filter
        brand: Brand filter
    Returns: JSON response with filtered cars
    """
    cars = load_cars()
    search_query = request.args.get('search', '').lower()
    car_type = request.args.get('type', '').lower()
    brand = request.args.get('brand', '').lower()
    
    # Apply filters
    if search_query:
        cars = [car for car in cars if 
                search_query in car['carType'].lower() or
                search_query in car['brand'].lower() or
                search_query in car['carModel'].lower() or
                search_query in car['description'].lower()]
    
    if car_type:
        cars = [car for car in cars if car['carType'].lower() == car_type]
    
    if brand:
        cars = [car for car in cars if car['brand'].lower() == brand]
    
    return jsonify(cars)

@app.route('/api/car/<vin>')
def get_car(vin):
    """
    Get car details by VIN
    Args:
        vin: Vehicle Identification Number
    Returns: JSON response with car details
    """
    cars = load_cars()
    car = next((car for car in cars if car['vin'] == vin), None)
    if car:
        return jsonify(car)
    return jsonify({'error': 'Car not found'}), 404

@app.route('/api/car-types')
def get_car_types():
    """
    Get unique car types for filtering
    Returns: JSON response with unique car types
    """
    cars = load_cars()
    types = sorted(list(set(car['carType'] for car in cars)))
    return jsonify(types)

@app.route('/api/brands')
def get_brands():
    """
    Get unique car brands for filtering
    Returns: JSON response with unique brands
    """
    cars = load_cars()
    brands = sorted(list(set(car['brand'] for car in cars)))
    return jsonify(brands)

@app.route('/api/search-suggestions')
def get_search_suggestions():
    """
    Get search suggestions based on query
    Query parameters:
        q: Search query string
    Returns: JSON response with search suggestions
    """
    query = request.args.get('q', '').lower()
    cars = load_cars()
    suggestions = set()
    
    for car in cars:
        if query in car['carType'].lower():
            suggestions.add(car['carType'])
        if query in car['brand'].lower():
            suggestions.add(car['brand'])
        if query in car['carModel'].lower():
            suggestions.add(car['carModel'])
    
    return jsonify(list(suggestions))

@app.route('/api/reserve', methods=['POST'])
def reserve_car():
    """
    Create a new car reservation
    Request body:
        customer: Customer details (name, phone, email, license)
        car: Car details (vin)
        rental: Rental details (startDate, rentalPeriod)
    Returns: JSON response with reservation status
    """
    data = request.json
    cars = load_cars()
    orders_data = load_orders()
    
    # Verify car availability
    car = next((car for car in cars if car['vin'] == data['car']['vin']), None)
    if not car or not car['available']:
        return jsonify({'error': 'Car is not available'}), 400
    
    # Calculate total price
    total_price = car['pricePerDay'] * data['rental']['rentalPeriod']
    
    # Create new order
    new_order = {
        'customer': data['customer'],
        'car': {'vin': car['vin']},
        'rental': {
            'startDate': data['rental']['startDate'],
            'rentalPeriod': data['rental']['rentalPeriod'],
            'totalPrice': total_price,
            'orderDate': datetime.now().strftime('%Y-%m-%d')
        }
    }
    
    # Update orders
    orders_data['orders'].append(new_order)
    save_orders(orders_data)
    
    # Update car availability
    car['available'] = False
    with open('json_data/cars_processed_v1.json', 'w') as f:
        json.dump(cars, f, indent=2)
    
    return jsonify({'success': True, 'order': new_order})

if __name__ == '__main__':
    app.run(debug=True) 