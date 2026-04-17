import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, ArrowRight, Info } from 'lucide-react';
import { getBarangays, createReport, uploadReportPhoto } from '../../services/api';
import { COLORS, WASTE_TYPES } from '../../utils/constants';
import Select from './shared/Select';
import Input from './shared/Input';
import TextArea from './shared/TextArea';
import Button from './shared/Button';
import Card from './shared/Card';
import DatePicker from './shared/DatePicker';
import FileUpload from './shared/FileUpload';

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
    const [photo, setPhoto] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [photoWarning, setPhotoWarning] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadPct, setUploadPct] = useState(null);
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
        setSubmitError('');
        setPhotoWarning('');
        try {
            const { result } = await createReport({
                barangay,
                missed_date: missedDate,
                waste_type: wasteType,
                email,
                description,
            });
            if (photo && result.sys_id) {
                setUploadPct(0);
                try {
                    await uploadReportPhoto(result.sys_id, photo, (pct) => setUploadPct(pct));
                } catch {
                    setPhotoWarning('Report saved, but the photo could not be attached. You can re-submit with the photo later.');
                } finally {
                    setUploadPct(null);
                }
            }
            setSubmittedCode(result.report_code);
        } catch (err) {
            setSubmitError(err?.message || 'Could not submit your report. Please try again.');
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
                {photoWarning && (
                    <div role="alert" style={{
                        background: '#FEF3C7',
                        border: `1px solid ${COLORS.warning}`,
                        color: '#92400E',
                        padding: '10px 14px',
                        borderRadius: 10,
                        fontSize: 13,
                        marginBottom: 14,
                        textAlign: 'left',
                    }}>
                        {photoWarning}
                    </div>
                )}
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
                {submitError && (
                    <div role="alert" style={{
                        background: '#FEF2F2',
                        border: `1px solid ${COLORS.error}`,
                        color: COLORS.error,
                        padding: '10px 14px',
                        borderRadius: 10,
                        fontSize: 14,
                        marginBottom: 16,
                    }}>
                        {submitError}
                    </div>
                )}
                <FieldGroup title="Location & Waste">
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
                    <DatePicker
                        label="Missed Date"
                        name="missedDate"
                        value={missedDate}
                        onChange={setMissedDate}
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
                        maxLength={500}
                    />
                    <FileUpload
                        label="Photo (optional)"
                        name="photo"
                        accept="image/*"
                        maxSizeMB={5}
                        helperText="PNG or JPG, up to 5 MB"
                        value={photo}
                        onChange={setPhoto}
                    />
                    {uploadPct !== null && (
                        <div aria-live="polite" style={{ marginTop: 8 }}>
                            <div style={{
                                height: 6, background: COLORS.bg.muted, borderRadius: 999, overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${uploadPct}%`,
                                    background: COLORS.primary,
                                    transition: 'width 0.15s linear',
                                }} />
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.text.muted, marginTop: 4 }}>
                                Uploading photo… {uploadPct}%
                            </div>
                        </div>
                    )}
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
