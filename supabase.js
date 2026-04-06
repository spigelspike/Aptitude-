// Supabase Configuration
// Updated with your actual Supabase project details
const SUPABASE_URL = 'https://usuaejehxkcfxuzlrnxo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_048PDpN-h8-iU5c2Vc1l8A_hm3mVJzA';

// Initialize the Supabase client
// Note: Ensure the Supabase JS SDK is included in your HTML before this script
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export the client for use in other scripts
window.supabaseClient = supabaseClient;
