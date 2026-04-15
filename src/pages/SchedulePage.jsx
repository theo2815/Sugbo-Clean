import React from 'react';
import { Calendar } from 'lucide-react';
import ScheduleChecker from '../client/components/ScheduleChecker';
import ReminderSignup from '../client/components/resident/ReminderSignup';
import PageHeader from '../client/components/shared/PageHeader';
import { COLORS } from '../utils/constants';

export default function SchedulePage() {
    return (
        <section style={{ padding: '24px 5% 48px', maxWidth: 1000, margin: '0 auto' }}>
            <PageHeader
                icon={Calendar}
                title="Your Pickup Schedule"
                subtitle="Select your barangay to see collection days, your assigned hauler, and the route."
                accent={COLORS.primary}
            />
            <ScheduleChecker />
            <div style={{ marginTop: 24 }}>
                <ReminderSignup />
            </div>
        </section>
    );
}
