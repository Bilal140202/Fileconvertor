import { ConverterAdapter, ConversionResult } from '@/lib/types';
import Color from 'color';
import { convertUnit } from 'unit-converter';

export class UtilityAdapter implements ConverterAdapter {
  id = 'utility-converter';
  name = 'Utility Converter';
  description = 'Color conversion, unit conversion, and other utilities';
  category = 'utility' as const;
  
  supportedFormats = {
    input: ['hex', 'rgb', 'hsl', 'cmyk', 'temperature', 'length', 'weight', 'area'],
    output: ['hex', 'rgb', 'hsl', 'cmyk', 'temperature', 'length', 'weight', 'area']
  };
  
  capabilities = [
    'color-conversion',
    'unit-conversion',
    'format-validation'
  ];

  optionsSchema = {
    conversionType: {
      type: 'select' as const,
      label: 'Conversion Type',
      description: 'Type of utility conversion',
      default: 'color',
      options: [
        { value: 'color', label: 'Color Conversion' },
        { value: 'unit', label: 'Unit Conversion' },
      ],
    },
    targetFormat: {
      type: 'string' as const,
      label: 'Target Format',
      description: 'Target format for conversion',
      default: 'rgb',
    },
    fromUnit: {
      type: 'string' as const,
      label: 'From Unit',
      description: 'Source unit for conversion',
      default: 'cm',
    },
    toUnit: {
      type: 'string' as const,
      label: 'To Unit', 
      description: 'Target unit for conversion',
      default: 'inch',
    },
  };

  async convert(input: ArrayBuffer | string, options: Record<string, any>): Promise<ConversionResult> {
    const { conversionType = 'color', targetFormat = 'rgb', fromUnit, toUnit } = options;
    
    try {
      const text = typeof input === 'string' ? input : new TextDecoder().decode(input);
      
      if (conversionType === 'color') {
        const color = new Color(text);
        let result: string;
        
        switch (targetFormat) {
          case 'hex':
            result = color.hex();
            break;
          case 'rgb':
            result = color.rgb().string();
            break;
          case 'hsl':
            result = color.hsl().string();
            break;
          case 'cmyk':
            result = color.cmyk().string();
            break;
          default:
            throw new Error(`Unsupported color format: ${targetFormat}`);
        }
        
        return {
          jobId: '',
          success: true,
          data: new TextEncoder().encode(result),
          metadata: { inputColor: text, outputFormat: targetFormat, result },
        };
        
      } else if (conversionType === 'unit') {
        if (!fromUnit || !toUnit) {
          throw new Error('fromUnit and toUnit are required for unit conversion');
        }
        
        const value = parseFloat(text);
        if (isNaN(value)) {
          throw new Error('Invalid numeric value for unit conversion');
        }
        
        const result = convertUnit(value, fromUnit, toUnit);
        
        return {
          jobId: '',
          success: true,
          data: new TextEncoder().encode(result.toString()),
          metadata: { 
            inputValue: value, 
            fromUnit, 
            toUnit, 
            result: result,
            type: 'unit-conversion'
          },
        };
      }
      
      return {
        jobId: '',
        success: false,
        error: `Unsupported conversion type: ${conversionType}`,
      };
      
    } catch (error) {
      return {
        jobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Utility conversion failed',
      };
    }
  }
}
