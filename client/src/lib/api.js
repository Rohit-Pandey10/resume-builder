const API_BASE = '/api';

async function fetchJson(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    me: () => fetchJson('/auth/me'),
    google: (credential) =>
      fetchJson('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }),
    logout: () =>
      fetchJson('/auth/logout', {
        method: 'POST',
      }),
  },
  resumes: {
    list: () => fetchJson('/resumes'),
    get: (id) => fetchJson(`/resumes/${id}`),
    create: (payload) =>
      fetchJson('/resumes', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id, payload) =>
      fetchJson(`/resumes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: (id) =>
      fetchJson(`/resumes/${id}`, {
        method: 'DELETE',
      }),
  },
};
