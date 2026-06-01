// ============================================================
// JustCook — Supabase Authentication Service
// ============================================================

(function () {
    const Store = window.Store;

    window.Auth = {
        async init() {
            if (!window.supabaseClient) return;

            // Listen for auth changes
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session && session.user) {
                    const sbUser = session.user;
                    const userData = {
                        uid: sbUser.id,
                        email: sbUser.email,
                        name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
                        role: sbUser.email === 'admin@justcook.com' ? 'admin' : 'customer' // Optional admin override
                    };
                    Store.setUser(userData);
                    localStorage.setItem('jc_active_user', JSON.stringify(userData));
                } else {
                    Store.setUser(null);
                    localStorage.removeItem('jc_active_user');
                }
            });

            // Initial check
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                const sbUser = session.user;
                const userData = {
                    uid: sbUser.id,
                    email: sbUser.email,
                    name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
                    role: sbUser.email === 'admin@justcook.com' ? 'admin' : 'customer'
                };
                Store.setUser(userData);
                localStorage.setItem('jc_active_user', JSON.stringify(userData));
            }
        },

        async login(email, password) {
            if (!window.supabaseClient) return { success: false, error: "Supabase not configured" };
            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (window.showToast) window.showToast("Successfully logged in!");
                return { success: true, user: data.user };
            } catch (error) {
                console.error("Login Error:", error);
                return { success: false, error: error.message };
            }
        },

        async signup(email, password, name) {
            if (!window.supabaseClient) return { success: false, error: "Supabase not configured" };
            try {
                const { data, error } = await window.supabaseClient.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } }
                });
                if (error) throw error;
                if (window.showToast) window.showToast("Account created successfully!");
                return { success: true, user: data.user };
            } catch (error) {
                console.error("Signup Error:", error);
                return { success: false, error: error.message };
            }
        },

        async loginWithGoogle() {
            if (!window.supabaseClient) {
                if (window.showToast) window.showToast("Supabase not configured. Check config.js", "error");
                return;
            }
            try {
                const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + window.location.pathname
                    }
                });
                if (error) throw error;
            } catch (error) {
                console.error("Google Auth Error:", error);
                if (window.showToast) window.showToast(error.message, "error");
            }
        },

        async logout() {
            if (!window.supabaseClient) return;
            try {
                const { error } = await window.supabaseClient.auth.signOut();
                if (error) throw error;
                window.location.hash = '#/login';
                if (window.showToast) window.showToast("Signed out successfully.");
            } catch (error) {
                console.error("Logout Error:", error);
            }
        },

        // Helper to get current user ID synchronously (from Store)
        getUid() {
            const user = Store.getState().user;
            return user ? user.uid : null;
        }
    };

    // Initialize
    window.Auth.init();
})();
