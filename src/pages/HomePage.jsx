import React from 'react';
import { useNavigate } from 'react-router-dom';
import SugboLanding from '../client/components/SugboLanding';

export default function HomePage() {
    const navigate = useNavigate();

    const handlePortalSelect = (portalId) => {
        if (portalId === 'resident') navigate('/resident');
        else if (portalId === 'admin') navigate('/admin/login');
    };

    return <SugboLanding onViewChange={handlePortalSelect} />;
}
