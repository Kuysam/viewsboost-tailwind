// src/lib/youtube/apiKeyManager.ts

// --- Array of all API keys (rotate for quota) ---
export const apiKeys = [
  'AIzaSyBdr4M5QyT9Lcg67LjSbwlWWGklGmER_u8',
  'AIzaSyA7RGJh_JiiBPCwPFd4M7GLxyka10P4jTk',
  'AIzaSyCcOAQhmSYFGx26Pk3-7MQ5S9xGHnCd3Z8',
  'AIzaSyCIQdRtOB93WvHN0uBND8N63n9yfj9vAcM',
];

let keyIndex = 0; // Start from the first key
const keyErrors: Record<number, number> = {}; // Track failures per key

// --- Get the next API key (rotate & avoid bad keys) ---
export function getAPIKey(): string {
  for (let i = 0; i < apiKeys.length; i++) {
    const idx = (keyIndex + i) % apiKeys.length;
    // If key isn't marked as bad, or hasn't failed 3x recently, use it
    if (!keyErrors[idx] || keyErrors[idx] < 3) {
      keyIndex = idx;
      return apiKeys[idx];
    }
  }
  // If all are failing, just rotate (yikes!)
  keyIndex = (keyIndex + 1) % apiKeys.length;
  return apiKeys[keyIndex];
}

// --- When an API key fails (like quota exceeded), mark it "bad" for 5 min ---
export function reportApiKeyError(key: string) {
  const idx = apiKeys.indexOf(key);
  if (idx !== -1) {
    keyErrors[idx] = (keyErrors[idx] || 0) + 1;
    // Reset after 5 mins, so it can be tried again later
    setTimeout(() => { keyErrors[idx] = 0; }, 5 * 60 * 1000);
  }
}

// --- Helper: get the full list of API keys (for admin panel, stats, etc) ---
export function getApiKeyList(): string[] {
  return [...apiKeys];
}
