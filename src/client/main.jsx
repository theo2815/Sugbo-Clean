import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

// OAuth redirect_uri is registered against `localhost` — opening the app on
// `[::1]` or `127.0.0.1` creates a different origin, so sessionStorage (where
// the PKCE state lives) isn't visible to the callback and login fails with a
// state-mismatch error. Canonicalize to localhost before anything else runs.
(function enforceCanonicalDevHost() {
    const { hostname, protocol, port, pathname, search, hash } = window.location;
    const stray = ['[::1]', '::1', '127.0.0.1'];
    if (!stray.includes(hostname)) return;
    const nextPort = port ? `:${port}` : '';
    window.location.replace(`${protocol}//localhost${nextPort}${pathname}${search}${hash}`);
})();

// ServiceNow OAuth redirects to the registered redirect_uri with ?code=&state=
// (or ?error=) in the query string — but HashRouter only matches routes after
// `#`. Detect the OAuth response on any path and forward the params into the
// hash callback route so the flow works regardless of the registered URI or
// the static server's SPA fallback behavior.
(function hoistOAuthRedirect() {
    const params = new URLSearchParams(window.location.search);
    const looksLikeOAuth =
        (params.has('code') && params.has('state')) || params.has('error');
    if (!looksLikeOAuth) return;
    const qs = window.location.search;
    window.history.replaceState({}, '', `${window.location.origin}/#/admin/oauth/callback${qs}`);
})();

const rootElement = document.getElementById('root')
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
}
