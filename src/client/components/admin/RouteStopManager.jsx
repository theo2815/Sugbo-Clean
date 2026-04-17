import React, { useState, useEffect } from 'react';
import { getRouteStops, getBarangays, getHaulers, createRouteStop, updateRouteStop, deleteRouteStop } from '../../../services/api';
import { COLORS, STOP_STATUSES } from '../../../utils/constants';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';

const EMPTY_FORM = { hauler: '', barangay: '', stop_order: '', estimated_arrival: '', stop_status: 'Not Arrived' };

export default function RouteStopManager() {
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
    const [rsRes, brgyRes, haulRes] = await Promise.all([getRouteStops(), getBarangays(), getHaulers()]);
    setItems(rsRes.result);
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
      hauler: item.hauler_id || '',
      barangay: item.barangay_id || '',
      stop_order: String(item.stop_order),
      estimated_arrival: item.estimated_arrival,
      stop_status: item.stop_status,
    });
    setEditing(item.sys_id);
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const data = { ...form, stop_order: Number(form.stop_order) };
    try {
      if (editing) await updateRouteStop(editing, data);
      else await createRouteStop(data);
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
      await deleteRouteStop(sysId);
      setConfirm(null);
      await load();
    } catch (err) {
      setError(err?.message || 'Delete failed.');
      setConfirm(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="Loading route stops..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Route Stops ({items.length})</h3>
        <Button size="sm" onClick={openNew}>+ New Stop</Button>
      </div>

      {showForm && (
        <div style={{ padding: 16, marginBottom: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.bg.muted }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div role="alert" aria-live="assertive" style={{
                padding: '10px 14px', background: '#FEF2F2', border: `1px solid ${COLORS.error}`,
                borderRadius: 8, color: COLORS.error, fontSize: 13, marginBottom: 12,
              }}>{error}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <Select name="hauler" label="Hauler" value={form.hauler} onChange={(e) => setForm({ ...form, hauler: e.target.value })} options={haulers.map((h) => ({ value: h.sys_id, label: h.name }))} required />
              <Select name="barangay" label="Barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))} required />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: COLORS.text.primary }}>Stop Order *</label>
                <input type="number" min="1" value={form.stop_order} onChange={(e) => setForm({ ...form, stop_order: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500, color: COLORS.text.primary }}>Est. Arrival *</label>
                <input type="time" value={form.estimated_arrival} onChange={(e) => setForm({ ...form, estimated_arrival: e.target.value })} required style={{ width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <Select name="stop_status" label="Status" value={form.stop_status} onChange={(e) => setForm({ ...form, stop_status: e.target.value })} options={STOP_STATUSES.map((s) => ({ value: s, label: s }))} required />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" loading={submitting} disabled={submitting}>{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No route stops yet. Click "New" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Hauler', 'Barangay', 'Order', 'Arrival', 'Status', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.hauler}</td>
                <td style={tableStyles.td}>{item.barangay}</td>
                <td style={tableStyles.td}>{item.stop_order}</td>
                <td style={tableStyles.td}>{item.estimated_arrival}</td>
                <td style={tableStyles.td}>{item.stop_status}</td>
                <td style={tableStyles.td}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirm({ sysId: item.sys_id, label: `${item.hauler} · ${item.barangay} · stop ${item.stop_order}` })}
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
        title="Delete route stop?"
        message={confirm ? `"${confirm.label}" will be removed from the route.` : ''}
        loading={submitting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text.muted, fontSize: 12, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: `1px solid ${COLORS.bg.muted}`, color: COLORS.text.secondary },
};
