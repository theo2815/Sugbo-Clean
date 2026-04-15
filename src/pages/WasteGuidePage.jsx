import React from 'react';
import WasteSortingGuide from '../client/components/WasteSortingGuide';
import BackButton from '../client/components/shared/BackButton';

export default function WasteGuidePage() {
    return (
        <section style={{ padding: 20, maxWidth: 960, margin: '0 auto' }}>
            <BackButton label="Back to Resident Hub" />
            <h2>Waste Sorting Guide</h2>
            <WasteSortingGuide />
        </section>
    );
}
