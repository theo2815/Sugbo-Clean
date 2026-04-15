import React from 'react';
import { COLORS, STOP_STATUSES } from '../../utils/constants';
import Card from './shared/Card';

const stopStatusColors = {
    'Passed': COLORS.success,
    'Current': COLORS.status.inProgress,
    'Not Arrived': COLORS.text.muted,
};

export default function HaulerMap({ stops = [], haulerName }) {
    return (
        <div>
            <Card style={{ marginBottom: 20, background: COLORS.secondaryLight, textAlign: 'center' }}>
                <p style={{ margin: 0, fontWeight: 600, color: COLORS.secondary }}>
                    {haulerName ? `Route: ${haulerName}` : 'Hauler Route Map (Static)'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.text.muted }}>
                    Interactive map coming in Phase 3. Route stops shown below.
                </p>
            </Card>

            {stops.length === 0 ? (
                <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 20 }}>
                    No route stops available for this hauler.
                </p>
            ) : (
                <div>
                    {stops.map((stop) => {
                        const statusColor = stopStatusColors[stop.stop_status] || COLORS.text.muted;
                        return (
                            <div key={stop.sys_id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '12px 16px',
                                borderBottom: `1px solid ${COLORS.border}`,
                            }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: statusColor,
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                }}>
                                    {stop.stop_order}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: COLORS.text.primary }}>{stop.barangay}</div>
                                    <div style={{ fontSize: 13, color: COLORS.text.muted }}>Est. arrival: {stop.estimated_arrival}</div>
                                </div>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 12,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    background: `${statusColor}20`,
                                    color: statusColor,
                                }}>
                                    {stop.stop_status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}

            <p style={{ marginTop: 15, fontStyle: 'italic', color: COLORS.text.muted, fontSize: 12 }}>
                *This shows the pre-planned route. Live GPS tracking is not currently available.
            </p>
        </div>
    );
}
