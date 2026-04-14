import React from 'react';

export default function HaulerMap() {
    const stops = [
        { id: 1, barangay: 'Lahug Proper', time: '08:00 AM', status: 'Passed' },
        { id: 2, barangay: 'Salinas Dr.', time: '09:30 AM', status: 'In Transit' },
        { id: 3, barangay: 'Gorordo Ave.', time: '11:00 AM', status: 'Pending' }
    ];

    return (
        <div className="incident-list">
            <h3>Hauler Route Map (Static)</h3>
            <div className="card" style={{ padding: '20px', marginBottom: '20px', background: '#e3f2fd', textAlign: 'center' }}>
                <p>📍 <strong>Current Route:</strong> North District - Route A (Truck #042)</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Stop</th>
                        <th>Location</th>
                        <th>Est. Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {stops.map((stop) => (
                        <tr key={stop.id}>
                            <td><strong>{stop.id}</strong></td>
                            <td>{stop.barangay}</td>
                            <td>{stop.time}</td>
                            <td>
                                <span className={`state-badge ${stop.status === 'Passed' ? 'state-closed' : 'state-in-progress'}`}>
                                    {stop.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: '15px', fontStyle: 'italic', color: '#666', fontSize: '12px' }}>
                *Note: This map shows the pre-planned route. Live GPS tracking is not currently available.
            </div>
        </div>
    );
}