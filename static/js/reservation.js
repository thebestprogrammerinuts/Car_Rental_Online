// DOM Elements
const carDetails = document.getElementById('carDetails');
const noCarMessage = document.querySelector('.no-car-message');
const carInfo = document.querySelector('.car-info');
const reservationForm = document.getElementById('reservationForm');
const submitButton = document.getElementById('submitButton');
const cancelButton = document.getElementById('cancelButton');
const totalPriceElement = document.getElementById('totalPrice');

// Form Elements
const formInputs = {
    name: document.getElementById('name'),
    phone: document.getElementById('phone'),
    email: document.getElementById('email'),
    license: document.getElementById('license'),
    startDate: document.getElementById('startDate'),
    rentalPeriod: document.getElementById('rentalPeriod')
};

// State
let selectedCar = null;
let pricePerDay = 0;
const STORAGE_KEY = 'reservationFormData';

// Validation Rules
const validationRules = {
    name: {
        pattern: /^[a-zA-Z\s]{2,50}$/,
        message: 'Please enter a valid name (2-50 characters, letters only)'
    },
    phone: {
        pattern: /^\+?[\d\s-]{10,15}$/,
        message: 'Please enter a valid phone number (10-15 digits)'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    license: {
        pattern: /^[A-Z0-9]{5,15}$/,
        message: 'Please enter a valid driver\'s license number (5-15 characters)'
    },
    startDate: {
        validate: (value) => {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date >= today;
        },
        message: 'Start date must be today or later'
    },
    rentalPeriod: {
        validate: (value) => {
            const days = parseInt(value);
            return days > 0 && days <= 30;
        },
        message: 'Rental period must be between 1 and 30 days'
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    const selectedCarVIN = localStorage.getItem('selectedCarVIN');
    
    if (selectedCarVIN) {
        await loadCarDetails(selectedCarVIN);
    } else {
        showNoCarMessage();
    }

    loadSavedFormData();
    setupEventListeners();
});

// Load car details from API
async function loadCarDetails(vin) {
    try {
        const response = await fetch(`/api/car/${vin}`);
        const car = await response.json();
        
        if (car.error) {
            showNoCarMessage();
            return;
        }

        selectedCar = car;
        pricePerDay = car.pricePerDay;
        
        if (!car.available) {
            showUnavailableMessage();
            return;
        }

        displayCarInfo(car);
        showReservationForm();
    } catch (error) {
        console.error('Error loading car details:', error);
        showNoCarMessage();
    }
}

// Display car information
function displayCarInfo(car) {
    noCarMessage.style.display = 'none';
    carInfo.style.display = 'block';
    
    const image = carInfo.querySelector('img');
    const title = carInfo.querySelector('.car-title');
    const type = carInfo.querySelector('.car-type');
    const description = carInfo.querySelector('.car-description');
    const price = carInfo.querySelector('.car-price');
    const availability = carInfo.querySelector('.car-availability');

    image.src = car.image;
    image.alt = `${car.brand} ${car.carModel}`;
    title.textContent = `${car.brand} ${car.carModel} (${car.yearOfManufacture})`;
    type.textContent = car.carType;
    description.textContent = car.description;
    price.textContent = `$${car.pricePerDay} per day`;
    availability.textContent = car.available ? 'Available' : 'Not Available';
}

// Show no car message
function showNoCarMessage() {
    noCarMessage.style.display = 'block';
    carInfo.style.display = 'none';
    reservationForm.style.display = 'none';
}

// Show unavailable message
function showUnavailableMessage() {
    carInfo.style.display = 'block';
    reservationForm.style.display = 'none';
    const availability = carInfo.querySelector('.car-availability');
    availability.textContent = 'This car is no longer available';
    availability.style.color = 'red';
}

// Show reservation form
function showReservationForm() {
    reservationForm.style.display = 'block';
}

// Setup event listeners
function setupEventListeners() {
    // Form input validation
    Object.keys(formInputs).forEach(field => {
        const input = formInputs[field];
        input.addEventListener('input', () => {
            validateField(field);
            updateTotalPrice();
            saveFormData();
            checkFormValidity();
        });
    });

    // Form submission
    reservationForm.addEventListener('submit', handleSubmit);

    // Cancel button
    cancelButton.addEventListener('click', handleCancel);
}

// Validate individual field
function validateField(field) {
    const input = formInputs[field];
    const rule = validationRules[field];
    const messageElement = input.nextElementSibling;
    let isValid = true;

    if (rule.pattern) {
        isValid = rule.pattern.test(input.value);
    } else if (rule.validate) {
        isValid = rule.validate(input.value);
    }

    messageElement.textContent = isValid ? '' : rule.message;
    input.classList.toggle('invalid', !isValid);

    return isValid;
}

// Check overall form validity
function checkFormValidity() {
    const isValid = Object.keys(formInputs).every(field => validateField(field));
    submitButton.disabled = !isValid;
}

// Update total price
function updateTotalPrice() {
    const days = parseInt(formInputs.rentalPeriod.value) || 0;
    const total = days * pricePerDay;
    totalPriceElement.textContent = `$${total}`;
}

// Save form data to localStorage
function saveFormData() {
    const formData = {};
    Object.keys(formInputs).forEach(field => {
        formData[field] = formInputs[field].value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
}

// Load saved form data
function loadSavedFormData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        const formData = JSON.parse(savedData);
        Object.keys(formData).forEach(field => {
            if (formInputs[field]) {
                formInputs[field].value = formData[field];
            }
        });
        updateTotalPrice();
        checkFormValidity();
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const formData = {
        customer: {
            name: formInputs.name.value,
            phoneNumber: formInputs.phone.value,
            email: formInputs.email.value,
            driversLicenseNumber: formInputs.license.value
        },
        car: {
            vin: selectedCar.vin
        },
        rental: {
            startDate: formInputs.startDate.value,
            rentalPeriod: parseInt(formInputs.rentalPeriod.value)
        }
    };

    try {
        const response = await fetch('/api/reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.error) {
            alert(result.error);
            return;
        }

        // Clear form data and redirect to homepage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('selectedCarVIN');
        alert('Reservation successful!');
        window.location.href = '/';
    } catch (error) {
        console.error('Error submitting reservation:', error);
        alert('An error occurred while processing your reservation. Please try again.');
    }
}

// Handle cancel button click
function handleCancel() {
    if (confirm('Are you sure you want to cancel? Your form data will be saved.')) {
        window.location.href = '/';
    }
} 