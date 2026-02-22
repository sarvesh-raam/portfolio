// ===================================
// Clean Minimal Portfolio JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Hide/show navbar on scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // AJAX Form submission
    const quickForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (quickForm) {
        quickForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = this.querySelector('.btn-submit');
            const originalContent = btn.innerHTML;

            // Loading state
            btn.classList.add('sending');
            const originalText = btn.querySelector('.btn-content').textContent;
            btn.querySelector('.btn-content').textContent = 'Sending...';
            btn.style.pointerEvents = 'none';
            formStatus.className = 'form-status';
            formStatus.textContent = '';

            const formData = new FormData(this);

            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.classList.remove('sending');
                    btn.classList.add('sent');
                    btn.querySelector('.btn-content').textContent = 'Message Sent! ✓';
                    formStatus.textContent = 'I will get back to you soon.';
                    formStatus.classList.add('success');
                    quickForm.reset();

                    // Reset button after 3 seconds
                    setTimeout(() => {
                        btn.classList.remove('sent');
                        btn.querySelector('.btn-content').textContent = originalText;
                        btn.style.pointerEvents = 'auto';
                    }, 3500);
                } else {
                    btn.classList.remove('sending');
                    const data = await response.json();
                    formStatus.textContent = data.errors ? data.errors.map(error => error.message).join(", ") : 'Oops! There was a problem.';
                    formStatus.classList.add('error');
                    btn.querySelector('.btn-content').textContent = originalText;
                    btn.style.pointerEvents = 'auto';
                }
            } catch (error) {
                btn.classList.remove('sending');
                formStatus.textContent = 'Oops! Problem connecting to server.';
                formStatus.classList.add('error');
                btn.querySelector('.btn-content').textContent = originalText;
                btn.style.pointerEvents = 'auto';
            }
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') { e.preventDefault(); return; }
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    fetchGitHubRepos();
    initTypingAnimation();
    updateFooterYear();
});

function initTypingAnimation() {
    const card = document.querySelector('.about-creative-card');
    if (!card) return;

    const lines = card.querySelectorAll('.code-line');
    lines.forEach(line => {
        line.style.opacity = '0';
        line.style.transform = 'translateX(-12px)';
        line.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                lines.forEach((line, i) => {
                    setTimeout(() => {
                        line.style.opacity = '1';
                        line.style.transform = 'translateX(0)';
                    }, i * 100);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(card);

    setTimeout(() => {
        initCardButtons(card);
    }, lines.length * 100 + 300);
}

function initCardButtons(card) {
    const redDot = card.querySelector('.card-dot.red');
    const yellowDot = card.querySelector('.card-dot.yellow');
    const greenDot = card.querySelector('.card-dot.green');
    const restoreBtn = document.querySelector('.card-restore-btn');

    let state = 'normal'; // 'normal' | 'minimized' | 'fullscreen' | 'closed'

    const updateState = (newState) => {
        const wrapper = card.parentElement;
        card.classList.remove('card-minimized', 'card-fullscreen', 'card-closed');
        if (wrapper) wrapper.classList.remove('wrapper-minimized');

        if (newState !== 'normal') {
            card.classList.add(`card-${newState}`);
            if (newState === 'minimized' && wrapper) {
                wrapper.classList.add('wrapper-minimized');
            }
        }
        state = newState;

        // Handle Restore Button visibility
        if (restoreBtn) {
            if (newState === 'closed') {
                restoreBtn.style.display = 'flex';
                setTimeout(() => restoreBtn.classList.add('visible'), 10);
            } else {
                restoreBtn.classList.remove('visible');
                setTimeout(() => { if (state !== 'closed') restoreBtn.style.display = 'none'; }, 400);
            }
        }
    };

    redDot.addEventListener('click', (e) => {
        e.stopPropagation();
        updateState('closed');
    });

    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => updateState('normal'));
    }

    yellowDot.addEventListener('click', (e) => {
        e.stopPropagation();
        updateState(state === 'minimized' ? 'normal' : 'minimized');
    });

    greenDot.addEventListener('click', (e) => {
        e.stopPropagation();
        updateState(state === 'fullscreen' ? 'normal' : 'fullscreen');
    });
}

function initBlockCursor(card) {
    const body = card.querySelector('.creative-card-body');
    if (!body) return;

    let cursor = card.querySelector('.card-block-cursor');
    if (!cursor) {
        cursor = document.createElement('span');
        cursor.className = 'card-block-cursor';
        cursor.textContent = '▋';
        card.appendChild(cursor);
    }

    const updateCursor = () => {
        // Block positioning if card is not interactive
        if (card.classList.contains('card-closed') || card.classList.contains('card-minimized')) {
            cursor.style.display = 'none';
            return;
        }

        cursor.style.display = 'block'; // Always show

        const sel = window.getSelection();
        let targetRange;

        if (sel.rangeCount && body.contains(sel.anchorNode)) {
            targetRange = sel.getRangeAt(0);
        } else {
            // Default to end of content if no selection
            targetRange = document.createRange();
            targetRange.selectNodeContents(body);
            targetRange.collapse(false);
        }

        let rect;
        const rects = targetRange.getClientRects();
        if (rects.length > 0) {
            rect = rects[0];
        } else {
            // Fallback for empty lines
            const span = document.createElement('span');
            span.appendChild(document.createTextNode('\u200b'));
            targetRange.insertNode(span);
            rect = span.getBoundingClientRect();
            span.parentNode.removeChild(span);
        }

        const cardRect = card.getBoundingClientRect();
        cursor.style.left = `${rect.left - cardRect.left}px`;
        cursor.style.top = `${rect.top - cardRect.top}px`;
        cursor.style.display = 'inline-block';
    };

    // Attach to events using a throttled update
    const events = ['keyup', 'keydown', 'mousedown', 'mouseup', 'click', 'input', 'focus'];
    events.forEach(event => {
        body.addEventListener(event, () => {
            requestAnimationFrame(updateCursor);
        });
    });

    // Hide on blur
    body.addEventListener('blur', () => {
        setTimeout(() => {
            if (!body.contains(document.activeElement)) {
                cursor.style.display = 'none';
            }
        }, 50);
    });

    // Global scroll/resize sync
    window.addEventListener('scroll', updateCursor);
    window.addEventListener('resize', updateCursor);
}

// ===================================
// GitHub API Integration
// ===================================

const GITHUB_USERNAME = 'sarveshraam55';
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

const languageColors = {
    'JavaScript': '#f1e05a', 'Python': '#3572A5', 'Java': '#b07219', 'TypeScript': '#2b7489',
    'HTML': '#e34c26', 'CSS': '#563d7c', 'C++': '#f34b7d', 'C': '#555555', 'Go': '#00ADD8',
    'Rust': '#dea584', 'PHP': '#4F5D95', 'Ruby': '#701516', 'Swift': '#ffac45', 'Kotlin': '#F18E33',
    'Dart': '#00B4AB', 'Shell': '#89e051', 'Jupyter Notebook': '#DA5B0B', 'Vue': '#41b883', 'React': '#61dafb'
};

async function fetchGitHubRepos() {
    const reposContainer = document.getElementById('github-repos');
    if (!reposContainer) return;
    try {
        const response = await fetch(GITHUB_API_URL, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
        if (!response.ok) throw new Error('Failed to fetch repositories');
        const repos = await response.json();
        const selectedRepos = [
            'College-Scholarships-Financial-Aid', 'Threat-Modeling-Project', 'STOCK-PREDICTION',
            'Cat-vs.-Dog-Image-Classification-Using-SVM', 'Hand-Gesture-Recognition-for-Human-Computer-Interaction', 'TITANIC-CLASSIFICATION'
        ];
        const filteredRepos = repos.filter(repo => !repo.fork && !repo.archived && selectedRepos.includes(repo.name))
            .sort((a, b) => selectedRepos.indexOf(a.name) - selectedRepos.indexOf(b.name));
        if (filteredRepos.length === 0) { reposContainer.innerHTML = '<p class="loading">No repositories found.</p>'; return; }
        reposContainer.innerHTML = filteredRepos.map((repo, index) => createRepoCard(repo, index)).join('');
    } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        reposContainer.innerHTML = `<div class="loading">Unable to load repositories. Please visit my <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer" style="color: #000; text-decoration: underline;">GitHub profile</a> directly.</div>`;
    }
}

function createRepoCard(repo, index) {
    const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    const languageColor = languageColors[repo.language] || '#858585';
    const num = (index + 1).toString().padStart(2, '0');

    return `
        <div class="repo-expand-item" onclick="window.open('${repo.html_url}', '_blank')">
            <div class="repo-title-bar">
                <span class="repo-num">${num}</span>
                <div class="repo-path">src/repos/<span>${repo.name.toLowerCase()}</span></div>
                <span class="expand-icon-plus">+</span>
            </div>
            <div class="repo-expand-content">
                <div class="repo-content-inner">
                    <div class="repo-line-numbers">
                        1<br>2<br>3<br>4
                    </div>
                    <div class="repo-details">
                        <h3 class="repo-name-mini">${repo.name}</h3>
                        <p class="repo-description-mini">${repo.description || 'No description available for this repository.'}</p>
                        <div class="repo-meta-mini">
                            ${repo.language ? `<span class="repo-lang"><span class="lang-dot" style="background-color: ${languageColor}"></span>${repo.language}</span>` : ''}
                            <span class="repo-date-mini">${updatedDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateFooterYear() {
    const copyright = document.querySelector('.copyright');
    if (copyright) {
        copyright.textContent = `Copyright © ${new Date().getFullYear()} Sarvesh Raam T K. All Rights Reserved.`;
    }
}
