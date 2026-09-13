// Centralized API configuration
// Automatically connects to your live Render backend in production, or localhost if specified.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dsa-com.onrender.com';

export default API_BASE_URL;
