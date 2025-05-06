/**
 * Application Configuration
 */

const config = {
  // Server base URL - use environment variable or fallback to localhost
  serverBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};

export default config; 