export type ByteArray = Uint8Array;

export type FilePath = string;

export interface FileEntry {
  path: FilePath;
  data: ByteArray;
  mtime?: Date;
}

export interface ProgressUpdate {
  progress: number; // 0..1
  message?: string;
}

export type ProgressCallback = (update: ProgressUpdate) => void;
