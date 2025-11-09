document.addEventListener('DOMContentLoaded', () => {
    // Avoid running heavy scroll/observer logic on small/touch devices
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;

    const sections = document.querySelectorAll('section');
    if (!sections || sections.length === 0) return;

    const totalSections = sections.length;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(sections).indexOf(entry.target);
                document.body.setAttribute('data-scroll', index % 3);
            }
        });
    }, {
        threshold: 0.7
    });

    sections.forEach(section => {
        section.style.minHeight = '100vh';
        section.style.scrollSnapAlign = 'start';
        observer.observe(section);
    });
});