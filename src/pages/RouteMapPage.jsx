import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRouteStops, getHaulers } from '../services/api';
import HaulerMap from '../client/components/HaulerMap';
import Select from '../client/components/shared/Select';
import Loading from '../client/components/shared/Loading';
import BackButton from '../client/components/shared/BackButton';

export default function RouteMapPage() {
    const [searchParams] = useSearchParams();
    const [haulers, setHaulers] = useState([]);
    const [selectedHauler, setSelectedHauler] = useState(searchParams.get('hauler') || '');
    const [stops, setStops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stopsLoading, setStopsLoading] = useState(false);

    useEffect(() => {
        async function load() {
            const { result } = await getHaulers();
            setHaulers(result);
            setLoading(false);

            // Auto-load if hauler is in query params
            const haulerId = searchParams.get('hauler');
            if (haulerId) {
                loadStops(haulerId);
            }
        }
        load();
    }, []);

    async function loadStops(haulerId) {
        if (!haulerId) {
            setStops([]);
            return;
        }
        setStopsLoading(true);
        try {
            const { result } = await getRouteStops(haulerId);
            setStops(result);
        } finally {
            setStopsLoading(false);
        }
    }

    function handleHaulerChange(e) {
        setSelectedHauler(e.target.value);
        loadStops(e.target.value);
    }

    const haulerName = haulers.find((h) => h.sys_id === selectedHauler)?.name;

    if (loading) return <Loading message="Loading..." />;

    return (
        <section style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
            <BackButton to={searchParams.get('hauler') ? '/haulers' : '/resident'} label={searchParams.get('hauler') ? 'Back to Haulers' : 'Back to Resident Hub'} />
            <h2>Hauler Route Map</h2>
            <Select
                label="Select Hauler"
                name="hauler"
                value={selectedHauler}
                onChange={handleHaulerChange}
                options={haulers.map((h) => ({ value: h.sys_id, label: h.name }))}
                placeholder="-- Select a hauler --"
            />
            {stopsLoading ? (
                <Loading message="Loading route stops..." />
            ) : (
                <HaulerMap stops={stops} haulerName={haulerName} />
            )}
        </section>
    );
}
