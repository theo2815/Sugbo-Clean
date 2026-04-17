import React from 'react';
import { Recycle } from 'lucide-react';
import WasteSortingGuide from '../client/components/WasteSortingGuide';
import PageHeader from '../client/components/shared/PageHeader';
import { COLORS } from '../utils/constants';

export default function WasteGuidePage() {
    return (
        <section style={{ padding: '24px 5% 48px', maxWidth: 1000, margin: '0 auto' }}>
            <PageHeader
                icon={Recycle}
                title="Waste Sorting Guide"
                subtitle="Search any item or filter by bin color to know exactly where it belongs."
                accent={COLORS.success}
            />
            <WasteSortingGuide />
        </section>
    );
}
