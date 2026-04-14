import { reports as initialReports } from "./reports";

let listeners = [];
let store = [...initialReports];

export function getReports() {
  return store;
}

export function updateReportStatus(id, newStatus) {
  store = store.map((r) =>
    r.id === id ? { ...r, status: newStatus } : r
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