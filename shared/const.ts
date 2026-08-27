export const COOKIE_NAME = "app_session_id";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// The __Host- prefix makes this a host-only, secure cookie. It cannot be set
// by sibling subdomains and is only used once to bind the OAuth round trip.
export const OAUTH_STATE_COOKIE = "__Host-oauth_state";

export type OAuthState = { redirectUri: string; nonce: string };

export const encodeOAuthState = (state: OAuthState): string =>
  btoa(JSON.stringify(state));

export const decodeOAuthState = (state: string): OAuthState => {
  try {
    const decoded = atob(state);
    const parsed: unknown = JSON.parse(decoded);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as OAuthState).redirectUri === "string" &&
      typeof (parsed as OAuthState).nonce === "string"
    ) {
      return parsed as OAuthState;
    }
  } catch {
    // Invalid data is intentionally treated as an empty OAuth state. The
    // callback rejects it without exposing parser details to the requester.
  }
  return { redirectUri: "", nonce: "" };
};
