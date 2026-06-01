// ============================================================
// JustCook — App Router (no-fetch version)
// Works with file:// AND http:// without any server
// ============================================================

const appRoot = document.getElementById('app-root');

// ── Page registry ─────────────────────────────────────────────
// Each entry is a function that returns the HTML string for that page.
// We load pages lazily on first visit, caching the result.
const pageCache = {};

// Pages are stored as separate .html files.
// When running via file://, fetch() is blocked by CORS.
// Solution: dynamically create a <script> that loads the partial via XHR
// or – even simpler – just inline each page as a getter here.
// For maximum compatibility we use XMLHttpRequest (synchronous is fine
// for local files; async preferred for http).

async function loadPage(file) {
    if (pageCache[file]) return pageCache[file];

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', file, true);           // async = true
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
                // status 0 = success over file://
                pageCache[file] = xhr.responseText;
                resolve(xhr.responseText);
            } else {
                reject(new Error(`HTTP ${xhr.status} loading ${file}`));
            }
        };
        xhr.onerror = () => reject(new Error(`Network error loading ${file}`));
        xhr.send();
    });
}

// ── Routes ────────────────────────────────────────────────────
const routes = {
    '/':         { file: 'pages/home.html',           title: 'JustCook | Home' },
    '/products': { file: 'pages/products.html',        title: 'JustCook | Shop' },
    '/product':  { file: 'pages/product-details.html', title: 'JustCook | Product' },
    '/cart':     { file: 'pages/cart.html',            title: 'JustCook | Cart' },
    '/checkout': { file: 'pages/checkout.html',        title: 'JustCook | Checkout' },
    '/tracker':  { file: 'pages/tracker.html',         title: 'JustCook | Track Order' },
    '/orders':   { file: 'pages/orders.html',          title: 'JustCook | My Orders' },
    '/admin':    { file: 'pages/admin.html',           title: 'JustCook | Admin Dashboard' },
    '/login':    { file: 'pages/login.html',           title: 'JustCook | Login' },
    '/contact':  { file: 'pages/contact.html',         title: 'JustCook | Contact Us' }
};

// ── Script executor ───────────────────────────────────────────
// innerHTML injection does NOT run <script> tags — we re-clone them.
function executeScripts(container) {
    container.querySelectorAll('script').forEach(old => {
        const s = document.createElement('script');
        Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
        s.textContent = old.textContent;
        old.parentNode.replaceChild(s, old);
    });
}

// ── Router ────────────────────────────────────────────────────
async function handleRoute() {
    let hash = window.location.hash.slice(1) || '/';

    // strip trailing slash (except root)
    if (hash.length > 1 && hash.endsWith('/')) hash = hash.slice(0, -1);

    let baseRoute = hash.split('?')[0];
    let params    = null;

    // Dynamic segment: /product/some-id
    if (baseRoute.startsWith('/product/')) {
        params    = baseRoute.split('/')[2] || '';
        baseRoute = '/product';
    }

    const route = routes[baseRoute];

    // 404
    if (!route) {
        appRoot.innerHTML = `
            <div style="min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1.5rem;padding:2rem;">
                <p style="font-size:4rem">🍽️</p>
                <h2>404 — Page not found</h2>
                <p style="opacity:0.6">The page <code>${baseRoute}</code> doesn't exist.</p>
                <a href="#/" style="background:var(--primary);color:#fff;padding:0.9rem 2.5rem;border-radius:999px;font-weight:700;">Go Home</a>
            </div>`;
        return;
    }

    document.title = route.title;

    // For product details, always pass the product ID via a global
    // and NEVER cache the page (it's dynamic per product)
    if (baseRoute === '/product') {
        window.__currentProductId = params || '';
        // Remove from cache so it always re-runs the script fresh
        delete pageCache[route.file];
    }

    // Show loader
    appRoot.innerHTML = `
        <div style="min-height:65vh;display:flex;flex-direction:column;align-items:center;
                    justify-content:center;gap:1rem;">
            <div class="spinner"></div>
            <p style="opacity:0.5;font-size:0.9rem;">Loading…</p>
        </div>`;

    try {
        const html = await loadPage(route.file);

        function renderPage() {
            appRoot.innerHTML = html;
            executeScripts(appRoot);

            if (window.AOS) {
                AOS.init({ duration: 800, once: true, offset: 100 });
                AOS.refreshHard();
            }

            window.dispatchEvent(new CustomEvent('page-loaded', {
                detail: { route: baseRoute, params, fullHash: hash }
            }));

            updateNav(baseRoute);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Real-time session heartbeat
            if (window.Database && window.Database.registerSession) {
                window.Database.registerSession();
            }
        }

        if (window.gsap) {
            // Cinematic transition
            gsap.to(appRoot, {
                opacity: 0, 
                scale: 0.98,
                filter: 'blur(10px)',
                duration: 0.25,
                ease: 'power2.in',
                onComplete() {
                    renderPage();
                    gsap.fromTo(appRoot, 
                        { opacity: 0, scale: 1.02, filter: 'blur(20px)', y: 20 }, 
                        { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power3.out' }
                    );
                    
                    // Stagger reveal all sections in the new page
                    gsap.from('section, .form-card, .grid-container > div', {
                        opacity: 0,
                        y: 30,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'power2.out',
                        delay: 0.2
                    });
                }
            });
        } else {
            appRoot.style.opacity = '1';
            renderPage();
        }

    } catch (err) {
        console.error('[JustCook Router]', err);
        appRoot.innerHTML = `
            <div style="min-height:65vh;display:flex;flex-direction:column;align-items:center;
                        justify-content:center;gap:1.2rem;text-align:center;padding:2rem;">
                <h2>⚠️ Could not load page</h2>
                <p style="opacity:0.6;">${err.message}</p>
                <p style="opacity:0.4;font-size:0.85rem;">
                    Open this project with VS Code → right-click <strong>index.html</strong> →
                    <em>Open with Live Server</em>
                </p>
                <a href="#/" style="background:var(--primary);color:#fff;padding:0.9rem 2.5rem;border-radius:999px;font-weight:700;">Go Home</a>
            </div>`;
    }
}

// ── Nav active state ──────────────────────────────────────────
function updateNav(currentRoute) {
    document.querySelectorAll('.nav-link, .taskbar-item').forEach(link => {
        const href = (link.getAttribute('href') || '').slice(1);
        const active =
            href === currentRoute ||
            (currentRoute === '/product' && href === '/products');
        link.classList.toggle('active', active);
    });
}

// ── Listeners ─────────────────────────────────────────────────
window.addEventListener('hashchange', handleRoute);

function initApp() {
    handleRoute();

    // Theme toggle — preserve SVG icon
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        const applyTheme = (light) => {
            document.body.classList.toggle('light-theme', light);
            localStorage.setItem('theme', light ? 'light' : 'dark');
        };

        themeBtn.addEventListener('click', () => {
            applyTheme(!document.body.classList.contains('light-theme'));
        });

        // Restore saved preference
        applyTheme(localStorage.getItem('theme') === 'light');
    }

    // Search button (no-op hook for future feature)
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            window.location.hash = '#/products';
        });
    }

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // ── Admin Dashboard Link & User State ──────────────────────
    if (window.Store) {
        window.Store.subscribe((state) => {
            const user = state.user;
            const nav = document.getElementById('navLinks');
            const existingAdminLink = document.getElementById('nav-admin-link');
            
            if (user && user.role === 'admin') {
                if (!existingAdminLink) {
                    const a = document.createElement('a');
                    a.id = 'nav-admin-link';
                    a.href = '#/admin';
                    a.className = 'nav-link';
                    a.textContent = 'Dashboard';
                    a.style.color = 'var(--primary)';
                    a.style.fontWeight = '800';
                    nav.appendChild(a);
                }
            } else {
                if (existingAdminLink) existingAdminLink.remove();
            }

            // Update user icon color/state
            const userBtn = document.getElementById('user-btn');
            if (userBtn) {
                userBtn.style.color = user ? 'var(--primary)' : 'inherit';
                userBtn.title = user ? `Logged in as ${user.name}` : 'Login';
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
