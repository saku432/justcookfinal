// ============================================================
// JustCook — Global Config (Supabase Frontend)
// ============================================================

window.SUPABASE_URL = 'https://ezijiprjhitjyvufwfjz.supabase.co';
// TODO: Replace with your actual anon key from Supabase Dashboard -> Settings -> API
window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

if (window.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} else {
    console.error("⚠️ SUPABASE_ANON_KEY is missing! Realtime and Login will not work until you add it in js/config.js");
}
