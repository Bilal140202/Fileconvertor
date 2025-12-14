export type ByteArray = Uint8Array;

export interface FileEntry {
  path: string;
  data: ByteArray;
  mtime?: Date;
}

export interface ProgressUpdate {
  progress: number; // 0..1
  message?: string;
}

export type ProgressCallback = (update: ProgressUpdate) => void;
