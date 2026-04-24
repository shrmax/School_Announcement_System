import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for easier error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const message = error.response?.data?.error || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);
