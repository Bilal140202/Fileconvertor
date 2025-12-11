/// <reference lib="webworker" />
import { expose } from 'comlink';
import { 
  ConversionJob, 
  ConversionProgress, 
  ConversionResult, 
  WorkerMessage,
  ConverterAdapter 
} from '@/lib/types';
import { adapterRegistry } from '@/lib/adapters/registry';

// Worker state
const activeJobs = new Map<string, {
  job: ConversionJob;
  adapter: ConverterAdapter;
  abortController: AbortController;
}>();

// Progress callback for real-time updates
const progressCallbacks = new Map<string, (progress: ConversionProgress) => void>();

// Helper function to send messages back to main thread
const sendMessage = (type: WorkerMessage['type'], payload: any, jobId: string) => {
  const message: WorkerMessage = { type, payload, jobId };
  (self as any).postMessage(message);
};

// Update progress and notify main thread
const updateProgress = (jobId: string, progress: Partial<ConversionProgress>) => {
  const existingCallback = progressCallbacks.get(jobId);
  if (existingCallback) {
    const fullProgress: ConversionProgress = {
      jobId,
      progress: 0,
      status: 'processing',
      ...progress,
    };
    existingCallback(fullProgress);
  }
  
  sendMessage('PROGRESS', progress, jobId);
};

// Main conversion function
const performConversion = async (jobId: string): Promise<void> => {
  const jobState = activeJobs.get(jobId);
  if (!jobState) {
    sendMessage('ERROR', { error: 'Job not found' }, jobId);
    return;
  }

  const { job, adapter } = jobState;

  try {
    updateProgress(jobId, { status: 'processing', progress: 10, message: 'Starting conversion...' });

    // Validate options if adapter supports it
    if (adapter.validateOptions && !adapter.validateOptions(job.options)) {
      throw new Error('Invalid conversion options');
    }

    updateProgress(jobId, { progress: 30, message: 'Processing input...' });

    // Perform the actual conversion
    const result = await adapter.convert(job.input.data, job.options);
    result.jobId = jobId;

    updateProgress(jobId, { progress: 90, message: 'Finalizing...' });

    // Send completion message
    sendMessage('COMPLETE', result, jobId);
    
    // Clean up
    activeJobs.delete(jobId);
    progressCallbacks.delete(jobId);

  } catch (error) {
    const errorResult: ConversionResult = {
      jobId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    };

    sendMessage('ERROR', errorResult, jobId);
    
    // Clean up
    activeJobs.delete(jobId);
    progressCallbacks.delete(jobId);
  }
};

// Comlink-exposed API
const conversionWorkerAPI = {
  // Start a new conversion job
  async startConversion(
    job: Omit<ConversionJob, 'id' | 'createdAt' | 'status'>,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullJob: ConversionJob = {
      ...job,
      id: jobId,
      createdAt: new Date(),
      status: 'pending',
    };

    // Find the appropriate adapter
    const adapter = adapterRegistry.getAdapter(job.adapter);
    if (!adapter) {
      throw new Error(`Adapter '${job.adapter}' not found`);
    }

    // Verify format support
    const inputFormat = job.input.filename.split('.').pop()?.toLowerCase();
    if (inputFormat && !adapter.supportedFormats.input.includes(inputFormat)) {
      throw new Error(`Adapter '${job.adapter}' does not support input format: ${inputFormat}`);
    }

    // Store job state
    const abortController = new AbortController();
    activeJobs.set(jobId, { job: fullJob, adapter, abortController });
    
    if (onProgress) {
      progressCallbacks.set(jobId, onProgress);
    }

    // Start conversion in background
    performConversion(jobId);

    return jobId;
  },

  // Get current job status
  getJobStatus(jobId: string): ConversionJob | undefined {
    const jobState = activeJobs.get(jobId);
    return jobState?.job;
  },

  // Cancel a running job
  cancelConversion(jobId: string): boolean {
    const jobState = activeJobs.get(jobId);
    if (jobState) {
      jobState.abortController.abort();
      activeJobs.delete(jobId);
      progressCallbacks.delete(jobId);
      
      sendMessage('ERROR', { error: 'Job cancelled by user' }, jobId);
      return true;
    }
    return false;
  },

  // Get all registered adapters
  getAdapters() {
    return adapterRegistry.getAllAdapters().map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      description: adapter.description,
      category: adapter.category,
      supportedFormats: adapter.supportedFormats,
      capabilities: adapter.capabilities,
      optionsSchema: adapter.optionsSchema,
    }));
  },

  // Get adapter by ID
  getAdapter(adapterId: string) {
    const adapter = adapterRegistry.getAdapter(adapterId);
    if (!adapter) return null;

    return {
      id: adapter.id,
      name: adapter.name,
      description: adapter.description,
      category: adapter.category,
      supportedFormats: adapter.supportedFormats,
      capabilities: adapter.capabilities,
      optionsSchema: adapter.optionsSchema,
    };
  },

  // Find adapters for specific conversion
  findAdapters(fromFormat: string, toFormat: string) {
    return adapterRegistry.findAdaptersForConversion(fromFormat, toFormat).map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      description: adapter.description,
      category: adapter.category,
      supportedFormats: adapter.supportedFormats,
      capabilities: adapter.capabilities,
      optionsSchema: adapter.optionsSchema,
    }));
  },

  // Get file metadata using appropriate adapter
  async getMetadata(adapterId: string, input: ArrayBuffer | string) {
    const adapter = adapterRegistry.getAdapter(adapterId);
    if (!adapter || !adapter.getMetadata) {
      throw new Error(`Adapter '${adapterId}' does not support metadata extraction`);
    }

    return await adapter.getMetadata(input);
  },

  // Validate options for an adapter
  validateAdapterOptions(adapterId: string, options: Record<string, any>) {
    const adapter = adapterRegistry.getAdapter(adapterId);
    if (!adapter) {
      throw new Error(`Adapter '${adapterId}' not found`);
    }

    if (adapter.validateOptions) {
      return adapter.validateOptions(options);
    }

    return true; // No validation defined, assume valid
  },
};

// Export the worker API
expose(conversionWorkerAPI);

// Handle worker initialization
console.log('Conversion worker initialized with adapters:', 
  adapterRegistry.getAllAdapters().map(a => a.id).join(', '));
