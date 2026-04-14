import React from "react";

export default function StatusPill({ status }) {
  const config = {
    PENDING: { label: "Pending", color: "#f59e0b" },
    IN_PROGRESS: { label: "In Progress", color: "#06b6d4" },
    RESOLVED: { label: "Resolved", color: "#10b981" },
  };

  const s = config[status];

  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: 12,
      fontSize: 12,
      background: `${s.color}20`,
      color: s.color,
      fontWeight: 500
    }}>
      {s.label}
    </span>
  );
}