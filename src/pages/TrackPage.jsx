import React from 'react';
import { Search } from 'lucide-react';
import ReportTracker from '../client/components/tracker/ReportTracker';
import PageHeader from '../client/components/shared/PageHeader';
import { COLORS } from '../utils/constants';

export default function TrackPage() {
    return (
        <section style={{ padding: '24px 5% 48px', maxWidth: 720, margin: '0 auto' }}>
            <PageHeader
                icon={Search}
                title="Track My Report"
                subtitle="Enter the code you received after filing your report (e.g. SC-2026-0001)."
                accent={COLORS.secondary}
            />
            <ReportTracker />
        </section>
    );
}
