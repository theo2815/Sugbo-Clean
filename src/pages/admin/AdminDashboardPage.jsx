import React, { useState, useEffect, useCallback } from 'react';
import { getAllReports, subscribeToReports } from '../../services/api';
import MetricsGrid from '../../client/components/admin/MetricsGrid';
import FilterBar from '../../client/components/admin/FilterBar';
import ReportsTable from '../../client/components/admin/ReportsTable';
import Loading from '../../client/components/shared/Loading';

export default function AdminDashboardPage() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'ALL', barangay: 'ALL' });
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    const { result } = await getAllReports();
    setReports(result);
    applyFilters(result, filters);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Live subscription for status updates
  useEffect(() => {
    const unsub = subscribeToReports(() => {
      loadReports();
    });
    return unsub;
  }, [loadReports]);

  function applyFilters(data, f) {
    let result = data;
    if (f.status !== 'ALL') {
      result = result.filter((r) => r.status === f.status);
    }
    if (f.barangay !== 'ALL') {
      result = result.filter((r) => r.barangay === f.barangay);
    }
    if (f.search) {
      const term = f.search.toLowerCase();
      result = result.filter((r) =>
        r.report_code.toLowerCase().includes(term) ||
        r.barangay.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    applyFilters(reports, newFilters);
  }

  if (loading) return <Loading message="Loading reports..." />;

  return (
    <div>
      <MetricsGrid reports={reports} />
      <FilterBar onFilterChange={handleFilterChange} />
      <ReportsTable reports={filtered} onStatusChange={loadReports} />
    </div>
  );
}
