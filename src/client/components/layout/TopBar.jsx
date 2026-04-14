import React from "react";

export default function TopBar() {
  return (
    <header style={styles.topbar}>
      <h3>Admin Dashboard</h3>

      <div style={styles.live}>
        <div style={styles.dot}></div>
        Live
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    height: 60,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    borderBottom: "1px solid #eee",
  },
  live: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "green",
  },
};