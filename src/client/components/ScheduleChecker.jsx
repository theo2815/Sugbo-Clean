import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Truck, CalendarDays, Clock, Navigation } from 'lucide-react';
import { getBarangays, getBarangayBundle } from '../../services/api';
import { COLORS } from '../../utils/constants';
import Select from './shared/Select';
import Loading from './shared/Loading';
import Card from './shared/Card';
import EmptyState from './shared/EmptyState';
import { SkeletonRows } from './shared/Skeleton';

const stopStatusColors = {
    'Passed': COLORS.success,
    'Current': COLORS.status.inProgress,
    'Not Arrived': COLORS.text.muted,
};

const wasteTypeColor = {
    Biodegradable: COLORS.bin.Biodegradable,
    Recyclable: COLORS.bin.Recyclable,
    Residual: COLORS.bin.Residual,
};

function SectionTitle({ icon: Icon, children, accent = COLORS.primary }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${accent}1A`, color: accent,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={18} />
            </div>
            <h3 style={{ margin: 0, color: COLORS.text.primary, fontSize: '1.05rem' }}>{children}</h3>
        </div>
    );
}

export default function ScheduleChecker() {
    const [barangays, setBarangays] = useState([]);
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const [hauler, setHauler] = useState(null);
    const [routeStops, setRouteStops] = useState([]);
    const [routeLoading, setRouteLoading] = useState(false);

    useEffect(() => {
        async function loadBarangays() {
            try {
                const { result } = await getBarangays();
                setBarangays(result);
            } finally {
                setLoading(false);
            }
        }
        loadBarangays();
    }, []);

    useEffect(() => {
        if (!selectedBarangay) {
            setSchedules([]);
            setHauler(null);
            setRouteStops([]);
            return;
        }
        let cancelled = false;
        async function loadAll() {
            setScheduleLoading(true);
            setRouteLoading(true);
            // Merged bundle fetch — uses a 60s cache so toggling between the
            // same barangay doesn't re-hit the network.
            const bundle = await getBarangayBundle(selectedBarangay);
            if (cancelled) return;
            setSchedules(bundle.schedules);
            setHauler(bundle.hauler);
            setRouteStops(bundle.routeStops);
            setScheduleLoading(false);
            setRouteLoading(false);
        }
        loadAll();
        return () => { cancelled = true; };
    }, [selectedBarangay]);

    if (loading) return <Loading message="Loading barangays..." />;

    // Route stops are already filtered by barangay — first entry is the relevant stop.
    const myStop = routeStops[0] || null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ── Barangay Selector ── */}
            <Card>
                <SectionTitle icon={MapPin}>Find Your Collection Schedule</SectionTitle>
                <Select
                    label="Your Barangay"
                    name="barangay"
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
                    placeholder="-- Select your Barangay --"
                />

                {!selectedBarangay && (
                    <p style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: COLORS.text.muted,
                    }}>
                        Tip: we'll show your pickup days, hauler, and route once you pick one.
                    </p>
                )}
            </Card>

            {/* ── Schedule ── */}
            {selectedBarangay && (
                <Card>
                    <SectionTitle icon={CalendarDays}>Pickup Days</SectionTitle>

                    {scheduleLoading && <SkeletonRows rows={3} columns={3} />}

                    {!scheduleLoading && schedules.length === 0 && (
                        <EmptyState
                            icon={CalendarDays}
                            title="No schedule yet"
                            message="We couldn't find a pickup schedule for this barangay. Please check back soon."
                        />
                    )}

                    {!scheduleLoading && schedules.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {schedules.map((item) => (
                                <div key={item.sys_id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(110px, 1fr) auto auto',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 14px',
                                    borderLeft: `4px solid ${wasteTypeColor[item.waste_type] || COLORS.text.muted}`,
                                    background: COLORS.bg.muted,
                                    borderRadius: 8,
                                }}>
                                    <strong style={{ color: COLORS.text.primary }}>{item.day_of_week}</strong>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        color: COLORS.text.secondary, fontSize: 13,
                                    }}>
                                        <Clock size={13} />
                                        {item.time_window_start} – {item.time_window_end}
                                    </span>
                                    <span style={{
                                        color: wasteTypeColor[item.waste_type] || COLORS.text.secondary,
                                        fontWeight: 600,
                                        fontSize: 13,
                                    }}>
                                        {item.waste_type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ── Hauler Info ── */}
            {selectedBarangay && !scheduleLoading && hauler && (
                <Card>
                    <SectionTitle icon={Truck} accent={COLORS.secondary}>Your Assigned Hauler</SectionTitle>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: 14,
                        alignItems: 'center',
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 12,
                            background: COLORS.secondaryLight, color: COLORS.secondary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Truck size={26} />
                        </div>
                        <div>
                            <div style={{
                                fontWeight: 700, color: COLORS.text.primary, fontSize: '1.05rem',
                            }}>
                                {hauler.name}
                            </div>
                            <div style={{ fontSize: 13, color: COLORS.text.muted, marginTop: 2 }}>
                                Areas covered: {hauler.areas_covered}
                            </div>
                        </div>
                    </div>
                    <a
                        href={`tel:${hauler.contact_number}`}
                        style={{
                            marginTop: 14,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: COLORS.secondaryLight,
                            color: COLORS.secondaryDark,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        <Phone size={15} /> {hauler.contact_number}
                    </a>
                </Card>
            )}

            {/* ── Route / Arrival ── */}
            {selectedBarangay && !scheduleLoading && hauler && (
                <Card>
                    <SectionTitle icon={Navigation} accent={COLORS.primary}>Route & Arrival</SectionTitle>

                    <div style={{
                        background: `linear-gradient(135deg, ${COLORS.secondaryLight} 0%, ${COLORS.primaryLight} 100%)`,
                        borderRadius: 12,
                        padding: '28px 20px',
                        textAlign: 'center',
                        border: `1px dashed ${COLORS.secondary}40`,
                    }}>
                        <div style={{ fontSize: '2.25rem', marginBottom: 6 }}>🗺️</div>
                        <p style={{ margin: 0, fontWeight: 600, color: COLORS.secondary }}>
                            {hauler.name}'s route
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: COLORS.text.muted }}>
                            Interactive map coming in Phase 3
                        </p>
                    </div>

                    {routeLoading && <Loading message="Loading route status..." />}

                    {!routeLoading && myStop && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            padding: '14px 4px 2px',
                            marginTop: 16,
                            flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{ fontSize: 13, color: COLORS.text.muted }}>Estimated arrival</div>
                                <div style={{
                                    fontSize: '1.35rem',
                                    color: COLORS.primary,
                                    fontWeight: 700,
                                    marginTop: 2,
                                }}>
                                    {myStop.estimated_arrival}
                                </div>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 600,
                                background: `${stopStatusColors[myStop.stop_status] || COLORS.text.muted}20`,
                                color: stopStatusColors[myStop.stop_status] || COLORS.text.muted,
                            }}>
                                {myStop.stop_status}
                            </span>
                        </div>
                    )}

                    {!routeLoading && !myStop && (
                        <p style={{
                            margin: '16px 0 0',
                            textAlign: 'center',
                            color: COLORS.text.muted,
                            fontSize: 13,
                        }}>
                            No route data available for this stop yet.
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
}
