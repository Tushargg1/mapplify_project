const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function postJson(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  let rawText = "";
  try {
    rawText = await res.text();
    data = rawText ? JSON.parse(rawText) : null;
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      (rawText && rawText.trim()) ||
      `Request failed (${res.status})`;

    const error = new Error(message);
    error.status = res.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export function registerUser(payload) {
  return postJson("/auth/register", payload);
}

export function loginUser(payload) {
  return postJson("/auth/login", payload);
}
