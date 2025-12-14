/// <reference lib="webworker" />

import type { WorkerRequestMessage, WorkerResponseMessage } from '../lib/types/worker';

const controllers = new Map<string, AbortController>();

function serializeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: 'Error', message: String(error) };
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequestMessage>) => {
  const msg = event.data;

  if (msg.type === 'ABORT') {
    controllers.get(msg.jobId)?.abort();
    controllers.delete(msg.jobId);
    return;
  }

  if (msg.type !== 'CONVERT') return;

  const controller = new AbortController();
  controllers.set(msg.jobId, controller);

  try {
    const { convertImage } = await import('../lib/adapters/image-converter');

    const result = await convertImage(msg.input, msg.options, {
      signal: controller.signal,
      emitProgress: (progress) => {
        const progressMsg: WorkerResponseMessage = { type: 'PROGRESS', jobId: msg.jobId, progress };
        self.postMessage(progressMsg);
      }
    });

    const completeMsg: WorkerResponseMessage = { type: 'COMPLETE', jobId: msg.jobId, result };
    self.postMessage(completeMsg, [result.data.buffer]);
  } catch (error) {
    const errorMsg: WorkerResponseMessage = {
      type: 'ERROR',
      jobId: msg.jobId,
      error: serializeError(error)
    };
    self.postMessage(errorMsg);
  } finally {
    controllers.delete(msg.jobId);
  }
});
