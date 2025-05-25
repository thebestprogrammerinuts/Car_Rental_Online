# LuxeWheels Car Rental System

A modern web application for car rental services, built with Flask backend and vanilla JavaScript frontend.

## Features

- **Interactive Homepage**
  - Smooth-scrolling horizontal carousel of available cars
  - Complete car listing in grid layout
  - Real-time search with suggestions
  - Filter cars by type and brand

- **Advanced Search**
  - Keyword-based search for car type, brand, model, and description
  - Real-time search suggestions
  - Combine search with filters

- **Car Details**
  - Detailed car information including images
  - Price per day
  - Availability status
  - One-click reservation

- **Reservation System**
  - User-friendly reservation form
  - Real-time form validation
  - Automatic price calculation
  - Form data persistence using localStorage
  - Comprehensive order confirmation

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data Storage**: JSON files
- **State Management**: localStorage/sessionStorage

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd car-rental-system
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Project Structure

```
car-rental-system/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── json_data/            # Data storage
│   ├── cars_processed_v1.json  # Car information
│   └── orders.json             # Order information
├── static/               # Static files
│   ├── css/
│   │   └── style.css    # Main stylesheet
│   └── js/
│       ├── index.js     # Homepage JavaScript
│       └── reservation.js# Reservation page JavaScript
└── templates/           # HTML templates
    ├── base.html       # Base template
    ├── index.html      # Homepage template
    └── reservation.html# Reservation page template
```

## Data Structure

### Cars (cars_processed_v1.json)
```json
{
  "carType": "string",
  "brand": "string",
  "carModel": "string",
  "image": "string (URL)",
  "yearOfManufacture": "number",
  "mileage": "number",
  "fuelType": "string",
  "available": "boolean",
  "pricePerDay": "number",
  "description": "string",
  "vin": "string"
}
```

### Orders (orders.json)
```json
{
  "customer": {
    "name": "string",
    "phoneNumber": "string",
    "email": "string",
    "driversLicenseNumber": "string"
  },
  "car": {
    "vin": "string"
  },
  "rental": {
    "startDate": "string (YYYY-MM-DD)",
    "rentalPeriod": "number",
    "totalPrice": "number",
    "orderDate": "string (YYYY-MM-DD)"
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 