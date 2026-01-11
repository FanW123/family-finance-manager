import axios from 'axios';
import { supabase } from './lib/supabase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[API Client] Error getting session:', error);
      // Don't add auth header if session error
      return config;
    }
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.warn('[API Client] No access token in session - user may not be logged in');
    }
  } catch (error) {
    console.error('[API Client] Exception getting session:', error);
  }
  return config;
});

// Handle 401 errors (unauthorized) - redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('[API Client] 401 Unauthorized - user needs to login');
      // Clear any stale session
      await supabase.auth.signOut();
      // Redirect to login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

