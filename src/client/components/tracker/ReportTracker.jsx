import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Copy, CalendarDays, MapPin, SearchX, RotateCcw } from 'lucide-react';
import { getReportByCode, ApiError } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import StatusStepper from './StatusStepper';
import Button from '../shared/Button';
import Card from '../shared/Card';
import EmptyState from '../shared/EmptyState';

function formatAgo(ts) {
  if (!ts) return '';
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export default function ReportTracker() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null); // { kind: 'notFound' | 'network', message }
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode);
      doSearch(queryCode);
    }
  }, []);

  // Poll every 10s when a report is loaded so updates appear without manual refresh.
  useEffect(() => {
    if (!report) return;
    const reportCode = report.report_code;
    const interval = setInterval(async () => {
      try {
        const { result } = await getReportByCode(reportCode);
        if (result) {
          setReport(result);
          setLastUpdated(Date.now());
        }
      } catch {
        // Silently ignore polling errors — user can still manually re-search.
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [report?.report_code]);

  // Re-render every 5s so "Xs ago" label stays current without re-fetching.
  useEffect(() => {
    if (!report) return;
    const tick = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(tick);
  }, [report]);

  async function doSearch(searchCode) {
    const trimmed = (searchCode || code).trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const { result } = await getReportByCode(trimmed);
      setReport(result);
      setLastUpdated(Date.now());
    } catch (err) {
      setReport(null);
      if (err instanceof ApiError && err.isNotFound) {
        setError({ kind: 'notFound' });
      } else if (err instanceof ApiError && err.isNetwork) {
        setError({ kind: 'network', message: err.message });
      } else {
        setError({ kind: 'network', message: err?.message || 'Something went wrong. Please try again.' });
      }
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: COLORS.text.primary,
                letterSpacing: 1,
              }}>
                {report.report_code}
              </span>
              {lastUpdated && (
                <span aria-live="polite" style={{ fontSize: 11, color: COLORS.text.muted }}>
                  Last updated {formatAgo(lastUpdated)}
                </span>
              )}
            </div>
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

      {error?.kind === 'notFound' && (
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

      {error?.kind === 'network' && (
        <div role="alert" aria-live="assertive" style={{
          padding: 16, border: `1px solid ${COLORS.error}`, background: '#FEF2F2',
          borderRadius: 10, color: COLORS.error, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14 }}>
            {error.message || 'Something went wrong. Please try again.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => doSearch()}>
            <RotateCcw size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
