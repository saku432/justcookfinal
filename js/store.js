// Simple Reactive Store — exposed globally for all page scripts
window.Store = {
    state: {
        user: null,   // { uid, email, role }
        cart: [],     // [{ productId, variantId, qty, price, name, variantName }]
        products: []
    },
    listeners: [],

    getState() { return this.state; },

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    },

    subscribe(listener) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    },

    notify() {
        this.listeners.forEach(l => l(this.state));
    },

    setUser(user) { this.setState({ user }); },

    addToCart(item) {
        const cart = [...this.state.cart];
        // Ensure numeric values
        item.qty = Number(item.qty) || 1;
        item.price = Number(item.price) || 0;
        
        const existing = cart.find(c => c.productId === item.productId && c.variantId === item.variantId);
        if (existing) {
            existing.qty += item.qty;
        } else {
            cart.push(item);
        }
        this.setState({ cart });
        this.saveCart();
        this.updateCartBadge();
    },

    removeFromCart(productId, variantId) {
        const cart = this.state.cart.filter(c => !(c.productId === productId && c.variantId === variantId));
        this.setState({ cart });
        this.saveCart();
        this.updateCartBadge();
    },

    clearCart() {
        this.setState({ cart: [] });
        this.saveCart();
        this.updateCartBadge();
    },

    saveCart() {
        localStorage.setItem('jc_cart', JSON.stringify(this.state.cart));
    },

    loadCart() {
        const saved = localStorage.getItem('jc_cart');
        if (saved) {
            try { 
                let data = JSON.parse(saved);
                // Sanitize data
                data = data.map(i => ({
                    ...i,
                    price: Number(i.price) || 0,
                    qty: Number(i.qty) || 1
                }));
                this.setState({ cart: data }); 
            } catch(e) {}
        }
        this.updateCartBadge();
    },

    updateCartBadge() {
        // Support both possible badge IDs
        const count = this.state.cart.reduce((sum, i) => sum + i.qty, 0);
        const badge = document.getElementById('cart-count') || document.getElementById('cart-badge');
        if (badge) {
            badge.textContent = count;
        }
        const taskbarBadge = document.getElementById('taskbar-cart-count');
        if (taskbarBadge) {
            taskbarBadge.textContent = count;
        }
    },

    getCartTotals() {
        const subtotal = this.state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const delivery = 0; // Testing: Delivery is free
        return {
            subtotal,
            delivery,
            total: subtotal + delivery
        };
    }
};

// Backward compatibility exports removed since we load globally

// Initialize on load
window.Store.loadCart();
