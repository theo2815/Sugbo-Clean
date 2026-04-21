import React, { useState, useEffect, useMemo } from 'react';
import { getAllReports } from '../../services/api';
import MetricsGrid from '../../client/components/admin/MetricsGrid';
import FilterBar from '../../client/components/admin/FilterBar';
import ReportsTable from '../../client/components/admin/ReportsTable';
import { SkeletonRows } from '../../client/components/shared/Skeleton';
import { COLORS } from '../../utils/constants';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'ALL', barangay: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadReports() {
    setError(null);
    try {
      const { result } = await getAllReports();
      setReports(result);
    } catch (err) {
      setError(err?.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = useMemo(() => {
    let result = reports;
    if (filters.status !== 'ALL') {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters.barangay !== 'ALL') {
      result = result.filter((r) => r.barangay === filters.barangay);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((r) =>
        (r.report_code || '').toLowerCase().includes(term) ||
        (r.barangay || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [reports, filters]);

  if (loading) {
    return (
      <div style={styles.page}>
        <SkeletonRows rows={6} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div role="alert" style={{
          padding: 16, border: `1px solid ${COLORS.error}`, background: '#FEF2F2',
          borderRadius: 10, color: COLORS.error, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14 }}>{error}</span>
          <button
            onClick={loadReports}
            style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${COLORS.error}`,
              background: '#fff', color: COLORS.error, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <MetricsGrid reports={reports} />
      <FilterBar onFilterChange={setFilters} resultCount={filtered.length} />
      <ReportsTable reports={filtered} onReportsChange={loadReports} />
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
};
