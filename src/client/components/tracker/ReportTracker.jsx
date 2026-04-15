import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getReportByCode, subscribeToReports } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import StatusStepper from './StatusStepper';
import Button from '../shared/Button';

export default function ReportTracker() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [report, setReport] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-fill from query param
  useEffect(() => {
    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode);
      doSearch(queryCode);
    }
  }, []);

  // Live subscription — update displayed report when status changes
  useEffect(() => {
    const unsubscribe = subscribeToReports((reports) => {
      if (report) {
        const updated = reports.find((r) => r.report_code === report.report_code);
        if (updated && updated.status !== report.status) {
          setReport({ ...updated });
        }
      }
    });
    return unsubscribe;
  }, [report]);

  async function doSearch(searchCode) {
    const trimmed = (searchCode || code).trim();
    if (!trimmed) return;
    setLoading(true);
    setNotFound(false);
    try {
      const { result } = await getReportByCode(trimmed);
      setReport(result);
    } catch {
      setReport(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (report) {
      navigator.clipboard.writeText(report.report_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Track Your Report</h2>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder="Enter SC-2026-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          aria-label="Report code"
        />
        <Button onClick={() => doSearch()} loading={loading}>
          Track
        </Button>
      </div>

      {report && (
        <div style={styles.resultBox}>
          <div style={styles.header}>
            <span style={styles.reportId}>{report.report_code}</span>
            <span style={styles.barangay}>{report.barangay}</span>
          </div>

          <div style={{ fontSize: 13, color: COLORS.text.muted, marginBottom: 8 }}>
            Missed date: {report.missed_date} &middot; {report.waste_type}
          </div>

          <StatusStepper status={report.status} />

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        </div>
      )}

      {notFound && (
        <div style={styles.notFoundCard}>
          <span style={{ fontSize: '2rem' }}>&#128269;</span>
          <h3 style={{ margin: '8px 0 4px', color: COLORS.text.primary }}>Report Not Found</h3>
          <p style={{ margin: 0, color: COLORS.text.muted, fontSize: 14 }}>
            No report matches the code "{code}". Please double-check and try again.
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: '40px auto',
    padding: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 16,
    color: COLORS.text.primary,
  },
  searchBox: {
    display: 'flex',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
  },
  resultBox: {
    padding: 16,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.bg.card,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportId: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  barangay: {
    color: COLORS.text.secondary,
  },
  notFoundCard: {
    textAlign: 'center',
    padding: 30,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.bg.muted,
  },
};
