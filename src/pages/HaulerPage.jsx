import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHaulers } from '../services/api';
import { COLORS } from '../utils/constants';
import Card from '../client/components/shared/Card';
import Loading from '../client/components/shared/Loading';
import Button from '../client/components/shared/Button';
import BackButton from '../client/components/shared/BackButton';

export default function HaulerPage() {
    const navigate = useNavigate();
    const [haulers, setHaulers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { result } = await getHaulers();
                setHaulers(result);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <Loading message="Loading hauler directory..." />;

    return (
        <section style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
            <BackButton label="Back to Landing Page" />
            <h2>Hauler Directory</h2>
            <p style={{ color: COLORS.text.muted, marginBottom: 20 }}>
                Contracted garbage hauling companies and their contact information.
            </p>

            {haulers.length === 0 ? (
                <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>
                    No haulers registered yet.
                </p>
            ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                    {haulers.map((hauler) => (
                        <Card key={hauler.sys_id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px', color: COLORS.text.primary }}>{hauler.name}</h3>
                                    <p style={{ margin: '0 0 4px', fontSize: 14, color: COLORS.text.secondary }}>
                                        <a href={`tel:${hauler.contact_number}`} style={{ color: COLORS.secondary, textDecoration: 'none' }}>
                                            {hauler.contact_number}
                                        </a>
                                    </p>
                                    <p style={{ margin: 0, fontSize: 13, color: COLORS.text.muted }}>
                                        Areas: {hauler.areas_covered}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/route-map?hauler=${hauler.sys_id}`)}
                                >
                                    View Route
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}
