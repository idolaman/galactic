document.addEventListener('DOMContentLoaded', () => {
    createStars();
    initCardGlow();
});

function createStars() {
    const starsContainer = document.getElementById('stars');
    const starCount = 200;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.style.position = 'absolute';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        star.style.backgroundColor = 'white';
        star.style.borderRadius = '50%';
        star.style.opacity = Math.random() * 0.7 + 0.3;

        // Random twinkle animation
        const duration = Math.random() * 3 + 2;
        star.style.animation = `twinkle ${duration}s infinite alternate`;

        starsContainer.appendChild(star);
    }

    // Add global keyframes for twinkle if not already present
    if (!document.getElementById('star-styles')) {
        const style = document.createElement('style');
        style.id = 'star-styles';
        style.textContent = `
            @keyframes twinkle {
                0% { opacity: 0.3; transform: scale(0.8); }
                100% { opacity: 1; transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }
}

function initCardGlow() {
    const cards = document.querySelectorAll('.feature-card');

    document.addEventListener('mousemove', (e) => {
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
