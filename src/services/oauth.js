// OAuth 2.0 Authorization Code + PKCE flow for SugboClean admin login.
// Public client: the PKCE code_verifier replaces the client secret, so nothing
// in this file is sensitive. Token exchange hits ServiceNow directly — no
// backend proxy is required.

import { OAUTH } from '../utils/constants';

const STORAGE = {
  verifier: 'sc_pkce_verifier',
  state: 'sc_pkce_state',
  returnTo: 'sc_pkce_return_to',
};

// ============ PKCE helpers ============

function base64UrlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomBytes(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
}

function generateVerifier() {
  return base64UrlEncode(randomBytes(32));
}

async function deriveChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return base64UrlEncode(new Uint8Array(hash));
}

// ============ Start flow ============

export async function beginOAuthLogin(returnTo = '/admin/dashboard') {
  const verifier = generateVerifier();
  const challenge = await deriveChallenge(verifier);
  const state = base64UrlEncode(randomBytes(16));

  sessionStorage.setItem(STORAGE.verifier, verifier);
  sessionStorage.setItem(STORAGE.state, state);
  sessionStorage.setItem(STORAGE.returnTo, returnTo);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH.clientId,
    redirect_uri: OAUTH.redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  window.location.assign(`${OAUTH.authorizeUrl}?${params.toString()}`);
}

export function consumeReturnTo() {
  const v = sessionStorage.getItem(STORAGE.returnTo) || '/admin/dashboard';
  sessionStorage.removeItem(STORAGE.returnTo);
  return v;
}

// ============ Complete flow ============

export async function completeOAuthLogin({ code, state }) {
  const savedState = sessionStorage.getItem(STORAGE.state);
  const verifier = sessionStorage.getItem(STORAGE.verifier);
  sessionStorage.removeItem(STORAGE.state);
  sessionStorage.removeItem(STORAGE.verifier);

  if (!savedState || savedState !== state) {
    throw new Error('OAuth state mismatch. Please try logging in again.');
  }
  if (!verifier) {
    throw new Error('Missing PKCE verifier. Please try logging in again.');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: OAUTH.clientId,
    redirect_uri: OAUTH.redirectUri,
    code_verifier: verifier,
  });

  const res = await fetch(OAUTH.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Token exchange failed (${res.status}) ${detail || res.statusText}`.trim());
  }
  return normalizeTokenResponse(await res.json());
}

// ============ Refresh ============

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAUTH.clientId,
  });

  const res = await fetch(OAUTH.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token refresh failed (${res.status})`);
  return normalizeTokenResponse(await res.json());
}

function normalizeTokenResponse(json) {
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + (Number(json.expires_in || 0) * 1000),
    tokenType: json.token_type || 'Bearer',
  };
}
