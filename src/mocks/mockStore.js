// Pub/sub store for reports — migrated from src/data/reportStore.js.
// Keeps the live subscription pattern so the tracker updates in real time.

import { mockReports } from './mockData';

let listeners = [];
let store = [...mockReports];

export function getAll() {
  return store;
}

export function findByCode(code) {
  return store.find((r) => r.report_code === code) || null;
}

export function add(report) {
  store = [...store, report];
  notify();
}

export function updateStatus(sysId, newStatus) {
  store = store.map((r) =>
    r.sys_id === sysId ? { ...r, status: newStatus } : r
  );
  notify();
}

export function subscribe(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notify() {
  listeners.forEach((cb) => cb(store));
}
