import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBarangays, createReport } from '../../services/api';
import { COLORS, WASTE_TYPES } from '../../utils/constants';
import Select from './shared/Select';
import Input from './shared/Input';
import TextArea from './shared/TextArea';
import Button from './shared/Button';
import Card from './shared/Card';

export default function MissedPickupForm() {
    const navigate = useNavigate();
    const [barangays, setBarangays] = useState([]);
    const [barangay, setBarangay] = useState('');
    const [wasteType, setWasteType] = useState('');
    const [missedDate, setMissedDate] = useState('');
    const [email, setEmail] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submittedCode, setSubmittedCode] = useState(null);

    useEffect(() => {
        async function load() {
            const { result } = await getBarangays();
            setBarangays(result);
        }
        load();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { result } = await createReport({
                barangay,
                missed_date: missedDate,
                waste_type: wasteType,
                email,
                description,
            });
            setSubmittedCode(result.report_code);
        } finally {
            setSubmitting(false);
        }
    }

    if (submittedCode) {
        return (
            <Card style={{ textAlign: 'center', padding: 40, maxWidth: 500, margin: '0 auto' }}>
                <span style={{ fontSize: '4rem' }}>&#9989;</span>
                <h2 style={{ color: COLORS.primary }}>Report Submitted!</h2>
                <p style={{ color: COLORS.text.secondary }}>Please save your reference code:</p>
                <div style={{
                    background: COLORS.bg.muted,
                    padding: 20,
                    borderRadius: 8,
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: COLORS.secondary,
                    letterSpacing: 2,
                    margin: '20px 0',
                    fontFamily: 'monospace',
                }}>
                    {submittedCode}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={() => navigator.clipboard.writeText(submittedCode)} variant="outline">
                        Copy Code
                    </Button>
                    <Button onClick={() => navigate(`/track?code=${submittedCode}`)}>
                        Track This Report
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ maxWidth: 560, margin: '0 auto' }}>
            <h3 style={{ marginTop: 0, color: COLORS.text.primary }}>Report Missed Pickup</h3>
            <form onSubmit={handleSubmit}>
                <Select
                    label="Barangay"
                    name="barangay"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
                    required
                />
                <Select
                    label="Waste Type Not Collected"
                    name="wasteType"
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    options={WASTE_TYPES.map((w) => ({ value: w, label: w }))}
                    required
                />
                <Input
                    label="Missed Date"
                    name="missedDate"
                    type="date"
                    value={missedDate}
                    onChange={(e) => setMissedDate(e.target.value)}
                    required
                />
                <Input
                    label="Email (optional)"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextArea
                    label="Additional Details (optional)"
                    name="description"
                    placeholder="Describe the location or issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <Button type="submit" loading={submitting}>
                        Submit Report
                    </Button>
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
