import axios from 'axios';

// Dynamically detect backend URL: Prioritize explicit environment variable, then fallback to local LAN/localhost
const getBaseUrls = () => {
  const envApi = import.meta.env.VITE_API_BASE_URL;
  const envBackend = import.meta.env.VITE_BACKEND_URL;

  if (envApi) {
    const cleanApi = envApi.replace(/\/+$/, '');
    const apiUrl = cleanApi.endsWith('/api/v1') ? cleanApi : `${cleanApi}/api/v1`;
    const backendUrl = envBackend ? envBackend.replace(/\/+$/, '') : cleanApi.replace(/\/api\/v1$/, '');
    return { apiUrl, backendUrl };
  }

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    // When accessing from a LAN IP in local dev (e.g., 192.168.x.x)
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('vercel.app')) {
      return {
        apiUrl: `http://${host}:8000/api/v1`,
        backendUrl: `http://${host}:8000`,
      };
    }
  }

  return {
    apiUrl: 'http://127.0.0.1:8000/api/v1',
    backendUrl: 'http://127.0.0.1:8000',
  };
};

export const { apiUrl: API_BASE_URL, backendUrl: BACKEND_BASE_URL } = getBaseUrls();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request Interceptor: Attach JWT token if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('food_quality_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Catch 401 Unauthorized and notify app
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired / invalid token
      localStorage.removeItem('food_quality_token');
      localStorage.removeItem('food_quality_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

// --- Authentication Endpoints ---

export const registerUser = async ({ name, email, password }) => {
  const response = await apiClient.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginUser = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const updateCurrentUser = async ({ name }) => {
  const response = await apiClient.put('/auth/me', { name });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async ({ token, new_password }) => {
  const response = await apiClient.post('/auth/reset-password', { token, new_password });
  return response.data;
};

// --- Core Food Quality Assessment Endpoints ---

export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const predictFoodQuality = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Do not set manual Content-Type header so the browser/Axios attaches the correct multipart boundary
  const response = await apiClient.post('/predict', formData);
  return response.data;
};

export const getPredictionHistory = async (params = {}) => {
  const response = await apiClient.get('/history', { params });
  return response.data;
};

export const getPredictionDetail = async (id) => {
  const response = await apiClient.get(`/history/${id}`);
  return response.data;
};

export const updatePredictionNotes = async (id, notes) => {
  const response = await apiClient.patch(`/history/${id}`, { notes });
  return response.data;
};

export const deletePrediction = async (id) => {
  const response = await apiClient.delete(`/history/${id}`);
  return response.data;
};

export const clearAllHistory = async () => {
  const response = await apiClient.delete('/history');
  return response.data;
};

export const getAnalytics = async () => {
  const response = await apiClient.get('/analytics');
  return response.data;
};

export const getModels = async () => {
  const response = await apiClient.get('/models');
  return response.data;
};

export const switchModel = async (modelName) => {
  const response = await apiClient.post('/models/switch', { model_name: modelName });
  return response.data;
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_BASE_URL}${imagePath}`;
};

export default apiClient;
