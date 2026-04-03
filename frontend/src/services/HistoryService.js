const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchHistoryEvents() {
  const response = await fetch(`${API_BASE}/history/events`);
  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch history");
  }

  return Array.isArray(data) ? data : [];
}

export async function createHistoryEvent(payload) {
  const response = await fetch(`${API_BASE}/history/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to save history event");
  }

  return data;
}
