import React, { useState, useEffect } from 'react';
import { getWasteItems } from '../../services/api';
import { COLORS, BIN_TYPES } from '../../utils/constants';
import Card from './shared/Card';
import BinColorTag from './shared/BinColorTag';
import Loading from './shared/Loading';

export default function WasteSortingGuide() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState(null);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems(searchTerm, binType) {
        setLoading(true);
        try {
            const { result } = await getWasteItems(searchTerm || undefined, binType || undefined);
            setItems(result);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        const term = e.target.value;
        setSearch(term);
        fetchItems(term, activeFilter);
    }

    function handleFilter(binType) {
        const next = activeFilter === binType ? null : binType;
        setActiveFilter(next);
        fetchItems(search, next);
    }

    // Group items by bin type for display
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.bin_type]) acc[item.bin_type] = [];
        acc[item.bin_type].push(item);
        return acc;
    }, {});

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search items (e.g., battery, plastic)..."
                    value={search}
                    onChange={handleSearch}
                    aria-label="Search waste items"
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        marginBottom: 12,
                    }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {BIN_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilter(type)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: `1px solid ${COLORS.bin[type]}`,
                                background: activeFilter === type ? COLORS.bin[type] : 'transparent',
                                color: activeFilter === type ? '#fff' : COLORS.bin[type],
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <Loading message="Loading waste items..." />
            ) : items.length === 0 ? (
                <p style={{ color: COLORS.text.muted, textAlign: 'center', padding: 30 }}>
                    No waste items match your search.
                </p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                    {Object.entries(grouped).map(([binType, binItems]) => (
                        <Card key={binType} accentColor={COLORS.bin[binType]}>
                            <h3 style={{ color: COLORS.bin[binType], marginTop: 0 }}>
                                <BinColorTag binType={binType} />
                            </h3>
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                {binItems.map((item) => (
                                    <li key={item.sys_id} style={{ marginBottom: 8, color: COLORS.text.secondary, fontSize: 14 }}>
                                        <strong style={{ color: COLORS.text.primary }}>{item.name}</strong>
                                        <br />
                                        <span style={{ fontSize: 13 }}>{item.disposal_instructions}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
