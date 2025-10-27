document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
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