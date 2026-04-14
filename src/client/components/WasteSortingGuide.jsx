import React from 'react';

export default function WasteSortingGuide() {
    const bins = [
        { type: 'Biodegradable', color: '#4caf50', items: ['Food Scraps', 'Fruit Peelings', 'Leaves', 'Paper'], binColor: 'Green' },
        { type: 'Recyclable', color: '#2196f3', items: ['Plastic Bottles', 'Glass Jars', 'Metal Cans', 'Cardboard'], binColor: 'Blue' },
        { type: 'Residual', color: '#333333', items: ['Styrofoam', 'Soiled Wrappers', 'Disposable Diapers', 'Rags'], binColor: 'Black' },
        { type: 'Hazardous', color: '#f44336', items: ['Batteries', 'Bulbs', 'Paint', 'Chemicals'], binColor: 'Red' }
    ];

    return (
        <div className="incident-list">
            <h2 style={{ marginBottom: '15px' }}>Waste Disposal Guide</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {bins.map((bin) => (
                    <div key={bin.type} className="card" style={{ 
                        padding: '20px', 
                        borderTop: `6px solid ${bin.color}`,
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ color: bin.color }}>{bin.binColor} Bin</h3>
                        <p><strong>{bin.type}</strong></p>
                        <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                            {bin.items.map(item => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}