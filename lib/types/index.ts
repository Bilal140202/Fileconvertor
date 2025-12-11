export interface ConversionProgress {
  jobId: string;
  progress: number; // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  stage?: string;
}

export interface ConversionResult {
  jobId: string;
  success: boolean;
  data?: ArrayBuffer | string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ConversionJob {
  id: string;
  tool: string;
  adapter: string;
  input: {
    data: ArrayBuffer | string;
    filename: string;
    mimeType: string;
  };
  options: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: ConversionProgress;
}

export interface ConverterAdapter {
  // Adapter metadata
  id: string;
  name: string;
  description: string;
  category: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'qr' | 'utility';
  supportedFormats: {
    input: string[];
    output: string[];
  };
  capabilities: string[];
  
  // Options schema for UI generation
  optionsSchema: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'select' | 'range';
    label: string;
    description?: string;
    default?: any;
    options?: { value: any; label: string }[];
    min?: number;
    max?: number;
    step?: number;
  }>;
  
  // Core conversion methods
  convert(input: ArrayBuffer | string, options: Record<string, any>): Promise<ConversionResult>;
  validateOptions?(options: Record<string, any>): boolean;
  getMetadata?(input: ArrayBuffer | string): Promise<Record<string, any>>;
}

export interface ConversionQueue {
  addJob(job: Omit<ConversionJob, 'id' | 'createdAt' | 'status'>): string;
  getJob(id: string): ConversionJob | undefined;
  updateJobProgress(id: string, progress: ConversionProgress): void;
  updateJobResult(id: string, result: ConversionResult): void;
  removeJob(id: string): boolean;
  getAllJobs(): ConversionJob[];
  clearCompleted(): void;
}

export interface WorkerMessage {
  type: 'CONVERT' | 'PROGRESS' | 'COMPLETE' | 'ERROR';
  payload: any;
  jobId: string;
}
