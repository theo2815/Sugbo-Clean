import React from 'react';
import MissedPickupForm from '../client/components/MissedPickupForm';
import BackButton from '../client/components/shared/BackButton';

export default function ReportPage() {
    return (
        <section style={{ padding: 20, maxWidth: 640, margin: '0 auto' }}>
            <BackButton label="Back to Resident Hub" />
            <h2>Report a Missed Pickup</h2>
            <MissedPickupForm />
        </section>
    );
}
