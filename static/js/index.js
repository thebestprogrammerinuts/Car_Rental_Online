// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchSuggestions = document.getElementById('searchSuggestions');
const typeFilter = document.getElementById('typeFilter');
const brandFilter = document.getElementById('brandFilter');
const carousel = document.querySelector('.carousel');
const carGrid = document.querySelector('.car-grid');
const carouselSection = document.getElementById('carouselSection');
const prevButton = document.querySelector('.carousel-button.prev');
const nextButton = document.querySelector('.carousel-button.next');

// State
let currentCars = [];
let availableCars = [];
let debounceTimer;

// Constants
const DEBOUNCE_DELAY = 300;
const CAROUSEL_SCROLL_AMOUNT = 300;

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadFilters();
    await loadCars();
    setupEventListeners();
});

// Load filters from API
async function loadFilters() {
    try {
        const [types, brands] = await Promise.all([
            fetch('/api/car-types').then(res => res.json()),
            fetch('/api/brands').then(res => res.json())
        ]);

        // Populate type filter
        types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeFilter.appendChild(option);
        });

        // Populate brand filter
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading filters:', error);
    }
}

// Load cars from API
async function loadCars(searchQuery = '', type = '', brand = '') {
    try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (type) params.append('type', type);
        if (brand) params.append('brand', brand);

        const response = await fetch(`/api/cars?${params.toString()}`);
        const cars = await response.json();
        
        currentCars = cars;
        availableCars = cars.filter(car => car.available);

        // Show/hide carousel based on search
        carouselSection.style.display = searchQuery ? 'none' : 'block';

        renderCars();
    } catch (error) {
        console.error('Error loading cars:', error);
    }
}

// Render cars in carousel and grid
function renderCars() {
    // Clear existing content
    carousel.innerHTML = '';
    carGrid.innerHTML = '';

    // Render available cars in carousel
    availableCars.forEach(car => {
        carousel.appendChild(createCarCard(car));
    });

    // Render all cars in grid
    currentCars.forEach(car => {
        carGrid.appendChild(createCarCard(car));
    });
}

// Create car card element
function createCarCard(car) {
    const card = document.createElement('div');
    card.className = 'car-card';
    
    card.innerHTML = `
        <img src="${car.image}" alt="${car.brand} ${car.carModel}">
        <div class="car-card-content">
            <h3>${car.brand} ${car.carModel}</h3>
            <p>${car.carType}</p>
            <p>${car.description}</p>
            <p class="price">$${car.pricePerDay} per day</p>
            <button ${!car.available ? 'disabled' : ''} onclick="rentCar('${car.vin}')">
                ${car.available ? 'Rent Now' : 'Unavailable'}
            </button>
        </div>
    `;
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleSearch, DEBOUNCE_DELAY);
    });

    // Search button
    searchButton.addEventListener('click', handleSearch);

    // Filters
    typeFilter.addEventListener('change', handleFilters);
    brandFilter.addEventListener('change', handleFilters);

    // Carousel navigation
    prevButton.addEventListener('click', () => {
        carousel.scrollLeft -= CAROUSEL_SCROLL_AMOUNT;
    });

    nextButton.addEventListener('click', () => {
        carousel.scrollLeft += CAROUSEL_SCROLL_AMOUNT;
    });
}

// Handle search input
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (query.length > 0) {
        try {
            const response = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            
            if (suggestions.length > 0) {
                showSuggestions(suggestions);
            } else {
                hideSuggestions();
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    } else {
        hideSuggestions();
    }

    await loadCars(query, typeFilter.value, brandFilter.value);
}

// Show search suggestions
function showSuggestions(suggestions) {
    searchSuggestions.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', () => {
            searchInput.value = suggestion;
            hideSuggestions();
            handleSearch();
        });
        searchSuggestions.appendChild(div);
    });
    searchSuggestions.style.display = 'block';
}

// Hide search suggestions
function hideSuggestions() {
    searchSuggestions.style.display = 'none';
}

// Handle filter changes
async function handleFilters() {
    await loadCars(searchInput.value, typeFilter.value, brandFilter.value);
}

// Rent car function
function rentCar(vin) {
    // Store selected car VIN in localStorage
    localStorage.setItem('selectedCarVIN', vin);
    // Redirect to reservation page
    window.location.href = '/reservation';
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchSuggestions.contains(e.target) && e.target !== searchInput) {
        hideSuggestions();
    }
}); 