import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'

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
