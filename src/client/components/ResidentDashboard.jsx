import React, { useState } from 'react';
import ScheduleChecker from './ScheduleChecker';
import WasteSortingGuide from './WasteSortingGuide';
import HaulerMap from './HaulerMap';
import MissedPickupForm from './MissedPickupForm';

export default function ResidentDashboard({ onBack }) {
    const [activeTab, setActiveTab] = useState('hub');

    const renderContent = () => {
        switch(activeTab) {
            case 'schedule': return <ScheduleChecker />;
            case 'report': return <MissedPickupForm onCancel={() => setActiveTab('hub')} />;
            case 'guide': return <WasteSortingGuide />;
            case 'map': return <HaulerMap />;
            case 'track': return <StatusTracker />; // We can add this simple lookup later
            default: return <ResidentHub onNavigate={setActiveTab} />;
        }
    };

    return (
        <div className="incident-app">
            <header className="app-header">
                <h2>Resident Portal</h2>
                <button className="cancel-button" onClick={onBack}>Back to Selection</button>
            </header>
            {activeTab !== 'hub' && (
                <button 
                    onClick={() => setActiveTab('hub')} 
                    style={{ marginBottom: '20px', cursor: 'pointer', background: 'none', border: 'none', color: '#2196f3', fontWeight: 'bold' }}
                >
                    ← Back to Menu
                </button>
            )}
            {renderContent()}
        </div>
    );
}