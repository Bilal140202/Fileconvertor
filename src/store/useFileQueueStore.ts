import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FileJob, FileStatus } from '../types';

interface FileQueueState {
  jobs: FileJob[];
  addFiles: (files: File[]) => void;
  removeJob: (id: string) => void;
  updateJob: (id: string, updates: Partial<FileJob>) => void;
  updateStatus: (id: string, status: FileStatus) => void;
  clearQueue: () => void;
  startQueue: () => void;
  pauseQueue: () => void;
  cancelQueue: () => void;
  retryJob: (id: string) => void;
}

export const useFileQueueStore = create<FileQueueState>()(
  persist(
    (set) => ({
      jobs: [],
      addFiles: (files) => {
        const newJobs: FileJob[] = files.map((file) => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'idle',
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));
        
        set((state) => ({ jobs: [...state.jobs, ...newJobs] }));
      },
      removeJob: (id) => set((state) => {
        const job = state.jobs.find(j => j.id === id);
        if (job?.previewUrl) URL.revokeObjectURL(job.previewUrl);
        return { jobs: state.jobs.filter((j) => j.id !== id) };
      }),
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
      })),
      updateStatus: (id, status) => set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? { ...j, status } : j)),
      })),
      clearQueue: () => set((state) => {
        state.jobs.forEach(j => {
            if (j.previewUrl) URL.revokeObjectURL(j.previewUrl);
        });
        return { jobs: [] };
      }),
      startQueue: () => {
        set((state) => ({
          jobs: state.jobs.map((j) => 
            j.status === 'idle' || j.status === 'error' || j.status === 'cancelled' 
              ? { ...j, status: 'queued' } 
              : j
          ),
        }));
      },
      pauseQueue: () => {
         // Placeholder for pause logic
      },
      cancelQueue: () => set((state) => ({
        jobs: state.jobs.map((j) => 
            (j.status === 'queued' || j.status === 'processing')
             ? { ...j, status: 'cancelled' }
             : j
        )
      })),
      retryJob: (id) => set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: 'queued', progress: 0, error: undefined } : j)),
      })),
    }),
    {
      name: 'file-queue-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jobs: state.jobs.map(job => ({
          ...job,
          file: undefined, // Don't persist File object
          previewUrl: undefined // Don't persist Blob URLs
        }))
      }),
    }
  )
);
