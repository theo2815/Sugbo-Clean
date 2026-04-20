import React, { useState, useEffect } from 'react';
import { getBarangays, getSchedules, subscribeReminder } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import { formatTime12h } from '../../../utils/helpers';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Card from '../shared/Card';
import Toast from '../shared/Toast';

const COOLDOWN_SECONDS = 30;

const DAY_LABEL = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

function dayLabel(raw) {
    if (!raw) return '';
    const key = String(raw).toLowerCase();
    return DAY_LABEL[key] || raw;
}

export default function ReminderSignup() {
    const [barangays, setBarangays] = useState([]);
    const [email, setEmail] = useState('');
    const [barangay, setBarangay] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loadingSchedules, setLoadingSchedules] = useState(false);
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
        if (!barangay) {
            setSchedules([]);
            setSelected(new Set());
            return;
        }
        let cancelled = false;
        async function load() {
            setLoadingSchedules(true);
            try {
                const { result } = await getSchedules(barangay);
                if (cancelled) return;
                setSchedules(result);
                setSelected(new Set(result.map((s) => s.sys_id)));
            } catch (err) {
                if (cancelled) return;
                setSchedules([]);
                setSelected(new Set());
                setToast({ message: err?.message || 'Failed to load schedules.', type: 'error' });
            } finally {
                if (!cancelled) setLoadingSchedules(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [barangay]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    function toggleSchedule(sysId) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(sysId)) next.delete(sysId);
            else next.add(sysId);
            return next;
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!email || !barangay || selected.size === 0 || submitting || cooldown > 0) return;
        setSubmitting(true);
        try {
            const { result } = await subscribeReminder({
                email,
                schedules: Array.from(selected),
            });
            setEmail('');
            setBarangay('');
            setSchedules([]);
            setSelected(new Set());
            setCooldown(COOLDOWN_SECONDS);
            setToast({
                message: result?.message || 'Subscribed! You will be reminded ~1 hour before each pickup.',
                type: 'success',
            });
        } catch (err) {
            setToast({ message: err?.message || 'Could not subscribe. Please try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    }

    const hasSchedules = schedules.length > 0;
    const canSubmit = email && barangay && selected.size > 0 && !submitting && cooldown === 0;
    const buttonLabel = cooldown > 0
        ? `Wait ${cooldown}s`
        : selected.size > 1
            ? `Subscribe to ${selected.size} pickups`
            : 'Subscribe';

    return (
        <>
            <Card style={{ marginTop: 20 }}>
                <h3 style={{ color: COLORS.text.primary, marginTop: 0 }}>Pickup Reminder</h3>
                <p style={{ color: COLORS.text.muted, fontSize: 14 }}>
                    Get an email reminder about an hour before each scheduled pickup.
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

                    {barangay && (
                        <div style={{ marginTop: 12, marginBottom: 16 }}>
                            <label style={{
                                display: 'block',
                                fontSize: 14,
                                fontWeight: 500,
                                color: COLORS.text.primary,
                                marginBottom: 8,
                            }}>
                                Pickup Schedules
                            </label>

                            {loadingSchedules && (
                                <p style={{ color: COLORS.text.muted, fontSize: 13, margin: 0 }}>
                                    Loading schedules…
                                </p>
                            )}

                            {!loadingSchedules && !hasSchedules && (
                                <p style={{ color: COLORS.text.muted, fontSize: 13, margin: 0 }}>
                                    No pickup schedules published for this barangay yet.
                                </p>
                            )}

                            {!loadingSchedules && hasSchedules && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    border: `1px solid ${COLORS.border || '#e5e7eb'}`,
                                    borderRadius: 8,
                                    padding: 12,
                                }}>
                                    {schedules.map((s) => {
                                        const checked = selected.has(s.sys_id);
                                        return (
                                            <label
                                                key={s.sys_id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    color: COLORS.text.primary,
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleSchedule(s.sys_id)}
                                                />
                                                <span>
                                                    <strong>{dayLabel(s.day_of_week)}</strong>
                                                    {' · '}
                                                    {formatTime12h(s.time_window_start)} – {formatTime12h(s.time_window_end)}
                                                    {s.waste_type ? ` · ${s.waste_type}` : ''}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <Button type="submit" loading={submitting} disabled={!canSubmit}>
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
