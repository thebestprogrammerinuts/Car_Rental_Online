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
const progressBar = document.querySelector('.carousel-progress-bar');

// State
let currentCars = [];
let availableCars = [];
let debounceTimer;
let autoScrollInterval;
let isDragging = false;
let startX;
let scrollLeft;

// Constants
const DEBOUNCE_DELAY = 300;
const CAROUSEL_SCROLL_AMOUNT = 300;
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds
const SCROLL_ANIMATION_DURATION = 500; // 0.5 seconds

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

    // Stop any existing auto-scroll
    stopAutoScroll();

    // Render available cars in carousel
    availableCars.forEach(car => {
        carousel.appendChild(createCarCard(car));
    });

    // Render all cars in grid
    currentCars.forEach(car => {
        carGrid.appendChild(createCarCard(car));
    });

    // Reset progress bar
    if (progressBar) {
        progressBar.style.width = '0%';
    }

    // Restart auto-scroll
    startAutoScroll();
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

    // Setup carousel functionality
    setupCarousel();
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

// Enhanced carousel functionality
function setupCarousel() {
    if (!carousel) return;

    // Mouse drag scrolling
    carousel.addEventListener('mousedown', (e) => {
        isDragging = true;
        carousel.classList.add('grabbing');
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener('mouseleave', () => {
        isDragging = false;
        carousel.classList.remove('grabbing');
    });

    carousel.addEventListener('mouseup', () => {
        isDragging = false;
        carousel.classList.remove('grabbing');
    });

    carousel.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
        updateProgressBar();
    });

    // Smooth scroll navigation
    prevButton.addEventListener('click', () => {
        const cardWidth = carousel.querySelector('.car-card')?.offsetWidth || CAROUSEL_SCROLL_AMOUNT;
        smoothScroll(carousel, -cardWidth);
    });

    nextButton.addEventListener('click', () => {
        const cardWidth = carousel.querySelector('.car-card')?.offsetWidth || CAROUSEL_SCROLL_AMOUNT;
        smoothScroll(carousel, cardWidth);
    });

    // Auto-scroll
    startAutoScroll();

    // Pause auto-scroll on hover
    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    // Update progress bar on scroll
    carousel.addEventListener('scroll', updateProgressBar);
}

// Smooth scroll animation
function smoothScroll(element, amount) {
    const start = element.scrollLeft;
    const startTime = performance.now();

    function scroll(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / SCROLL_ANIMATION_DURATION, 1);
        
        // Easing function for smooth animation
        const easeInOutCubic = progress => progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        element.scrollLeft = start + amount * easeInOutCubic(progress);

        if (progress < 1) {
            requestAnimationFrame(scroll);
        }
    }

    requestAnimationFrame(scroll);
}

// Auto-scroll functionality
function startAutoScroll() {
    if (autoScrollInterval) return;
    
    autoScrollInterval = setInterval(() => {
        const isAtEnd = carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth;
        if (isAtEnd) {
            // Smoothly scroll back to start
            smoothScroll(carousel, -carousel.scrollLeft);
        } else {
            // Scroll one card width
            const cardWidth = carousel.querySelector('.car-card')?.offsetWidth || CAROUSEL_SCROLL_AMOUNT;
            smoothScroll(carousel, cardWidth);
        }
    }, AUTO_SCROLL_INTERVAL);
}

function stopAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// Update progress bar
function updateProgressBar() {
    if (!carousel || !progressBar) return;
    
    const scrollWidth = carousel.scrollWidth - carousel.offsetWidth;
    const scrolled = (carousel.scrollLeft / scrollWidth) * 100;
    progressBar.style.width = `${scrolled}%`;
}

// Add CSS class for dragging
const style = document.createElement('style');
style.textContent = `
    .carousel.grabbing {
        cursor: grabbing;
        user-select: none;
    }
    .carousel {
        cursor: grab;
    }
`;
document.head.appendChild(style); 