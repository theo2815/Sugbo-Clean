import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../utils/constants';
import Input from '../../client/components/shared/Input';
import Button from '../../client/components/shared/Button';
import Card from '../../client/components/shared/Card';

export default function LoginPage() {
    const { isAdmin, login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

    function handleSubmit(e) {
        e.preventDefault();
        setError('');
        const success = login(username, password);
        if (success) {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid credentials. Try admin / admin.');
        }
    }

    return (
        <section style={{ padding: '60px 20px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <h2 style={{ color: COLORS.secondary, margin: '0 0 8px' }}>LGU Admin Login</h2>
                <p style={{ color: COLORS.text.muted, margin: 0 }}>Sign in to the SugboClean admin portal</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
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
                    <Button type="submit" style={{ width: '100%' }}>
                        Sign In
                    </Button>
                </form>
            </Card>
        </section>
    );
}
