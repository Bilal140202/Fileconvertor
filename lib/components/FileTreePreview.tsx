import React from 'react';

export interface FileTreePreviewEntry {
  path: string;
  size: number;
  ratio?: number;
}

export interface FileTreePreviewProps {
  entries: FileTreePreviewEntry[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 2 : value < 100 ? 1 : 0)} ${units[unit]}`;
}

function badgeStyle(bg: string): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    background: bg,
    color: '#111',
    fontSize: 12,
    lineHeight: '16px',
    whiteSpace: 'nowrap'
  };
}

export function FileTreePreview({ entries }: FileTreePreviewProps): JSX.Element {
  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>File</th>
            <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>Size</th>
            <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>Ratio</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.path}>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {e.path}
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                <span style={badgeStyle('#eef2ff')}>{formatBytes(e.size)}</span>
              </td>
              <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                {e.ratio == null ? (
                  <span style={badgeStyle('#f3f4f6')}>—</span>
                ) : (
                  <span style={badgeStyle(e.ratio <= 0.8 ? '#dcfce7' : '#fee2e2')}>{(e.ratio * 100).toFixed(0)}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
