import { useMemo } from 'react';

import { useConversionQueue } from '../../lib/store/useConversionQueue';

function downloadBytes(fileName: string, mimeType: string, bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProgressTracker() {
  const jobs = useConversionQueue((s) => Object.values(s.jobs).sort((a, b) => b.createdAt - a.createdAt));
  const batches = useConversionQueue((s) => s.batches);

  const batchDownloads = useMemo(() => Object.values(batches).filter((b) => b.download), [batches]);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {batchDownloads.map((batch) => (
        <button
          key={batch.id}
          onClick={() => {
            if (!batch.download) return;
            downloadBytes(batch.download.fileName, batch.download.mimeType, batch.download.data);
          }}
        >
          Download batch {batch.id}
        </button>
      ))}

      {jobs.map((job) => (
        <div key={job.id} style={{ border: '1px solid #ddd', padding: 8 }}>
          <div>{job.input.fileName}</div>
          <div>
            {job.status} {Math.round(job.progress.percent * 100)}%
          </div>

          {job.result && (
            <button onClick={() => downloadBytes(job.result.fileName, job.result.mimeType, job.result.data)}>
              Download
            </button>
          )}

          {job.error && <div style={{ color: 'red' }}>{job.error.message}</div>}
        </div>
      ))}
    </div>
  );
}
