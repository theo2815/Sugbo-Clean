import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COLORS, DEV_USE_BASIC_AUTH } from '../../utils/constants';
import Input from '../../client/components/shared/Input';
import Button from '../../client/components/shared/Button';
import Card from '../../client/components/shared/Card';

export default function LoginPage() {
    const { isAdmin, startLogin, loginBasic } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [flash, setFlash] = useState(() => {
        const m = sessionStorage.getItem('sc_flash');
        if (m) sessionStorage.removeItem('sc_flash');
        return m || '';
    });
    const [loading, setLoading] = useState(false);

    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

    function handleOAuth() {
        setError('');
        startLogin();
    }

    async function handleBasicSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await loginBasic(username, password);
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section style={{ padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h2 style={{ color: COLORS.secondary, margin: '0 0 8px' }}>LGU Admin Login</h2>
                <p style={{ color: COLORS.text.muted, margin: 0 }}>Sign in to the SugboClean admin portal</p>
            </div>

            <Card>
                {flash && !error && (
                    <div role="status" aria-live="polite" style={{
                        padding: '10px 14px',
                        background: '#FEF3C7',
                        border: `1px solid ${COLORS.warning}`,
                        borderRadius: 8,
                        color: '#92400E',
                        fontSize: 14,
                        marginBottom: 16,
                    }}>
                        {flash}
                    </div>
                )}
                {error && (
                    <div role="alert" aria-live="assertive" style={{
                        padding: '10px 14px',
                        background: '#FEF2F2',
                        border: `1px solid ${COLORS.error}`,
                        borderRadius: 8,
                        color: COLORS.error,
                        fontSize: 14,
                        marginBottom: 16,
                    }}>
                        {error}
                    </div>
                )}

                <Button onClick={handleOAuth} style={{ width: '100%' }}>
                    Log in with ServiceNow
                </Button>

                {DEV_USE_BASIC_AUTH && (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            margin: '20px 0',
                            color: COLORS.text.muted,
                            fontSize: 13,
                        }}>
                            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                            <span>or dev login</span>
                            <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                        </div>
                        <form onSubmit={handleBasicSubmit}>
                            <Input
                                label="Username"
                                name="username"
                                placeholder="admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="admin"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" variant="outline" loading={loading} disabled={loading} style={{ width: '100%' }}>
                                Sign In (Basic)
                            </Button>
                        </form>
                    </>
                )}
            </Card>
        </section>
    );
}
