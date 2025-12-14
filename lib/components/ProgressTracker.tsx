import React from 'react';

export interface ProgressTrackerProps {
  progress: number; // 0..1
  message?: string;
}

export function ProgressTracker({ progress, message }: ProgressTrackerProps): JSX.Element {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#444' }}>
        <span>{message ?? 'Working…'}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#eee', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb' }} />
      </div>
    </div>
  );
}
