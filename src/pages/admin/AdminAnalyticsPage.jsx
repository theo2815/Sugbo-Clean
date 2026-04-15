import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { getAllReports } from '../../services/api';
import { COLORS } from '../../utils/constants';
import Card from '../../client/components/shared/Card';
import Loading from '../../client/components/shared/Loading';

const WASTE_COLORS = {
  Biodegradable: COLORS.bin.Biodegradable,
  Recyclable: COLORS.bin.Recyclable,
  Residual: COLORS.bin.Residual,
  Hazardous: COLORS.bin.Hazardous,
};

export default function AdminAnalyticsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    async function load() {
      const { result } = await getAllReports();
      setReports(result);
      setLoading(false);
    }
    load();
  }, []);

  // Apply date filter
  const filtered = reports.filter((r) => {
    if (dateFrom && r.missed_date < dateFrom) return false;
    if (dateTo && r.missed_date > dateTo) return false;
    return true;
  });

  // Bar chart — reports by barangay
  const barangayCounts = {};
  filtered.forEach((r) => {
    barangayCounts[r.barangay] = (barangayCounts[r.barangay] || 0) + 1;
  });
  const barData = Object.entries(barangayCounts).map(([name, count]) => ({ name, count }));

  // Pie chart — by waste type
  const wasteCounts = {};
  filtered.forEach((r) => {
    wasteCounts[r.waste_type] = (wasteCounts[r.waste_type] || 0) + 1;
  });
  const pieData = Object.entries(wasteCounts).map(([name, value]) => ({ name, value }));

  // Line chart — filed vs resolved by date
  const dateMap = {};
  filtered.forEach((r) => {
    const date = r.missed_date;
    if (!dateMap[date]) dateMap[date] = { date, filed: 0, resolved: 0 };
    dateMap[date].filed += 1;
    if (r.status === 'Resolved') dateMap[date].resolved += 1;
  });
  const lineData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  if (loading) return <Loading message="Loading analytics..." />;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14, color: COLORS.text.secondary }}>Date Range:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInputStyle} />
        <span style={{ color: COLORS.text.muted }}>to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        <Card>
          <h4 style={{ marginTop: 0, color: COLORS.text.primary }}>Reports by Barangay</h4>
          {barData.length === 0 ? (
            <p style={{ color: COLORS.text.muted, textAlign: 'center' }}>No data for selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h4 style={{ marginTop: 0, color: COLORS.text.primary }}>Reports by Waste Type</h4>
          {pieData.length === 0 ? (
            <p style={{ color: COLORS.text.muted, textAlign: 'center' }}>No data for selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={WASTE_COLORS[entry.name] || COLORS.text.muted} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card style={{ gridColumn: '1 / -1' }}>
          <h4 style={{ marginTop: 0, color: COLORS.text.primary }}>Reports Filed vs Resolved Over Time</h4>
          {lineData.length === 0 ? (
            <p style={{ color: COLORS.text.muted, textAlign: 'center' }}>No data for selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="filed" stroke={COLORS.status.pending} strokeWidth={2} name="Filed" />
                <Line type="monotone" dataKey="resolved" stroke={COLORS.status.resolved} strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

const dateInputStyle = {
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: 14,
};
