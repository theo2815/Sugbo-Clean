import React, { useState, useEffect } from 'react';
import { getBarangays, getSchedules } from '../../services/api';
import { COLORS } from '../../utils/constants';
import Select from './shared/Select';
import Loading from './shared/Loading';
import Card from './shared/Card';

export default function ScheduleChecker() {
    const [barangays, setBarangays] = useState([]);
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scheduleLoading, setScheduleLoading] = useState(false);

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
            return;
        }
        async function loadSchedules() {
            setScheduleLoading(true);
            try {
                const { result } = await getSchedules(selectedBarangay);
                setSchedules(result);
            } finally {
                setScheduleLoading(false);
            }
        }
        loadSchedules();
    }, [selectedBarangay]);

    const wasteTypeColor = {
        Biodegradable: COLORS.bin.Biodegradable,
        Recyclable: COLORS.bin.Recyclable,
        Residual: COLORS.bin.Residual,
    };

    if (loading) return <Loading message="Loading barangays..." />;

    return (
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
    );
}
