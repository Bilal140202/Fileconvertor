import React from 'react';

import type { ArchiveFormat } from '../adapters/archive-converter.js';

export interface OptionsPanelState {
  archiveFormat: ArchiveFormat;
  compressionLevel: number;
  password?: string;
}

export interface OptionsPanelProps {
  value: OptionsPanelState;
  onChange: (value: OptionsPanelState) => void;
}

export function OptionsPanel({ value, onChange }: OptionsPanelProps): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#555' }}>Archive format</span>
        <select
          value={value.archiveFormat}
          onChange={(e) => onChange({ ...value, archiveFormat: e.target.value as ArchiveFormat })}
          style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
        >
          <option value="zip">ZIP</option>
          <option value="tar">TAR</option>
          <option value="tar.gz">TAR.GZ</option>
          <option value="7z">7Z (extract only)</option>
          <option value="rar">RAR (extract only)</option>
        </select>
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#555' }}>Compression level</span>
        <input
          type="number"
          min={0}
          max={9}
          value={value.compressionLevel}
          onChange={(e) => onChange({ ...value, compressionLevel: Number(e.target.value) })}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#555' }}>Password (ZIP only)</span>
        <input
          type="password"
          value={value.password ?? ''}
          onChange={(e) => onChange({ ...value, password: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
