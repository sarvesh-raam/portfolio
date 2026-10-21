// ===================================
// Clean Minimal Portfolio JavaScript
// ===================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', async () => {
    // Theme Toggle Logic
    // The initial theme is applied to <html> by an inline script in <head> (avoids a light flash);
    // mirror it on <body> so existing selectors and the canvas keep working.
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (theme) => {
        root.setAttribute('data-theme', theme);
        body.setAttribute('data-theme', theme);
    };
    applyTheme(root.getAttribute('data-theme') || 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
            try { localStorage.setItem('theme', newTheme); } catch (e) { /* storage blocked */ }
        });
    }

    // Phone/tablet "More" sheet (opened from the tab bar)
    const moreTab = document.getElementById('tab-more');
    const tabSheet = document.getElementById('tab-sheet');

    const setSheetOpen = (open) => {
        if (!moreTab || !tabSheet) return;
        tabSheet.hidden = !open;
        moreTab.setAttribute('aria-expanded', String(open));
        moreTab.classList.toggle('open', open);
    };

    if (moreTab && tabSheet) {
        moreTab.addEventListener('click', (e) => {
            e.stopPropagation();
            setSheetOpen(tabSheet.hidden);
        });
        tabSheet.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setSheetOpen(false)));
        document.addEventListener('click', (e) => {
            if (!tabSheet.hidden && !tabSheet.contains(e.target)) setSheetOpen(false);
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setSheetOpen(false); });
    }

    // Hide/show the top glass pill on scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.classList.add('hidden');
            setSheetOpen(false);
        } else {
            navbar.classList.remove('hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });

    // AJAX Form submission
    const quickForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (quickForm) {
        quickForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const btn = this.querySelector('.btn-submit');

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

                    // Reset button after 3.5 seconds
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
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top: targetPosition, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            }
        });
    });

    // Independent of the content files
    initLiquidGlass();
    updateFooterYear();
    initScrollSpy();
    initHeroMeshCanvas();

    // Content (projects, experience, numbers…) lives in /data and is edited from /admin
    const content = await loadContent();
    renderContent(content);
    initCertViewer();
    initAssistant(content.profile);

    initTypingAnimation();
    initHeroTyping(content.profile && content.profile.typing);
    initScrollReveal();
    initCard3DTilt();
    initHeroStatsCounter(content);
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

// ===================================
// Hero "I build ..." typing rotation
// ===================================
function initHeroTyping(customPhrases) {
    const el = document.getElementById('hero-typing');
    if (!el) return;

    const phrases = (Array.isArray(customPhrases) && customPhrases.filter(Boolean).length)
        ? customPhrases.filter(Boolean)
        : ['Agentic AI Systems', 'RAG Pipelines', 'Explainable AI', 'Real-time Web Apps'];
    el.textContent = phrases[0];
    if (prefersReducedMotion || phrases.length < 2) return;

    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let deleting = true;

    function tick() {
        const phrase = phrases[phraseIndex];
        if (deleting) {
            charIndex--;
            el.textContent = phrase.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
            setTimeout(tick, 45);
        } else {
            const next = phrases[phraseIndex];
            charIndex++;
            el.textContent = next.slice(0, charIndex);
            if (charIndex === next.length) {
                deleting = true;
                setTimeout(tick, 2200);
            } else {
                setTimeout(tick, 85);
            }
        }
    }

    setTimeout(tick, 2500);
}

// ===================================
// Content: loaded from /data (edited through /admin)
// ===================================

const DATA_FILES = ['profile', 'projects', 'experience', 'certifications', 'achievements', 'building', 'stats'];

async function loadContent() {
    const entries = await Promise.all(DATA_FILES.map(async name => {
        try {
            // no-cache = revalidate with the server, so an admin edit shows up on the next load
            const res = await fetch(`data/${name}.json`, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return [name, await res.json()];
        } catch (error) {
            console.error(`Could not load data/${name}.json:`, error);
            return [name, null];
        }
    }));
    return Object.fromEntries(entries);
}

function escapeHTML(str) {
    return String(str ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// Escaped text with **bold** support
function richText(str) {
    return escapeHTML(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// Only http(s), mailto and relative links; CMS image paths like "/assets/x.png" become relative
function safeUrl(url) {
    const value = String(url ?? '').trim();
    if (!value) return '';
    if (/^(https?:|mailto:)/i.test(value)) return encodeURI(value);
    if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return '';
    return encodeURI(value.replace(/^\/(?=assets\/)/, ''));
}

function getPath(obj, path) {
    return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function listOf(file, key) {
    const items = file && Array.isArray(file[key]) ? file[key] : [];
    return items.filter(item => item && item.visible !== false);
}

function leetcodeNumbers(content) {
    const live = content.stats && content.stats.leetcode;
    const fallback = content.profile && content.profile.leetcodeFallback;
    return (live && live.total) ? live : (fallback || null);
}

const EXTERNAL = 'target="_blank" rel="noopener noreferrer"';

const PROJECT_ICONS = {
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    info: '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4M12 8h.01"/>',
    dollar: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    gamepad: '<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1"/><circle cx="18" cy="13" r="1"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v4"/>',
    translate: '<path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>',
};

// CMS colour names -> existing header gradient classes in style.css
const PROJECT_THEMES = {
    red: 'threat', green: 'stock', violet: 'finsense', navy: 'trustflow', slate: 'pluse',
    wine: 'packassist', forest: 'flappymind', indigo: 'imgcaption', sky: 'translator', amber: 'calldojo',
};

const CERT_LOGOS = {
    cisco: '<svg viewBox="0 0 40 24" fill="#00BCEB" width="36" height="22" aria-hidden="true"><rect x="2" y="10" width="3" height="12" rx="1.5"/><rect x="8" y="4" width="3" height="18" rx="1.5"/><rect x="14" y="8" width="3" height="14" rx="1.5"/><rect x="20" y="2" width="3" height="20" rx="1.5"/><rect x="26" y="8" width="3" height="14" rx="1.5"/><rect x="32" y="4" width="3" height="18" rx="1.5"/></svg>',
    isc2: '<svg viewBox="0 0 24 24" fill="#00A887" width="32" height="32" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
};

const ICON_EXTERNAL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
const ICON_VERIFY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>';

const chips = (items, wrapClass) => {
    const list = (items || []).filter(Boolean);
    return list.length ? `<div class="${wrapClass}">${list.map(t => `<span>${escapeHTML(t)}</span>`).join('')}</div>` : '';
};

// Line icon in front of a project badge: a medal for a win, a flag for anything else (e.g. "Final Round")
function prizeIcon(badge) {
    const path = /1st|first|winner|prize/i.test(badge)
        ? '<circle cx="12" cy="15" r="6"/><path d="M8.5 10.2 6 2h4l2 5 2-5h4l-2.5 8.2"/>'
        : '<path d="M5 22V4"/><path d="M5 4h11l-2 4 2 4H5"/>';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function renderProjectCard(p, index) {
    const icon = PROJECT_ICONS[p.icon] || PROJECT_ICONS.layers;
    const theme = PROJECT_THEMES[p.theme] || PROJECT_THEMES.slate;
    const num = String(index + 1).padStart(2, '0');
    const repo = safeUrl(p.repo);
    const demo = safeUrl(p.demo);
    const video = safeUrl(p.video);
    return `
        <div class="project-card">
            <div class="project-header project-header-${theme}">
                <span class="project-id">[ ${num} ]</span>
                <div class="project-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${icon}</svg>
                </div>
                <h3 class="project-name">${escapeHTML(p.title)}${p.badge ? ` <span class="project-prize-badge">${prizeIcon(p.badge)}${escapeHTML(p.badge)}</span>` : ''}</h3>
            </div>
            <div class="project-card-body">
                ${chips(p.tags, 'project-tags')}
                <p class="project-description">${escapeHTML(p.description)}</p>
                ${video ? `<a href="${video}" ${EXTERNAL} class="project-video-link"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Watch the demo video</a>` : ''}
                <div class="project-buttons">
                    ${repo ? `<a href="${repo}" ${EXTERNAL} class="btn btn-outline btn-sm">Source Code</a>` : ''}
                    ${demo ? `<a href="${demo}" ${EXTERNAL} class="btn btn-filled btn-sm">${escapeHTML(p.demoLabel || 'Live Demo')}</a>` : ''}
                </div>
            </div>
        </div>`;
}

function slugify(title) {
    return String(title).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
}

function renderMoreProjectRow(p, index) {
    const num = String(index + 1).padStart(2, '0');
    const repo = safeUrl(p.repo);
    const demo = safeUrl(p.demo);
    const tags = (p.tags || []).filter(Boolean).map(escapeHTML).join(' · ');
    return `
        <div class="repo-expand-item" onclick="toggleRepoExpansion(this, event)">
            <div class="repo-title-bar">
                <span class="repo-num">${num}</span>
                <div class="repo-path">src/projects/<span>${escapeHTML(slugify(p.title))}</span></div>
                <span class="expand-icon-plus" aria-hidden="true">+</span>
            </div>
            <div class="repo-expand-content">
                <div class="repo-content-inner">
                    <div class="repo-line-numbers" aria-hidden="true">1<br>2<br>3<br>4</div>
                    <div class="repo-details">
                        <h3 class="repo-name-mini">${escapeHTML(p.title)}</h3>
                        <p class="repo-description-mini">${escapeHTML(p.description)}</p>
                        <div class="repo-meta-mini">
                            ${tags ? `<span class="repo-date-mini">${tags}</span>` : ''}
                            ${demo ? `<a href="${demo}" ${EXTERNAL} class="repo-link-mini" onclick="event.stopPropagation()">${escapeHTML(p.demoLabel || 'Live Demo')} ↗</a>` : ''}
                            ${repo ? `<a href="${repo}" ${EXTERNAL} class="repo-link-mini" onclick="event.stopPropagation()">View on GitHub ↗</a>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseYearMonth(value) {
    const m = /^(\d{4})-(\d{1,2})$/.exec(String(value || '').trim());
    return m ? { year: +m[1], month: +m[2] } : null;
}

function formatYearMonth(ym) {
    return ym ? `${MONTHS[ym.month - 1]} ${ym.year}` : '';
}

function renderExperienceCard(e) {
    const start = parseYearMonth(e.start);
    const end = parseYearMonth(e.end);
    const now = new Date();
    const until = end || { year: now.getFullYear(), month: now.getMonth() + 1 };
    const months = start ? Math.max(1, (until.year - start.year) * 12 + (until.month - start.month)) : null;
    const ongoing = !end;
    const companyUrl = safeUrl(e.companyUrl);
    const locationUrl = safeUrl(e.locationUrl);
    const logo = safeUrl(e.logo);
    const demoUrl = safeUrl(e.demoUrl);
    const theme = /^[a-z]+$/.test(e.theme || '') ? e.theme : 'tpi';

    const logoHTML = logo
        ? `<div class="exp-company-logo"><img src="${logo}" alt="${escapeHTML(e.logoAlt || e.company)}" class="exp-logo-img" /></div>`
        : `<div class="exp-company-logo exp-logo-text-dd">${escapeHTML(e.logoText || (e.company || '?').slice(0, 2).toUpperCase())}</div>`;
    const company = companyUrl
        ? `<a href="${companyUrl}" ${EXTERNAL} class="exp-company-name exp-company-link">${escapeHTML(e.company)} ↗</a>`
        : `<span class="exp-company-name">${escapeHTML(e.company)}</span>`;
    const location = !e.location ? '' : locationUrl
        ? `<a href="${locationUrl}" ${EXTERNAL} class="exp-company-sub exp-location-link">${escapeHTML(e.location)}</a>`
        : `<span class="exp-company-sub">${escapeHTML(e.location)}</span>`;
    const stat = (value, label) => `<div class="exp-stat"><span class="exp-stat-value">${escapeHTML(value)}</span><span class="exp-stat-label">${label}</span></div>`;
    const certificate = safeUrl(e.certificate);
    // An image certificate opens in the shared viewer; a PDF opens in a new tab
    const certLink = !certificate ? '' : /\.pdf$/i.test(certificate)
        ? `<a href="${certificate}" ${EXTERNAL} class="exp-demo-link">View Certificate ↗</a>`
        : `<button type="button" class="exp-demo-link" data-cert="${certificate}" data-caption="${escapeHTML(`${e.role} · ${e.company}`)}">View Certificate</button>`;
    const bottom = (e.nda || demoUrl || certLink) ? `
                <div class="exp-bottom-row">
                    ${e.nda ? '<div class="exp-nda-pill">Proprietary &middot; Under NDA</div>' : ''}
                    <div class="exp-links">
                        ${demoUrl ? `<a href="${demoUrl}" ${EXTERNAL} class="exp-demo-link">View Demo ↗</a>` : ''}
                        ${certLink}
                    </div>
                </div>` : '';

    return `
        <div class="exp-card">
            <div class="exp-card-header exp-header-${theme}">
                <div class="exp-header-top">
                    ${ongoing ? '<span class="exp-badge ongoing-badge">&#9679; Live</span>' : '<span class="exp-badge completed-badge">&#10003; Done</span>'}
                    <span class="exp-year">${escapeHTML(e.yearLabel || (start ? start.year : ''))}</span>
                </div>
                ${logoHTML}
                <h3 class="exp-role">${escapeHTML(e.role)}</h3>
                ${company}
                ${location}
            </div>
            <div class="exp-card-body">
                <div class="exp-stats">
                    ${stat(formatYearMonth(start), 'Start')}
                    <div class="exp-stat-divider"></div>
                    ${ongoing ? stat('Present', 'Status') : stat(formatYearMonth(end), 'End')}
                    <div class="exp-stat-divider"></div>
                    ${stat(months == null ? '–' : `${months}${ongoing ? '+' : ''}`, 'Months')}
                </div>
                <ul class="exp-bullets">${(e.bullets || []).filter(Boolean).map(b => `<li>${richText(b)}</li>`).join('')}</ul>
                ${chips(e.tags, 'exp-tags')}${bottom}
            </div>
        </div>`;
}

function renderCertCard(c) {
    const theme = /^[a-z0-9]+$/.test(c.theme || '') ? c.theme : 'sf';
    const logo = safeUrl(c.logo);
    const logoHTML = logo
        ? `<img src="${logo}" alt="${escapeHTML(c.issuer)}" class="cert-logo-img">`
        : (CERT_LOGOS[theme] || '');
    const titleUrl = safeUrl(c.titleUrl);
    const primaryUrl = safeUrl(c.primaryUrl);
    const verifyUrl = safeUrl(c.verifyUrl);
    const meta = (c.meta || []).filter(m => m && m.label).map(m => `
                    <div class="cert-meta-item">
                        <span class="cert-meta-label">${escapeHTML(m.label)}</span>
                        <span class="cert-meta-value${/\bid\b/i.test(m.label) ? ' cert-id' : ''}">${escapeHTML(m.value)}</span>
                    </div>`).join('');

    return `
        <div class="cert-card">
            <div class="cert-card-header cert-header-${theme}">
                <div class="cert-badge cert-badge-logo">${logoHTML}</div>
                <div class="cert-header-text">
                    <span class="cert-issuer">${escapeHTML(c.issuer)}</span>
                    <span class="cert-type">${escapeHTML(c.type)}</span>
                </div>
                ${c.ribbon ? `<div class="cert-ribbon cert-ribbon-${theme}">${escapeHTML(c.ribbon)}</div>` : ''}
            </div>
            <div class="cert-card-body">
                <h3 class="cert-title">${titleUrl
                    ? `<a href="${titleUrl}" ${EXTERNAL} class="cert-title-link">${escapeHTML(c.title)}</a>`
                    : `<span class="cert-title-link">${escapeHTML(c.title)}</span>`}</h3>
                <div class="cert-meta">${meta}</div>
                ${chips(c.tags, 'cert-tags')}
                <div class="cert-btn-group">
                    ${primaryUrl ? `<a href="${primaryUrl}" ${EXTERNAL} class="cert-btn cert-btn-${theme}">${ICON_EXTERNAL} ${escapeHTML(c.primaryLabel || 'View')}</a>` : ''}
                    ${verifyUrl ? `<a href="${verifyUrl}" ${EXTERNAL} class="cert-btn cert-btn-verify">${ICON_VERIFY} Verify</a>` : ''}
                </div>
            </div>
        </div>`;
}

// {{leetcode.total}} etc. inside achievement text -> live numbers
function fillTokens(str, content) {
    const lc = leetcodeNumbers(content) || {};
    const scope = { leetcode: lc, github: (content.stats && content.stats.github) || {} };
    return String(str ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
        const value = getPath(scope, path);
        return value == null ? match : String(value);
    });
}

const ACH_KINDS = ['winner', 'finalist', 'record', 'role', 'participant'];

// Achievements are grouped by type, in this order
const ACH_GROUPS = [
    { name: 'results', title: 'Top results', kinds: ['winner', 'finalist', 'record'] },
    { name: 'leadership', title: 'Leadership', kinds: ['role'] },
    { name: 'hackathons', title: 'Hackathons', kinds: ['participant'] },
];

// The paper "sheet" at the top of a card: the certificate itself, a live number, or a quiet placeholder
function achievementMedia(a, kind, title, content) {
    const cert = safeUrl(a.certificate);
    if (cert && /\.pdf$/i.test(cert)) {
        return `
            <a class="ach-desk" href="${cert}" ${EXTERNAL} aria-label="Open certificate (PDF): ${escapeHTML(title)}">
                <span class="ach-sheet ach-sheet--doc">PDF</span>
                <span class="ach-cta">View certificate</span>
            </a>`;
    }
    if (cert) {
        const thumb = safeUrl(a.certificateThumb) || cert;
        return `
            <button type="button" class="ach-desk" data-cert="${cert}" data-caption="${escapeHTML(title)}" aria-label="View certificate: ${escapeHTML(title)}">
                <img class="ach-sheet" src="${thumb}" alt="" width="640" height="452" loading="lazy" decoding="async" />
                <span class="ach-cta">View certificate</span>
            </button>`;
    }
    if (kind === 'record') {
        const lc = leetcodeNumbers(content);
        const bar = lc && lc.total && /leetcode/i.test(a.title)
            ? `<span class="ach-bar" aria-hidden="true">${['easy', 'medium', 'hard']
                .map(level => `<span class="ach-bar-${level}" style="flex-grow:${Number(lc[level]) || 0}"></span>`).join('')}</span>`
            : '';
        const [, number, rest] = title.match(/^([\d.,+]+)\s+(.*)$/) || [null, title, ''];
        return `
            <div class="ach-desk ach-desk--stat">
                <span class="ach-stat">${escapeHTML(number)}</span>
                ${rest ? `<span class="ach-stat-unit">${escapeHTML(rest)}</span>` : ''}
                ${bar}
            </div>`;
    }
    if (kind === 'participant') {
        return `<div class="ach-desk ach-desk--blank" aria-hidden="true"><span>${escapeHTML(title.split(/[\s·]+/)[0])}</span></div>`;
    }
    return '';
}

function renderAchievement(a, content) {
    const kind = ACH_KINDS.includes(a.kind) ? a.kind : 'participant';
    const link = safeUrl(a.link);
    const title = fillTokens(a.title, content);
    const text = fillTokens(a.text, content);
    return `
        <li class="ach-item ach-item--${kind}">
            ${achievementMedia(a, kind, title, content)}
            <div class="ach-body">
                <div class="ach-meta">
                    <span class="ach-label">${escapeHTML(a.label)}</span>
                    ${a.date ? `<span class="ach-date">${escapeHTML(a.date)}</span>` : ''}
                </div>
                <h4 class="ach-title">${link ? `<a href="${link}" ${EXTERNAL}>${escapeHTML(title)} ↗</a>` : escapeHTML(title)}</h4>
                ${a.org ? `<p class="ach-org">${escapeHTML(a.org)}</p>` : ''}
                ${text ? `<p class="ach-text">${escapeHTML(text)}</p>` : ''}
            </div>
        </li>`;
}

function renderAchievements(content) {
    const el = document.getElementById('achievements-list');
    if (!el) return;
    if (!content.achievements) {
        el.innerHTML = '<p class="loading">Achievements could not be loaded.</p>';
        return;
    }
    const items = listOf(content.achievements, 'achievements');
    const kindOf = a => (ACH_KINDS.includes(a.kind) ? a.kind : 'participant');
    let index = 0;
    el.innerHTML = ACH_GROUPS.map(group => {
        const members = items.filter(a => group.kinds.includes(kindOf(a)));
        if (!members.length) return '';
        index += 1;
        return `
            <div class="ach-group ach-group--${group.name}">
                <h3 class="ach-group-title"><span>${String(index).padStart(2, '0')}</span>${group.title}</h3>
                <ul class="ach-grid">${members.map(a => renderAchievement(a, content)).join('')}</ul>
            </div>`;
    }).join('');
}

function renderBuildingCard(b) {
    const repo = safeUrl(b.repo);
    return `
        <div class="building-card">
            <div class="building-card-top">
                <span class="building-pulse"></span>
                <span class="building-status">In Progress</span>
            </div>
            <h3 class="building-name">${escapeHTML(b.name)}</h3>
            <p class="building-desc">${escapeHTML(b.description)}</p>
            ${chips(b.stack, 'building-stack')}
            ${repo ? `<a href="${repo}" ${EXTERNAL} class="building-gh-link">View Repo ↗</a>` : ''}
        </div>`;
}

function renderInto(id, items, render, emptyMessage) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = items === null
        ? `<p class="loading">${emptyMessage}</p>`
        : items.map(render).join('');
}

function renderProfileCard(profile, content) {
    const body = document.querySelector('.creative-card-body');
    if (!body || !profile) return;
    const key = k => `<span class="code-key">"${k}"</span><span class="code-colon">:</span> `;
    const str = (v, extra = '') => `<span class="code-string${extra}">"${escapeHTML(v)}"</span>`;
    const num = v => `<span class="code-number">${escapeHTML(v)}</span>`;
    const comma = '<span class="code-comma">,</span>';
    const skills = (profile.cardSkills || []).filter(Boolean);
    const lines = [
        key('name') + str(profile.name) + comma,
        key('role') + str(profile.role) + comma,
        key('degree') + str(profile.cardDegree || 'B.Tech AI (SRM) + BS DS (IITM)') + comma,
        key('gpa') + num(profile.cgpa) + comma,
        key('internships') + num(listOf(content.experience, 'experience').length) + comma,
        key('projects') + num(listOf(content.projects, 'projects').length) + comma,
        key('skills') + '<span class="code-bracket">[</span>',
        ...skills.map((s, i) => ({ indent: true, html: str(s) + (i < skills.length - 1 ? comma : '') })),
        '<span class="code-bracket">]</span>' + comma,
        key('status') + str(profile.status, ' code-green') + '<span class="cursor-blink">▋</span>',
    ];
    body.innerHTML = lines.map(line => typeof line === 'string'
        ? `<div class="code-line">${line}</div>`
        : `<div class="code-line code-indent">${line.html}</div>`).join('');
}

function renderContent(content) {
    const profile = content.profile;

    // Simple text bindings: <span data-field="cgpa"> and <span data-stat="github.publicRepos">
    if (profile) {
        document.querySelectorAll('[data-field]').forEach(el => {
            const value = getPath(profile, el.dataset.field);
            if (value != null && value !== '') el.textContent = value;
        });
    }
    if (content.stats) {
        document.querySelectorAll('[data-stat]').forEach(el => {
            const value = getPath(content.stats, el.dataset.stat);
            if (value != null) el.textContent = value;
        });
    }
    renderProfileCard(profile, content);

    const projects = content.projects ? listOf(content.projects, 'projects') : null;
    renderInto('projects-list', projects && projects.filter(p => p.featured), renderProjectCard, 'Projects could not be loaded.');
    renderInto('more-projects-list', projects && projects.filter(p => !p.featured), renderMoreProjectRow, 'Projects could not be loaded.');
    renderInto('experience-list', content.experience ? listOf(content.experience, 'experience') : null, renderExperienceCard, 'Experience could not be loaded.');
    renderInto('certs-list', content.certifications ? listOf(content.certifications, 'certifications') : null, renderCertCard, 'Certifications could not be loaded.');
    renderAchievements(content);
    renderInto('building-list', content.building ? listOf(content.building, 'building') : null, renderBuildingCard, 'Projects could not be loaded.');

    // Hide "More Projects" entirely when nothing is listed there
    const more = document.getElementById('more-projects-list');
    if (more && projects && !projects.some(p => !p.featured)) {
        more.closest('section').hidden = true;
    }
}

function toggleRepoExpansion(element, event) {
    if (window.innerWidth <= 768) {
        // Clear active from others
        document.querySelectorAll('.repo-expand-item').forEach(item => {
            if (item !== element) item.classList.remove('active');
        });
        element.classList.toggle('active');
    } else {
        // On PC, let hover handle CSS transition, but click opens link
        window.open(element.querySelector('.repo-link-mini').href, '_blank', 'noopener');
    }
}

function updateFooterYear() {
    const year = document.getElementById('footer-year');
    if (year) year.textContent = new Date().getFullYear();
}

// ===================================
// Liquid Glass refraction
// Adapted from Shu Ding's liquid-glass (github.com/shuding/liquid-glass, MIT): an SVG
// feDisplacementMap bends the backdrop near each element's rounded edge, like the rim of
// a lens. Only Chromium accepts an SVG filter inside backdrop-filter; Safari and Firefox
// keep the frosted glass from style.css.
// ===================================
function initLiquidGlass() {
    const elements = document.querySelectorAll('[data-liquid-glass]');
    const brands = navigator.userAgentData && navigator.userAgentData.brands;
    const isChromium = !!(brands && brands.some(b => /Chromium/.test(b.brand)));
    const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    if (!elements.length || !isChromium || reducedTransparency || !window.ResizeObserver) return;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    document.body.appendChild(svg);

    elements.forEach((el, index) => {
        const id = `liquid-glass-${index}`;
        const filter = document.createElementNS(NS, 'filter');
        filter.setAttribute('id', id);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('color-interpolation-filters', 'sRGB');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');

        const map = document.createElementNS(NS, 'feImage');
        map.setAttribute('result', 'map');
        map.setAttribute('preserveAspectRatio', 'none');

        const displace = document.createElementNS(NS, 'feDisplacementMap');
        displace.setAttribute('in', 'SourceGraphic');
        displace.setAttribute('in2', 'map');
        displace.setAttribute('xChannelSelector', 'R');
        displace.setAttribute('yChannelSelector', 'G');

        filter.append(map, displace);
        svg.appendChild(filter);

        let lastSize = '';
        let frame = null;
        const build = () => {
            frame = null;
            const w = Math.round(el.offsetWidth);
            const h = Math.round(el.offsetHeight);
            if (!w || !h || `${w}x${h}` === lastSize) return;
            lastSize = `${w}x${h}`;

            const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, w / 2, h / 2);
            const { url, scale } = liquidGlassMap(w, h, radius);
            filter.setAttribute('width', w);
            filter.setAttribute('height', h);
            map.setAttribute('width', w);
            map.setAttribute('height', h);
            map.setAttribute('href', url);
            displace.setAttribute('scale', scale);
            el.style.backdropFilter = `url(#${id}) blur(10px) saturate(150%) brightness(1.04)`;
        };

        new ResizeObserver(() => {
            if (frame === null) frame = requestAnimationFrame(build);
        }).observe(el);
    });
}

// Displacement map for a rounded rectangle: neutral in the middle, bending inward within a
// narrow bezel along the edge (strongest right at the rim), as on iOS.
function liquidGlassMap(w, h, radius) {
    const bezel = Math.max(4, Math.min(18, h * 0.3, w * 0.3));
    const hw = w / 2;
    const hh = h / 2;
    const offsets = new Float32Array(w * h * 2);
    let max = 0;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const px = x + 0.5 - hw;
            const py = y + 0.5 - hh;
            // signed distance to the rounded rectangle (negative inside)
            const qx = Math.abs(px) - hw + radius;
            const qy = Math.abs(py) - hh + radius;
            const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
            const depth = -(Math.min(Math.max(qx, qy), 0) + outside - radius);
            if (depth <= 0 || depth >= bezel) continue;

            // outward edge normal at this point
            let nx = 0;
            let ny = 0;
            if (qx > 0 && qy > 0) {
                nx = qx / (outside || 1);
                ny = qy / (outside || 1);
            } else if (qx > qy) {
                nx = 1;
            } else {
                ny = 1;
            }
            nx *= px < 0 ? -1 : 1;
            ny *= py < 0 ? -1 : 1;

            const t = 1 - depth / bezel;
            const amount = t * t * bezel * 0.9;
            const i = (y * w + x) * 2;
            offsets[i] = -nx * amount;
            offsets[i + 1] = -ny * amount;
            max = Math.max(max, amount);
        }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(w, h);
    const range = max * 2 || 1;
    for (let p = 0, i = 0; p < image.data.length; p += 4, i += 2) {
        image.data[p] = (offsets[i] / range + 0.5) * 255;
        image.data[p + 1] = (offsets[i + 1] / range + 0.5) * 255;
        image.data[p + 2] = 128;
        image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return { url: canvas.toDataURL(), scale: range };
}

// ===================================
// Interactive Hero Mesh / Particles Canvas
// ===================================
function initHeroMeshCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero') || canvas.parentElement;
    let width, height;
    let particles = [];
    const particleCount = 42;

    function resize() {
        // Scale the backing store for high-DPI screens so dots stay crisp
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = hero.offsetWidth;
        height = hero.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.8 + 1
        });
    }

    let mouse = { x: -1000, y: -1000 };
    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Only animate while the hero is on screen and the tab is visible
    let heroVisible = true;
    let frameId = null;

    function render() {
        frameId = null;
        ctx.clearRect(0, 0, width, height);

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const dotColor = isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.28)';
        const lineColor = isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(59, 130, 246, 0.08)';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Mouse repulsion subtle effect (skip zero distance to avoid NaN)
            const dxm = mouse.x - p.x;
            const dym = mouse.y - p.y;
            const distM = Math.sqrt(dxm * dxm + dym * dym);
            if (distM > 0 && distM < 110) {
                p.x -= (dxm / distM) * 1.5;
                p.y -= (dym / distM) * 1.5;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = dotColor;
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1 - dist / 130;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        schedule();
    }

    function schedule() {
        if (frameId === null && heroVisible && !document.hidden) {
            frameId = requestAnimationFrame(render);
        }
    }

    new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        schedule();
    }).observe(hero);
    document.addEventListener('visibilitychange', schedule);

    schedule();
}

// ===================================
// Nav Scrollspy Active Indicator
// ===================================
function initScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = Array.from(navLinks)
        .map(link => document.querySelector(link.getAttribute('href')))
        .filter(sec => sec !== null);

    if (sections.length === 0) return;

    let ticking = false;

    function update() {
        ticking = false;
        const scrollPosition = window.pageYOffset + 220;

        let currentSectionId = '';
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // The last section can be too short to reach the offset; treat page bottom as it
        if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 2) {
            currentSectionId = sections[sections.length - 1].getAttribute('id');
        }

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
        });
        updateTabBar(currentSectionId || 'hero');
    }

    // Phone/tablet tab bar: highlight the tab for this section and slide the glass capsule under it
    const tabBar = document.querySelector('.tab-bar');
    const lens = tabBar && tabBar.querySelector('.tab-lens');
    const tabs = tabBar ? Array.from(tabBar.querySelectorAll('.tab-item')) : [];
    const sheetLinks = document.querySelectorAll('.tab-sheet a');
    let currentTab = null;

    // While a tapped tab's smooth scroll is running, keep the capsule on that tab instead of
    // following every section the page passes on the way (e.g. Home -> Work passes About/Skills).
    let lockedTab = null;
    let unlockTimer = null;
    const armUnlock = () => {
        clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => {
            lockedTab = null;
            update();
        }, 180);
    };
    const lockTo = (tab) => {
        lockedTab = tab;
        setActiveTab(tab);
        armUnlock();
    };
    tabs.forEach(t => {
        if (t.tagName === 'A') t.addEventListener('click', () => lockTo(t.dataset.tab));
    });
    sheetLinks.forEach(a => a.addEventListener('click', () => lockTo('more')));

    function moveLens() {
        const active = tabs.find(t => t.classList.contains('active'));
        if (!lens || !active || !active.offsetWidth) return;
        const inset = 4;
        lens.style.width = `${active.offsetWidth - inset * 2}px`;
        lens.style.transform = `translateX(${active.offsetLeft + inset}px)`;
        lens.style.opacity = '1';
    }

    function updateTabBar(sectionId) {
        sheetLinks.forEach(a => a.classList.toggle('active', a.dataset.sheet === sectionId));
        if (lockedTab) return;
        const direct = tabs.some(t => t.dataset.tab === sectionId);
        setActiveTab(direct ? sectionId : 'more');
    }

    function setActiveTab(tab) {
        if (tab === currentTab) return;
        currentTab = tab;
        tabs.forEach(t => {
            const on = t.dataset.tab === tab;
            t.classList.toggle('active', on);
            if (t.tagName === 'A') {
                if (on) t.setAttribute('aria-current', 'location');
                else t.removeAttribute('aria-current');
            }
        });
        moveLens();
    }

    window.addEventListener('scroll', () => {
        if (lockedTab) armUnlock();
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    window.addEventListener('resize', moveLens);
    update();
}

// ===================================
// Certificate viewer: any [data-cert] button opens the image in a modal <dialog>
// ===================================
function initCertViewer() {
    const dialog = document.getElementById('cert-viewer');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = document.getElementById('cert-viewer-img');
    const caption = document.getElementById('cert-viewer-caption');
    const open = document.getElementById('cert-viewer-open');

    document.addEventListener('click', e => {
        const trigger = e.target.closest('[data-cert]');
        if (!trigger) return;
        img.src = trigger.dataset.cert;
        img.alt = `Certificate: ${trigger.dataset.caption}`;
        caption.textContent = trigger.dataset.caption;
        open.href = trigger.dataset.cert;
        dialog.showModal();
    });

    dialog.querySelector('.cert-viewer-close').addEventListener('click', () => dialog.close());
    // A click on the dimmed backdrop lands on the <dialog> itself
    dialog.addEventListener('click', e => {
        if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => img.removeAttribute('src'));
}

// ===================================
// "Ask my assistant" (About): talks to the Cloudflare Worker in /assistant
// ===================================
function initAssistant(profile) {
    const card = document.getElementById('ask-card');
    const endpoint = profile && safeUrl(profile.assistantUrl);
    if (!card || !endpoint || !/^https?:/i.test(endpoint)) return;
    card.hidden = false;

    const log = document.getElementById('ask-log');
    const form = document.getElementById('ask-form');
    const input = document.getElementById('ask-input');
    const suggestions = document.getElementById('ask-suggestions');
    const messages = [];
    let busy = false;

    // Plain text with links and email addresses made clickable (built with DOM nodes, never innerHTML)
    const linkified = text => {
        const frag = document.createDocumentFragment();
        const pattern = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]|[\w.+-]+@[\w-]+\.[\w.-]*\w)/g;
        let last = 0;
        for (const match of text.matchAll(pattern)) {
            frag.append(text.slice(last, match.index));
            const a = document.createElement('a');
            const isEmail = !match[0].startsWith('http');
            a.href = isEmail ? `mailto:${match[0]}` : match[0];
            if (!isEmail) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            // Show "github.com/sarvesh-raam/calldojo", not the full address with tracking bits
            const short = match[0].replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
            a.textContent = isEmail || short.length <= 36 ? (isEmail ? match[0] : short) : `${short.slice(0, 33)}…`;
            if (!isEmail) a.title = match[0];
            frag.append(a);
            last = match.index + match[0].length;
        }
        frag.append(text.slice(last));
        return frag;
    };

    // The model sometimes writes **bold** despite being asked for plain text: show it as bold, not asterisks
    const formatted = text => {
        const frag = document.createDocumentFragment();
        text.split(/\*\*(.+?)\*\*/g).forEach((part, i) => {
            if (i % 2) {
                const strong = document.createElement('strong');
                strong.append(linkified(part));
                frag.append(strong);
            } else {
                frag.append(linkified(part));
            }
        });
        return frag;
    };

    const status = document.getElementById('ask-status');
    const setStatus = (text, state = '') => {
        status.lastChild.textContent = text;
        status.dataset.state = state;
    };
    const scrollDown = () => { log.scrollTop = log.scrollHeight; };
    const line = (className, ...children) => {
        const el = document.createElement('div');
        el.className = className;
        el.append(...children);
        log.append(el);
        scrollDown();
        return el;
    };

    // "→ message sarvesh about this": jump to the contact form with the question already written
    const handoffButton = question => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'term-cmd';
        button.textContent = '→ message sarvesh about this';
        button.addEventListener('click', () => {
            const name = document.getElementById('name');
            const message = document.getElementById('message');
            if (message && !message.value.trim()) {
                message.value = `Hi Sarvesh, I asked the assistant on your portfolio: "${question}"\n\n`;
            }
            document.getElementById('contact')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            const target = name && !name.value.trim() ? name : message;
            // focus after the scroll so the page doesn't jump
            setTimeout(() => target?.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 600);
        });
        return button;
    };

    // Braille spinner while waiting; returns a function that stops it
    const spinner = (el, label) => {
        const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
        let i = 0;
        const glyph = document.createElement('span');
        glyph.className = 'term-spin';
        glyph.textContent = frames[0];
        const text = document.createTextNode(` ${label}`);
        el.replaceChildren(glyph, text);
        const timer = prefersReducedMotion ? null : setInterval(() => { glyph.textContent = frames[++i % frames.length]; }, 80);
        return {
            label: value => { text.data = ` ${value}`; },
            stop: () => clearInterval(timer),
        };
    };

    // Type the answer out, then swap in the formatted version (links, bold)
    const typeOut = (el, text) => new Promise(resolve => {
        if (prefersReducedMotion) {
            el.replaceChildren(formatted(text));
            return resolve();
        }
        const plain = text.replace(/\*\*/g, '');
        const node = document.createTextNode('');
        const caret = document.createElement('span');
        caret.className = 'term-caret';
        el.replaceChildren(node, caret);
        const step = Math.max(1, Math.ceil(plain.length / 80)); // about 1.3 s whatever the length
        let shown = 0;
        const tick = () => {
            shown = Math.min(plain.length, shown + step);
            node.data = plain.slice(0, shown);
            scrollDown();
            if (shown < plain.length) return requestAnimationFrame(tick);
            el.replaceChildren(formatted(text));
            resolve();
        };
        requestAnimationFrame(tick);
    });

    const wait = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

    const request = async () => {
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages.slice(-6) }),
            });
            return { ok: res.ok, data: await res.json().catch(() => ({})) };
        } catch {
            return { ok: false, data: { answer: 'The assistant could not be reached. Please try again in a moment.', contact: true } };
        }
    };

    const ask = async question => {
        question = question.trim().slice(0, 300);
        if (!question || busy) return;
        busy = true;
        form.classList.add('is-busy');
        suggestions.hidden = true;
        suggestions.previousElementSibling.hidden = true; // "# Try one:"

        const sign = document.createElement('span');
        sign.className = 'term-q-sign';
        sign.textContent = '❯';
        line('term-q', sign, ` ${question}`);
        messages.push({ role: 'user', content: question });

        const out = line('term-a');
        const spin = spinner(out, 'thinking…');
        setStatus('thinking', 'busy');

        // The free AI plan allows only a few questions a minute: wait and retry (twice) instead of failing
        let reply = await request();
        for (let attempt = 0; !reply.ok && reply.data.retryAfter && attempt < 2; attempt++) {
            setStatus('rate-limited', 'wait');
            for (let left = reply.data.retryAfter; left > 0; left--) {
                spin.label(`free AI plan is busy, retrying in ${left}s…`);
                await wait(1);
            }
            spin.label('thinking…');
            setStatus('thinking', 'busy');
            reply = await request();
        }
        spin.stop();

        const answer = reply.data.answer || 'Sorry, something went wrong. Please try again.';
        if (reply.ok) messages.push({ role: 'assistant', content: answer });
        else messages.pop(); // failed: forget the question

        out.classList.toggle('is-error', !reply.ok);
        await typeOut(out, answer);
        if (reply.data.contact) out.append(handoffButton(question));
        scrollDown();
        setStatus('online');
        busy = false;
        form.classList.remove('is-busy');
    };

    // Clicking anywhere in the terminal puts the cursor in the prompt, like a real one
    card.addEventListener('click', e => {
        if (e.target.closest('a, button, input') || String(getSelection())) return;
        input.focus({ preventScroll: true });
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const question = input.value;
        input.value = '';
        ask(question);
    });
    suggestions.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button) ask(button.textContent);
    });
}

// ===================================
// Scroll Reveal Animations
// ===================================
function initScrollReveal() {
    if (prefersReducedMotion) return;

    const targets = document.querySelectorAll(
        '.project-card, .building-card, .exp-card, .ach-item, .cert-card, .skill-category'
    );

    targets.forEach(el => el.classList.add('reveal-item'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0,
        rootMargin: '0px 0px -40px 0px'
    });

    targets.forEach(el => observer.observe(el));
}

// ===================================
// 3D Card Tilt Effect on Hover
// ===================================
function initCard3DTilt() {
    // Disable on touch devices and for reduced motion
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || prefersReducedMotion) return;

    const cards = document.querySelectorAll('.project-card, .building-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5.5;
            const rotateY = ((x - centerX) / centerX) * 5.5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
        });

        card.addEventListener('mouseleave', () => {
            // Hand control back to the stylesheet (hover / reveal transforms)
            card.style.transform = '';
        });
    });
}

// ===================================
// Hero Stats: real numbers from /data (LeetCode refreshed every 6 h by a GitHub Action)
// ===================================
function initHeroStatsCounter(content) {
    const lc = leetcodeNumbers(content);
    const targets = {
        internship: content.experience ? listOf(content.experience, 'experience').length : null,
        project: content.projects ? listOf(content.projects, 'projects').length : null,
        leetcode: lc ? lc.total : null,
    };

    function animateCounter(numEl, target) {
        if (!target || target <= 0) return;
        if (prefersReducedMotion) {
            numEl.textContent = target;
            return;
        }
        numEl.textContent = '0';
        const duration = 1200;
        const startTime = performance.now();

        function update(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const ease = 1 - (1 - progress) * (1 - progress);
            numEl.textContent = progress < 1 ? Math.floor(ease * target) : target;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    document.querySelectorAll('.hero-stat-num').forEach(numEl => {
        const lbl = numEl.parentElement.querySelector('.hero-stat-lbl')?.textContent.toLowerCase() || '';
        const key = Object.keys(targets).find(k => lbl.includes(k));
        const target = key && targets[key] != null ? targets[key] : parseInt(numEl.dataset.target || '0', 10);
        numEl.dataset.target = target;
        animateCounter(numEl, target);
    });
}
