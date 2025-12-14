import { useMemo } from 'react';

import { useConversionQueue } from '../../lib/store/useConversionQueue';

function downloadBytes(fileName: string, mimeType: string, bytes: Uint8Array) {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
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
        <div key={job.id} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 4 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{job.input.fileName}</div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ textTransform: 'capitalize' }}>{job.status}</span>
              <div style={{ flex: 1, height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.round(job.progress.percent * 100)}%`,
                    height: '100%',
                    background: job.status === 'error' ? '#dc3545' : job.status === 'completed' ? '#28a745' : '#007bff',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <span>{Math.round(job.progress.percent * 100)}%</span>
            </div>
            {job.progress.message && <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>{job.progress.message}</div>}
          </div>

          {job.result && (
            <>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                {job.result.fileName} ({Math.round(job.result.data.length / 1024)} KB)
              </div>
              <button onClick={() => job.result && downloadBytes(job.result.fileName, job.result.mimeType, job.result.data)}>
                Download
              </button>
            </>
          )}

          {job.error && <div style={{ color: 'red', fontSize: '14px' }}>{job.error.message}</div>}
        </div>
      ))}
    </div>
  );
}
