import { create } from 'zustand';

import type {
  ConversionOutput,
  ConversionProgress,
  ImageConvertOptions,
  VideoConvertOptions,
  AudioConvertOptions
} from '../types/conversion';
import type { ConversionInput } from '../types/conversion';
import { zipFiles } from '../utils/batch-zip';

export type ConversionJobStatus = 'queued' | 'running' | 'completed' | 'error' | 'aborted';

export interface ConversionJobError {
  name: string;
  message: string;
  stack?: string;
}

export type ConversionOptions = ImageConvertOptions | VideoConvertOptions | AudioConvertOptions;

export interface ConversionJob {
  id: string;
  batchId: string;
  input: ConversionInput;
  options: ConversionOptions;
  status: ConversionJobStatus;
  progress: ConversionProgress;
  result?: ConversionOutput;
  error?: ConversionJobError;
  createdAt: number;
  updatedAt: number;
}

export interface ConversionBatchDownload {
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}

export interface ConversionBatch {
  id: string;
  jobIds: string[];
  download?: ConversionBatchDownload;
}

interface ConversionQueueState {
  jobs: Record<string, ConversionJob>;
  batches: Record<string, ConversionBatch>;

  addJob: (job: Omit<ConversionJob, 'createdAt' | 'updatedAt'>) => void;
  updateJobProgress: (jobId: string, progress: ConversionProgress) => void;
  updateJobResult: (jobId: string, result: ConversionOutput) => void;
  updateJobError: (jobId: string, error: ConversionJobError) => void;
  updateJobStatus: (jobId: string, status: ConversionJobStatus) => void;

  ensureBatch: (batchId: string) => void;
  finalizeBatch: (batchId: string) => Promise<void>;
}

export const useConversionQueue = create<ConversionQueueState>((set, get) => ({
  jobs: {},
  batches: {},

  ensureBatch: (batchId) => {
    set((state) => {
      if (state.batches[batchId]) return state;
      return {
        ...state,
        batches: {
          ...state.batches,
          [batchId]: { id: batchId, jobIds: [] }
        }
      };
    });
  },

  addJob: (job) => {
    set((state) => {
      const now = Date.now();
      const batch = state.batches[job.batchId] ?? { id: job.batchId, jobIds: [] };

      return {
        ...state,
        jobs: {
          ...state.jobs,
          [job.id]: {
            ...job,
            createdAt: now,
            updatedAt: now
          }
        },
        batches: {
          ...state.batches,
          [job.batchId]: {
            ...batch,
            jobIds: batch.jobIds.includes(job.id) ? batch.jobIds : [...batch.jobIds, job.id]
          }
        }
      };
    });
  },

  updateJobStatus: (jobId, status) => {
    set((state) => {
      const job = state.jobs[jobId];
      if (!job) return state;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [jobId]: {
            ...job,
            status,
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  updateJobProgress: (jobId, progress) => {
    set((state) => {
      const job = state.jobs[jobId];
      if (!job) return state;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [jobId]: {
            ...job,
            status: job.status === 'queued' ? 'running' : job.status,
            progress,
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  updateJobResult: (jobId, result) => {
    set((state) => {
      const job = state.jobs[jobId];
      if (!job) return state;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [jobId]: {
            ...job,
            status: 'completed',
            progress: { percent: 1, stage: 'complete' },
            result,
            error: undefined,
            updatedAt: Date.now()
          }
        }
      };
    });

    const batchId = get().jobs[jobId]?.batchId;
    if (batchId) void get().finalizeBatch(batchId);
  },

  updateJobError: (jobId, error) => {
    set((state) => {
      const job = state.jobs[jobId];
      if (!job) return state;
      return {
        ...state,
        jobs: {
          ...state.jobs,
          [jobId]: {
            ...job,
            status: error.name === 'AbortError' ? 'aborted' : 'error',
            error,
            updatedAt: Date.now()
          }
        }
      };
    });
  },

  finalizeBatch: async (batchId) => {
    const state = get();
    const batch = state.batches[batchId];
    if (!batch) return;

    const jobs = batch.jobIds.map((id) => state.jobs[id]).filter(Boolean);
    if (jobs.length <= 1) return;
    if (!jobs.every((j) => j.status === 'completed' && j.result)) return;

    const entries = jobs
      .map((j) => j.result)
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({ fileName: r.fileName, data: r.data }));

    const zipBytes = await zipFiles(entries);

    set((prev) => ({
      ...prev,
      batches: {
        ...prev.batches,
        [batchId]: {
          ...prev.batches[batchId],
          download: {
            fileName: `converted-${batchId}.zip`,
            mimeType: 'application/zip',
            data: zipBytes
          }
        }
      }
    }));
  }
}));
