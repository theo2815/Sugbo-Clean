import React, { useState, useEffect } from 'react';
import { getBarangays, getSchedules, getHaulerByName, getRouteStops } from '../../services/api';
import { COLORS, STOP_STATUSES } from '../../utils/constants';
import Select from './shared/Select';
import Loading from './shared/Loading';
import Card from './shared/Card';

const stopStatusColors = {
    'Passed': COLORS.success,
    'Current': COLORS.status.inProgress,
    'Not Arrived': COLORS.text.muted,
};

export default function ScheduleChecker() {
    const [barangays, setBarangays] = useState([]);
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    // Hauler & route state
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
        async function loadAll() {
            setScheduleLoading(true);
            setRouteLoading(true);
            try {
                // 1. get schedules
                const { result: scheduleResult } = await getSchedules(selectedBarangay);
                setSchedules(scheduleResult);

                // 2. find the hauler name from the first schedule entry
                const haulerName = scheduleResult.length > 0 ? scheduleResult[0].hauler : null;
                if (haulerName) {
                    const { result: haulerResult } = await getHaulerByName(haulerName);
                    setHauler(haulerResult);

                    // 3. get route stops for that hauler
                    if (haulerResult) {
                        const { result: stops } = await getRouteStops(haulerResult.sys_id);
                        setRouteStops(stops);
                    } else {
                        setRouteStops([]);
                    }
                } else {
                    setHauler(null);
                    setRouteStops([]);
                }
            } finally {
                setScheduleLoading(false);
                setRouteLoading(false);
            }
        }
        loadAll();
    }, [selectedBarangay]);

    const wasteTypeColor = {
        Biodegradable: COLORS.bin.Biodegradable,
        Recyclable: COLORS.bin.Recyclable,
        Residual: COLORS.bin.Residual,
    };

    if (loading) return <Loading message="Loading barangays..." />;

    return (
        <div>
            {/* ── Barangay Selector ── */}
            <Card>
                <h3 style={{ color: COLORS.text.primary, marginTop: 0 }}>Find Your Collection Schedule</h3>
                <Select
                    label="Your Barangay"
                    name="barangay"
                    value={selectedBarangay}
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
                    placeholder="-- Select your Barangay --"
                />

                {scheduleLoading && <Loading message="Loading schedule..." />}

                {!scheduleLoading && selectedBarangay && schedules.length === 0 && (
                    <p style={{ color: COLORS.text.muted, textAlign: 'center', padding: 20 }}>
                        No schedules found for this barangay.
                    </p>
                )}

                {!scheduleLoading && schedules.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                        {schedules.map((item) => (
                            <div key={item.sys_id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderBottom: `1px solid ${COLORS.border}`,
                                borderLeft: `5px solid ${wasteTypeColor[item.waste_type] || COLORS.text.muted}`,
                                margin: '5px 0',
                                background: COLORS.bg.muted,
                                borderRadius: 4,
                            }}>
                                <strong style={{ color: COLORS.text.primary }}>{item.day_of_week}</strong>
                                <span style={{ color: COLORS.text.secondary, fontSize: 13 }}>
                                    {item.time_window_start} - {item.time_window_end}
                                </span>
                                <span style={{ color: wasteTypeColor[item.waste_type] || COLORS.text.secondary, fontWeight: 500 }}>
                                    {item.waste_type}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* ── Hauler Info Card ── */}
            {!scheduleLoading && hauler && (
                <Card style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: COLORS.secondaryLight,
                            color: COLORS.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            flexShrink: 0,
                        }}>
                            🚛
                        </div>
                        <div style={{ flex: 1, minWidth: 180 }}>
                            <h4 style={{ margin: '0 0 4px', color: COLORS.text.primary, fontSize: '1.05rem' }}>
                                {hauler.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: 14, color: COLORS.text.secondary }}>
                                Assigned hauler for your barangay
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            <a
                                href={`tel:${hauler.contact_number}`}
                                style={{
                                    color: COLORS.secondary,
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: 14,
                                }}
                            >
                                📞 {hauler.contact_number}
                            </a>
                            <span style={{ fontSize: 12, color: COLORS.text.muted }}>
                                Areas: {hauler.areas_covered}
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Route Map Placeholder + Route Stops ── */}
            {!scheduleLoading && hauler && (
                <Card style={{ marginTop: 20 }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${COLORS.secondaryLight} 0%, ${COLORS.primaryLight} 100%)`,
                        borderRadius: 12,
                        padding: '32px 20px',
                        textAlign: 'center',
                        border: `1px dashed ${COLORS.secondary}40`,
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🗺️</div>
                        <p style={{ margin: 0, fontWeight: 600, color: COLORS.secondary, fontSize: '1.05rem' }}>
                            Route Map: {hauler.name}
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: COLORS.text.muted }}>
                            Interactive map coming in Phase 3. Arrival estimation shown below.
                        </p>
                    </div>

                    {routeLoading && <Loading message="Loading route status..." />}

                    {!routeLoading && routeStops.length > 0 && (() => {
                        const myStop = routeStops.find(stop => stop.barangay === barangays.find(b => b.sys_id === selectedBarangay)?.name);
                        if (!myStop) return null;
                        
                        const statusColor = stopStatusColors[myStop.stop_status] || COLORS.text.muted;
                        return (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px',
                                borderTop: `1px solid ${COLORS.border}`,
                                marginTop: 20
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: COLORS.text.primary, fontSize: '1.05rem' }}>
                                        Estimated Arrival
                                    </div>
                                    <div style={{ fontSize: '1.2rem', color: COLORS.primary, fontWeight: 700, marginTop: 4 }}>
                                        {myStop.estimated_arrival}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 4 }}>Status</div>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: 20,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        background: `${statusColor}20`,
                                        color: statusColor,
                                    }}>
                                        {myStop.stop_status}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {!routeLoading && routeStops.length === 0 && (
                        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 20 }}>
                            No route data available for this hauler yet.
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
}
