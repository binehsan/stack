// Ported from frontend/src/auth/jwt.js — decodes the access token's
// `user_id` claim client-side (no verification needed, we're just reading
// our own token to label a value, the backend is the actual authority).
export function decodeJwtUserId(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(decodeURIComponent(escape(json)));
    return data.user_id ?? null;
  } catch {
    return null;
  }
}
