import { nanoid } from 'nanoid';

import type { AudioConvertOptions, ConversionInput, ImageConvertOptions } from '../types/conversion';
import type { WorkerRequestMessage, WorkerResponseMessage } from '../types/worker';
import { useConversionQueue } from '../store/useConversionQueue';

export interface WorkerLike {
  postMessage: (message: WorkerRequestMessage, transfer?: Transferable[]) => void;
  addEventListener: (type: 'message', listener: (ev: MessageEvent<WorkerResponseMessage>) => void) => void;
  removeEventListener: (type: 'message', listener: (ev: MessageEvent<WorkerResponseMessage>) => void) => void;
  terminate?: () => void;
}

export interface CreateWorkerClientOptions {
  workerFactory?: () => WorkerLike;
}

function defaultWorkerFactory(): WorkerLike {
  return new Worker(new URL('../../workers/conversion-worker.ts', import.meta.url), { type: 'module' });
}

const MAX_RETRIES = 2;

export function createWorkerClient(options: CreateWorkerClientOptions = {}) {
  const worker = (options.workerFactory ?? defaultWorkerFactory)();

  const onMessage = (event: MessageEvent<WorkerResponseMessage>) => {
    const msg = event.data;
    const queue = useConversionQueue.getState();

    if (msg.type === 'PROGRESS') {
      queue.updateJobProgress(msg.jobId, msg.progress);
      return;
    }

    if (msg.type === 'COMPLETE') {
      queue.updateJobResult(msg.jobId, msg.result);
      return;
    }

    if (msg.type === 'ERROR') {
      const job = queue.jobs[msg.jobId];
      const retryCount = job?.retryCount ?? 0;

      if (
        msg.error.name === 'AudioDecodeError' &&
        retryCount < MAX_RETRIES &&
        job?.adapterId === 'audio-converter'
      ) {
        const updatedJob = { ...job, retryCount: retryCount + 1 };
        queue.addJob(updatedJob);

        const transferableInput: ConversionInput = { ...job.input, data: job.input.data.slice() };
        const retryMsg: WorkerRequestMessage = {
          type: 'CONVERT',
          jobId: msg.jobId,
          adapterId: job.adapterId,
          input: transferableInput,
          options: job.options
        };
        worker.postMessage(retryMsg, [transferableInput.data.buffer]);
      } else {
        queue.updateJobError(msg.jobId, msg.error);
      }
    }
  };

  worker.addEventListener('message', onMessage);

  function enqueueConversion(
    adapterId: 'image-converter' | 'audio-converter',
    input: ConversionInput,
    options: ImageConvertOptions | AudioConvertOptions,
    batchId: string
  ): string {
    const jobId = nanoid();
    const queue = useConversionQueue.getState();

    queue.addJob({
      id: jobId,
      batchId,
      adapterId,
      input,
      options,
      status: 'queued',
      progress: { percent: 0, stage: 'queued' },
      retryCount: 0
    });

    const transferableInput: ConversionInput = { ...input, data: input.data.slice() };
    const msg: WorkerRequestMessage = { type: 'CONVERT', jobId, adapterId, input: transferableInput, options };
    worker.postMessage(msg, [transferableInput.data.buffer]);

    return jobId;
  }

  function abortJob(jobId: string) {
    const msg: WorkerRequestMessage = { type: 'ABORT', jobId };
    worker.postMessage(msg);
    useConversionQueue.getState().updateJobStatus(jobId, 'aborted');
  }

  function dispose() {
    worker.removeEventListener('message', onMessage);
    worker.terminate?.();
  }

  return {
    worker,
    enqueueConversion,
    abortJob,
    dispose
  };
}
