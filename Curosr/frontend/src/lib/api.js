const API_BASE = '';

function getToken() {
  return localStorage.getItem('police_token');
}

async function request(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  auth: {
    login: (username, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request('/api/auth/me'),
  },
  items: {
    publicList: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/items/public${qs ? `?${qs}` : ''}`);
    },
    publicGet: (id) => request(`/api/items/public/${id}`),
    list: (params) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/api/items${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/api/items/${id}`),
    create: (data) =>
      request('/api/items', { method: 'POST', body: JSON.stringify(data) }),
    markReturned: (id, returnedTo) =>
      request(`/api/items/${id}/return`, {
        method: 'PATCH',
        body: JSON.stringify({ returnedTo }),
      }),
    hqs: () => request('/api/items/meta/hqs'),
  },
  claims: {
    submit: (itemId, formData) =>
      request(`/api/claims/${itemId}`, { method: 'POST', body: formData }),
    count: (itemId, identifierType, identifierValue) =>
      request(
        `/api/claims/item/${itemId}/count?identifierType=${identifierType}&identifierValue=${encodeURIComponent(identifierValue)}`,
      ),
    pending: () => request('/api/claims/pending'),
    accept: (id) => request(`/api/claims/${id}/accept`, { method: 'PATCH' }),
    reject: (id) => request(`/api/claims/${id}/reject`, { method: 'PATCH' }),
  },
};

export function setPoliceSession(token, police) {
  localStorage.setItem('police_token', token);
  localStorage.setItem('police_user', JSON.stringify(police));
}

export function clearPoliceSession() {
  localStorage.removeItem('police_token');
  localStorage.removeItem('police_user');
}

export function getPoliceUser() {
  const raw = localStorage.getItem('police_user');
  return raw ? JSON.parse(raw) : null;
}
