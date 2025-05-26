document.addEventListener('DOMContentLoaded', function() {
    const parallaxBackground = document.querySelector('.parallax-background');
    const parallaxSpeed = -0.3; // Adjust this value to control the parallax speed (lower = slower)

    // Set initial position to the bottom of the background
    const backgroundHeight = parallaxBackground.offsetHeight;
    const viewportHeight = window.innerHeight;
    const initialOffset = backgroundHeight - viewportHeight;
    
    // Apply initial position
    parallaxBackground.style.transform = `translate3d(0, ${-initialOffset}px, 0)`;

    let ticking = false;
    let lastScrollY = window.scrollY;

    function updateParallax() {
        const scrolled = window.scrollY;
        
        // Calculate the new position starting from the bottom
        const translate = initialOffset + (scrolled * parallaxSpeed);
        
        // Apply the transform
        parallaxBackground.style.transform = `translate3d(0, ${-translate}px, 0)`;
        
        ticking = false;
        lastScrollY = scrolled;
    }

    // Throttle scroll events for better performance
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateParallax();
            });
            ticking = true;
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        const newBackgroundHeight = parallaxBackground.offsetHeight;
        const newViewportHeight = window.innerHeight;
        const newInitialOffset = newBackgroundHeight - newViewportHeight;
        updateParallax();
    });

    // Initial update
    updateParallax();
}); 