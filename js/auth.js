// js/auth.js
import { supabase, isConfigured } from './supabase.js';

/**
 * Check if the owner/admin is currently authenticated.
 * Returns true if authenticated, false otherwise.
 */
export async function checkAuth() {
  if (isConfigured && supabase) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!session;
    } catch (err) {
      console.error("Auth check failed, checking offline session:", err);
      return checkOfflineAuth();
    }
  } else {
    return checkOfflineAuth();
  }
}

function checkOfflineAuth() {
  return sessionStorage.getItem('sketchbook_mock_auth') === 'true';
}

/**
 * Log in the owner with email and password
 */
export async function signIn(email, password) {
  if (isConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data.user;
  } else {
    // Offline authentication fallback
    // Accept simple admin@example.com / password credentials for testing
    if (email === 'admin@example.com' && password === 'password') {
      sessionStorage.setItem('sketchbook_mock_auth', 'true');
      return { email: 'admin@example.com', mock: true };
    } else {
      throw new Error("Invalid credentials. Use admin@example.com and 'password' in offline mode.");
    }
  }
}

/**
 * Log out the owner/admin
 */
export async function signOut() {
  if (isConfigured && supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out from Supabase:", error);
  }

  sessionStorage.removeItem('sketchbook_mock_auth');
}

/**
 * Enforce auth route guard.
 * Redirects to login.html if not authenticated.
 */
export async function enforceAuth() {
  const isAuth = await checkAuth();
  if (!isAuth) {
    window.location.href = 'login.html';
  }
}

/**
 * Enforce guest route guard (e.g. for login page).
 * Redirects to admin.html if already logged in.
 */
export async function enforceGuest() {
  const isAuth = await checkAuth();
  if (isAuth) {
    window.location.href = 'admin.html';
  }
}
