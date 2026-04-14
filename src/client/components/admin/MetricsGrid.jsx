import React from "react";

export default function MetricsGrid({ reports }) {
  const total = reports.length;

  const pending = reports.filter(r => r.status === "PENDING").length;
  const inProgress = reports.filter(r => r.status === "IN_PROGRESS").length;
  const resolved = reports.filter(r => r.status === "RESOLVED").length;

  return (
    <div style={styles.grid}>

      <MetricCard title="Total Reports" value={total} />
      <MetricCard title="Pending" value={pending} />
      <MetricCard title="In Progress" value={inProgress} />
      <MetricCard title="Resolved" value={resolved} />

    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.value}>{value}</h2>
      <p style={styles.title}>{title}</p>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    margin: "20px 0",
  },

  card: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
  },

  value: {
    margin: 0,
    fontSize: 26,
  },

  title: {
    margin: 0,
    color: "#666",
    fontSize: 13,
  }
};