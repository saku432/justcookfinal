// ============================================================
// JustCook — Database Service (Supabase REST API & Realtime)
// ============================================================

(function () {
    const LS_PRODUCTS = "jc_products_test_1";
    // If running from VS Code Live Server (port 5500), use localhost:3000. 
    // Otherwise, use relative /api (works for unified Render.com deployment)
    const API_BASE_URL = window.location.port === '5500' ? "http://localhost:3000/api" : "/api";
    
    // Default products stay local for fast initial load
    // Testing: All prices set to 1 Rs
    const DEFAULT_PRODUCTS = [
        { id: "pp-mint", name: "Pani Puri - Mint (1kg)", category: "Pani Puri", price: 1, imageUrl: "images/pp-mint.jpg" },
        { id: "pp-garlic", name: "Pani Puri - Garlic (1kg)", category: "Pani Puri", price: 1, imageUrl: "images/pp-garlic.jpg" },
        { id: "pp-hajma", name: "Pani Puri - Hajma (1kg)", category: "Pani Puri", price: 1, imageUrl: "images/pp-hajma.jpg" },
        { id: "pp-jeera", name: "Pani Puri - Jeera (1kg)", category: "Pani Puri", price: 1, imageUrl: "images/pp-jeera.jpg" },
        { id: "pp-tamarind", name: "Pani Puri - Tamarind (1kg)", category: "Pani Puri", price: 1, imageUrl: "images/pp-tamarind.jpg" },
        { id: "fc-hot-spicy", name: "Fried Chicken - Hot & Spicy (1kg)", category: "Snacks", price: 1, imageUrl: "images/Extra Hot And Spicy.jpg.jpeg" },
        { id: "fc-cajun", name: "Fried Chicken - Cajun (1kg)", category: "Snacks", price: 1, imageUrl: "images/Cajun Breading Mix.jpg.jpeg" },
        { id: "waffle-mix", name: "Belgian Waffle Mix (1kg)", category: "Ready Mix", price: 1, imageUrl: "images/Waffles Mix.jpg.jpeg" }
    ];

    function ensureProducts() {
        const raw = localStorage.getItem(LS_PRODUCTS);
        if (!raw) {
            localStorage.setItem(LS_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
            return DEFAULT_PRODUCTS;
        }
        return JSON.parse(raw);
    }

    window.Database = {
        async getProducts() {
            return ensureProducts();
        },

        async getProductById(id) {
            const products = ensureProducts();
            return products.find(p => p.id === id) || null;
        },

        // ── Order Management (Backend API) ──────────────────────────
        async placeOrder(orderData) {
            try {
                const user = window.Store ? window.Store.getState().user : null;
                const payload = {
                    ...orderData,
                    userId: user ? user.uid : 'guest',
                    userEmail: user ? user.email : 'guest',
                };

                const response = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data; // { success: true, orderId: ... }
            } catch (error) {
                console.error("Order Error:", error);
                return { success: false, error: error.message };
            }
        },

        async getOrderById(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/orders/id/${id}`);
                if (!response.ok) throw new Error('Failed to fetch order');
                return await response.json();
            } catch (error) {
                console.error("Fetch Order by ID Error:", error);
                return null;
            }
        },

        async getMyOrders() {
            const user = window.Store ? window.Store.getState().user : null;
            if (!user) return [];

            try {
                const response = await fetch(`${API_BASE_URL}/orders/user/${user.uid}`);
                if (!response.ok) throw new Error('Failed to fetch orders');
                return await response.json();
            } catch (error) {
                console.error("Fetch Orders Error:", error);
                return [];
            }
        },

        async getOrdersByPhone(phone) {
            if (!phone) return [];
            try {
                const response = await fetch(`${API_BASE_URL}/orders/phone/${phone}`);
                if (!response.ok) throw new Error('Failed to fetch phone orders');
                return await response.json();
            } catch (error) {
                console.error("Fetch Phone Orders Error:", error);
                return [];
            }
        },

        async getAllOrders() {
            try {
                const response = await fetch(`${API_BASE_URL}/orders`);
                if (!response.ok) throw new Error('Failed to fetch all orders');
                return await response.json();
            } catch (error) {
                console.error("Fetch All Orders Error:", error);
                return [];
            }
        },

        // Realtime subscription using Supabase Channel
        subscribeToOrders(callback) {
            this.getAllOrders().then(callback);
            
            if (window.supabaseClient) {
                const channel = window.supabaseClient
                    .channel('public:orders')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'orders' },
                        (payload) => {
                            console.log('Realtime change received!', payload);
                            // To keep data mapped correctly via backend mapping format,
                            // we just refetch all orders when a change occurs. 
                            // (In a massive app, you'd patch the array manually).
                            this.getAllOrders().then(callback);
                        }
                    )
                    .subscribe();

                // Return unsubscribe fn
                return () => {
                    window.supabaseClient.removeChannel(channel);
                };
            } else {
                console.warn("Supabase Realtime not connected. Falling back to polling.");
                const interval = setInterval(async () => {
                    const orders = await this.getAllOrders();
                    callback(orders);
                }, 5000);
                return () => clearInterval(interval);
            }
        },

        // Realtime subscription for a single order (for Tracker page)
        subscribeToSingleOrder(orderId, callback) {
            this.getOrderById(orderId).then(callback);

            if (window.supabaseClient) {
                const channel = window.supabaseClient
                    .channel(`public:orders:id=${orderId}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_id=eq.${orderId}` },
                        (payload) => {
                            console.log('Realtime single order change!', payload);
                            this.getOrderById(orderId).then(callback);
                        }
                    )
                    .subscribe();

                return () => {
                    window.supabaseClient.removeChannel(channel);
                };
            } else {
                const interval = setInterval(async () => {
                    const order = await this.getOrderById(orderId);
                    callback(order);
                }, 5000);
                return () => clearInterval(interval);
            }
        },

        async updateOrderStatus(docId, status) {
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${docId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                return await response.json();
            } catch (error) {
                console.error("Update Status Error:", error);
                return { success: false };
            }
        }
    };
})();
