const API_BASE = "http://localhost:3001/api";

function getToken() {
  return localStorage.getItem("policeToken");
}

async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // ---------- Public ----------
  async getHQs() {
    const res = await fetch(`${API_BASE}/hqs`);
    return handleResponse(res);
  },

  async getItems(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) params.set(key, value);
    });
    const res = await fetch(`${API_BASE}/items?${params.toString()}`);
    return handleResponse(res);
  },

  async getItem(id) {
    const res = await fetch(`${API_BASE}/items/${id}`);
    return handleResponse(res);
  },

  async checkClaimLimit({ itemId, identityType, identityValue }) {
    const params = new URLSearchParams({ itemId, identityType, identityValue });
    const res = await fetch(`${API_BASE}/claims/check?${params.toString()}`);
    return handleResponse(res);
  },

  async submitClaim(formData) {
    const res = await fetch(`${API_BASE}/claims`, {
      method: "POST",
      body: formData, // FormData — browser sets multipart boundary automatically
    });
    return handleResponse(res);
  },

  // ---------- Police auth ----------
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  // ---------- Police (authenticated) ----------
  async getPoliceItems(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) params.set(key, value);
    });
    const res = await fetch(`${API_BASE}/items/police/all?${params.toString()}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },

  async getPoliceItem(id) {
    const res = await fetch(`${API_BASE}/items/police/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },

  async createItem(payload) {
    const res = await fetch(`${API_BASE}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async markReturned(itemId, payload) {
    const res = await fetch(`${API_BASE}/items/${itemId}/return`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getClaimsForItem(itemId) {
    const res = await fetch(`${API_BASE}/claims/police/item/${itemId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(res);
  },

  async decideClaim(claimId, decision) {
    const res = await fetch(`${API_BASE}/claims/${claimId}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ decision }),
    });
    return handleResponse(res);
  },

  claimDocumentUrl(claimId) {
    return `${API_BASE}/uploads/claim/${claimId}`;
  },

  async fetchClaimDocumentBlob(claimId) {
    const res = await fetch(`${API_BASE}/uploads/claim/${claimId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Could not load document.");
    return res.blob();
  },
};
