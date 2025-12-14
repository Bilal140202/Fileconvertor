import { beforeEach, describe, expect, it } from 'vitest';

import { useConversionQueue } from '../lib/store/useConversionQueue';
import { createWorkerClient } from '../lib/utils/worker-client';
import type { WorkerRequestMessage, WorkerResponseMessage } from '../lib/types/worker';

class MockWorker {
  private listeners = new Set<(e: MessageEvent<WorkerResponseMessage>) => void>();

  postMessage(_message: WorkerRequestMessage, _transfer?: Transferable[]): void {
    return;
  }

  addEventListener(_type: 'message', listener: (ev: MessageEvent<WorkerResponseMessage>) => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: 'message', listener: (ev: MessageEvent<WorkerResponseMessage>) => void) {
    this.listeners.delete(listener);
  }

  emit(message: WorkerResponseMessage) {
    const event = { data: message } as MessageEvent<WorkerResponseMessage>;
    for (const listener of this.listeners) listener(event);
  }
}

beforeEach(() => {
  useConversionQueue.setState({ jobs: {}, batches: {} });
});

describe('worker-client wiring', () => {
  it('routes PROGRESS/COMPLETE/ERROR messages into the queue store', async () => {
    const worker = new MockWorker();
    const client = createWorkerClient({ workerFactory: () => worker });

    const batchId = 'batch-1';

    const jobId = client.enqueueConversion(
      {
        fileName: 'a.png',
        mimeType: 'image/png',
        data: new Uint8Array([1, 2, 3])
      },
      { outputFormat: 'jpeg' },
      batchId
    );

    expect(useConversionQueue.getState().jobs[jobId]).toBeTruthy();

    worker.emit({ type: 'PROGRESS', jobId, progress: { percent: 0.5, stage: 'encode' } });
    expect(useConversionQueue.getState().jobs[jobId]?.progress.percent).toBe(0.5);

    worker.emit({
      type: 'COMPLETE',
      jobId,
      result: {
        fileName: 'a.jpg',
        mimeType: 'image/jpeg',
        data: new Uint8Array([4, 5, 6])
      }
    });

    expect(useConversionQueue.getState().jobs[jobId]?.status).toBe('completed');

    client.dispose();
  });

  it('creates a zip download for completed multi-file batches', async () => {
    const worker = new MockWorker();
    const client = createWorkerClient({ workerFactory: () => worker });

    const batchId = 'batch-zip';

    const jobA = client.enqueueConversion(
      { fileName: 'a.png', mimeType: 'image/png', data: new Uint8Array([1]) },
      { outputFormat: 'png' },
      batchId
    );

    const jobB = client.enqueueConversion(
      { fileName: 'b.png', mimeType: 'image/png', data: new Uint8Array([2]) },
      { outputFormat: 'png' },
      batchId
    );

    worker.emit({
      type: 'COMPLETE',
      jobId: jobA,
      result: { fileName: 'a.png', mimeType: 'image/png', data: new Uint8Array([3]) }
    });

    worker.emit({
      type: 'COMPLETE',
      jobId: jobB,
      result: { fileName: 'b.png', mimeType: 'image/png', data: new Uint8Array([4]) }
    });

    for (let i = 0; i < 20; i++) {
      const download = useConversionQueue.getState().batches[batchId]?.download;
      if (download) {
        expect(download.mimeType).toBe('application/zip');
        expect(download.data.length).toBeGreaterThan(0);
        client.dispose();
        return;
      }
      await new Promise((r) => setTimeout(r, 10));
    }

    throw new Error('Batch zip was not created');
  });
});
