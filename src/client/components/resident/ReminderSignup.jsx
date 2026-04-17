import React, { useState, useEffect } from 'react';
import { getBarangays, subscribeReminder } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function ReminderSignup() {
    const [barangays, setBarangays] = useState([]);
    const [email, setEmail] = useState('');
    const [barangay, setBarangay] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        async function load() {
            const { result } = await getBarangays();
            setBarangays(result);
        }
        load();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !barangay) return;
        setSubmitting(true);
        try {
            const { result } = await subscribeReminder({ email, barangay });
            setMessage(result.message);
            setEmail('');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Card style={{ marginTop: 20 }}>
            <h3 style={{ color: COLORS.text.primary, marginTop: 0 }}>Pickup Reminder</h3>
            <p style={{ color: COLORS.text.muted, fontSize: 14 }}>
                Get a day-before email reminder for your collection schedule.
            </p>

            {message ? (
                <div style={{ padding: 16, background: COLORS.primaryLight, borderRadius: 8, textAlign: 'center' }}>
                    <p style={{ margin: 0, color: COLORS.primary, fontWeight: 600 }}>{message}</p>
                </div>
            ) : (
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
                    <Button type="submit" loading={submitting}>
                        Subscribe
                    </Button>
                </form>
            )}
        </Card>
    );
}
