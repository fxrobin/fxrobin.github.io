// CV Scroll Animations
// Smooth fade-in effect for elements as they come into view
// H3 sections animate as complete blocks

document.addEventListener('DOMContentLoaded', function() {
    // Mark that JavaScript is enabled
    document.body.classList.add('js-enabled');
    
    // FORCE ALL LIST ITEMS TO BE VISIBLE IMMEDIATELY
    const allListItems = document.querySelectorAll('li');
    allListItems.forEach(li => {
        li.style.opacity = '1';
        li.style.visibility = 'visible';
        li.style.display = 'list-item';
        li.style.transform = 'none';
    });
    
    // Initialize: Add animation classes to elements that should animate
    function initializeAnimations() {
        const elementsToAnimate = document.querySelectorAll('h1, h2, h3, h4, p:not(fieldset p), #biography, ul:not(fieldset ul), ol:not(fieldset ol)');
        
        elementsToAnimate.forEach(element => {
            // Skip elements that are already visible or in the viewport initially
            const rect = element.getBoundingClientRect();
            const inInitialView = rect.top < window.innerHeight * 0.3;
            
            if (!inInitialView) {
                element.classList.add('animate-on-scroll');
            } else {
                // Elements in initial view should be visible immediately
                element.classList.add('visible');
            }
        });
    }

    // Function to animate h3 section as a block
    function animateH3Section(h3Element) {
        // Add visible to h3
        h3Element.classList.add('visible');
        
        // Find and animate all content until next heading
        let nextElement = h3Element.nextElementSibling;
        const sectionElements = [];
        
        while (nextElement && !nextElement.matches('h1, h2, h3')) {
            if (nextElement.matches('h4, p, ul, ol')) {
                sectionElements.push(nextElement);
            }
            nextElement = nextElement.nextElementSibling;
        }
        
        // Animate section content with slight delay
        setTimeout(() => {
            sectionElements.forEach(element => {
                element.classList.add('visible');
                
                // Also make sure any list items within are visible
                const listItems = element.querySelectorAll('li');
                listItems.forEach(li => {
                    li.classList.add('visible');
                });
            });
        }, 100);
    }

    // Initialize animations
    initializeAnimations();

    // Simplified animation approach - animate elements as they come into view
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -20% 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // If it's an h3, animate its section as a block
                    if (element.tagName === 'H3') {
                        animateH3Section(element);
                    } else {
                        // For other elements, just add visible class
                        element.classList.add('visible');
                    }
                    
                    // Stop observing this element
                    observer.unobserve(element);
                }
            });
        }, observerOptions);

        // Observe all elements that should animate
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            observer.observe(element);
        });

    } else {
        // Fallback: make all content visible immediately if no Intersection Observer
        document.querySelectorAll('.animate-on-scroll').forEach(element => {
            element.classList.add('visible');
        });
    }
});

// Optional: Add smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for internal links
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
