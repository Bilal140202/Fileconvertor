import { useEffect, useMemo, useRef, useState } from 'react';

export interface ImagePreviewProps {
  title: string;
  fileName: string;
  mimeType: string;
  data: Uint8Array;
  maxSize?: number;
}

async function renderBitmapToCanvas(canvas: HTMLCanvasElement, blob: Blob, maxSize: number) {
  const bitmap = await createImageBitmap(blob);

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.floor(bitmap.width * scale));
  const height = Math.max(1, Math.floor(bitmap.height * scale));

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
}

export function ImagePreview({ title, fileName, mimeType, data, maxSize = 160 }: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const blob = useMemo(() => new Blob([data], { type: mimeType }), [data, mimeType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    setError(null);

    void (async () => {
      try {
        await renderBitmapToCanvas(canvas, blob, maxSize);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob, maxSize]);

  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 12 }}>{fileName}</div>
      {error ? <div style={{ color: 'red', fontSize: 12 }}>{error}</div> : <canvas ref={canvasRef} />}
    </div>
  );
}
