// In dev, Vite's proxy (see vite.config.js) forwards /api to the Django
// backend on localhost:8000, so relative paths just work. In production,
// set VITE_API_BASE_URL to the deployed backend's full URL (e.g.
// https://api.yourdomain.com/api) at build time.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
