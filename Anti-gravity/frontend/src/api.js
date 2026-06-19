const API_BASE_URL = 'http://localhost:3001/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const api = {
  // Authentication
  login: async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(res);
    // Store in localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // HQs
  getHQs: async () => {
    const res = await fetch(`${API_BASE_URL}/hqs`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Items
  getItems: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.holdingLocationId) queryParams.append('holdingLocationId', filters.holdingLocationId);
    if (filters.color) queryParams.append('color', filters.color);

    const url = `${API_BASE_URL}/items?${queryParams.toString()}`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getItem: async (id) => {
    const res = await fetch(`${API_BASE_URL}/items/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  addItem: async (itemData) => {
    const res = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(itemData),
    });
    return handleResponse(res);
  },

  returnItem: async (id, returnData) => {
    const res = await fetch(`${API_BASE_URL}/items/${id}/return`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(returnData),
    });
    return handleResponse(res);
  },

  // Claims
  submitClaim: async (itemId, emailOrCnic, contactInfo, proofFile) => {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('emailOrCnic', emailOrCnic);
    formData.append('contactInfo', contactInfo);
    formData.append('proofDocument', proofFile);

    const res = await fetch(`${API_BASE_URL}/claims`, {
      method: 'POST',
      headers: getHeaders(true), // Content-Type is set automatically by fetch for FormData
      body: formData,
    });
    return handleResponse(res);
  },

  getClaims: async () => {
    const res = await fetch(`${API_BASE_URL}/claims`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  acceptClaim: async (id) => {
    const res = await fetch(`${API_BASE_URL}/claims/${id}/accept`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  rejectClaim: async (id) => {
    const res = await fetch(`${API_BASE_URL}/claims/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
