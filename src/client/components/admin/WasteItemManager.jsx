import React, { useState, useEffect, useRef } from 'react';
import { getWasteItems, createWasteItem, updateWasteItem, deleteWasteItem } from '../../../services/api';
import { COLORS, BIN_TYPES, BIN_COLOR_MAP } from '../../../utils/constants';
import Button from '../shared/Button';
import Input from '../shared/Input';
import Select from '../shared/Select';
import TextArea from '../shared/TextArea';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import Card from '../shared/Card';
import BinColorTag from '../shared/BinColorTag';

// Normalize "biodegradable" → "Biodegradable" to match BIN_TYPES constants.
function normalizeBinType(raw) {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  return BIN_TYPES.find((t) => t.toLowerCase() === lower) || raw;
}

function BinSwatch({ binType, size = 10 }) {
  const key = normalizeBinType(binType);
  const hex = COLORS.bin[key] || COLORS.text.muted;
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: hex,
        flexShrink: 0,
      }}
    />
  );
}

const BIN_TYPE_OPTIONS = BIN_TYPES.map((t) => ({
  value: t,
  label: t,
  icon: <BinSwatch binType={t} />,
}));

const EMPTY_FORM = { name: '', bin_type: '', bin_color: '', disposal_instructions: '' };

export default function WasteItemManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const formRef = useRef(null);

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  useEffect(() => { load(); }, []);

  // After the form mounts (or re-targets a different item), bring it into view
  // so adding/editing from a card lower on the page doesn't feel like a no-op.
  useEffect(() => {
    if (!showForm) return;
    const node = formRef.current;
    if (node?.scrollIntoView) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm, editing]);

  async function load() {
    setLoading(true);
    const { result } = await getWasteItems();
    setItems(result);
    setLoading(false);
  }

  function openNew(binType) {
    const next = { ...EMPTY_FORM };
    if (binType) {
      next.bin_type = binType;
      next.bin_color = BIN_COLOR_MAP[binType] || '';
    }
    setForm(next);
    setEditing(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(item) {
    const binType = normalizeBinType(item.bin_type);
    setForm({
      name: item.name,
      bin_type: binType,
      bin_color: BIN_COLOR_MAP[binType] || item.bin_color,
      disposal_instructions: item.disposal_instructions,
    });
    setEditing(item.sys_id);
    setError('');
    setShowForm(true);
  }

  function handleBinTypeChange(e) {
    const binType = e.target.value;
    setForm({ ...form, bin_type: binType, bin_color: BIN_COLOR_MAP[binType] || '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Select's `required` is a label-only affordance — the hidden input can't
    // trigger native validation — so guard bin_type explicitly before submit.
    const name = form.name.trim();
    const instructions = form.disposal_instructions.trim();
    if (!name || !form.bin_type || !instructions) {
      setError('Please fill in the name, bin type, and disposal instructions.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form, name, disposal_instructions: instructions };
      if (editing) {
        await updateWasteItem(editing, payload);
        setToast({ message: 'Waste item updated successfully.', type: 'success' });
      } else {
        await createWasteItem(payload);
        setToast({ message: 'Waste item created successfully.', type: 'success' });
      }
      closeForm();
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
      await deleteWasteItem(sysId);
      setConfirm(null);
      setToast({ message: 'Waste item deleted.', type: 'success' });
      await load();
    } catch (err) {
      setToast({ message: err?.message || 'Delete failed.', type: 'error' });
      setConfirm(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading message="Loading waste items..." />;

  const grouped = items.reduce((acc, item) => {
    const key = normalizeBinType(item.bin_type) || 'Uncategorized';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // The form is rendered inside the card matching form.bin_type. If the admin
  // is editing an item whose bin_type isn't in BIN_TYPES, fall back to the
  // Uncategorized card so the form is still visible and reachable.
  const formHostsUncategorized =
    showForm && !!form.bin_type && !BIN_TYPES.includes(form.bin_type);

  function renderForm() {
    return (
      <div ref={formRef} style={styles.formBlock}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div role="alert" aria-live="assertive" style={styles.formError}>{error}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
            <Input label="Name" name="name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Select
              name="bin_type"
              label="Bin Type"
              value={form.bin_type}
              onChange={handleBinTypeChange}
              options={BIN_TYPE_OPTIONS}
              required
            />
          </div>
          <TextArea
            label="Disposal Instructions"
            name="disposal_instructions"
            maxLength={500}
            value={form.disposal_instructions}
            onChange={(e) => setForm({ ...form, disposal_instructions: e.target.value })}
            placeholder="How should this item be disposed?"
            required
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" size="sm" loading={submitting} disabled={submitting}>{editing ? 'Update' : 'Create'}</Button>
            <Button variant="ghost" size="sm" type="button" onClick={closeForm} disabled={submitting}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Waste Items ({items.length})</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {BIN_TYPES.map((binType) => {
          const binItems = grouped[binType] || [];
          const showFormHere = showForm && form.bin_type === binType;
          return (
            <Card key={binType} accentColor={COLORS.bin[binType]}>
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <BinColorTag binType={binType} />
                  <h4 style={styles.cardTitle}>{binType} Waste</h4>
                  <span style={styles.countPill}>
                    {binItems.length} {binItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                {!showFormHere && (
                  <Button size="sm" onClick={() => openNew(binType)}>+ Add</Button>
                )}
              </div>

              {showFormHere && renderForm()}

              {binItems.length === 0 ? (
                <p style={styles.emptyHint}>
                  No items in this category yet — click <strong>+ Add</strong> to create one.
                </p>
              ) : (
                <ul style={styles.grid}>
                  {binItems.map((item) => {
                    const isEditingTile = editing === item.sys_id;
                    return (
                      <li
                        key={item.sys_id}
                        style={{
                          ...styles.tile,
                          background: isEditingTile ? COLORS.primaryLight : COLORS.bg.muted,
                          borderColor: isEditingTile ? COLORS.primary : COLORS.border,
                        }}
                      >
                        <div style={{
                          ...styles.tileName,
                          color: isEditingTile ? COLORS.primaryDark : COLORS.text.primary,
                          fontWeight: isEditingTile ? 700 : 600,
                        }}>
                          {item.name}
                        </div>
                        <div style={styles.tileInstructions}>
                          {item.disposal_instructions}
                        </div>
                        <div style={styles.tileActions}>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirm({ sysId: item.sys_id, name: item.name })}
                            style={{ color: COLORS.error }}
                          >Delete</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          );
        })}

        {(grouped.Uncategorized?.length > 0 || formHostsUncategorized) && (
          <Card>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h4 style={styles.cardTitle}>Uncategorized</h4>
                <span style={styles.countPill}>
                  {(grouped.Uncategorized?.length || 0)} {(grouped.Uncategorized?.length || 0) === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {formHostsUncategorized && renderForm()}

            <p style={styles.emptyHint}>
              These items have an unrecognized bin type. Edit each one to assign a category.
            </p>
            {grouped.Uncategorized?.length > 0 && (
              <ul style={styles.grid}>
                {grouped.Uncategorized.map((item) => (
                  <li key={item.sys_id} style={{ ...styles.tile, background: COLORS.bg.muted, borderColor: COLORS.border }}>
                    <div style={{ ...styles.tileName, color: COLORS.text.primary, fontWeight: 600 }}>{item.name}</div>
                    <div style={styles.tileInstructions}>{item.disposal_instructions}</div>
                    <div style={styles.tileActions}>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirm({ sysId: item.sys_id, name: item.name })}
                        style={{ color: COLORS.error }}
                      >Delete</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Delete waste item?"
        message={confirm ? `"${confirm.name}" will be removed from the waste guide.` : ''}
        loading={submitting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const styles = {
  formBlock: {
    padding: 16,
    marginBottom: 16,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: COLORS.bg.page,
    scrollMarginTop: 16,
  },
  formError: {
    padding: '10px 14px',
    background: '#FEF2F2',
    border: `1px solid ${COLORS.error}`,
    borderRadius: 8,
    color: COLORS.error,
    fontSize: 13,
    marginBottom: 12,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: `1px solid ${COLORS.border}`,
    flexWrap: 'wrap',
    gap: 12,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: COLORS.text.primary,
  },
  countPill: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontWeight: 600,
    background: COLORS.bg.muted,
    padding: '4px 10px',
    borderRadius: 12,
  },
  emptyHint: {
    margin: 0,
    fontSize: 13,
    color: COLORS.text.muted,
    fontStyle: 'italic',
  },
  grid: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
    gap: 12,
  },
  tile: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxSizing: 'border-box',
    transition: 'background 150ms ease, border-color 150ms ease',
  },
  tileName: {
    fontSize: 15,
  },
  tileInstructions: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 1.5,
    overflowWrap: 'anywhere',
    flex: 1,
  },
  tileActions: {
    display: 'flex',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${COLORS.border}`,
  },
};
