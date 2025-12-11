import * as Comlink from 'comlink';

interface ConversionWorkerAPI {
  startConversion: (
    job: any,
    onProgress?: (progress: any) => void
  ) => Promise<string>;
  getJobStatus: (jobId: string) => any;
  cancelConversion: (jobId: string) => boolean;
  getAdapters: () => any[];
  getAdapter: (adapterId: string) => any;
  findAdapters: (fromFormat: string, toFormat: string) => any[];
  getMetadata: (adapterId: string, input: ArrayBuffer | string) => Promise<any>;
  validateAdapterOptions: (adapterId: string, options: Record<string, any>) => boolean;
}

class WorkerClient {
  private worker: Worker | null = null;
  private api: Comlink.Remote<ConversionWorkerAPI> | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create worker using dynamic import for Next.js
      this.worker = new Worker(
        new URL('@/workers/conversion-worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.api = Comlink.wrap<ConversionWorkerAPI>(this.worker);
      this.isInitialized = true;
      
      console.log('Conversion worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize conversion worker:', error);
      throw error;
    }
  }

  async getAPI(): Promise<Comlink.Remote<ConversionWorkerAPI>> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.api) {
      throw new Error('Worker API not available');
    }
    
    return this.api;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.api = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
export const workerClient = new WorkerClient();

// Hook for React components
export const useConversionWorker = () => {
  return {
    async startConversion(
      job: any,
      onProgress?: (progress: any) => void
    ): Promise<string> {
      const api = await workerClient.getAPI();
      return await api.startConversion(job, onProgress);
    },

    async getJobStatus(jobId: string) {
      const api = await workerClient.getAPI();
      return await api.getJobStatus(jobId);
    },

    async cancelConversion(jobId: string): Promise<boolean> {
      const api = await workerClient.getAPI();
      return await api.cancelConversion(jobId);
    },

    async getAdapters() {
      const api = await workerClient.getAPI();
      return await api.getAdapters();
    },

    async getAdapter(adapterId: string) {
      const api = await workerClient.getAPI();
      return await api.getAdapter(adapterId);
    },

    async findAdapters(fromFormat: string, toFormat: string) {
      const api = await workerClient.getAPI();
      return await api.findAdapters(fromFormat, toFormat);
    },

    async getMetadata(adapterId: string, input: ArrayBuffer | string) {
      const api = await workerClient.getAPI();
      return await api.getMetadata(adapterId, input);
    },

    async validateAdapterOptions(adapterId: string, options: Record<string, any>) {
      const api = await workerClient.getAPI();
      return await api.validateAdapterOptions(adapterId, options);
    },
  };
};
