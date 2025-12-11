import { ConverterAdapter, ConversionResult } from '@/lib/types';
import { initializeImageMagick, ImageMagick, MagickFormat } from 'wasm-imagemagick';

export class ImageConverterAdapter implements ConverterAdapter {
  id = 'image-converter';
  name = 'Image Converter';
  description = 'Convert between various image formats with quality control';
  category = 'image' as const;
  
  supportedFormats = {
    input: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'],
    output: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff']
  };
  
  capabilities = [
    'format-conversion',
    'quality-control', 
    'resize',
    'compress',
    'metadata-extraction'
  ];

  optionsSchema = {
    quality: {
      type: 'range' as const,
      label: 'Quality',
      description: 'Output quality (1-100)',
      default: 85,
      min: 1,
      max: 100,
      step: 1,
    },
    width: {
      type: 'number' as const,
      label: 'Width',
      description: 'Target width in pixels (optional)',
      default: undefined,
      min: 1,
    },
    height: {
      type: 'number' as const,
      label: 'Height', 
      description: 'Target height in pixels (optional)',
      default: undefined,
      min: 1,
    },
    maintainAspectRatio: {
      type: 'boolean' as const,
      label: 'Maintain Aspect Ratio',
      description: 'Preserve image proportions when resizing',
      default: true,
    },
    outputFormat: {
      type: 'select' as const,
      label: 'Output Format',
      description: 'Target image format',
      default: 'jpg',
      options: [
        { value: 'jpg', label: 'JPEG' },
        { value: 'png', label: 'PNG' },
        { value: 'webp', label: 'WebP' },
        { value: 'gif', label: 'GIF' },
        { value: 'bmp', label: 'BMP' },
        { value: 'tiff', label: 'TIFF' },
      ],
    },
  };

  private isInitialized = false;
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await initializeImageMagick();
      this.isInitialized = true;
    }
  }

  validateOptions(options: Record<string, any>): boolean {
    const { quality, width, height } = options;
    
    if (quality !== undefined && (quality < 1 || quality > 100)) {
      return false;
    }
    
    if (width !== undefined && width <= 0) {
      return false;
    }
    
    if (height !== undefined && height <= 0) {
      return false;
    }
    
    return true;
  }

  async getMetadata(input: ArrayBuffer | string): Promise<Record<string, any>> {
    await this.ensureInitialized();
    
    const inputData = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    
    return new Promise((resolve) => {
      ImageMagick.read(inputData, (image) => {
        const metadata = {
          width: image.width,
          height: image.height,
          format: image.format,
          colorSpace: image.colorSpace,
          depth: image.depth,
          hasAlpha: image.hasAlpha,
        };
        
        image.dispose();
        resolve(metadata);
      });
    });
  }

  async convert(input: ArrayBuffer | string, options: Record<string, any>): Promise<ConversionResult> {
    await this.ensureInitialized();
    
    const inputData = typeof input === 'string' 
      ? new TextEncoder().encode(input) 
      : new Uint8Array(input);
    
    const { 
      quality = 85, 
      width, 
      height, 
      maintainAspectRatio = true,
      outputFormat = 'jpg'
    } = options;

    if (!this.validateOptions(options)) {
      return {
        jobId: '', // Will be set by caller
        success: false,
        error: 'Invalid conversion options',
      };
    }

    try {
      const outputBuffer = await new Promise<Uint8Array>((resolve, reject) => {
        ImageMagick.read(inputData, (image) => {
          try {
            // Resize if dimensions specified
            if (width || height) {
              const targetWidth = width || image.width;
              const targetHeight = height || image.height;
              
              if (maintainAspectRatio && width && height) {
                // Calculate aspect ratio preserving dimensions
                const aspectRatio = image.width / image.height;
                const targetAspectRatio = width / height;
                
                if (aspectRatio > targetAspectRatio) {
                  // Image is wider, fit to width
                  image.resize(targetWidth, Math.round(targetWidth / aspectRatio));
                } else {
                  // Image is taller, fit to height
                  image.resize(Math.round(targetHeight * aspectRatio), targetHeight);
                }
              } else {
                image.resize(targetWidth, targetHeight);
              }
            }
            
            // Set quality for formats that support it
            if (['jpg', 'jpeg', 'webp'].includes(outputFormat)) {
              image.quality = quality;
            }
            
            // Convert format
            const format = outputFormat.toUpperCase() as MagickFormat;
            const outputData = image.write(format);
            image.dispose();
            resolve(outputData);
            
          } catch (error) {
            image.dispose();
            reject(error);
          }
        });
      });
      
      return {
        jobId: '', // Will be set by caller
        success: true,
        data: outputBuffer.buffer,
        metadata: {
          originalSize: inputData.length,
          convertedSize: outputBuffer.length,
          compressionRatio: (outputBuffer.length / inputData.length * 100).toFixed(2) + '%',
          format: outputFormat.toUpperCase(),
        },
      };
      
    } catch (error) {
      return {
        jobId: '', // Will be set by caller
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error',
      };
    }
  }
}
