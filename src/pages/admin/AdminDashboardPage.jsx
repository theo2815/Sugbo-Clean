import React, { useState, useEffect, useMemo } from 'react';
import { getAllReports } from '../../services/api';
import MetricsGrid from '../../client/components/admin/MetricsGrid';
import FilterBar from '../../client/components/admin/FilterBar';
import ReportsTable from '../../client/components/admin/ReportsTable';
import { SkeletonRows } from '../../client/components/shared/Skeleton';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'ALL', barangay: 'ALL' });
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    const { result } = await getAllReports();
    setReports(result);
    setLoading(false);
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

  return (
    <div style={styles.page}>
      <MetricsGrid reports={reports} />
      <FilterBar onFilterChange={setFilters} resultCount={filtered.length} />
      <ReportsTable reports={filtered} onStatusChange={loadReports} />
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
