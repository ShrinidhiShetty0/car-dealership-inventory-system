const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getToken() {
  return localStorage.getItem('accessToken') || '';
}

export function setAuth(token, username, role) {
  localStorage.setItem('accessToken', token);
  localStorage.setItem('username', username);
  localStorage.setItem('role', role);
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
}

export function getStoredUser() {
  const token = getToken();
  if (!token) return null;
  return {
    token,
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || 'user',
  };
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? data.detail || `HTTP ${response.status}`
        : data || `HTTP ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}

// Auth
export const register = (payload) =>
  request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });

export const login = (payload) =>
  request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });

// Vehicles
export const listVehicles = () => request('/api/vehicles');

export const searchVehicles = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  return request(`/api/vehicles/search${qs ? `?${qs}` : ''}`);
};

export const addVehicle = (payload) =>
  request('/api/vehicles', { method: 'POST', body: JSON.stringify(payload) });

export const updateVehicle = (id, payload) =>
  request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteVehicle = (id) =>
  request(`/api/vehicles/${id}`, { method: 'DELETE' });

export const purchaseVehicle = (id) =>
  request(`/api/vehicles/${id}/purchase`, { method: 'POST' });

export const restockVehicle = (id, quantity) =>
  request(`/api/vehicles/${id}/restock?quantity=${quantity}`, { method: 'POST' });
