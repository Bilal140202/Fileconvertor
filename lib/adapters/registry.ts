import { ConverterAdapter } from '@/lib/types';
import { ImageConverterAdapter } from './image-converter';
import { AudioVideoConverterAdapter } from './audiovideo-converter';
import { DocumentConverterAdapter } from './document-converter';
import { ArchiveConverterAdapter } from './archive-converter';
import { QRCodeAdapter } from './qr-adapter';
import { UtilityAdapter } from './utility-adapter';

class AdapterRegistry {
  private adapters: Map<string, ConverterAdapter> = new Map();

  constructor() {
    this.registerBuiltInAdapters();
  }

  private registerBuiltInAdapters() {
    const adapters = [
      new ImageConverterAdapter(),
      new AudioVideoConverterAdapter(), 
      new DocumentConverterAdapter(),
      new ArchiveConverterAdapter(),
      new QRCodeAdapter(),
      new UtilityAdapter(),
    ];

    adapters.forEach(adapter => {
      this.adapters.set(adapter.id, adapter);
    });
  }

  registerAdapter(adapter: ConverterAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter with id '${adapter.id}' is already registered`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(id: string): ConverterAdapter | undefined {
    return this.adapters.get(id);
  }

  getAllAdapters(): ConverterAdapter[] {
    return Array.from(this.adapters.values());
  }

  getAdaptersByCategory(category: string): ConverterAdapter[] {
    return this.getAllAdapters().filter(adapter => adapter.category === category);
  }

  getSupportedFormats(): Record<string, { input: string[], output: string[] }> {
    const formats: Record<string, { input: string[], output: string[] }> = {};
    
    this.getAllAdapters().forEach(adapter => {
      formats[adapter.id] = adapter.supportedFormats;
    });
    
    return formats;
  }

  findAdaptersForInputFormat(format: string): ConverterAdapter[] {
    return this.getAllAdapters().filter(adapter => 
      adapter.supportedFormats.input.includes(format)
    );
  }

  findAdaptersForConversion(fromFormat: string, toFormat: string): ConverterAdapter[] {
    return this.getAllAdapters().filter(adapter => 
      adapter.supportedFormats.input.includes(fromFormat) &&
      adapter.supportedFormats.output.includes(toFormat)
    );
  }
}

// Singleton instance
export const adapterRegistry = new AdapterRegistry();

// Export convenience functions
export const getAdapter = (id: string) => adapterRegistry.getAdapter(id);
export const getAllAdapters = () => adapterRegistry.getAllAdapters();
export const getAdaptersByCategory = (category: string) => adapterRegistry.getAdaptersByCategory(category);
export const registerAdapter = (adapter: ConverterAdapter) => adapterRegistry.registerAdapter(adapter);
