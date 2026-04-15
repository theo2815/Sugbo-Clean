import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, ArrowRight, Info } from 'lucide-react';
import { getBarangays, createReport } from '../../services/api';
import { COLORS, WASTE_TYPES } from '../../utils/constants';
import Select from './shared/Select';
import Input from './shared/Input';
import TextArea from './shared/TextArea';
import Button from './shared/Button';
import Card from './shared/Card';

function FieldGroup({ title, children }) {
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: COLORS.text.muted,
                marginBottom: 10,
            }}>
                {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {children}
            </div>
        </div>
    );
}

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
    const [copied, setCopied] = useState(false);

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

    function handleCopy() {
        navigator.clipboard.writeText(submittedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const canSubmit = barangay && wasteType && missedDate && !submitting;

    if (submittedCode) {
        return (
            <Card style={{ textAlign: 'center', padding: 32, maxWidth: 540, margin: '0 auto' }}>
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: COLORS.primaryLight, color: COLORS.primary,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                }}>
                    <CheckCircle2 size={32} />
                </div>
                <h2 style={{ margin: '0 0 6px', color: COLORS.text.primary }}>Report Submitted</h2>
                <p style={{ margin: 0, color: COLORS.text.secondary, fontSize: 14 }}>
                    Save this code — you'll use it to track your report's progress.
                </p>
                <div style={{
                    background: COLORS.bg.muted,
                    padding: 18,
                    borderRadius: 12,
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: COLORS.secondary,
                    letterSpacing: 2,
                    margin: '20px 0',
                    fontFamily: 'monospace',
                    border: `1px dashed ${COLORS.border}`,
                }}>
                    {submittedCode}
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={handleCopy} variant="outline">
                        <Copy size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                        {copied ? 'Copied!' : 'Copy Code'}
                    </Button>
                    <Button onClick={() => navigate(`/track?code=${submittedCode}`)}>
                        Track This Report
                        <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: COLORS.secondaryLight,
                color: COLORS.secondaryDark,
                padding: '10px 12px',
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                lineHeight: 1.5,
            }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>This takes about one minute. Required fields are marked with *.</span>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <FieldGroup title="Location & Waste">
                    <Select
                        label="Barangay *"
                        name="barangay"
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
                        required
                    />
                    <Select
                        label="Waste Type Not Collected *"
                        name="wasteType"
                        value={wasteType}
                        onChange={(e) => setWasteType(e.target.value)}
                        options={WASTE_TYPES.map((w) => ({ value: w, label: w }))}
                        required
                    />
                    <Input
                        label="Missed Date *"
                        name="missedDate"
                        type="date"
                        value={missedDate}
                        onChange={(e) => setMissedDate(e.target.value)}
                        max={new Date().toISOString().slice(0, 10)}
                        required
                    />
                </FieldGroup>

                <FieldGroup title="Contact (optional)">
                    <Input
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextArea
                        label="Additional Details"
                        name="description"
                        placeholder="Describe the location or any specific issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </FieldGroup>

                <div style={{
                    display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap',
                }}>
                    <Button type="submit" loading={submitting} disabled={!canSubmit}>
                        Submit Report
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => navigate('/')}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Card>
    );
}
