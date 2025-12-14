import React, { useMemo, useState } from 'react';
import opentype from 'opentype.js';

export interface FontPreviewProps {
  fontData: Uint8Array;
  metadata?: {
    family?: string;
    subfamily?: string;
    weightClass?: number;
  };
  initialSampleText?: string;
  maxGlyphs?: number;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

export function FontPreview({
  fontData,
  metadata,
  initialSampleText = 'The quick brown fox jumps over the lazy dog',
  maxGlyphs = 96
}: FontPreviewProps): JSX.Element {
  const [sampleText, setSampleText] = useState(initialSampleText);

  const font = useMemo(() => {
    try {
      return opentype.parse(toArrayBuffer(fontData));
    } catch {
      return null;
    }
  }, [fontData]);

  const glyphs = useMemo(() => {
    if (!font) return [];
    const out: any[] = [];
    for (let i = 0; i < font.glyphs.length && out.length < maxGlyphs; i++) {
      const g = font.glyphs.get(i);
      if (!g) continue;
      out.push(g);
    }
    return out;
  }, [font, maxGlyphs]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <div style={{ fontWeight: 600 }}>Font Preview</div>
        {metadata?.family ? (
          <div style={{ color: '#555' }}>
            {metadata.family} {metadata.subfamily ? `— ${metadata.subfamily}` : ''}{' '}
            {metadata.weightClass ? `(w${metadata.weightClass})` : ''}
          </div>
        ) : null}
      </div>

      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#555' }}>Sample text</span>
        <input value={sampleText} onChange={(e) => setSampleText(e.target.value)} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }} />
      </label>

      <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8, minHeight: 64 }}>
        {font ? (
          <div style={{ fontFamily: 'inherit' }}>{sampleText}</div>
        ) : (
          <div style={{ color: '#b91c1c' }}>Unable to parse font</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8 }}>
        {glyphs.map((g, idx) => {
          const size = 40;
          const path = g.getPath(8, 32, 28);
          const d = path.toPathData(2);
          return (
            <div key={idx} style={{ border: '1px solid #eee', borderRadius: 8, padding: 6, textAlign: 'center' }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <path d={d} fill="currentColor" />
              </svg>
              <div style={{ fontSize: 10, color: '#666' }}>{g.unicode ? `U+${g.unicode.toString(16).toUpperCase()}` : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
