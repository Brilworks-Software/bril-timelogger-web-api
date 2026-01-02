import axios from 'axios';
import { loadingManager } from '../utils/loadingManager';

// Delay function to add minimum delay to requests
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const api = axios.create({
  baseURL: '/api', // Next.js API routes
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  },
  withCredentials: true // Include cookies for authentication
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Start loading
    loadingManager.startRequest();

    // Add delay before making the request
    const delayMs = loadingManager.getDelay();
    await delay(delayMs);

    // Token is now in httpOnly cookie, but we can still check localStorage for client-side token if needed
    // The cookie will be sent automatically with withCredentials: true
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure token is properly formatted
        const cleanToken = token.replace(/^"|"$/g, ''); // Remove any quotes
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => {
    // End loading on request error
    loadingManager.endRequest();
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // End loading on successful response
    loadingManager.endRequest();
    return response;
  },
  (error) => {
    // End loading on error response
    loadingManager.endRequest();

    if (error.response?.status === 401) {
      // Handle unauthorized access (token expired or invalid)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Use window.location for a full page reload to clear any stale state
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Handle forbidden access (insufficient permissions)
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
    return Promise.reject(error);
  }
);

export default api; 