import React, { useState, useEffect, useMemo } from 'react';
import {
  getSchedules, createSchedule, updateSchedule, deleteSchedule,
} from '../../../services/api';
import { COLORS, WASTE_TYPES, DAYS_OF_WEEK } from '../../../utils/constants';
import { fromGlideTime, toGlideTime, formatTime12h } from '../../../utils/helpers';
import Button from '../shared/Button';
import Select from '../shared/Select';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';

function titleCase(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }

const EMPTY_FORM = { waste_type: '', day_of_week: '', time_window_start: '', time_window_end: '' };

export default function HaulerScheduleManager({ hauler, onChanged }) {
  const haulerId = hauler?.sys_id || '';
  const haulerName = hauler?.name || '';
  const haulerBarangayId = hauler?.barangay_id || '';
  const haulerBarangayName = hauler?.barangay || '';

  const [allSchedules, setAllSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getSchedules();
      setAllSchedules(res.result);
    } catch (err) {
      setToast({ message: err?.message || 'Failed to load schedules.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    const res = await getSchedules();
    setAllSchedules(res.result);
  }

  const schedules = useMemo(() => {
    if (!haulerId) return [];
    return allSchedules.filter((row) => row?.hauler_id === haulerId);
  }, [allSchedules, haulerId]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      waste_type: titleCase(item.waste_type),
      day_of_week: titleCase(item.day_of_week),
      time_window_start: fromGlideTime(item.time_window_start),
      time_window_end: fromGlideTime(item.time_window_end),
    });
    setEditingId(item.sys_id);
    setError('');
    setShowForm(true);
  }

  async function save(e) {
    e.preventDefault();
    if (!haulerBarangayId) {
      setError('This hauler has no assigned barangay. Assign one in the Hauler page first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        time_window_start: toGlideTime(form.time_window_start),
        time_window_end: toGlideTime(form.time_window_end),
        hauler: haulerId,
        barangay: haulerBarangayId,
      };
      if (editingId) {
        await updateSchedule(editingId, payload);
        setToast({ message: 'Schedule updated.', type: 'success' });
      } else {
        await createSchedule(payload);
        setToast({ message: 'Schedule created.', type: 'success' });
      }
      setShowForm(false);
      await reload();
      onChanged?.();
    } catch (err) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    setSubmitting(true);
    try {
      await deleteSchedule(confirmDelete.sysId);
      setToast({ message: 'Schedule deleted.', type: 'success' });
      setConfirmDelete(null);
      await reload();
      onChanged?.();
    } catch (err) {
      setToast({ message: err?.message || 'Delete failed.', type: 'error' });
      setConfirmDelete(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h4 style={styles.h4}>Schedules for {haulerName || '—'}</h4>
          {haulerBarangayName && (
            <div style={{ fontSize: 12, color: COLORS.text.muted, marginTop: 2 }}>
              Barangay: <strong>{haulerBarangayName}</strong>
            </div>
          )}
        </div>
        <Button size="sm" onClick={openNew} disabled={!haulerId}>+ New Schedule</Button>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <form onSubmit={save}>
            {error && (
              <div role="alert" style={styles.alert}>{error}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0 16px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.miniLabel}>
                  Barangay
                  <input
                    type="text"
                    value={haulerBarangayName || '— not set —'}
                    disabled
                    style={{ ...styles.miniInput, marginTop: 6, background: COLORS.bg.muted, color: COLORS.text.secondary }}
                  />
                </label>
              </div>
              <Select label="Waste Type" name="waste_type" value={form.waste_type}
                onChange={(e) => setForm({ ...form, waste_type: e.target.value })}
                options={WASTE_TYPES.map((w) => ({ value: w, label: w }))} required />
              <Select label="Day" name="day_of_week" value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
                options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))} required />
              <div style={{ marginBottom: 16 }}>
                <label style={styles.miniLabel}>
                  Start Time
                  <input type="time" value={form.time_window_start}
                    onChange={(e) => setForm({ ...form, time_window_start: e.target.value })}
                    required style={{ ...styles.miniInput, marginTop: 6 }} />
                </label>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={styles.miniLabel}>
                  End Time
                  <input type="time" value={form.time_window_end}
                    onChange={(e) => setForm({ ...form, time_window_end: e.target.value })}
                    required style={{ ...styles.miniInput, marginTop: 6 }} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" loading={submitting} disabled={submitting}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: COLORS.text.muted, fontSize: 14 }}>Loading schedules…</p>
      ) : schedules.length === 0 ? (
        <p style={{ color: COLORS.text.muted, fontSize: 14 }}>No schedules for this hauler yet.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Waste Type', 'Day', 'Time', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {schedules.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.waste_type}</td>
                <td style={tableStyles.td}>{item.day_of_week}</td>
                <td style={tableStyles.td}>{formatTime12h(item.time_window_start)} – {formatTime12h(item.time_window_end)}</td>
                <td style={tableStyles.td}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => setConfirmDelete({ sysId: item.sys_id, label: `${item.day_of_week} · ${item.waste_type}` })}
                    style={{ color: COLORS.error }}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete schedule?"
        message={confirmDelete ? `"${confirmDelete.label}" will be removed from the weekly schedule.` : ''}
        loading={submitting}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </section>
  );
}

const styles = {
  card: {
    padding: 16,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    background: COLORS.bg.card,
  },
  h4: { margin: 0, fontSize: 15, fontWeight: 700, color: COLORS.text.primary },
  formBox: {
    padding: 14, marginBottom: 14,
    border: `1px solid ${COLORS.border}`, borderRadius: 10,
    background: COLORS.bg.muted,
  },
  alert: {
    padding: '10px 14px', background: '#FEF2F2', border: `1px solid ${COLORS.error}`,
    borderRadius: 8, color: COLORS.error, fontSize: 13, marginBottom: 12,
  },
  miniLabel: { display: 'flex', flexDirection: 'column', fontSize: 12, color: COLORS.text.secondary, fontWeight: 500 },
  miniInput: {
    width: '100%', padding: '6px 8px',
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    fontSize: 13, boxSizing: 'border-box',
  },
};

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text.muted, fontSize: 12, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: `1px solid ${COLORS.bg.muted}`, color: COLORS.text.secondary },
};
