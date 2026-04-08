const BASE_URL = 'http://localhost:5008/api';

// Core fetch function
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const get  = (path) => request(path, { method: 'GET' });
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put  = (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body) });
const del  = (path) => request(path, { method: 'DELETE' });

// Terminals
export const terminalsApi = {
  getAll: () => get('/terminals'),
};

export default { terminalsApi };