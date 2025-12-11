import { create } from 'zustand';
import { ConversionJob, ConversionProgress, ConversionResult, ConversionQueue } from '@/lib/types';

interface QueueStore extends ConversionQueue {
  jobs: Map<string, ConversionJob>;
  listeners: Set<(job: ConversionJob) => void>;
  
  // Additional store-specific methods
  addListener: (callback: (job: ConversionJob) => void) => () => void;
  notifyListeners: (job: ConversionJob) => void;
}

export const useConversionQueue = create<QueueStore>((set, get) => ({
  jobs: new Map(),
  listeners: new Set(),
  
  addJob: (jobData) => {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: ConversionJob = {
      ...jobData,
      id,
      createdAt: new Date(),
      status: 'pending',
    };
    
    set(state => {
      const newJobs = new Map(state.jobs);
      newJobs.set(id, job);
      return { jobs: newJobs };
    });
    
    get().notifyListeners(job);
    return id;
  },
  
  getJob: (id) => {
    return get().jobs.get(id);
  },
  
  updateJobProgress: (id, progress) => {
    set(state => {
      const job = state.jobs.get(id);
      if (!job) return state;
      
      const updatedJob = { ...job, progress };
      const newJobs = new Map(state.jobs);
      newJobs.set(id, updatedJob);
      
      return { jobs: newJobs };
    });
    
    const updatedJob = get().jobs.get(id);
    if (updatedJob) {
      get().notifyListeners(updatedJob);
    }
  },
  
  updateJobResult: (id, result) => {
    set(state => {
      const job = state.jobs.get(id);
      if (!job) return state;
      
      const updatedJob = { 
        ...job, 
        status: result.success ? 'completed' as const : 'error' as const,
        progress: result.success 
          ? { ...job.progress, status: 'completed', progress: 100 }
          : { ...job.progress, status: 'error', message: result.error }
      };
      const newJobs = new Map(state.jobs);
      newJobs.set(id, updatedJob);
      
      return { jobs: newJobs };
    });
    
    const updatedJob = get().jobs.get(id);
    if (updatedJob) {
      get().notifyListeners(updatedJob);
    }
  },
  
  removeJob: (id) => {
    const existed = get().jobs.has(id);
    if (existed) {
      set(state => {
        const newJobs = new Map(state.jobs);
        newJobs.delete(id);
        return { jobs: newJobs };
      });
    }
    return existed;
  },
  
  getAllJobs: () => {
    return Array.from(get().jobs.values());
  },
  
  clearCompleted: () => {
    set(state => {
      const newJobs = new Map(state.jobs);
      for (const [id, job] of newJobs.entries()) {
        if (job.status === 'completed' || job.status === 'error') {
          newJobs.delete(id);
        }
      }
      return { jobs: newJobs };
    });
  },
  
  addListener: (callback) => {
    const listeners = get().listeners;
    listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  },
  
  notifyListeners: (job) => {
    const listeners = get().listeners;
    listeners.forEach(callback => callback(job));
  },
}));

// Helper function to create a conversion queue instance
export const createConversionQueue = (): ConversionQueue => {
  return useConversionQueue.getState();
};
