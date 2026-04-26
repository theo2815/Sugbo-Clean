import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, AlertTriangle, Search, Recycle,
    ClipboardList, MessageSquare, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { COLORS, BIN_TYPES } from '../../utils/constants';
import { getAllReports } from '../../services/api';
import Card from './shared/Card';
import Button from './shared/Button';
import BinColorTag from './shared/BinColorTag';

const SECONDARY_ACTIONS = [
    { to: '/schedule', label: 'My Schedule', desc: 'Check pickup days for your barangay', icon: Calendar, accent: COLORS.primary },
    { to: '/track', label: 'Track Report', desc: 'See live status with your code', icon: Search, accent: COLORS.secondary },
    { to: '/waste-guide', label: 'Sorting Guide', desc: 'Learn what goes in each bin', icon: Recycle, accent: COLORS.status.resolved },
];

const HOW_IT_WORKS = [
    { icon: ClipboardList, title: 'Check Your Schedule', desc: 'Find pickup days and bin types for your barangay.' },
    { icon: MessageSquare, title: 'Report or Track', desc: 'Missed a pickup? File a report and follow it with a code.' },
    { icon: CheckCircle2, title: 'LGU Responds', desc: 'Your hauler is dispatched and you see status updates live.' },
];

function useReportStats() {
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
    return stats;
}

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
            gap: 6,
            background: '#fff',
            padding: 6,
            borderRadius: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            maxWidth: 460,
        }}>
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Already filed? Enter code e.g. SC-2026-0001"
                aria-label="Report code"
                style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    padding: '12px 14px',
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

function HeroStats({ stats }) {
    const items = [
        { label: 'Reports Filed', value: stats?.total ?? '—' },
        { label: 'In Progress', value: stats?.inProgress ?? '—' },
        { label: 'Resolved', value: stats?.resolved ?? '—' },
    ];
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.22)',
            maxWidth: 540,
        }}>
            {items.map((s) => (
                <div key={s.label}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 700, lineHeight: 1.1 }}>
                        {s.value}
                    </div>
                    <div style={{
                        fontSize: 11,
                        opacity: 0.85,
                        marginTop: 6,
                        textTransform: 'uppercase',
                        letterSpacing: 0.7,
                        fontWeight: 600,
                    }}>
                        {s.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

function Hero({ stats }) {
    const navigate = useNavigate();
    return (
        <section style={{
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            color: '#fff',
            padding: '72px 5% 88px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div aria-hidden style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                pointerEvents: 'none',
            }} />
            <div aria-hidden style={{
                position: 'absolute',
                top: -120,
                right: -120,
                width: 360,
                height: 360,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                pointerEvents: 'none',
            }} />
            <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
                <span style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.18)',
                    padding: '6px 14px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 20,
                    backdropFilter: 'blur(8px)',
                }}>
                    Maayong Adlaw, Sugbo!
                </span>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    margin: 0,
                    lineHeight: 1.1,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                }}>
                    Keeping Sugbo clean,<br />one pickup at a time.
                </h1>
                <p style={{
                    fontSize: 'clamp(1rem, 1.6vw, 1.1rem)',
                    opacity: 0.95,
                    maxWidth: 560,
                    margin: '16px 0 28px',
                    lineHeight: 1.55,
                }}>
                    Check collection schedules, report missed pickups, and track your report's status —
                    all in one place. No login needed.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/report')}
                        style={{
                            background: '#fff',
                            color: COLORS.primary,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        }}
                    >
                        Report Missed Pickup
                        <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/schedule')}
                        style={{
                            borderColor: '#fff',
                            color: '#fff',
                            background: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        View My Schedule
                    </Button>
                </div>
                <HeroTracker />
                <HeroStats stats={stats} />
            </div>
        </section>
    );
}

function PrimaryActionPanel() {
    const navigate = useNavigate();
    return (
        <section style={{ padding: '64px 5% 32px', background: '#fff' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 24,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.secondaryLight} 100%)`,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 16,
                    padding: '28px 32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}>
                    <div style={{
                        display: 'flex',
                        gap: 20,
                        alignItems: 'center',
                        flex: '1 1 320px',
                        minWidth: 0,
                    }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: COLORS.warning,
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
                        }}>
                            <AlertTriangle size={30} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{
                                margin: 0,
                                color: COLORS.text.primary,
                                fontSize: '1.4rem',
                                fontWeight: 700,
                            }}>
                                Missed your pickup?
                            </h2>
                            <p style={{
                                margin: '6px 0 0',
                                color: COLORS.text.secondary,
                                fontSize: 15,
                                lineHeight: 1.5,
                            }}>
                                File a quick report and we'll dispatch your barangay's hauler.
                                You'll get a code to track the status.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/report')}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        File Report
                        <ArrowRight size={16} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                    </Button>
                </div>
            </div>
        </section>
    );
}

function OtherServices() {
    const navigate = useNavigate();
    return (
        <section style={{ padding: '32px 5% 64px', background: '#fff' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <h2 style={{
                    color: COLORS.text.primary,
                    fontSize: '1.4rem',
                    margin: 0,
                    fontWeight: 700,
                }}>
                    Other services
                </h2>
                <p style={{
                    color: COLORS.text.muted,
                    marginTop: 6,
                    marginBottom: 24,
                    fontSize: 14,
                }}>
                    Everything else you might need.
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 16,
                }}>
                    {SECONDARY_ACTIONS.map((action) => (
                        <Card
                            key={action.to}
                            accentColor={action.accent}
                            onClick={() => navigate(action.to)}
                            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                        >
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: `${action.accent}1A`,
                                color: action.accent,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <action.icon size={20} />
                            </div>
                            <h3 style={{
                                margin: 0,
                                color: COLORS.text.primary,
                                fontSize: '1rem',
                                fontWeight: 600,
                            }}>
                                {action.label}
                            </h3>
                            <p style={{
                                margin: 0,
                                fontSize: 13,
                                color: COLORS.text.secondary,
                                lineHeight: 1.5,
                            }}>
                                {action.desc}
                            </p>
                            <span style={{
                                marginTop: 'auto',
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

function HowItWorks() {
    return (
        <section style={{ padding: '64px 5%', background: COLORS.bg.page }}>
            <div style={{ maxWidth: 1120, margin: '0 auto' }}>
                <h2 style={{
                    textAlign: 'center',
                    color: COLORS.text.primary,
                    fontSize: '1.75rem',
                    margin: 0,
                    fontWeight: 700,
                }}>
                    How SugboClean Works
                </h2>
                <p style={{
                    textAlign: 'center',
                    color: COLORS.text.muted,
                    marginTop: 8,
                    marginBottom: 48,
                }}>
                    Three simple steps. No app to install.
                </p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 32,
                }}>
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={step.title} style={{ textAlign: 'center', padding: '0 8px' }}>
                            <div style={{
                                width: 72,
                                height: 72,
                                borderRadius: '50%',
                                background: '#fff',
                                color: COLORS.primary,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 18,
                                position: 'relative',
                                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.18)',
                                border: `2px solid ${COLORS.primaryLight}`,
                            }}>
                                <step.icon size={30} />
                                <span style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    background: COLORS.secondary,
                                    color: '#fff',
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                }}>
                                    {i + 1}
                                </span>
                            </div>
                            <h3 style={{
                                color: COLORS.text.primary,
                                margin: '0 0 8px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                            }}>
                                {step.title}
                            </h3>
                            <p style={{
                                color: COLORS.text.secondary,
                                fontSize: 14,
                                margin: 0,
                                lineHeight: 1.55,
                            }}>
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SortingTeaser() {
    const navigate = useNavigate();
    return (
        <section style={{ padding: '64px 5%', background: '#fff' }}>
            <div style={{
                maxWidth: 1120,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 32,
                alignItems: 'center',
            }}>
                <div>
                    <h2 style={{
                        color: COLORS.text.primary,
                        fontSize: '1.75rem',
                        margin: 0,
                        fontWeight: 700,
                    }}>
                        Sort it right, the first time.
                    </h2>
                    <p style={{
                        color: COLORS.text.secondary,
                        marginTop: 12,
                        lineHeight: 1.6,
                    }}>
                        Cebu uses four bin colors. Putting items in the wrong bin can mean your trash gets left behind.
                        Our sorting guide helps you decide in seconds.
                    </p>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => navigate('/waste-guide')}
                        style={{ marginTop: 8 }}
                    >
                        See Full Guide <ArrowRight size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                    </Button>
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'center',
                }}>
                    {BIN_TYPES.map((bin) => (
                        <div key={bin} style={{
                            background: COLORS.bg.page,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            padding: 16,
                            minWidth: 130,
                            textAlign: 'center',
                        }}>
                            <BinColorTag binType={bin} />
                            <div style={{
                                marginTop: 10,
                                color: COLORS.text.primary,
                                fontSize: 14,
                                fontWeight: 600,
                            }}>
                                {bin}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function SugboLanding() {
    const stats = useReportStats();
    return (
        <div>
            <Hero stats={stats} />
            <PrimaryActionPanel />
            <OtherServices />
            <HowItWorks />
            <SortingTeaser />
        </div>
    );
}
