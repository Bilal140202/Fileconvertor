export type ImageFormat =
  | 'png'
  | 'jpeg'
  | 'jpg'
  | 'webp'
  | 'gif'
  | 'svg'
  | 'tiff'
  | 'ico'
  | 'bmp';

export interface ConversionInput {
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}

export interface ConversionOutput {
  fileName: string;
  mimeType: string;
  data: Uint8Array;
}

export interface ConversionProgress {
  percent: number;
  stage?: string;
  message?: string;
}

export interface ConversionContext {
  signal: AbortSignal;
  emitProgress: (progress: ConversionProgress) => void;
}

export interface ImageTransformOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  backgroundColor?: string;
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue?: number;
  };
}

export interface ImageConvertOptions extends ImageTransformOptions {
  outputFormat: ImageFormat;
  quality?: number;
}
