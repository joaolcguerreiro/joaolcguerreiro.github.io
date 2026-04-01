document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetContent = document.getElementById(targetId);

            if (targetContent) {
                targetContent.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Robust ScrollSpy for updating active nav links based on precise scroll position
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // The - 300 buffer ensures that as soon as the top of a section is reasonably visible, we switch to it.
            if (window.scrollY >= (sectionTop - 300)) {
                current = section.getAttribute('id');
            }
        });

        // Ensure we handle absolute top and absolute bottom edge cases
        if (window.scrollY === 0) current = 'about';
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) current = 'achievements';

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Call it once on load to set initial state correctly
    window.dispatchEvent(new Event('scroll'));

    // Intersection Observer purely for the beautiful fade-in 'visible' animation
    const observerOptions = {
        root: null,
        rootMargin: '-50px 0px -50px 0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Observe footer animation
    const footer = document.querySelector('.footer');
    if (footer) {
        sectionObserver.observe(footer);
    }

    // Add active animation load immediately for the top-most visible element
    setTimeout(() => {
        const firstSection = document.getElementById('about');
        if (firstSection) {
            firstSection.classList.add('visible');
        }
    }, 100);

    // Fetch Google Scholar publications
    fetchGoogleScholar();
});

// Google Scholar Fetch Implementation
async function fetchGoogleScholar() {
    const container = document.getElementById('publications-container');
    const scholarId = 'a89cK-wAAAAJ';
    // Use codetabs proxy which is more reliable for raw HTML fetching
    // Added 'sortby=pubdate' to sort from recent to oldest, and 'pagesize=100' to fetch all papers at once.
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://scholar.google.com/citations?user=${scholarId}&hl=en&view_op=list_works&sortby=pubdate&cstart=0&pagesize=100`)}`;

    // Hardcoded dictionary for additional links. 
    // Key is the simplified version of the title (lowercase, trimmed).
    // You can modify this dictionary anytime!
    const customLinks = {
        "Example": {
            pdf: "https://arxiv.org/abs/xxxx.xxxx",
            code: "https://github.com/joaolcguerreiro/example",
            project: "https://example.com/project"
        },
        "Residual Diffusion Implicit Models": {
            code: "https://github.com/joaolcguerreiro/rdim"
        }
    };

    function simplifyTitle(title) {
        return title.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Google Scholar returns ISO-8859-1 payload but proxy strips headers, 
        // causing .text() to attempt UTF-8 and fail on accents (\ufffd).
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const html = decoder.decode(buffer);

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Google scholar table rows
        const rows = doc.querySelectorAll('#gsc_a_b .gsc_a_tr');

        container.innerHTML = ''; // clear loading text

        if (rows.length === 0) {
            container.innerHTML = '<p>No publications found or error loading from Scholar. Please check your Scholar ID.</p>';
            return;
        }

        rows.forEach(row => {
            const titleEl = row.querySelector('.gsc_a_at');
            const authorEl = row.querySelector('.gs_gray'); // first gs_gray is authors
            const venueEl = row.querySelectorAll('.gs_gray')[1]; // second gs_gray is venue
            const yearEl = row.querySelector('.gsc_a_y .gsc_a_h'); // year

            if (!titleEl) return;

            const title = titleEl.textContent.trim();
            const authors = authorEl ? authorEl.textContent.trim() : '';
            let venue = venueEl ? venueEl.textContent.trim() : '';
            const year = yearEl ? yearEl.textContent.trim() : '';

            const simplifiedTitleInput = simplifyTitle(title);

            // Generate standard Scholar link
            const scholarLink = `https://scholar.google.com${titleEl.getAttribute('href')}`;

            let primaryLinkHtml = '';
            let secondaryLinksHtml = '';

            // Check hardcoded dictionary
            for (const [key, links] of Object.entries(customLinks)) {
                if (simplifyTitle(key) === simplifiedTitleInput || simplifiedTitleInput.includes(simplifyTitle(key))) {
                    if (links.pdf) { primaryLinkHtml = `<a href="${links.pdf}" class="btn-pill btn-primary" target="_blank"><i class="fas fa-file-pdf"></i> PDF</a>`; }
                    if (links.code) { secondaryLinksHtml += `<a href="${links.code}" class="btn-pill btn-secondary" target="_blank"><i class="fas fa-code"></i> Code</a>`; }
                    if (links.project) { secondaryLinksHtml += `<a href="${links.project}" class="btn-pill btn-secondary" target="_blank"><i class="fas fa-globe"></i> Project</a>`; }
                }
            }

            // Add a default link to Scholar if no PDF is specified
            if (!primaryLinkHtml) {
                primaryLinkHtml = `<a href="${scholarLink}" class="btn-pill btn-primary" target="_blank"><i class="fas fa-book"></i> Scholar Page</a>`;
            }

            const linksHtml = primaryLinkHtml + secondaryLinksHtml;

            // Bold your own name in authors
            const formattedAuthors = authors.replace(/João Guerreiro|J Guerreiro/ig, '<strong>João Guerreiro</strong>');

            const paperCard = document.createElement('div');
            paperCard.className = 'paper-card glossy-card';
            paperCard.innerHTML = `
                <h3 class="paper-title">${title}</h3>
                <p class="paper-authors">${formattedAuthors}</p>
                <p class="paper-venue">${venue} ${year ? `(${year})` : ''}</p>
                <div class="paper-links">
                    ${linksHtml}
                </div>
            `;
            container.appendChild(paperCard);
        });

    } catch (error) {
        console.error("Error fetching Scholar data:", error);
        container.innerHTML = '<p>Error loading publications. Please try again later.</p>';
    }
}
