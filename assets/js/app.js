document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. MOBILE MENU FIX (Event Delegation) --- */
    // We attach the listener to the 'body' because the navbar loads dynamically
    document.body.addEventListener('click', (e) => {
        // Check if the clicked element is the hamburger (or the icon inside it)
        if (e.target.closest('.hamburger')) {
            const navLinks = document.querySelector('.nav-links');
            
            // Toggle the class defined in your CSS (.nav-active)
            if (navLinks) {
                navLinks.classList.toggle('nav-active');
            }
        }
    });

    /* --- 2. ANIMATION OBSERVER --- */
    // This handles the fade-in animations for content that is already on the page
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop watching once it appears (saves memory)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));


    /* --- 3. AUTO-UPDATE COPYRIGHT YEAR (New Addition) --- */
    // Because the footer is loaded via 'fetch', it might not be there when the page starts.
    // This 'Watcher' waits for the footer to appear, then sets the year automatically.
    
    const yearObserver = new MutationObserver(() => {
        const yearSpan = document.getElementById('year');
        
        // If we find the 'year' span and it is currently empty...
        if (yearSpan && yearSpan.textContent.trim() === '') {
            const currentYear = new Date().getFullYear();
            yearSpan.textContent = currentYear;
            
            // Optional: You can stop watching once the year is set, 
            // but keeping it running is fine for small sites.
            // yearObserver.disconnect(); 
        }
    });

    // Start watching the entire body for new content (like the footer being added)
    yearObserver.observe(document.body, { childList: true, subtree: true });
});
