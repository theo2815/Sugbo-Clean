// Stubbed API layer — Phase 1 returns mock data; Phase 2 replaces with real fetch().
// Every function returns { result: ... } matching the real ServiceNow API shape.

import { mockBarangays, mockHaulers, mockSchedules, mockWasteItems, mockRouteStops } from '../mocks/mockData';
import * as reportStore from '../mocks/mockStore';
import { generateReportCode, initReportCounter } from '../utils/helpers';

// Initialize report code counter from existing mock data
initReportCounter(reportStore.getAll().length);

// Mutable copies for CRUD operations within a session
let schedules = [...mockSchedules];
let haulers = [...mockHaulers];
let routeStops = [...mockRouteStops];
let wasteItems = [...mockWasteItems];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 100;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${String(idCounter).padStart(3, '0')}`;
}

// ============ RESIDENT ENDPOINTS (8) ============

export async function getBarangays() {
  await delay();
  return { result: [...mockBarangays] };
}

export async function getHaulers() {
  await delay();
  return { result: [...haulers] };
}

export async function getHaulerByName(name) {
  await delay(150);
  const hauler = haulers.find((h) => h.name === name);
  return { result: hauler ? { ...hauler } : null };
}

export async function getSchedules(barangayId) {
  await delay();
  let filtered = [...schedules];
  if (barangayId) {
    const brgy = mockBarangays.find((b) => b.sys_id === barangayId);
    if (brgy) {
      filtered = filtered.filter((s) => s.barangay === brgy.name);
    }
  }
  return { result: filtered };
}

export async function createReport({ barangay, missed_date, waste_type, email, description }) {
  await delay();
  const brgy = mockBarangays.find((b) => b.sys_id === barangay);
  const report_code = generateReportCode();
  const newReport = {
    sys_id: nextId('rpt'),
    report_code,
    barangay: brgy ? brgy.name : barangay,
    missed_date,
    waste_type,
    status: 'Pending',
    email: email || '',
    description: description || '',
    created_on: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  reportStore.add(newReport);
  return { result: { sys_id: newReport.sys_id, report_code } };
}

export async function getReportByCode(reportCode) {
  await delay();
  const report = reportStore.findByCode(reportCode);
  if (!report) {
    throw new Error('Report not found');
  }
  return { result: { ...report } };
}

export async function getWasteItems(search, binType) {
  await delay();
  let filtered = [...wasteItems];
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((item) => item.name.toLowerCase().includes(term));
  }
  if (binType) {
    filtered = filtered.filter((item) => item.bin_type === binType);
  }
  return { result: filtered };
}

export async function getRouteStops(haulerId) {
  await delay();
  let filtered = [...routeStops];
  if (haulerId) {
    filtered = filtered.filter((rs) => rs.hauler_id === haulerId);
  }
  return { result: filtered.sort((a, b) => a.stop_order - b.stop_order) };
}

export async function subscribeReminder({ email, barangay }) {
  await delay();
  return { result: { sys_id: nextId('rem'), message: 'Subscribed successfully' } };
}

// ============ ADMIN ENDPOINTS (14) ============

export async function getAllReports(filters = {}) {
  await delay();
  let result = reportStore.getAll();
  if (filters.barangay_id) {
    const brgy = mockBarangays.find((b) => b.sys_id === filters.barangay_id);
    if (brgy) {
      result = result.filter((r) => r.barangay === brgy.name);
    }
  }
  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }
  return { result: [...result] };
}

export async function updateReportStatus(sysId, status) {
  await delay();
  reportStore.updateStatus(sysId, status);
  const report = reportStore.getAll().find((r) => r.sys_id === sysId);
  return { result: { sys_id: sysId, report_code: report?.report_code, status } };
}

// --- Schedule CRUD ---

export async function createSchedule(data) {
  await delay();
  const brgy = mockBarangays.find((b) => b.sys_id === data.barangay);
  const haul = haulers.find((h) => h.sys_id === data.hauler);
  const newSchedule = {
    sys_id: nextId('sched'),
    barangay: brgy ? brgy.name : data.barangay,
    hauler: haul ? haul.name : data.hauler,
    waste_type: data.waste_type,
    day_of_week: data.day_of_week,
    time_window_start: data.time_window_start,
    time_window_end: data.time_window_end,
  };
  schedules = [...schedules, newSchedule];
  return { result: { sys_id: newSchedule.sys_id, message: 'Created' } };
}

export async function updateSchedule(sysId, data) {
  await delay();
  schedules = schedules.map((s) => (s.sys_id === sysId ? { ...s, ...data } : s));
  return { result: { sys_id: sysId, message: 'Updated' } };
}

export async function deleteSchedule(sysId) {
  await delay();
  schedules = schedules.filter((s) => s.sys_id !== sysId);
  return { result: { message: 'Deleted' } };
}

// --- Hauler CRUD ---

export async function createHauler(data) {
  await delay();
  const newHauler = { sys_id: nextId('haul'), ...data };
  haulers = [...haulers, newHauler];
  return { result: { sys_id: newHauler.sys_id, name: newHauler.name } };
}

export async function updateHauler(sysId, data) {
  await delay();
  haulers = haulers.map((h) => (h.sys_id === sysId ? { ...h, ...data } : h));
  return { result: { sys_id: sysId, message: 'Updated' } };
}

export async function deleteHauler(sysId) {
  await delay();
  haulers = haulers.filter((h) => h.sys_id !== sysId);
  return { result: { message: 'Deleted' } };
}

// --- Route Stop CRUD ---

export async function createRouteStop(data) {
  await delay();
  const brgy = mockBarangays.find((b) => b.sys_id === data.barangay);
  const haul = haulers.find((h) => h.sys_id === data.hauler);
  const newStop = {
    sys_id: nextId('rs'),
    hauler: haul ? haul.name : data.hauler,
    hauler_id: data.hauler,
    barangay: brgy ? brgy.name : data.barangay,
    stop_order: data.stop_order,
    estimated_arrival: data.estimated_arrival,
    stop_status: data.stop_status || 'Not Arrived',
  };
  routeStops = [...routeStops, newStop];
  return { result: { sys_id: newStop.sys_id, message: 'Created' } };
}

export async function updateRouteStop(sysId, data) {
  await delay();
  routeStops = routeStops.map((rs) => (rs.sys_id === sysId ? { ...rs, ...data } : rs));
  return { result: { sys_id: sysId, message: 'Updated' } };
}

export async function deleteRouteStop(sysId) {
  await delay();
  routeStops = routeStops.filter((rs) => rs.sys_id !== sysId);
  return { result: { message: 'Deleted' } };
}

// --- Waste Item CRUD ---

export async function createWasteItem(data) {
  await delay();
  const newItem = { sys_id: nextId('wi'), ...data };
  wasteItems = [...wasteItems, newItem];
  return { result: { sys_id: newItem.sys_id, message: 'Created' } };
}

export async function updateWasteItem(sysId, data) {
  await delay();
  wasteItems = wasteItems.map((w) => (w.sys_id === sysId ? { ...w, ...data } : w));
  return { result: { sys_id: sysId, message: 'Updated' } };
}

export async function deleteWasteItem(sysId) {
  await delay();
  wasteItems = wasteItems.filter((w) => w.sys_id !== sysId);
  return { result: { message: 'Deleted' } };
}

// ============ PUB/SUB RE-EXPORT ============

export { subscribe as subscribeToReports } from '../mocks/mockStore';
