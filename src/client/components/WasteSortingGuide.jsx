import React, { useState, useEffect } from 'react';
import { Search, PackageSearch, X } from 'lucide-react';
import { getWasteItems } from '../../services/api';
import { COLORS, BIN_TYPES } from '../../utils/constants';
import Card from './shared/Card';
import BinColorTag from './shared/BinColorTag';
import Loading from './shared/Loading';
import EmptyState from './shared/EmptyState';
import Button from './shared/Button';

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

    function clearAll() {
        setSearch('');
        setActiveFilter(null);
        fetchItems();
    }

    const grouped = items.reduce((acc, item) => {
        if (!acc[item.bin_type]) acc[item.bin_type] = [];
        acc[item.bin_type].push(item);
        return acc;
    }, {});

    const hasActiveFilters = !!search || !!activeFilter;

    return (
        <div>
            {/* ── Search + Filters ── */}
            <Card style={{ marginBottom: 20 }}>
                <div style={{ position: 'relative', marginBottom: 14 }}>
                    <Search size={16} style={{
                        position: 'absolute', left: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        color: COLORS.text.muted, pointerEvents: 'none',
                    }} />
                    <input
                        type="text"
                        placeholder="Search items (e.g., battery, plastic, banana peel)..."
                        value={search}
                        onChange={handleSearch}
                        aria-label="Search waste items"
                        style={{
                            width: '100%',
                            padding: '11px 40px 11px 38px',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 10,
                            fontSize: 14,
                            boxSizing: 'border-box',
                            outline: 'none',
                        }}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); fetchItems('', activeFilter); }}
                            aria-label="Clear search"
                            style={{
                                position: 'absolute', right: 10, top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent', border: 'none',
                                cursor: 'pointer', padding: 4,
                                color: COLORS.text.muted,
                                display: 'inline-flex', alignItems: 'center',
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 8, flexWrap: 'wrap',
                }}>
                    <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        color: COLORS.text.muted,
                        marginRight: 4,
                    }}>
                        Filter by bin:
                    </span>
                    {BIN_TYPES.map((type) => {
                        const isActive = activeFilter === type;
                        return (
                            <button
                                key={type}
                                onClick={() => handleFilter(type)}
                                aria-pressed={isActive}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 999,
                                    border: `1.5px solid ${COLORS.bin[type]}`,
                                    background: isActive ? COLORS.bin[type] : 'transparent',
                                    color: isActive ? '#fff' : COLORS.bin[type],
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                            >
                                {type}
                            </button>
                        );
                    })}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearAll}
                            style={{
                                marginLeft: 'auto',
                                padding: '6px 10px',
                                border: 'none',
                                background: 'transparent',
                                color: COLORS.text.secondary,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: 'underline',
                            }}
                        >
                            Clear all
                        </button>
                    )}
                </div>
            </Card>

            {/* ── Results ── */}
            {loading ? (
                <Loading message="Loading waste items..." />
            ) : items.length === 0 ? (
                <EmptyState
                    icon={PackageSearch}
                    title="No items match your search"
                    message="Try a different keyword or clear your filters to browse all items."
                    action={
                        hasActiveFilters ? (
                            <Button variant="outline" size="sm" onClick={clearAll}>
                                Clear filters
                            </Button>
                        ) : null
                    }
                />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 20,
                }}>
                    {Object.entries(grouped).map(([binType, binItems]) => {
                        const binKey = binType.charAt(0).toUpperCase() + binType.slice(1).toLowerCase();
                        return (
                        <Card key={binType} accentColor={COLORS.bin[binKey]}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 12,
                            }}>
                                <BinColorTag binType={binType} />
                                <span style={{
                                    fontSize: 12,
                                    color: COLORS.text.muted,
                                    fontWeight: 600,
                                }}>
                                    {binItems.length} {binItems.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}>
                                {binItems.map((item) => (
                                    <li
                                        key={item.sys_id}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            background: COLORS.bg.muted,
                                        }}
                                    >
                                        <div style={{
                                            color: COLORS.text.primary,
                                            fontWeight: 600,
                                            fontSize: 14,
                                        }}>
                                            {item.name}
                                        </div>
                                        <div style={{
                                            color: COLORS.text.secondary,
                                            fontSize: 13,
                                            marginTop: 2,
                                            lineHeight: 1.45,
                                            overflowWrap: 'anywhere',
                                        }}>
                                            {item.disposal_instructions}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
