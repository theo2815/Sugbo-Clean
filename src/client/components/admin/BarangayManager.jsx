import React, { useState, useEffect } from 'react';
import { barangayAPI } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import RouteMap from '../shared/RouteMap';

const ZONES = ['North District', 'South District'];

const EMPTY_FORM = { name: '', zone: '', latitude: '', longitude: '' };

function fmtCoord(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : '';
}

function coordError(value, kind) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  const label = kind === 'lat' ? 'Latitude' : 'Longitude';
  if (!Number.isFinite(n)) return `${label} must be a number.`;
  const max = kind === 'lat' ? 90 : 180;
  if (n < -max || n > max) return `${label} must be between -${max} and ${max}.`;
  return '';
}

export default function BarangayManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await barangayAPI.list();
      setItems(res.result);
    } catch (err) {
      setToast({ message: err?.message || 'Failed to load barangays.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      name: item.name || '',
      zone: item.zone || '',
      latitude: fmtCoord(item.latitude),
      longitude: fmtCoord(item.longitude),
    });
    setEditing(item.sys_id);
    setError('');
    setShowForm(true);
  }

  // Map click + marker drag both write back to form lat/lng.
  function handlePinned({ latitude, longitude }) {
    setForm((f) => ({
      ...f,
      latitude: fmtCoord(latitude),
      longitude: fmtCoord(longitude),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const latErr = coordError(form.latitude, 'lat');
    const lngErr = coordError(form.longitude, 'lng');
    if (latErr || lngErr) {
      setError('Fix the coordinate errors before saving.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      name: form.name,
      zone: form.zone,
    };
    if (form.latitude !== '' && form.longitude !== '') {
      payload.latitude = Number(form.latitude);
      payload.longitude = Number(form.longitude);
    }
    try {
      if (editing) {
        await barangayAPI.update(editing, payload);
        setToast({ message: 'Barangay updated successfully.', type: 'success' });
      } else {
        await barangayAPI.create(payload);
        setToast({ message: 'Barangay created successfully.', type: 'success' });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err?.message || 'Save failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const sysId = confirm.sysId;
    setSubmitting(true);
    try {
      await barangayAPI.remove(sysId);
      setConfirm(null);
      setToast({ message: 'Barangay deleted.', type: 'success' });
      await load();
    } catch (err) {
      setToast({ message: err?.message || 'Delete failed.', type: 'error' });
      setConfirm(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="Loading barangays..." />;

  const latErr = coordError(form.latitude, 'lat');
  const lngErr = coordError(form.longitude, 'lng');
  const coordsUsable =
    form.latitude !== '' && form.longitude !== '' && !latErr && !lngErr;

  const editableMarker = coordsUsable
    ? { latitude: form.latitude, longitude: form.longitude }
    : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Barangays ({items.length})</h3>
        <Button size="sm" onClick={openNew}>+ New Barangay</Button>
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
              <Input label="Name" name="name" maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required />
              <Select label="Zone" name="zone"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                options={ZONES.map((z) => ({ value: z, label: z }))}
                required />
              <Input label="Latitude" name="latitude" value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="e.g. 10.3157 — or click the map" inputMode="decimal"
                error={latErr} />
              <Input label="Longitude" name="longitude" value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="e.g. 123.8854 — or click the map" inputMode="decimal"
                error={lngErr} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: COLORS.text.secondary }}>
                Click anywhere on the map to place this barangay. Drag the pin to fine-tune.
              </p>
              <RouteMap
                barangays={editing ? items.filter((b) => b.sys_id !== editing) : items}
                editableMarker={editableMarker}
                onMapClick={handlePinned}
                onMarkerDragEnd={handlePinned}
                center={editableMarker ? [Number(editableMarker.latitude), Number(editableMarker.longitude)] : undefined}
                zoom={13}
                height={420}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" loading={submitting} disabled={submitting}>{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No barangays yet. Click "+ New Barangay" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Name', 'Zone', 'Coordinates', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const hasCoords = Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
              return (
                <tr key={item.sys_id}>
                  <td style={tableStyles.td}>{item.name}</td>
                  <td style={tableStyles.td}>{item.zone || '—'}</td>
                  <td style={tableStyles.td}>
                    {hasCoords
                      ? <span style={{ color: COLORS.primary, fontWeight: 600 }}>📍 {fmtCoord(item.latitude)}, {fmtCoord(item.longitude)}</span>
                      : <span style={{ color: COLORS.text.muted }}>— not set</span>}
                  </td>
                  <td style={tableStyles.td}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirm({ sysId: item.sys_id, name: item.name })}
                      style={{ color: COLORS.error }}
                    >Delete</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete barangay?"
        message={confirm ? `"${confirm.name}" will be removed. Schedules, route stops, and reports referencing it may break.` : ''}
        loading={submitting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text.muted, fontSize: 12, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: `1px solid ${COLORS.bg.muted}`, color: COLORS.text.secondary },
};
