import React, { useState, useEffect } from 'react';
import { getWasteItems, createWasteItem, updateWasteItem, deleteWasteItem } from '../../../services/api';
import { COLORS, BIN_TYPES, BIN_COLOR_MAP } from '../../../utils/constants';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import TextArea from '../shared/TextArea';
import Loading from '../shared/Loading';

export default function WasteItemManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', bin_type: '', bin_color: '', disposal_instructions: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { result } = await getWasteItems();
    setItems(result);
    setLoading(false);
  }

  function openNew() {
    setForm({ name: '', bin_type: '', bin_color: '', disposal_instructions: '' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({ name: item.name, bin_type: item.bin_type, bin_color: item.bin_color, disposal_instructions: item.disposal_instructions });
    setEditing(item.sys_id);
    setShowForm(true);
  }

  function handleBinTypeChange(e) {
    const binType = e.target.value;
    setForm({ ...form, bin_type: binType, bin_color: BIN_COLOR_MAP[binType] || '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await updateWasteItem(editing, form);
    } else {
      await createWasteItem(form);
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(sysId) {
    await deleteWasteItem(sysId);
    load();
  }

  if (loading) return <Loading message="Loading waste items..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Waste Items ({items.length})</h3>
        <Button size="sm" onClick={openNew}>+ New Item</Button>
      </div>

      {showForm && (
        <div style={{ padding: 16, marginBottom: 16, border: `1px solid ${COLORS.border}`, borderRadius: 10, background: COLORS.bg.muted }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <Input label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Select
                name="bin_type"
                label="Bin Type"
                value={form.bin_type}
                onChange={handleBinTypeChange}
                options={BIN_TYPES.map((t) => ({ value: t, label: t }))}
                required
              />
            </div>
            <TextArea
              label="Disposal Instructions"
              name="disposal_instructions"
              value={form.disposal_instructions}
              onChange={(e) => setForm({ ...form, disposal_instructions: e.target.value })}
              placeholder="How should this item be disposed?"
              required
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" size="sm">{editing ? 'Update' : 'Create'}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', color: COLORS.text.muted, padding: 30 }}>No waste items yet. Click "New" to add one.</p>
      ) : (
        <table style={tableStyles.table}>
          <thead>
            <tr>{['Name', 'Bin Type', 'Color', 'Instructions', 'Actions'].map((h) => <th key={h} style={tableStyles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sys_id}>
                <td style={tableStyles.td}>{item.name}</td>
                <td style={tableStyles.td}>{item.bin_type}</td>
                <td style={tableStyles.td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.bin[item.bin_type] }} />
                    {item.bin_color}
                  </span>
                </td>
                <td style={{ ...tableStyles.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.disposal_instructions}</td>
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
