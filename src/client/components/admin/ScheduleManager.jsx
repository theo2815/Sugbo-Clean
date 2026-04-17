import React, { useState, useEffect } from 'react';
import { getSchedules, getBarangays, getHaulers, createSchedule, updateSchedule, deleteSchedule } from '../../../services/api';
import { COLORS, WASTE_TYPES, DAYS_OF_WEEK } from '../../../utils/constants';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';

const EMPTY_FORM = { barangay: '', hauler: '', waste_type: '', day_of_week: '', time_window_start: '', time_window_end: '' };

export default function ScheduleManager() {
  const [items, setItems] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [haulers, setHaulers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [schedRes, brgyRes, haulRes] = await Promise.all([getSchedules(), getBarangays(), getHaulers()]);
    setItems(schedRes.result);
    setBarangays(brgyRes.result);
    setHaulers(haulRes.result);
    setLoading(false);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      barangay: item.barangay_id || '',
      hauler: item.hauler_id || '',
      waste_type: item.waste_type,
      day_of_week: item.day_of_week,
      time_window_start: item.time_window_start,
      time_window_end: item.time_window_end,
    });
    setEditing(item.sys_id);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) await updateSchedule(editing, form);
      else await createSchedule(form);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const sysId = confirm.sysId;
    setSubmitting(true);
    try {
      await deleteSchedule(sysId);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err?.message || 'Delete failed.');
      setConfirm(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="Loading schedules..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Schedules ({items.length})</h3>
        <Button size="sm" onClick={openNew}>+ New Schedule</Button>
      </div>

      {showForm && (
        <div style={formStyles.card}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div role="alert" aria-live="assertive" style={{
                padding: '10px 14px', background: '#FEF2F2', border: `1px solid ${COLORS.error}`,
                borderRadius: 8, color: COLORS.error, fontSize: 13, marginBottom: 12,
              }}>{error}</div>
            )}
            <div style={formStyles.grid}>
              <Select name="barangay" label="Barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))} required />
              <Select name="hauler" label="Hauler" value={form.hauler} onChange={(e) => setForm({ ...form, hauler: e.target.value })} options={haulers.map((h) => ({ value: h.sys_id, label: h.name }))} required />
              <Select name="waste_type" label="Waste Type" value={form.waste_type} onChange={(e) => setForm({ ...form, waste_type: e.target.value })} options={WASTE_TYPES.map((w) => ({ value: w, label: w }))} required />
              <Select name="day_of_week" label="Day" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })} options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))} required />
              <div style={{ marginBottom: 16 }}>
                <label style={formStyles.label}>Start Time</label>
                <input type="time" value={form.time_window_start} onChange={(e) => setForm({ ...form, time_window_start: e.target.value })} required style={formStyles.input} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={formStyles.label}>End Time</label>
                <input type="time" value={form.time_window_end} onChange={(e) => setForm({ ...form, time_window_end: e.target.value })} required style={formStyles.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" loading={submitting} disabled={submitting}>{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No schedules yet. Click "New" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Barangay', 'Hauler', 'Waste Type', 'Day', 'Time', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.barangay}</td>
                <td style={tableStyles.td}>{item.hauler}</td>
                <td style={tableStyles.td}>{item.waste_type}</td>
                <td style={tableStyles.td}>{item.day_of_week}</td>
                <td style={tableStyles.td}>{item.time_window_start} - {item.time_window_end}</td>
                <td style={tableStyles.td}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirm({ sysId: item.sys_id, label: `${item.barangay} · ${item.day_of_week} · ${item.waste_type}` })}
                    style={{ color: COLORS.error }}
                  >Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete schedule?"
        message={confirm ? `"${confirm.label}" will be removed from the weekly schedule.` : ''}
        loading={submitting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

const formStyles = {
  card: { padding: 16, marginBottom: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.bg.muted },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' },
  label: { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: COLORS.text.primary },
  input: { width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
};

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text.muted, fontSize: 12, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: `1px solid ${COLORS.bg.muted}`, color: COLORS.text.secondary },
};
