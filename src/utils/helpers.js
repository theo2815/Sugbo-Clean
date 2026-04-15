import { COLORS, STATUS_COLOR_MAP } from './constants';

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatReportCode(code) {
  return code || '';
}

export function getStatusColor(status) {
  return STATUS_COLOR_MAP[status] || COLORS.text.muted;
}

export function getBinColor(binType) {
  return COLORS.bin[binType] || COLORS.text.muted;
}

let reportCounter = 0;

export function generateReportCode() {
  reportCounter += 1;
  const num = String(reportCounter).padStart(4, '0');
  return `SC-2026-${num}`;
}

export function initReportCounter(existingCount) {
  reportCounter = existingCount;
}
