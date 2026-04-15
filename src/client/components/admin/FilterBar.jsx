import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { getBarangays } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';

export default function FilterBar({ onFilterChange, resultCount }) {
  const [barangays, setBarangays] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [barangay, setBarangay] = useState('ALL');

  useEffect(() => {
    async function load() {
      const { result } = await getBarangays();
      setBarangays(result);
    }
    load();
  }, []);

  function applyChange(updated) {
    const newFilters = {
      search: updated.search ?? search,
      status: updated.status ?? status,
      barangay: updated.barangay ?? barangay,
    };
    if (updated.search !== undefined) setSearch(updated.search);
    if (updated.status !== undefined) setStatus(updated.status);
    if (updated.barangay !== undefined) setBarangay(updated.barangay);
    onFilterChange(newFilters);
  }

  function clearAll() {
    setSearch('');
    setStatus('ALL');
    setBarangay('ALL');
    onFilterChange({ search: '', status: 'ALL', barangay: 'ALL' });
  }

  const activeChips = [];
  if (status !== 'ALL') activeChips.push({ label: `Status: ${status}`, key: 'status' });
  if (barangay !== 'ALL') activeChips.push({ label: `Barangay: ${barangay}`, key: 'barangay' });
  if (search) activeChips.push({ label: `"${search}"`, key: 'search' });

  function removeChip(key) {
    if (key === 'status') applyChange({ status: 'ALL' });
    if (key === 'barangay') applyChange({ barangay: 'ALL' });
    if (key === 'search') applyChange({ search: '' });
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <div style={styles.searchWrap}>
          <Search size={16} style={styles.searchIcon} />
          <input
            style={styles.input}
            placeholder="Search by code or barangay…"
            value={search}
            onChange={(e) => applyChange({ search: e.target.value })}
            aria-label="Search reports"
          />
          {search && (
            <button
              type="button"
              onClick={() => applyChange({ search: '' })}
              aria-label="Clear search"
              style={styles.clearBtn}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={styles.selectGroup}>
          <SlidersHorizontal size={15} color={COLORS.text.muted} />
          <select
            style={styles.select}
            value={status}
            onChange={(e) => applyChange({ status: e.target.value })}
            aria-label="Filter by status"
          >
            <option value="ALL">All Status</option>
            {Object.values(STATUS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            style={styles.select}
            value={barangay}
            onChange={(e) => applyChange({ barangay: e.target.value })}
            aria-label="Filter by barangay"
          >
            <option value="ALL">All Barangays</option>
            {barangays.map((b) => (
              <option key={b.sys_id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {(activeChips.length > 0 || typeof resultCount === 'number') && (
        <div style={styles.chipRow}>
          {typeof resultCount === 'number' && (
            <span style={styles.count}>
              {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </span>
          )}
          {activeChips.map((c) => (
            <span key={c.key} style={styles.chip}>
              {c.label}
              <button
                type="button"
                onClick={() => removeChip(c.key)}
                aria-label={`Remove ${c.label}`}
                style={styles.chipX}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {activeChips.length > 0 && (
            <button type="button" onClick={clearAll} style={styles.clearLink}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: {
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 14,
  },
  row: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 260px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    color: COLORS.text.muted,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '10px 36px 10px 38px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'transparent',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    color: COLORS.text.muted,
    display: 'inline-flex',
  },
  selectGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  select: {
    padding: '9px 10px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    fontSize: 13,
    background: '#fff',
    color: COLORS.text.primary,
    cursor: 'pointer',
  },
  chipRow: {
    marginTop: 12,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTop: `1px dashed ${COLORS.border}`,
  },
  count: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 4,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 4px 4px 10px',
    background: COLORS.secondaryLight,
    color: COLORS.secondaryDark,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  chipX: {
    background: 'transparent',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    color: COLORS.secondaryDark,
    display: 'inline-flex',
    borderRadius: '50%',
  },
  clearLink: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
