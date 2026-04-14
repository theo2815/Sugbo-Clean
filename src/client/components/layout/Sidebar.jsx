import React from "react";

const navItems = [
  { icon: "📊", label: "Dashboard" },
  { icon: "📋", label: "Reports" },
  { icon: "📈", label: "Analytics" },
];

export default function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <div>✨</div>
        <span>SugboClean</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <div key={item.label} style={styles.navItem}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240,
    background: "#fff",
    borderRight: "1px solid #eee",
    padding: 20,
  },
  logoContainer: {
    display: "flex",
    gap: 10,
    marginBottom: 30,
    fontWeight: "bold",
  },
  navItem: {
    padding: "10px 8px",
    display: "flex",
    gap: 10,
    cursor: "pointer",
  },
};