import React, { useState, useEffect } from 'react';
import { getHaulers, getBarangays, createHauler, updateHauler, deleteHauler } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import TextArea from '../shared/TextArea';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';

const EMPTY_FORM = { name: '', contact_number: '', areas_covered: '', barangay: '' };

export default function HaulerManager() {
  const [items, setItems] = useState([]);
  const [barangays, setBarangays] = useState([]);
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
    const [haulRes, brgyRes] = await Promise.all([getHaulers(), getBarangays()]);
    setItems(haulRes.result);
    setBarangays(brgyRes.result);
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
      name: item.name,
      contact_number: item.contact_number,
      areas_covered: item.areas_covered,
      barangay: item.barangay_id || '',
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
      if (editing) {
        await updateHauler(editing, form);
        setToast({ message: 'Hauler updated successfully.', type: 'success' });
      } else {
        await createHauler(form);
        setToast({ message: 'Hauler created successfully.', type: 'success' });
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
      await deleteHauler(sysId);
      setConfirm(null);
      setToast({ message: 'Hauler deleted.', type: 'success' });
      await load();
    } catch (err) {
      setToast({ message: err?.message || 'Delete failed.', type: 'error' });
      setConfirm(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="Loading haulers..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Haulers ({items.length})</h3>
        <Button size="sm" onClick={openNew}>+ New Hauler</Button>
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
            <Input label="Name" name="name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Contact Number" name="contact_number" maxLength={40} value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required />
            <Select
              label="Assigned Barangay"
              name="barangay"
              value={form.barangay}
              onChange={(e) => setForm({ ...form, barangay: e.target.value })}
              options={barangays.map((b) => ({ value: b.sys_id, label: b.name }))}
              required
            />
            <TextArea label="Areas Covered" name="areas_covered" maxLength={500} value={form.areas_covered} onChange={(e) => setForm({ ...form, areas_covered: e.target.value })} placeholder="e.g. Lahug, Mabolo, Banilad" required />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm" loading={submitting} disabled={submitting}>{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No haulers yet. Click "New" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Name', 'Barangay', 'Contact', 'Areas Covered', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.name}</td>
                <td style={tableStyles.td}>{item.barangay || '—'}</td>
                <td style={tableStyles.td}>{item.contact_number}</td>
                <td style={tableStyles.td}>{item.areas_covered}</td>
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
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="Delete hauler?"
        message={confirm ? `"${confirm.name}" will be removed. Schedules and route stops assigned to this hauler will no longer resolve.` : ''}
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
