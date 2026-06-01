// Use a plain function so errors surface cleanly
function __initProductPage() {
    var root = document.getElementById('pd-root');
    if (!root) return;

    function show(html) { root.innerHTML = html; }

    function showError(msg) {
        show('<div style="padding:4rem;text-align:center;">'
            + '<h2 style="margin-bottom:1rem;">⚠️ ' + msg + '</h2>'
            + '<a href="#/products" style="color:var(--primary);font-weight:600;">← Browse All Products</a>'
            + '</div>');
    }

    // Get product ID — prefer the router-injected global, fall back to hash
    var hash   = window.location.hash; // e.g. #/product/pani-puri-mint
    var parts  = hash.split('/');      // ['#', 'product', 'pani-puri-mint']
    var fromHash = parts.length >= 3 ? parts[parts.length - 1] : '';
    var productId = (window.__currentProductId && window.__currentProductId !== 'product')
                    ? window.__currentProductId
                    : fromHash;

    if (!productId || productId === 'product' || productId === '') {
        showError('No product selected. Please go back and pick one.');
        return;
    }

    var Database = window.Database;
    if (!Database) {
        showError('Database not loaded. Please refresh the page.');
        return;
    }

    Database.getProductById(productId).then(function(product) {
        if (!product) {
            showError('Product "' + productId + '" not found.');
            return;
        }

        var imgUrl  = product.imageUrl || 'images/logo.png';
        var price   = Number(product.price).toFixed(2);
        var isSoon  = !!product.isComingSoon;

        var actionsHtml = isSoon
            ? `<div style="margin-bottom:2rem;">
                 <span style="background:#ffb703;color:#000;padding:.5rem 1.5rem;border-radius:99px;font-weight:800;font-size:1rem;">Coming Soon</span>
               </div>
               <div class="pd-actions">
                 <button class="btn-add-cart" id="pd-notify" style="background:var(--card);border:2px solid var(--border);color:var(--text);box-shadow:none;">
                 🔔 Notify Me When Available</button>
               </div>`
            : `<div class="pd-actions">
                 <div class="qty-control">
                   <button type="button" class="qty-btn" id="pd-minus">−</button>
                   <input type="number" class="qty-input" id="pd-qty" value="1" min="1" max="99">
                   <button type="button" class="qty-btn" id="pd-plus">+</button>
                 </div>
                 <button type="button" class="btn-add-cart" id="pd-addcart">Add to Cart 🛒</button>
               </div>`;

        var checkSvg = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>`;

        var productHtml = `
            <div class="pd-grid">
              <div class="pd-image"><img src="${imgUrl}" alt="${product.name}"></div>
              <div class="pd-info">
                <span class="pd-category">${product.category}</span>
                <h1 class="pd-title">${product.name}</h1>
                <div class="pd-price">&#8377;${price}</div>
                <p class="pd-desc">${product.description}</p>
                ${actionsHtml}
                <div class="pd-features">
                  <div class="pd-feature">${checkSvg} 100% Authentic Regional Flavours</div>
                  <div class="pd-feature">${checkSvg} Made with Real Whole Spices</div>
                  <div class="pd-feature">${checkSvg} Free from Artificial Preservatives</div>
                </div>
              </div>
            </div>
            <div id="pd-suggestions" class="suggestions-section">
                <!-- Suggestions will load here -->
            </div>
        `;

        show(productHtml);

        // Fetch suggestions
        Database.getProducts().then(function(allProducts) {
            var suggestions = allProducts.filter(p => p.id !== productId).slice(0, 3);
            if (suggestions.length > 0) {
                var sugHtml = `
                    <h2 class="suggestions-title">You May Also Like</h2>
                    <div class="suggestions-grid">
                        ${suggestions.map(s => `
                            <a href="#/product/${s.id}" class="suggestion-card">
                                <img src="${s.imageUrl}" alt="${s.name}" class="suggestion-img">
                                <div class="suggestion-info">
                                    <h3 class="suggestion-name">${s.name}</h3>
                                    <div class="suggestion-price">&#8377;${Number(s.price).toFixed(2)}</div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                `;
                document.getElementById('pd-suggestions').innerHTML = sugHtml;
            }
        });

        // GSAP entrance
        if (window.gsap) {
            gsap.from('.pd-image', { opacity: 0, x: -50, duration: 0.9, ease: 'power2.out' });
            gsap.from('.pd-info > *', { opacity: 0, x: 50, duration: 0.7, stagger: 0.1, ease: 'power2.out', delay: 0.2 });
        }

        // Wire up buttons
        if (!isSoon) {
            var qtyEl   = document.getElementById('pd-qty');
            var minusEl = document.getElementById('pd-minus');
            var plusEl  = document.getElementById('pd-plus');
            var cartBtn = document.getElementById('pd-addcart');

            if (minusEl) minusEl.onclick = function() { var v = parseInt(qtyEl.value)||1; if(v>1) qtyEl.value = v-1; };
            if (plusEl)  plusEl.onclick  = function() { var v = parseInt(qtyEl.value)||1; qtyEl.value = v+1; };
            if (qtyEl)   qtyEl.onchange  = function() { var v=parseInt(qtyEl.value); if(isNaN(v)||v<1) qtyEl.value=1; };

            if (cartBtn) {
                cartBtn.onclick = function() {
                    var Store = window.Store;
                    if (!Store) { alert('Cart unavailable — please refresh.'); return; }
                    Store.addToCart({
                        productId:   product.id,
                        variantId:   'default',
                        qty:         parseInt(qtyEl.value) || 1,
                        price:       product.price,
                        name:        product.name,
                        variantName: 'Standard',
                        imageUrl:    imgUrl
                    });
                    var orig = cartBtn.textContent;
                    cartBtn.textContent = '✓ Added to Cart!';
                    cartBtn.style.background = '#16a34a';
                    cartBtn.style.boxShadow  = '0 5px 20px rgba(22,163,74,0.4)';
                    setTimeout(function() {
                        cartBtn.textContent      = orig;
                        cartBtn.style.background = '';
                        cartBtn.style.boxShadow  = '';
                    }, 2200);
                };
            }
        } else {
            var notifyBtn = document.getElementById('pd-notify');
            if (notifyBtn) {
                notifyBtn.onclick = function() {
                    notifyBtn.textContent    = '✓ We will notify you!';
                    notifyBtn.style.borderColor = '#16a34a';
                    notifyBtn.style.color    = '#16a34a';
                    notifyBtn.disabled       = true;
                };
            }
        }

    }).catch(function(err) {
        showError('Failed to load product: ' + err.message);
    });
}

// Run immediately — the DOM is already injected by the router
__initProductPage();
