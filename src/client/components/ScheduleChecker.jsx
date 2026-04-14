import React, { useState } from 'react';

export default function ScheduleChecker() {
    const [selectedBarangay, setSelectedBarangay] = useState('');

    // Mock data for SugboClean
    const schedules = {
        'Lahug': [
            { day: 'Monday', type: 'Biodegradable', color: '#4caf50' },
            { day: 'Wednesday', type: 'Residual', color: '#333333' },
            { day: 'Friday', type: 'Recyclable', color: '#2196f3' },
        ],
        'Mabolo': [
            { day: 'Tuesday', type: 'Biodegradable', color: '#4caf50' },
            { day: 'Thursday', type: 'Residual', color: '#333333' },
            { day: 'Saturday', type: 'Recyclable', color: '#2196f3' },
        ]
    };

    return (
        <div className="card" style={{ padding: '20px' }}>
            <h3>Find Your Collection Schedule</h3>
            <div className="form-group">
                <select 
                    value={selectedBarangay} 
                    onChange={(e) => setSelectedBarangay(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="">-- Select your Barangay --</option>
                    <option value="Lahug">Lahug</option>
                    <option value="Mabolo">Mabolo</option>
                </select>
            </div>

            {selectedBarangay && (
                <div style={{ marginTop: '20px' }}>
                    <h4>{selectedBarangay} Schedule:</h4>
                    {schedules[selectedBarangay].map((item, index) => (
                        <div key={index} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '10px', 
                            borderBottom: '1px solid #eee',
                            borderLeft: `5px solid ${item.color}`,
                            margin: '5px 0',
                            background: '#f9f9f9'
                        }}>
                            <strong>{item.day}</strong>
                            <span>{item.type}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}