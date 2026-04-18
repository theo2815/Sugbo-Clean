import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getHaulers, getBarangays, getRouteStops,
  createRouteStop, updateRouteStop, deleteRouteStop,
} from '../../../services/api';
import { COLORS, STOP_STATUSES } from '../../../utils/constants';
import { fromGlideTime, toGlideTime, formatTime12h } from '../../../utils/helpers';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Loading from '../shared/Loading';
import ConfirmDialog from '../shared/ConfirmDialog';
import Toast from '../shared/Toast';
import RouteMap, { CEBU_CENTER } from '../shared/RouteMap';
import HaulerScheduleManager from './HaulerScheduleManager';

const MODES = [
  { key: 'start', label: 'Set Start', color: '#22C55E', help: 'Click the map to place the start of the route.' },
  { key: 'add',   label: 'Add Stop',  color: COLORS.primary, help: 'Click the map to add a stop before the end.' },
  { key: 'end',   label: 'Set End',   color: '#EF4444', help: 'Click the map to place the end of the route.' },
];

function normalizeStatus(raw) {
  if (!raw) return 'Not Arrived';
  const lower = String(raw).toLowerCase();
  return STOP_STATUSES.find((s) => s.toLowerCase() === lower) || raw;
}

function maxOrder(list) {
  return list.reduce((m, s) => Math.max(m, s.stop_order || 0), 0);
}

function pointType(s) {
  return String(s?.point_type || '').toLowerCase();
}

export default function RouteBuilder() {
  const [haulers, setHaulers] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [stops, setStops] = useState([]);
  const [haulerId, setHaulerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null);
  const [stayInMode, setStayInMode] = useState(true);

  // Unsaved stop created by a map click — rendered on the map immediately so
  // the admin sees a pin the moment they click. Committed to the backend once
  // the label/ETA form is submitted.
  const [pendingStop, setPendingStop] = useState(null);
  const [pendingForm, setPendingForm] = useState({ label: '', estimated_arrival: '' });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', estimated_arrival: '', stop_status: 'Not Arrived' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const [focusedStopId, setFocusedStopId] = useState(null);
  const rowRefs = useRef({});

  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    if (!haulerId) {
      setStops([]);
      setPendingStop(null);
      setMode(null);
      return;
    }
    reloadStops();
    setPendingStop(null);
    setMode(null);
  }, [haulerId]);

  async function loadInitial() {
    setLoading(true);
    try {
      const [haulRes, brgyRes] = await Promise.all([getHaulers(), getBarangays()]);
      setHaulers(haulRes.result);
      setBarangays(brgyRes.result);
      if (!haulerId && haulRes.result.length > 0) setHaulerId(haulRes.result[0].sys_id);
    } catch (err) {
      setToast({ message: err?.message || 'Failed to load.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function reloadStops() {
    try {
      const res = await getRouteStops({ haulerId });
      setStops(res.result);
    } catch (err) {
      setToast({ message: err?.message || 'Failed to load stops.', type: 'error' });
    }
  }

  const hauler = useMemo(
    () => haulers.find((h) => h.sys_id === haulerId) || null,
    [haulers, haulerId],
  );

  const haulerBarangayId = hauler?.barangay_id || '';

  const mapCenter = useMemo(() => {
    if (!hauler?.barangay_id) return CEBU_CENTER;
    const b = barangays.find((x) => x.sys_id === hauler.barangay_id);
    const lat = Number(b?.latitude);
    const lng = Number(b?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return CEBU_CENTER;
    return [lat, lng];
  }, [hauler, barangays]);

  const mapZoom = mapCenter === CEBU_CENTER ? 12 : 15;

  const startStop = useMemo(() => stops.find((s) => pointType(s) === 'start') || null, [stops]);
  const endStop = useMemo(() => stops.find((s) => pointType(s) === 'end') || null, [stops]);

  // Temp stop merged into the render list so the map shows it immediately.
  const visibleStops = useMemo(
    () => (pendingStop ? [...stops, pendingStop] : stops),
    [stops, pendingStop],
  );

  // ---------- Map click ----------

  function previewOrder(m) {
    if (m === 'start') return 1;
    if (m === 'end') return maxOrder(stops) + 1;
    return endStop ? endStop.stop_order : maxOrder(stops) + 1;
  }

  function handleMapClick({ latitude, longitude }) {
    if (!mode || !haulerId || busy || pendingStop) return;
    if (!haulerBarangayId) {
      setToast({ message: 'This hauler has no assigned barangay. Set one in the Hauler page first.', type: 'error' });
      return;
    }
    if (mode === 'start' && startStop) {
      setToast({ message: 'Start already placed. Drag the existing Start pin to move it, or delete it first.', type: 'info' });
      return;
    }
    if (mode === 'end' && endStop) {
      setToast({ message: 'End already placed. Drag the existing End pin to move it, or delete it first.', type: 'info' });
      return;
    }
    setPendingStop({
      sys_id: `tmp-${Date.now()}`,
      __temp: true,
      latitude,
      longitude,
      point_type: mode,
      stop_order: previewOrder(mode),
      label: '',
      estimated_arrival: '',
      stop_status: 'Not Arrived',
    });
    setPendingForm({ label: '', estimated_arrival: '' });
  }

  async function commitPending(e) {
    e?.preventDefault?.();
    if (!pendingStop || busy) return;
    const { latitude, longitude, point_type } = pendingStop;
    const { label } = pendingForm;
    const estimated_arrival = toGlideTime(pendingForm.estimated_arrival);
    setBusy(true);
    try {
      if (point_type === 'start') {
        if (stops.length > 0) {
          await Promise.all(stops.map((s) =>
            updateRouteStop(s.sys_id, { stop_order: (s.stop_order || 0) + 1 })
          ));
        }
        await createRouteStop({
          hauler: haulerId,
          barangay: haulerBarangayId,
          latitude,
          longitude,
          label,
          estimated_arrival,
          stop_status: 'Not Arrived',
          stop_order: 1,
          point_type: 'start',
        });
      } else if (point_type === 'end') {
        await createRouteStop({
          hauler: haulerId,
          barangay: haulerBarangayId,
          latitude,
          longitude,
          label,
          estimated_arrival,
          stop_status: 'Not Arrived',
          stop_order: maxOrder(stops) + 1,
          point_type: 'end',
        });
      } else {
        // add stop: insert before End if it exists, else append.
        if (endStop) {
          const insertOrder = endStop.stop_order;
          await updateRouteStop(endStop.sys_id, { stop_order: endStop.stop_order + 1 });
          await createRouteStop({
            hauler: haulerId,
            barangay: haulerBarangayId,
            latitude,
            longitude,
            label,
            estimated_arrival,
            stop_status: 'Not Arrived',
            stop_order: insertOrder,
            point_type: 'stop',
          });
        } else {
          await createRouteStop({
            hauler: haulerId,
            barangay: haulerBarangayId,
            latitude,
            longitude,
            label,
            estimated_arrival,
            stop_status: 'Not Arrived',
            stop_order: maxOrder(stops) + 1,
            point_type: 'stop',
          });
        }
      }
      setPendingStop(null);
      setPendingForm({ label: '', estimated_arrival: '' });
      setToast({ message: 'Stop saved.', type: 'success' });
      await reloadStops();
      if (!stayInMode) setMode(null);
    } catch (err) {
      setToast({ message: err?.message || 'Save failed.', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function cancelPending() {
    setPendingStop(null);
    setPendingForm({ label: '', estimated_arrival: '' });
  }

  // ---------- Stop drag / click ----------

  async function handleStopDragEnd(stop, { latitude, longitude }) {
    if (stop.__temp) {
      setPendingStop({ ...pendingStop, latitude, longitude });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await updateRouteStop(stop.sys_id, { latitude, longitude });
      setToast({ message: 'Stop moved.', type: 'success' });
      await reloadStops();
    } catch (err) {
      setToast({ message: err?.message || 'Move failed.', type: 'error' });
      await reloadStops();
    } finally {
      setBusy(false);
    }
  }

  function handleStopPinClick(stop) {
    if (stop.__temp) return;
    setFocusedStopId(stop.sys_id);
    const el = rowRefs.current[stop.sys_id];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => setFocusedStopId(null), 1500);
  }

  // ---------- Sidebar: reorder / edit / delete ----------

  async function moveStop(stop, dir) {
    const sorted = [...stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));
    const idx = sorted.findIndex((s) => s.sys_id === stop.sys_id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    setBusy(true);
    try {
      await Promise.all([
        updateRouteStop(stop.sys_id, { stop_order: other.stop_order }),
        updateRouteStop(other.sys_id, { stop_order: stop.stop_order }),
      ]);
      await reloadStops();
    } catch (err) {
      setToast({ message: err?.message || 'Reorder failed.', type: 'error' });
      await reloadStops();
    } finally {
      setBusy(false);
    }
  }

  function openEditStop(stop) {
    setEditingId(stop.sys_id);
    setEditForm({
      label: stop.label || '',
      estimated_arrival: fromGlideTime(stop.estimated_arrival),
      stop_status: normalizeStatus(stop.stop_status),
    });
  }

  async function saveEditStop(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateRouteStop(editingId, {
        ...editForm,
        estimated_arrival: toGlideTime(editForm.estimated_arrival),
      });
      setEditingId(null);
      setToast({ message: 'Stop updated.', type: 'success' });
      await reloadStops();
    } catch (err) {
      setToast({ message: err?.message || 'Save failed.', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    const stop = confirmDelete.stop;
    setBusy(true);
    try {
      await deleteRouteStop(stop.sys_id);
      const toRenumber = stops.filter(
        (s) => s.sys_id !== stop.sys_id && (s.stop_order || 0) > (stop.stop_order || 0),
      );
      await Promise.all(
        toRenumber.map((s) => updateRouteStop(s.sys_id, { stop_order: (s.stop_order || 0) - 1 })),
      );
      setToast({ message: 'Stop removed.', type: 'success' });
      setConfirmDelete(null);
      await reloadStops();
    } catch (err) {
      setToast({ message: err?.message || 'Delete failed.', type: 'error' });
      setConfirmDelete(null);
      await reloadStops();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading message="Loading route builder..." />;

  const activeMode = MODES.find((m) => m.key === mode);
  const sortedStops = [...stops].sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hauler picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, color: COLORS.text.primary }}>Schedules & Route</h3>
        <div style={{ minWidth: 240 }}>
          <Select
            name="hauler"
            value={haulerId}
            onChange={(e) => setHaulerId(e.target.value)}
            options={haulers.map((h) => ({ value: h.sys_id, label: h.name }))}
            placeholder="-- Select hauler --"
          />
        </div>
        {hauler && (
          <span style={{ color: COLORS.text.muted, fontSize: 13 }}>
            Assigned barangay: <strong>{hauler.barangay || '—'}</strong>
            {' · '}
            {stops.length} stop{stops.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {!haulerId ? (
        <p style={{ color: COLORS.text.muted }}>Pick a hauler to manage their schedules and route.</p>
      ) : (
        <>
          {/* Schedules CRUD */}
          <HaulerScheduleManager hauler={hauler} />

          {/* Route builder */}
          <div style={styles.builderHeader}>
            <h4 style={styles.h4}>Route Map</h4>
            <span style={{ fontSize: 12, color: COLORS.text.muted }}>
              Pick a tool below, then click the map to place a pin.
            </span>
          </div>

          {/* Toolbar */}
          <div style={styles.toolbar}>
            <span style={{ fontSize: 13, color: COLORS.text.muted, fontWeight: 600 }}>Tool:</span>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(active ? null : m.key)}
                  disabled={busy || !!pendingStop}
                  style={{
                    ...styles.toolBtn,
                    background: active ? m.color : COLORS.bg.card,
                    color: active ? '#fff' : COLORS.text.primary,
                    borderColor: active ? m.color : COLORS.border,
                    opacity: pendingStop ? 0.5 : 1,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
            {mode && !pendingStop && (
              <button
                type="button"
                onClick={() => setMode(null)}
                style={{ ...styles.toolBtn, borderStyle: 'dashed', color: COLORS.text.muted }}
              >
                Cancel
              </button>
            )}
            <label style={styles.stayToggle} title="When on, the selected tool stays active after each save so you can drop several pins in a row.">
              <input
                type="checkbox"
                checked={stayInMode}
                onChange={(e) => setStayInMode(e.target.checked)}
              />
              Stay in mode
            </label>
            <span style={styles.hint}>
              {pendingStop
                ? 'Fill in the label & ETA on the left, then Save. Drag the new pin to fine-tune.'
                : activeMode ? activeMode.help : 'Pick a tool, then click the map. Drag a stop pin to move it.'}
            </span>
          </div>

          <div className="route-builder-layout">
            {/* Sidebar */}
            <aside style={styles.sidebar}>
              {pendingStop && (
                <form onSubmit={commitPending} style={styles.pendingCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      ...styles.orderBadge,
                      background: pendingStop.point_type === 'start' ? '#22C55E'
                        : pendingStop.point_type === 'end' ? '#EF4444' : COLORS.primary,
                    }}>
                      {pendingStop.point_type === 'start' ? 'S' : pendingStop.point_type === 'end' ? 'E' : pendingStop.stop_order}
                    </span>
                    <div style={{ fontWeight: 700, color: COLORS.text.primary, fontSize: 14 }}>
                      New {pendingStop.point_type === 'start' ? 'Start' : pendingStop.point_type === 'end' ? 'End' : 'Stop'}
                    </div>
                  </div>
                  <label style={styles.miniLabel}>
                    Label (street / landmark)
                    <input
                      type="text"
                      value={pendingForm.label}
                      onChange={(e) => setPendingForm({ ...pendingForm, label: e.target.value })}
                      placeholder="e.g. A.S. Fortuna St corner"
                      maxLength={100}
                      required
                      style={{ ...styles.miniInput, marginTop: 4 }}
                    />
                  </label>
                  <label style={{ ...styles.miniLabel, marginTop: 10 }}>
                    Estimated Arrival
                    <input
                      type="time"
                      value={pendingForm.estimated_arrival}
                      onChange={(e) => setPendingForm({ ...pendingForm, estimated_arrival: e.target.value })}
                      style={{ ...styles.miniInput, marginTop: 4 }}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button type="submit" size="sm" loading={busy} disabled={busy}>Save</Button>
                    <Button variant="ghost" size="sm" type="button" onClick={cancelPending} disabled={busy}>Cancel</Button>
                  </div>
                </form>
              )}

              <h4 style={styles.h4}>Stops</h4>
              {sortedStops.length === 0 ? (
                <p style={{ color: COLORS.text.muted, fontSize: 14, margin: 0 }}>
                  No stops yet. Use <strong>Set Start</strong> to begin.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sortedStops.map((s, i) => {
                    const pt = pointType(s);
                    const role = pt === 'start' ? 'Start' : pt === 'end' ? 'End' : null;
                    const chipColor = pt === 'start' ? '#22C55E' : pt === 'end' ? '#EF4444' : COLORS.primary;
                    return (
                      <li
                        key={s.sys_id}
                        ref={(el) => { rowRefs.current[s.sys_id] = el; }}
                        style={{
                          ...styles.row,
                          background: focusedStopId === s.sys_id ? COLORS.primaryLight : COLORS.bg.card,
                          borderColor: focusedStopId === s.sys_id ? COLORS.primary : COLORS.border,
                        }}
                      >
                        {editingId === s.sys_id ? (
                          <form onSubmit={saveEditStop} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={styles.miniLabel}>
                              Label
                              <input
                                type="text"
                                value={editForm.label}
                                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                maxLength={100}
                                style={styles.miniInput}
                              />
                            </label>
                            <label style={styles.miniLabel}>
                              ETA
                              <input
                                type="time"
                                value={editForm.estimated_arrival}
                                onChange={(e) => setEditForm({ ...editForm, estimated_arrival: e.target.value })}
                                style={styles.miniInput}
                              />
                            </label>
                            <label style={styles.miniLabel}>
                              Status
                              <select
                                value={editForm.stop_status}
                                onChange={(e) => setEditForm({ ...editForm, stop_status: e.target.value })}
                                style={styles.miniInput}
                              >
                                {STOP_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                              </select>
                            </label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Button type="submit" size="sm" loading={busy} disabled={busy}>Save</Button>
                              <Button variant="ghost" size="sm" type="button" onClick={() => setEditingId(null)} disabled={busy}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <span style={{ ...styles.orderBadge, background: chipColor }}>
                              {role ? role[0] : s.stop_order}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: COLORS.text.primary }}>
                                {s.label || <em style={{ color: COLORS.text.muted }}>No label</em>}
                              </div>
                              <div style={{ fontSize: 12, color: COLORS.text.muted }}>
                                {role ? `${role} · ` : ''}ETA {formatTime12h(s.estimated_arrival) || '—'} · {s.stop_status || 'Not Arrived'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button type="button" disabled={i === 0 || busy} onClick={() => moveStop(s, 'up')} style={styles.iconBtn} aria-label="Move up">↑</button>
                              <button type="button" disabled={i === sortedStops.length - 1 || busy} onClick={() => moveStop(s, 'down')} style={styles.iconBtn} aria-label="Move down">↓</button>
                              <Button variant="ghost" size="sm" onClick={() => openEditStop(s)}>Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete({ stop: s })} style={{ color: COLORS.error }}>✕</Button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>

            {/* Map */}
            <div style={styles.mapCol}>
              <RouteMap
                stops={visibleStops}
                onMapClick={handleMapClick}
                onStopClick={handleStopPinClick}
                onStopDragEnd={handleStopDragEnd}
                draggableStops
                cursorMode={pendingStop ? null : mode}
                center={mapCenter}
                zoom={mapZoom}
                height={560}
              />
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove stop?"
        message={confirmDelete ? `Stop #${confirmDelete.stop.stop_order} (${confirmDelete.stop.label || 'no label'}) will be removed and the rest renumbered.` : ''}
        loading={busy}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmDelete(null)}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

const styles = {
  builderHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    flexWrap: 'wrap',
  },
  toolBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  },
  stayToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: 500,
    cursor: 'pointer',
    userSelect: 'none',
  },
  hint: {
    marginLeft: 'auto',
    fontSize: 12,
    color: COLORS.text.muted,
    flex: '1 1 200px',
    textAlign: 'right',
  },
  sidebar: {
    padding: 14,
    background: COLORS.bg.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    maxHeight: 560,
    overflowY: 'auto',
  },
  pendingCard: {
    padding: 12,
    marginBottom: 14,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: 10,
    background: COLORS.primaryLight,
  },
  mapCol: { minWidth: 0 },
  h4: { margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: COLORS.text.primary },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: 10,
    transition: 'background 0.2s, border-color 0.2s',
  },
  orderBadge: {
    width: 28, height: 28, borderRadius: '50%',
    color: '#fff', fontWeight: 700, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  iconBtn: {
    width: 28, height: 28, borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg.card,
    cursor: 'pointer', fontSize: 14, lineHeight: 1,
    color: COLORS.text.secondary,
  },
  miniLabel: { display: 'flex', flexDirection: 'column', fontSize: 12, color: COLORS.text.secondary, fontWeight: 500 },
  miniInput: {
    width: '100%', padding: '6px 8px',
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    fontSize: 13, boxSizing: 'border-box',
  },
};
