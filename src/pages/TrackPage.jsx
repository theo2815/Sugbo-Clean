import React from 'react';
import ReportTracker from '../client/components/tracker/ReportTracker';
import BackButton from '../client/components/shared/BackButton';

export default function TrackPage() {
    return (
        <section style={{ padding: 20 }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <BackButton label="Back to Resident Hub" />
            </div>
            <ReportTracker />
        </section>
    );
}
