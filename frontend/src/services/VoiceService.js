const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function buildApiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

export async function reconstructVoiceMessage(text) {
  const response = await fetch(buildApiUrl("/api/reconstruct-message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to reconstruct voice message");
  }

  return String(payload?.reconstructed || "").trim();
}

export async function transcribeVoiceAudio(audioBase64, mimeType = "audio/webm", fileName = "voice.webm") {
  const response = await fetch(buildApiUrl("/api/transcribe-audio"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, fileName }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to transcribe audio");
  }

  return String(payload?.transcript || "").trim();
}

export async function synthesizeSpeech(text) {
  const response = await fetch(buildApiUrl("/api/text-to-speech"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to synthesize speech");
  }

  return {
    audioBase64: String(payload?.audioBase64 || ""),
    audioMimeType: String(payload?.audioMimeType || "audio/mpeg"),
  };
}

export async function findNearbyFromVoice(command, lat, lng) {
  const response = await fetch(buildApiUrl("/api/find-nearby"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, lat, lng }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to find nearby places");
  }

  return {
    placeType: payload?.placeType || "",
    places: Array.isArray(payload?.places) ? payload.places : [],
  };
}

export async function createBriefVoiceLine(text, mode = "broadcast", extras = {}) {
  const response = await fetch(buildApiUrl("/api/brief-message"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, ...extras }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Failed to create brief voice line");
  }

  return String(payload?.message || "").trim();
}
