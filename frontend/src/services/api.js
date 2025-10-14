import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Overlay CRUD operations
export const overlayAPI = {
  // Create a new overlay
  create: async (overlayData) => {
    const response = await api.post('/overlays', overlayData);
    return response.data;
  },

  // Get all overlays
  getAll: async () => {
    const response = await api.get('/overlays');
    return response.data;
  },

  // Get a single overlay by ID
  getById: async (id) => {
    const response = await api.get(`/overlays/${id}`);
    return response.data;
  },

  // Update an overlay
  update: async (id, overlayData) => {
    const response = await api.put(`/overlays/${id}`, overlayData);
    return response.data;
  },

  // Delete an overlay
  delete: async (id) => {
    const response = await api.delete(`/overlays/${id}`);
    return response.data;
  },
};

// RTSP Settings operations
export const settingsAPI = {
  // Get RTSP settings
  getRTSP: async () => {
    const response = await api.get('/settings/rtsp');
    return response.data;
  },

  // Save RTSP URL
  saveRTSP: async (rtspUrl) => {
    const response = await api.post('/settings/rtsp', { rtspUrl });
    return response.data;
  },
};

export default api;