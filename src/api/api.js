const BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_BASE_URL || "";

async function request(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const err = new Error(payload.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

async function requestBlob(method, path, { body, token } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const err = new Error(payload.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const filename = (res.headers.get("content-disposition") || "")
    .match(/filename="?([^"]+)"?/)?.[1] || "document.docx";
  const blob = await res.blob();
  return { blob, filename };
}

export const api = {
  /** POST /api/v1/auth/login */
  login: (username, password) =>
    request("POST", "/api/v1/auth/login", { body: { username, password } }),

  /** POST /api/v1/auth/refresh */
  refresh: (refresh_token) =>
    request("POST", "/api/v1/auth/refresh", { body: { refresh_token } }),

  /** POST /api/v1/auth/logout */
  logout: (access_token, refresh_token) =>
    request("POST", "/api/v1/auth/logout", {
      body: { refresh_token },
      token: access_token,
    }),

  /** POST /api/v1/workspace/search — создать workspace и получить результаты */
  workspaceSearch: (params, token) =>
    request("POST", "/api/v1/workspace/search", { body: params, token }),

  /** POST /api/v1/workspace/:id/nmck — пересчитать НМЦК с корректировками */
  workspaceNmck: (id, body, token) =>
    request("POST", `/api/v1/workspace/${id}/nmck`, { body, token }),

  /** GET /api/v1/workspace/:id — восстановить состояние */
  workspaceGet: (id, token) =>
    request("GET", `/api/v1/workspace/${id}`, { token }),

  /** DELETE /api/v1/workspace/:id — закрыть workspace */
  workspaceDelete: (id, token) =>
    request("DELETE", `/api/v1/workspace/${id}`, { token }),

  /** GET /api/v1/ste/:ste_id */
  ste: (ste_id, access_token) =>
    request("GET", `/api/v1/ste/${ste_id}`, { token: access_token }),

  /** GET /api/v1/contracts/:ste_id */
  contracts: (ste_id, access_token) =>
    request("GET", `/api/v1/contracts/${ste_id}`, { token: access_token }),

  /** GET /api/v1/cart — список позиций */
  cartList: (token) =>
    request("GET", "/api/v1/cart", { token }),

  /** POST /api/v1/cart — добавить позицию */
  cartAdd: (body, token) =>
    request("POST", "/api/v1/cart", { body, token }),

  /** PATCH /api/v1/cart/:id — обновить поля позиции */
  cartPatch: (id, body, token) =>
    request("PATCH", `/api/v1/cart/${id}`, { body, token }),

  /** POST /api/v1/cart/:id/nmck — обновить НМЦК позиции */
  cartUpdateNmck: (id, body, token) =>
    request("POST", `/api/v1/cart/${id}/nmck`, { body, token }),

  /** GET /api/v1/cart/:id/justification */
  cartJustification: (id, token, registryNumber) =>
    request("GET", `/api/v1/cart/${id}/justification${registryNumber ? `?registry_number=${encodeURIComponent(registryNumber)}` : ''}`, { token }),

  /** DELETE /api/v1/cart/:id */
  cartDelete: (id, token) =>
    request("DELETE", `/api/v1/cart/${id}`, { token }),

  /** POST /api/v1/report/cart → .docx */
  reportCart: (token) =>
    requestBlob("POST", "/api/v1/report/cart", { token }),

  /** POST /api/v1/report/single → .docx */
  reportSingle: (body, token) =>
    requestBlob("POST", "/api/v1/report/single", { body, token }),

  /** GET /api/v1/report/history */
  reportHistory: (token) =>
    request("GET", "/api/v1/report/history", { token }),

  /** GET /api/v1/report/history/:id → .docx */
  reportHistoryGet: (id, token) =>
    requestBlob("GET", `/api/v1/report/history/${id}`, { token }),

  /** DELETE /api/v1/report/history/:id */
  reportHistoryDelete: (id, token) =>
    request("DELETE", `/api/v1/report/history/${id}`, { token }),
};
