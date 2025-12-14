import type {
  AudioConvertOptions,
  ConversionInput,
  ConversionOutput,
  ConversionProgress,
  ImageConvertOptions
} from './conversion';

export type WorkerRequestMessage =
  | {
      type: 'CONVERT';
      jobId: string;
      adapterId: 'image-converter' | 'audio-converter';
      input: ConversionInput;
      options: ImageConvertOptions | AudioConvertOptions;
    }
  | {
      type: 'ABORT';
      jobId: string;
    };

export type WorkerResponseMessage =
  | {
      type: 'PROGRESS';
      jobId: string;
      progress: ConversionProgress;
    }
  | {
      type: 'COMPLETE';
      jobId: string;
      result: ConversionOutput;
    }
  | {
      type: 'ERROR';
      jobId: string;
      error: {
        name: string;
        message: string;
        stack?: string;
      };
    };
