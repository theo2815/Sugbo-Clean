import React, { useState, useEffect } from 'react';
import { getBarangays } from '../../../services/api';
import { COLORS, STATUS } from '../../../utils/constants';

export default function FilterBar({ onFilterChange }) {
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

  function handleChange(updated) {
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

  return (
    <div style={styles.bar}>
      <input
        style={styles.input}
        placeholder="Search SC-2026-0001..."
        value={search}
        onChange={(e) => handleChange({ search: e.target.value })}
        aria-label="Search reports"
      />
      <select
        style={styles.select}
        value={status}
        onChange={(e) => handleChange({ status: e.target.value })}
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
        onChange={(e) => handleChange({ barangay: e.target.value })}
        aria-label="Filter by barangay"
      >
        <option value="ALL">All Barangay</option>
        {barangays.map((b) => (
          <option key={b.sys_id} value={b.name}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex',
    gap: 12,
    margin: '20px 0',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: 200,
    padding: 10,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
  },
  select: {
    padding: 10,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
  },
};
