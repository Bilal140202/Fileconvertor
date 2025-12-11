import { ConverterAdapter, ConversionResult } from '@/lib/types';
import QRCode from 'qrcode';

export class QRCodeAdapter implements ConverterAdapter {
  id = 'qr-generator';
  name = 'QR Code Generator';
  description = 'Generate QR codes from text or data';
  category = 'qr' as const;
  
  supportedFormats = {
    input: ['text', 'url', 'vcard', 'wifi', 'sms', 'email'],
    output: ['png', 'svg', 'jpg']
  };
  
  capabilities = [
    'qr-generation',
    'custom-styling',
    'error-correction',
    'size-control'
  ];

  optionsSchema = {
    size: {
      type: 'number' as const,
      label: 'Size',
      description: 'QR code size in pixels',
      default: 256,
      min: 64,
      max: 1024,
    },
    margin: {
      type: 'number' as const,
      label: 'Margin',
      description: 'White space around QR code',
      default: 4,
      min: 0,
      max: 20,
    },
    errorCorrectionLevel: {
      type: 'select' as const,
      label: 'Error Correction',
      description: 'Error correction level',
      default: 'M',
      options: [
        { value: 'L', label: 'Low (~7%)' },
        { value: 'M', label: 'Medium (~15%)' },
        { value: 'Q', label: 'Quartile (~25%)' },
        { value: 'H', label: 'High (~30%)' },
      ],
    },
    color: {
      type: 'string' as const,
      label: 'Foreground Color',
      description: 'QR code foreground color (hex)',
      default: '#000000',
    },
    backgroundColor: {
      type: 'string' as const,
      label: 'Background Color',
      description: 'QR code background color (hex)',
      default: '#FFFFFF',
    },
    outputFormat: {
      type: 'select' as const,
      label: 'Output Format',
      description: 'Output image format',
      default: 'png',
      options: [
        { value: 'png', label: 'PNG' },
        { value: 'svg', label: 'SVG' },
        { value: 'jpg', label: 'JPEG' },
      ],
    },
  };

  async convert(input: ArrayBuffer | string, options: Record<string, any>): Promise<ConversionResult> {
    const {
      size = 256,
      margin = 4,
      errorCorrectionLevel = 'M',
      color = '#000000',
      backgroundColor = '#FFFFFF',
      outputFormat = 'png'
    } = options;

    try {
      const text = typeof input === 'string' ? input : new TextDecoder().decode(input);
      
      let dataUrl: string;
      
      if (outputFormat === 'svg') {
        dataUrl = await QRCode.toDataURL(text, {
          type: 'svg',
          width: size,
          margin,
          errorCorrectionLevel: errorCorrectionLevel as any,
          color: {
            dark: color,
            light: backgroundColor,
          },
        });
      } else {
        dataUrl = await QRCode.toDataURL(text, {
          width: size,
          margin,
          errorCorrectionLevel: errorCorrectionLevel as any,
          color: {
            dark: color,
            light: backgroundColor,
          },
        });
      }
      
      // Convert data URL to ArrayBuffer
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      return {
        jobId: '',
        success: true,
        data: arrayBuffer,
        metadata: {
          text,
          size,
          format: outputFormat.toUpperCase(),
          errorCorrectionLevel,
        },
      };
      
    } catch (error) {
      return {
        jobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'QR code generation failed',
      };
    }
  }
}
