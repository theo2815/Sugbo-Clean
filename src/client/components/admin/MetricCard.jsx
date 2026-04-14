import React from "react";

export default function MetricCard({ title, value }) {
  return (
    <div style={styles.card}>
      <h4>{value}</h4>
      <p>{title}</p>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: 16,
    border: "1px solid #eee",
    borderRadius: 10,
  },
};