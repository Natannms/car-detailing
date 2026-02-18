export function decodeJwtPayload(token: string): unknown | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  try {
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(padded, "base64").toString("utf8")
        : new TextDecoder().decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0)));
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}
