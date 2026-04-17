import React from 'react';
import { AlertTriangle } from 'lucide-react';
import MissedPickupForm from '../client/components/MissedPickupForm';
import PageHeader from '../client/components/shared/PageHeader';
import { COLORS } from '../utils/constants';

export default function ReportPage() {
    return (
        <section style={{ padding: '24px 5% 48px', maxWidth: 720, margin: '0 auto' }}>
            <PageHeader
                icon={AlertTriangle}
                title="Report a Missed Pickup"
                subtitle="Fill out the form below. You'll receive a reference code to track progress."
                accent={COLORS.warning}
            />
            <MissedPickupForm />
        </section>
    );
}
