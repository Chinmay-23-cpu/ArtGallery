// js/supabase.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let supabase = null;
const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (isConfigured) {
  if (window.supabase) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase client initialized successfully.");
    } catch (error) {
      console.error("Error creating Supabase client:", error);
    }
  } else {
    console.error("Supabase CDN script failed to load. Check index.html CDN script tag.");
  }
} else {
  console.log("Supabase credentials not configured in js/config.js. Running in local mock mode.");
}

export { supabase, isConfigured };
