import React, { useState, useEffect } from 'react';
import { getBarangays, subscribeReminder } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Toast from '../shared/Toast';

const COOLDOWN_SECONDS = 30;

export default function ReminderSignup() {
    const [barangays, setBarangays] = useState([]);
    const [email, setEmail] = useState('');
    const [barangay, setBarangay] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const { result } = await getBarangays();
                setBarangays(result);
            } catch (err) {
                setToast({ message: err?.message || 'Failed to load barangays.', type: 'error' });
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !barangay || submitting || cooldown > 0) return;
        setSubmitting(true);
        try {
            const { result } = await subscribeReminder({ email, barangay });
            setEmail('');
            setCooldown(COOLDOWN_SECONDS);
            setToast({ message: result.message || 'Subscribed! Check your inbox before the next pickup.', type: 'success' });
        } catch (err) {
            setToast({ message: err?.message || 'Could not subscribe. Please try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    }

    const disabled = submitting || cooldown > 0;
    const buttonLabel = cooldown > 0 ? `Wait ${cooldown}s` : 'Subscribe';

    return (
        <>
            <Card style={{ marginTop: 20 }}>
                <h3 style={{ color: COLORS.text.primary, marginTop: 0 }}>Pickup Reminder</h3>
                <p style={{ color: COLORS.text.muted, fontSize: 14 }}>
                    Get a day-before email reminder for your collection schedule.
                </p>

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
                        name="reminder-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Select
                        label="Barangay"
                        name="reminder-barangay"
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
                        placeholder="-- Select Barangay --"
                        required
                    />
                    <Button type="submit" loading={submitting} disabled={disabled}>
                        {buttonLabel}
                    </Button>
                </form>
            </Card>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.type === 'error' ? 5000 : 3500}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
