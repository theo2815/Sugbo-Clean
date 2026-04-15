import React, { useState, useEffect } from 'react';
import { getHaulers, createHauler, updateHauler, deleteHauler } from '../../../services/api';
import { COLORS } from '../../../utils/constants';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TextArea from '../shared/TextArea';
import Loading from '../shared/Loading';

export default function HaulerManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact_number: '', areas_covered: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { result } = await getHaulers();
    setItems(result);
    setLoading(false);
  }

  function openNew() {
    setForm({ name: '', contact_number: '', areas_covered: '' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({ name: item.name, contact_number: item.contact_number, areas_covered: item.areas_covered });
    setEditing(item.sys_id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await updateHauler(editing, form);
    } else {
      await createHauler(form);
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(sysId) {
    await deleteHauler(sysId);
    load();
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
            <Input label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Contact Number" name="contact_number" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} required />
            <TextArea label="Areas Covered" name="areas_covered" value={form.areas_covered} onChange={(e) => setForm({ ...form, areas_covered: e.target.value })} placeholder="e.g. Lahug, Mabolo, Banilad" required />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm">{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No haulers yet. Click "New" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Name', 'Contact', 'Areas Covered', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.name}</td>
                <td style={tableStyles.td}>{item.contact_number}</td>
                <td style={tableStyles.td}>{item.areas_covered}</td>
                <td style={tableStyles.td}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.sys_id)} style={{ color: COLORS.error }}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableStyles = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '10px 8px', borderBottom: `2px solid ${COLORS.border}`, color: COLORS.text.muted, fontSize: 12, fontWeight: 600 },
  td: { padding: '10px 8px', borderBottom: `1px solid ${COLORS.bg.muted}`, color: COLORS.text.secondary },
};
