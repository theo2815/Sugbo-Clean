import React from 'react';
import { COLORS } from '../../../utils/constants';

export default function StatusStepper({ status }) {
  const steps = [
    { key: 'Pending', label: 'Submitted' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Resolved', label: 'Resolved' },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div style={{ marginTop: 20 }}>
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;

        return (
          <div key={step.key} style={styles.step}>
            <div
              style={{
                ...styles.circle,
                background: isActive ? COLORS.primary : COLORS.border,
              }}
            />
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? COLORS.text.primary : COLORS.text.muted,
              }}>
                {step.label}
              </div>
            </div>
            {index !== steps.length - 1 && (
              <div style={{
                ...styles.line,
                background: index < currentIndex ? COLORS.primary : COLORS.border,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  step: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 20,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    marginRight: 10,
  },
  line: {
    position: 'absolute',
    left: 6,
    top: 20,
    width: 2,
    height: 20,
  },
};
