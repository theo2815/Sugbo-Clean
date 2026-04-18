import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { consumeReturnTo } from '../../services/oauth';
import { COLORS } from '../../utils/constants';
import Card from '../../client/components/shared/Card';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAdmin, completeLogin } = useAuth();
    const [error, setError] = useState('');
    // StrictMode double-invokes effects in dev; auth codes are single-use.
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        // Re-entry cases (browser back, manual nav, reload): the auth code has
        // already been consumed and the PKCE state removed. Don't re-exchange —
        // just route based on current auth state.
        if (isAdmin) {
            navigate(consumeReturnTo(), { replace: true });
            return;
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errParam = searchParams.get('error');

        if (errParam) {
            setError(searchParams.get('error_description') || errParam);
            return;
        }
        if (!code || !state) {
            setError('Missing authorization code. Please restart the login flow.');
            return;
        }

        (async () => {
            try {
                await completeLogin({ code, state });
                navigate(consumeReturnTo(), { replace: true });
            } catch (e) {
                setError(e.message || 'Login failed.');
            }
        })();
    }, [searchParams, navigate, completeLogin, isAdmin]);

    return (
        <section style={{ padding: '60px 20px', maxWidth: 420, margin: '0 auto' }}>
            <Card>
                {error ? (
                    <div role="alert" style={{ padding: 16 }}>
                        <h3 style={{ margin: '0 0 8px', color: COLORS.error }}>Login failed</h3>
                        <p style={{ margin: '0 0 16px', color: COLORS.text.secondary }}>{error}</p>
                        <button
                            onClick={() => navigate('/admin/login', { replace: true })}
                            style={{
                                color: COLORS.secondary,
                                textDecoration: 'underline',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                font: 'inherit',
                            }}
                        >
                            Back to login
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: COLORS.text.secondary }}>
                        <h3 style={{ margin: '0 0 8px', color: COLORS.secondary }}>Signing you in…</h3>
                        <p style={{ margin: 0 }}>Completing the ServiceNow login.</p>
                    </div>
                )}
            </Card>
        </section>
    );
}
