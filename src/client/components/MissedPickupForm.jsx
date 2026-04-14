import React, { useState } from 'react';

export default function MissedPickupForm({ onCancel }) {
    const [submittedCode, setSubmittedCode] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Generate mock SC code
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        setSubmittedCode(`SC-2026-${randomNum}`);
    };

    if (submittedCode) {
        return (
            <div className="form-overlay">
                <div className="form-container" style={{ textAlign: 'center', padding: '40px' }}>
                    <span style={{ fontSize: '4rem' }}>✅</span>
                    <h2 style={{ color: '#4caf50' }}>Report Submitted!</h2>
                    <p>Please save your reference code:</p>
                    <div style={{ 
                        background: '#f0f0f0', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        fontSize: '2.5rem', 
                        fontWeight: 'bold', 
                        color: '#004a99',
                        letterSpacing: '2px',
                        margin: '20px 0'
                    }}>
                        {submittedCode}
                    </div>
                    <button className="submit-button" onClick={() => window.navigator.clipboard.writeText(submittedCode)}>
                        📋 Copy to Clipboard
                    </button>
                    <button className="cancel-button" style={{ marginLeft: '10px' }} onClick={onCancel}>
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="form-header">
                <h2>Report Missed Pickup</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Barangay *</label>
                    <input type="text" placeholder="e.g. Lahug" required />
                </div>
                <div className="form-group">
                    <label>Waste Type Not Collected *</label>
                    <select required>
                        <option value="bio">Biodegradable (Green)</option>
                        <option value="res">Residual (Black)</option>
                        <option value="rec">Recyclable (Blue)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Optional: Additional Details</label>
                    <textarea rows="3" placeholder="Describe the location or issue..."></textarea>
                </div>
                <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" className="create-button">Submit Report</button>
                    <button type="button" onClick={onCancel} style={{ background: '#ccc', border: 'none', padding: '10px 15px', borderRadius: '4px' }}>Cancel</button>
                </div>
            </form>
        </div>
    );
}