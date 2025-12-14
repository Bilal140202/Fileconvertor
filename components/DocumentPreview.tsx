'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import type { DocumentFormat, DocumentMetadata } from '@lib/adapters/document-converter';

export type PreviewItem = {
  id: string;
  name: string;
  format: DocumentFormat;
  data: Uint8Array;
  metadata?: DocumentMetadata;
};

export type DocumentPreviewProps = {
  items: PreviewItem[];
  onReorder?: (next: PreviewItem[]) => void;
};

function PdfThumb({ data }: { data: Uint8Array }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const pdfjs: any = await import('pdfjs-dist');
        const getDocument = pdfjs.getDocument ?? pdfjs.default?.getDocument;
        if (typeof getDocument !== 'function') throw new Error('pdfjs-dist getDocument not available');

        const loadingTask = getDocument({ data });
        const doc = await loadingTask.promise;
        const page = await doc.getPage(1);

        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unable to render PDF');
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [data]);

  if (error) return <div style={{ fontSize: 12, color: 'crimson' }}>{error}</div>;
  return <canvas ref={canvasRef} style={{ border: '1px solid #ddd', width: '100%', height: 'auto' }} />;
}

export function DocumentPreview({ items, onReorder }: DocumentPreviewProps) {
  const canReorder = Boolean(onReorder) && items.length > 1;

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  function move(id: string, dir: -1 | 1) {
    if (!onReorder) return;
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const nextIndex = idx + dir;
    if (nextIndex < 0 || nextIndex >= items.length) return;

    const next = [...items];
    const [removed] = next.splice(idx, 1);
    next.splice(nextIndex, 0, removed);

    onReorder(next);
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h3>Preview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((item) => (
          <article key={item.id} style={{ border: '1px solid #eee', padding: 12, display: 'grid', gap: 8 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{item.format.toUpperCase()}</div>
              </div>
              {canReorder ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => move(item.id, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button onClick={() => move(item.id, 1)} aria-label="Move down">
                    ↓
                  </button>
                </div>
              ) : null}
            </header>

            {item.format === 'pdf' ? <PdfThumb data={item.data} /> : null}

            {item.format !== 'pdf' ? (
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {item.metadata?.pageCount ? <div>Pages: {item.metadata.pageCount}</div> : null}
                {item.metadata?.sheetCount ? <div>Sheets: {item.metadata.sheetCount}</div> : null}
                {item.metadata?.slideCount ? <div>Slides: {item.metadata.slideCount}</div> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <details>
        <summary>Merge order (ids)</summary>
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(Array.from(byId.keys()), null, 2)}</pre>
      </details>
    </section>
  );
}
