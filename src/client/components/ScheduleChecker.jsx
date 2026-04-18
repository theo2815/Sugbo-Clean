import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Phone, Truck, CalendarDays, Clock, Navigation } from 'lucide-react';
import { getBarangays, getBarangayBundle } from '../../services/api';
import { COLORS } from '../../utils/constants';
import { formatTime12h, etaFromSchedule } from '../../utils/helpers';
import Select from './shared/Select';
import Loading from './shared/Loading';
import Card from './shared/Card';
import EmptyState from './shared/EmptyState';
import { SkeletonRows } from './shared/Skeleton';
import RouteMap, { CEBU_CENTER } from './shared/RouteMap';

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
    const [selectedScheduleId, setSelectedScheduleId] = useState('');
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const [hauler, setHauler] = useState(null);
    const [routeStops, setRouteStops] = useState([]);
    const [bundleError, setBundleError] = useState(null);
    const [retryKey, setRetryKey] = useState(0);

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
            setSelectedScheduleId('');
            setHauler(null);
            setRouteStops([]);
            return;
        }
        let cancelled = false;
        async function loadAll() {
            setScheduleLoading(true);
            setBundleError(null);
            try {
                const bundle = await getBarangayBundle(selectedBarangay);
                if (cancelled) return;
                setSchedules(bundle.schedules);
                setHauler(bundle.hauler);
                setRouteStops(bundle.routeStops);
            } catch (err) {
                if (cancelled) return;
                setBundleError(err?.message || 'Failed to load schedule data. Please try again.');
            } finally {
                if (!cancelled) setScheduleLoading(false);
            }
        }
        loadAll();
        return () => { cancelled = true; };
    }, [selectedBarangay, retryKey]);

    useEffect(() => {
        if (schedules.length === 0) {
            setSelectedScheduleId('');
            return;
        }
        setSelectedScheduleId((prev) => (
            prev && schedules.some((s) => s.sys_id === prev) ? prev : schedules[0].sys_id
        ));
    }, [schedules]);

    const selectedSchedule = useMemo(
        () => schedules.find((s) => s.sys_id === selectedScheduleId) || null,
        [schedules, selectedScheduleId],
    );

    // Filter stops to the selected schedule only, then derive each stop's ETA
    // from that schedule's start time + stop offset (single source of truth).
    const annotatedStops = useMemo(() => {
        if (!selectedSchedule) return [];
        return routeStops
            .filter((s) => s.schedule_id === selectedSchedule.sys_id)
            .map((s) => ({
                ...s,
                estimated_arrival: etaFromSchedule(
                    selectedSchedule.time_window_start,
                    s.offset_minutes || 0,
                ),
            }));
    }, [routeStops, selectedSchedule]);

    if (loading) return <Loading message="Loading barangays..." />;

    const residentBarangay = barangays.find((b) => b.sys_id === selectedBarangay);
    const residentLatLng = residentBarangay
        && Number.isFinite(Number(residentBarangay.latitude))
        && Number.isFinite(Number(residentBarangay.longitude))
        ? [Number(residentBarangay.latitude), Number(residentBarangay.longitude)]
        : null;

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

                {bundleError && (
                    <div role="alert" style={{
                        padding: '10px 14px', border: `1px solid ${COLORS.error}`, background: '#FEF2F2',
                        borderRadius: 10, color: COLORS.error, fontSize: 13, marginTop: 12,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                    }}>
                        <span>{bundleError}</span>
                        <button
                            onClick={() => setRetryKey((k) => k + 1)}
                            style={{
                                padding: '4px 10px', borderRadius: 6, border: `1px solid ${COLORS.error}`,
                                background: '#fff', color: COLORS.error, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

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
                            {schedules.length > 1 && (
                                <p style={{
                                    margin: '0 0 4px', fontSize: 12, color: COLORS.text.muted,
                                }}>
                                    Tap a pickup day to see its route on the map below.
                                </p>
                            )}
                            {schedules.map((item) => {
                                const wasteColor = wasteTypeColor[item.waste_type] || COLORS.text.muted;
                                const isSelected = item.sys_id === selectedScheduleId;
                                return (
                                    <button
                                        key={item.sys_id}
                                        type="button"
                                        onClick={() => setSelectedScheduleId(item.sys_id)}
                                        aria-pressed={isSelected}
                                        style={{
                                            width: '100%',
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(110px, 1fr) auto auto',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 14px',
                                            border: 'none',
                                            borderLeft: `4px solid ${wasteColor}`,
                                            outline: isSelected ? `2px solid ${wasteColor}` : 'none',
                                            outlineOffset: isSelected ? -2 : 0,
                                            background: isSelected ? '#fff' : COLORS.bg.muted,
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            font: 'inherit',
                                            color: 'inherit',
                                        }}
                                    >
                                        <strong style={{ color: COLORS.text.primary }}>{item.day_of_week}</strong>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                            color: COLORS.text.secondary, fontSize: 13,
                                        }}>
                                            <Clock size={13} />
                                            {formatTime12h(item.time_window_start)} – {formatTime12h(item.time_window_end)}
                                        </span>
                                        <span style={{
                                            color: wasteColor,
                                            fontWeight: 600,
                                            fontSize: 13,
                                        }}>
                                            {item.waste_type}
                                        </span>
                                    </button>
                                );
                            })}
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

            {/* ── Route Map ── */}
            {selectedBarangay && !scheduleLoading && hauler && (
                <Card>
                    <SectionTitle icon={Navigation} accent={COLORS.primary}>
                        {selectedSchedule
                            ? `Route — ${selectedSchedule.day_of_week} ${selectedSchedule.waste_type}`
                            : 'Route'}
                    </SectionTitle>

                    <RouteMap
                        stops={annotatedStops}
                        center={residentLatLng ?? CEBU_CENTER}
                        zoom={residentLatLng ? 15 : 13}
                        height={340}
                    />

                    <p style={{
                        margin: '12px 0 0',
                        fontSize: 12,
                        color: COLORS.text.muted,
                        textAlign: 'center',
                    }}>
                        {!selectedSchedule
                            ? 'No schedule selected.'
                            : annotatedStops.length === 0
                                ? 'No route has been set yet for this pickup day.'
                                : 'Click any pin to see the street label and estimated arrival time.'}
                    </p>
                </Card>
            )}
        </div>
    );
}
