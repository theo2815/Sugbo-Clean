import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Copy, CalendarDays, MapPin, SearchX } from 'lucide-react';
import { getReportByCode, subscribeToReports } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import StatusStepper from './StatusStepper';
import Button from '../shared/Button';
import Card from '../shared/Card';
import EmptyState from '../shared/EmptyState';

export default function ReportTracker() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [report, setReport] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode);
      doSearch(queryCode);
    }
  }, []);

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
    <div>
      <Card style={{ marginBottom: 20 }}>
        <label
          htmlFor="report-code"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.text.secondary,
            display: 'block',
            marginBottom: 8,
          }}
        >
          Report Code
        </label>
        <div style={{
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
          flexWrap: 'wrap',
        }}>
          <div style={{
            flex: '1 1 240px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={16} style={{
              position: 'absolute', left: 12,
              color: COLORS.text.muted, pointerEvents: 'none',
            }} />
            <input
              id="report-code"
              style={{
                width: '100%',
                padding: '11px 12px 11px 38px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                fontSize: 14,
                background: COLORS.bg.card,
                color: COLORS.text.primary,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                letterSpacing: 1,
              }}
              placeholder="SC-2026-0001"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              aria-label="Report code"
              autoComplete="off"
            />
          </div>
          <Button onClick={() => doSearch()} loading={loading} disabled={!code.trim()}>
            Track
          </Button>
        </div>
        <p style={{
          margin: '10px 0 0', fontSize: 12, color: COLORS.text.muted,
        }}>
          Your code was shown after you submitted your report.
        </p>
      </Card>

      {report && (
        <Card>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 8,
            paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <span style={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '1.05rem',
              color: COLORS.text.primary,
              letterSpacing: 1,
            }}>
              {report.report_code}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 16,
            padding: '14px 0', fontSize: 13, color: COLORS.text.secondary,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> {report.barangay}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} /> {report.missed_date}
            </span>
            <span style={{
              padding: '2px 10px',
              borderRadius: 999,
              background: COLORS.bg.muted,
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.text.primary,
            }}>
              {report.waste_type}
            </span>
          </div>

          <StatusStepper status={report.status} />
        </Card>
      )}

      {notFound && (
        <EmptyState
          icon={SearchX}
          title="No report found"
          message={`We couldn't find a report with the code "${code}". Double-check your code and try again.`}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/report')}
            >
              File a New Report
            </Button>
          }
        />
      )}
    </div>
  );
}
