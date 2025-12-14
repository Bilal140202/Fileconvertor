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
    const mimeType = msg.input.mimeType.toLowerCase();
    let result;

    const context = {
      signal: controller.signal,
      emitProgress: (progress: { percent: number; stage?: string; message?: string }) => {
        const progressMsg: WorkerResponseMessage = { type: 'PROGRESS', jobId: msg.jobId, progress };
        self.postMessage(progressMsg);
      }
    };

    if (mimeType.startsWith('image/')) {
      const { convertImage } = await import('../lib/adapters/image-converter');
      result = await convertImage(msg.input, msg.options as never, context);
    } else if (mimeType.startsWith('video/')) {
      const { convertVideo } = await import('../lib/adapters/video-converter');
      result = await convertVideo(msg.input, msg.options as never, context);
    } else if (mimeType.startsWith('audio/')) {
      const { convertAudio } = await import('../lib/adapters/audio-converter');
      result = await convertAudio(msg.input, msg.options as never, context);
    } else {
      throw new Error(`Unsupported MIME type: ${msg.input.mimeType}`);
    }

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
