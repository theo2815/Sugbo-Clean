import React, { useState, useEffect } from "react";
import { getReports, subscribe } from "../../../data/reportStore";
import StatusStepper from "./StatusStepper";

export default function ReportTracker() {
  const [code, setCode] = useState("");
  const [report, setReport] = useState(null);
  const [liveReports, setLiveReports] = useState(getReports());

  // LIVE SUBSCRIPTION (real-time simulation)
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setLiveReports([...data]);
    });

    return unsubscribe;
  }, []);

  // LOOKUP FUNCTION
  const handleSearch = () => {
    const found = liveReports.find(r => r.id === code.trim());
    setReport(found || null);
  };

  return (
    <div style={styles.container}>

      <h2 style={styles.title}>Track Your Report</h2>

      {/* INPUT AREA */}
      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder="Enter SC-2026-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button style={styles.button} onClick={handleSearch}>
          Track
        </button>
      </div>

      {/* RESULT AREA */}
      {report ? (
        <div style={styles.resultBox}>

          <div style={styles.header}>
            <span style={styles.reportId}>{report.id}</span>
            <span style={styles.barangay}>{report.barangay}</span>
          </div>

          {/* LIVE STEP VISUAL */}
          <StatusStepper status={report.status} />

        </div>
      ) : (
        code && (
          <p style={styles.notFound}>Report not found</p>
        )
      )}

    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  container: {
    maxWidth: 600,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Arial",
  },

  title: {
    fontSize: 22,
    marginBottom: 16,
  },

  searchBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
  },

  button: {
    padding: "10px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  resultBox: {
    padding: 16,
    border: "1px solid #eee",
    borderRadius: 10,
    background: "#fff",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  reportId: {
    fontFamily: "monospace",
    fontWeight: "bold",
  },

  barangay: {
    color: "#666",
  },

  notFound: {
    marginTop: 20,
    color: "red",
  },
};