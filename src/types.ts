export type FileStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface FileJob {
  id: string;
  file?: File; // Optional because it might be missing after reload
  name: string;
  size: number;
  type: string;
  targetFormat?: string;
  progress: number;
  status: FileStatus;
  previewUrl?: string; // Blob URL or data URL
  error?: string;
}
