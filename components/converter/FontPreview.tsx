import { useMemo, useState } from 'react';
import opentype from 'opentype.js';

export interface FontPreviewProps {
  fontData: Uint8Array;
  initialSampleText?: string;
  maxGlyphs?: number;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

export function FontPreview({
  fontData,
  initialSampleText = 'The quick brown fox jumps over the lazy dog',
  maxGlyphs = 96
}: FontPreviewProps) {
  const [sampleText, setSampleText] = useState(initialSampleText);

  const font = useMemo(() => {
    try {
      return opentype.parse(toArrayBuffer(fontData));
    } catch {
      return null;
    }
  }, [fontData]);

  const sampleSvg = useMemo(() => {
    if (!font) return null;
    const fontSize = 56;
    const path = font.getPath(sampleText, 0, fontSize, fontSize);
    const bbox = path.getBoundingBox();
    const width = Math.max(1, bbox.x2 - bbox.x1);
    const height = Math.max(1, bbox.y2 - bbox.y1);

    return {
      viewBox: `${bbox.x1} ${bbox.y1} ${width} ${height}`,
      d: path.toPathData(2)
    };
  }, [font, sampleText]);

  const glyphs = useMemo(() => {
    if (!font) return [];
    const out: opentype.Glyph[] = [];
    for (let i = 0; i < font.glyphs.length && out.length < maxGlyphs; i++) {
      const g = font.glyphs.get(i);
      if (!g) continue;
      out.push(g);
    }
    return out;
  }, [font, maxGlyphs]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.75 }}>Sample text</span>
        <input value={sampleText} onChange={(e) => setSampleText(e.target.value)} style={{ padding: 8, border: '1px solid #ddd' }} />
      </label>

      <div style={{ padding: 12, border: '1px solid #eee' }}>
        {sampleSvg ? (
          <svg width="100%" height={80} viewBox={sampleSvg.viewBox} preserveAspectRatio="xMinYMid meet">
            <path d={sampleSvg.d} fill="currentColor" />
          </svg>
        ) : (
          <div style={{ color: '#b91c1c' }}>Unable to parse font</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 8 }}>
        {glyphs.map((g, idx) => {
          const size = 40;
          const path = g.getPath(8, 32, 28);
          const d = path.toPathData(2);
          const unicode = g.unicode;
          return (
            <div key={idx} style={{ border: '1px solid #eee', padding: 6, textAlign: 'center' }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <path d={d} fill="currentColor" />
              </svg>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{unicode != null ? `U+${unicode.toString(16).toUpperCase()}` : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
