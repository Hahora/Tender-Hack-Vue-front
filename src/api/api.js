/**
 * HTTP-клиент для работы с бэкендом.
 * BASE_URL берётся из переменной окружения VITE_API_BASE_URL (.env).
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    const err = new Error(payload.detail || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }

  return res.json()
}

export const api = {
  /** POST /api/v1/auth/login */
  login: (username, password) =>
    request('POST', '/api/v1/auth/login', { body: { username, password } }),

  /** POST /api/v1/auth/refresh */
  refresh: (refresh_token) =>
    request('POST', '/api/v1/auth/refresh', { body: { refresh_token } }),

  /** POST /api/v1/auth/logout */
  logout: (access_token, refresh_token) =>
    request('POST', '/api/v1/auth/logout', { body: { refresh_token }, token: access_token }),

  /** POST /api/v1/search */
  search: (params, access_token) =>
    request('POST', '/api/v1/search', { body: params, token: access_token }),

  /** GET /api/v1/contracts/:ste_id */
  contracts: (ste_id, access_token) =>
    request('GET', `/api/v1/contracts/${ste_id}`, { token: access_token }),
}
