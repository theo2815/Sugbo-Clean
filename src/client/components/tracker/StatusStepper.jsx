import React from "react";

export default function StatusStepper({ status }) {
  const steps = [
    { key: "PENDING", label: "Submitted" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "RESOLVED", label: "Resolved" },
  ];

  const currentIndex = steps.findIndex(s => s.key === status);

  return (
    <div style={styles.container}>

      {steps.map((step, index) => {
        const isActive = index <= currentIndex;

        return (
          <div key={step.key} style={styles.step}>

            <div
              style={{
                ...styles.circle,
                background: isActive ? "#4f46e5" : "#e5e7eb",
              }}
            />

            <div>
              <div style={styles.label}>{step.label}</div>
            </div>

            {index !== steps.length - 1 && (
              <div style={styles.line} />
            )}

          </div>
        );
      })}

    </div>
  );
}

const styles = {
  container: {
    marginTop: 20,
  },

  step: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    paddingBottom: 20,
  },

  circle: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    marginRight: 10,
  },

  label: {
    fontSize: 14,
  },

  line: {
    position: "absolute",
    left: 6,
    top: 20,
    width: 2,
    height: 20,
    background: "#e5e7eb",
  },
};