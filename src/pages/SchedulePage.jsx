import React from 'react';
import ScheduleChecker from '../client/components/ScheduleChecker';
import ReminderSignup from '../client/components/resident/ReminderSignup';
import BackButton from '../client/components/shared/BackButton';

export default function SchedulePage() {
    return (
        <section style={{ padding: 20, maxWidth: 640, margin: '0 auto' }}>
            <BackButton label="Back to Landing Page" />
            <h2>Pickup Schedule</h2>
            <ScheduleChecker />
            <ReminderSignup />
        </section>
    );
}
