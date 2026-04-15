import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, AlertTriangle, Search, Recycle, Truck,
    ClipboardList, MessageSquare, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { COLORS, BIN_TYPES } from '../../utils/constants';
import { getAllReports } from '../../services/api';
import Card from './shared/Card';
import Button from './shared/Button';
import BinColorTag from './shared/BinColorTag';

const QUICK_ACTIONS = [
    { to: '/schedule', label: 'View My Schedule', desc: 'Check pickup days for your barangay', icon: Calendar, accent: COLORS.primary },
    { to: '/report', label: 'Report Missed Pickup', desc: 'File a new report in under a minute', icon: AlertTriangle, accent: COLORS.warning },
    { to: '/track', label: 'Track My Report', desc: 'See live status with your code', icon: Search, accent: COLORS.secondary },
    { to: '/waste-guide', label: 'Waste Sorting Guide', desc: 'Learn what goes in each bin', icon: Recycle, accent: COLORS.status.resolved },
    { to: '/haulers', label: 'Hauler Directory', desc: 'Contact your collection team', icon: Truck, accent: COLORS.text.secondary },
];

const HOW_IT_WORKS = [
    { icon: ClipboardList, title: 'Check Your Schedule', desc: 'Find pickup days and bin types for your barangay.' },
    { icon: MessageSquare, title: 'Report or Track', desc: 'Missed a pickup? File a report and follow it with a code.' },
    { icon: CheckCircle2, title: 'LGU Responds', desc: 'Your hauler is dispatched and you see the status update live.' },
];

function HeroTracker() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');

    const submit = (e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (trimmed) navigate(`/track?code=${encodeURIComponent(trimmed)}`);
    };

    return (
        <form onSubmit={submit} style={{
            display: 'flex',
            gap: 8,
            background: '#fff',
            padding: 8,
            borderRadius: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            maxWidth: 440,
        }}>
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Have a code? e.g. SC-2026-0001"
                aria-label="Report code"
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '10px 12px',
                    fontSize: 14,
                    background: 'transparent',
                    color: COLORS.text.primary,
                }}
            />
            <Button type="submit" variant="secondary" size="md">
                Track <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
            </Button>
        </form>
    );
}

function Hero() {
    const navigate = useNavigate();
    return (
        <section style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            color: '#fff',
            padding: '64px 5% 72px',
        }}>
            <div style={{
                maxWidth: 1120,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: 24,
            }}>
                <div>
                    <span style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.18)',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 16,
                    }}>
                        Maayong Adlaw, Sugbo!
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
                        margin: 0,
                        lineHeight: 1.15,
                        fontWeight: 700,
                    }}>
                        Keeping Sugbo clean,<br />one pickup at a time.
                    </h1>
                    <p style={{
                        fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)',
                        opacity: 0.92,
                        maxWidth: 560,
                        margin: '14px 0 24px',
                        lineHeight: 1.55,
                    }}>
                        Check collection schedules, report missed pickups, and track your report's status —
                        all in one place. No login needed.
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                        <Button variant="primary" size="lg" onClick={() => navigate('/report')} style={{ background: '#fff', color: COLORS.primary }}>
                            Report Missed Pickup
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/schedule')} style={{ borderColor: '#fff', color: '#fff' }}>
                            View My Schedule
                        </Button>
                    </div>
                    <HeroTracker />
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section style={{ padding: '64px 5%', background: COLORS.bg.page }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', color: COLORS.text.primary, fontSize: '1.75rem', margin: 0 }}>
                    How SugboClean Works
                </h2>
                <p style={{ textAlign: 'center', color: COLORS.text.muted, marginTop: 8, marginBottom: 40 }}>
                    Three simple steps. No app to install.
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 24,
                }}>
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={step.title} style={{ textAlign: 'center', padding: '0 8px' }}>
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: COLORS.primaryLight,
                                color: COLORS.primary,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                                position: 'relative',
                            }}>
                                <step.icon size={28} />
                                <span style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    background: COLORS.secondary,
                                    color: '#fff',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>{i + 1}</span>
                            </div>
                            <h3 style={{ color: COLORS.text.primary, margin: '0 0 8px', fontSize: '1.1rem' }}>{step.title}</h3>
                            <p style={{ color: COLORS.text.secondary, fontSize: 14, margin: 0, lineHeight: 1.55 }}>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function QuickActions() {
    const navigate = useNavigate();
    return (
        <section style={{ padding: '64px 5%', background: '#fff' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <h2 style={{ color: COLORS.text.primary, fontSize: '1.75rem', margin: 0 }}>
                    What would you like to do?
                </h2>
                <p style={{ color: COLORS.text.muted, marginTop: 8, marginBottom: 32 }}>
                    Jump straight to the service you need.
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 20,
                }}>
                    {QUICK_ACTIONS.map((action) => (
                        <Card
                            key={action.to}
                            accentColor={action.accent}
                            onClick={() => navigate(action.to)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                        >
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                background: `${action.accent}1A`,
                                color: action.accent,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <action.icon size={22} />
                            </div>
                            <h3 style={{ margin: 0, color: COLORS.text.primary, fontSize: '1.05rem' }}>{action.label}</h3>
                            <p style={{ margin: 0, fontSize: 13, color: COLORS.text.secondary, lineHeight: 1.5 }}>{action.desc}</p>
                            <span style={{
                                marginTop: 4,
                                color: action.accent,
                                fontSize: 13,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                            }}>
                                Open <ArrowRight size={14} />
                            </span>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SortingTeaser() {
    const navigate = useNavigate();
    return (
        <section style={{ padding: '64px 5%', background: COLORS.bg.page }}>
            <div style={{
                maxWidth: 1120,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
            }}>
                <div>
                    <h2 style={{ color: COLORS.text.primary, fontSize: '1.75rem', margin: 0 }}>
                        Sort it right, the first time.
                    </h2>
                    <p style={{ color: COLORS.text.secondary, marginTop: 12, lineHeight: 1.6 }}>
                        Cebu uses four bin colors. Putting items in the wrong bin can mean your trash gets left behind.
                        Our sorting guide helps you decide in seconds.
                    </p>
                    <Button variant="primary" size="md" onClick={() => navigate('/waste-guide')} style={{ marginTop: 8 }}>
                        See Full Guide <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                    </Button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                    {BIN_TYPES.map((bin) => (
                        <div key={bin} style={{
                            background: '#fff',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: 16,
                            minWidth: 130,
                            textAlign: 'center',
                        }}>
                            <BinColorTag binType={bin} />
                            <div style={{ marginTop: 10, color: COLORS.text.primary, fontSize: 14, fontWeight: 600 }}>
                                {bin}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TodayStrip() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let alive = true;
        getAllReports()
            .then(({ result }) => {
                if (!alive) return;
                const total = result.length;
                const resolved = result.filter((r) => r.status === 'Resolved').length;
                const inProgress = result.filter((r) => r.status === 'In Progress').length;
                setStats({ total, resolved, inProgress });
            })
            .catch(() => alive && setStats({ total: 0, resolved: 0, inProgress: 0 }));
        return () => { alive = false; };
    }, []);

    const items = stats
        ? [
            { label: 'Reports Filed', value: stats.total },
            { label: 'In Progress', value: stats.inProgress },
            { label: 'Resolved', value: stats.resolved },
        ]
        : [
            { label: 'Reports Filed', value: '—' },
            { label: 'In Progress', value: '—' },
            { label: 'Resolved', value: '—' },
        ];

    return (
        <section style={{ padding: '40px 5%', background: COLORS.text.primary, color: '#fff' }}>
            <div style={{
                maxWidth: 1120,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 24,
                textAlign: 'center',
            }}>
                <div style={{ textAlign: 'left', alignSelf: 'center' }}>
                    <div style={{ fontSize: 12, opacity: 0.65, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Today in Cebu
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: 4 }}>
                        Working together for a cleaner Sugbo
                    </div>
                </div>
                {items.map((s) => (
                    <div key={s.label}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: COLORS.primary }}>{s.value}</div>
                        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function SugboLanding() {
    return (
        <div>
            <Hero />
            <HowItWorks />
            <QuickActions />
            <SortingTeaser />
            <TodayStrip />
        </div>
    );
}
