import React from "react";
import StatusPill from "../shared/StatusPill";

export default function ReportsTable({ reports }) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Reports</h3>

      <div>
        {reports
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((report) => (
            <div key={report.id} style={styles.row}>

              {/* LEFT SIDE INFO */}
              <div style={styles.left}>
                <span style={styles.id}>{report.id}</span>
                <span style={styles.barangay}>{report.barangay}</span>
                <span style={styles.date}>{report.date}</span>
              </div>

              {/* RIGHT SIDE STATUS */}
              <div style={styles.right}>
                <StatusPill status={report.status} />
              </div>

            </div>
          ))}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    background: "#fff",
    padding: 16,
    borderRadius: 10,
    border: "1px solid #eee",
  },

  title: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 8px",
    borderBottom: "1px solid #f1f1f1",
    alignItems: "center",
  },

  left: {
    display: "flex",
    gap: 20,
    alignItems: "center",
  },

  right: {
    display: "flex",
    alignItems: "center",
  },

  id: {
    fontFamily: "monospace",
    fontSize: 13,
    width: 140,
    color: "#0f172a",
  },

  barangay: {
    width: 120,
    color: "#475569",
    fontSize: 14,
  },

  date: {
    color: "#94a3b8",
    fontSize: 13,
  },
};