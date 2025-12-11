# Client-Side Conversion Engine

A modular, client-side file conversion platform powered by Web Workers and WASM libraries. Convert files entirely in your browser without uploading them to any server.

## 🚀 Features

- **100% Client-Side**: All conversions happen in your browser using Web Workers
- **Modular Architecture**: Pluggable adapters for different conversion types
- **WASM-Powered**: High-performance conversions using WebAssembly libraries
- **Progress Tracking**: Real-time progress updates and error handling
- **Modern Tech Stack**: Next.js 16, React 18, TypeScript, Tailwind CSS

## 📦 Included Adapters

### Image Converter (`image-converter`)
- **Formats**: PNG, JPG, JPEG, GIF, BMP, WebP, TIFF
- **Capabilities**: Format conversion, quality control, resizing, compression
- **WASM Library**: wasm-imagemagick
- **Example**: PNG → JPG with quality slider

### Audio/Video Converter (`audiovideo-converter`)
- **Formats**: MP3, WAV, AAC, FLAC, MP4, AVI, MOV, MKV, WebM
- **Capabilities**: Format conversion, quality control, bitrate adjustment
- **WASM Library**: @ffmpeg/ffmpeg
- **Status**: Scaffolded (TODO: implementation)

### Document Converter (`document-converter`)
- **Formats**: PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, RTF
- **Capabilities**: Format conversion, text extraction, metadata extraction
- **WASM Library**: pdf-lib, mammoth, xlsx
- **Status**: Scaffolded (TODO: implementation)

### Archive Converter (`archive-converter`)
- **Formats**: ZIP, 7Z, TAR, GZ, BZ2
- **Capabilities**: Archive creation/extraction, compression levels
- **WASM Library**: libarchive.js
- **Status**: Scaffolded (TODO: implementation)

### QR Code Generator (`qr-generator`)
- **Input**: Text, URLs, vCard, WiFi, SMS, Email
- **Output**: PNG, SVG, JPG
- **Capabilities**: QR generation, custom styling, error correction
- **Library**: qrcode

### Utility Converter (`utility-converter`)
- **Types**: Color conversion, unit conversion
- **Formats**: HEX, RGB, HSL, CMYK, Temperature, Length, Weight, Area
- **Capabilities**: Color conversion, unit conversion, format validation
- **Library**: color, unit-converter

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Application                   │
├─────────────────────────────────────────────────────────┤
│  Components (React)                                     │
│  ├── ConverterInterface.tsx                            │
│  ├── FileUploader.tsx                                  │
│  ├── OptionsPanel.tsx                                  │
│  └── ProgressTracker.tsx                               │
├─────────────────────────────────────────────────────────┤
│  Client Utilities                                      │
│  ├── worker-client.ts (Comlink wrapper)               │
│  └── queue/index.ts (Zustand state management)        │
├─────────────────────────────────────────────────────────┤
│  Web Worker (conversion-worker.ts)                     │
│  ├── Job Management                                    │
│  ├── Progress Callbacks                                │
│  └── Adapter Registry                                  │
├─────────────────────────────────────────────────────────┤
│  Adapters (Modular Conversion Engines)                 │
│  ├── Image Converter (wasm-imagemagick)               │
│  ├── Audio/Video Converter (@ffmpeg/ffmpeg)           │
│  ├── Document Converter (pdf-lib, mammoth, xlsx)      │
│  ├── Archive Converter (libarchive.js)                │
│  ├── QR Generator (qrcode)                            │
│  └── Utility Converter (color, unit-converter)        │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd client-conversion-engine

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm run start
```

### Dependencies Overview

```json
{
  "core": ["next", "react", "react-dom", "typescript"],
  "worker": ["comlink"],
  "wasm-libs": [
    "@ffmpeg/ffmpeg", "@ffmpeg/util", 
    "wasm-imagemagick", "pdf-lib"
  ],
  "converters": [
    "mammoth", "xlsx", "libarchive.js", 
    "qrcode", "color", "unit-converter"
  ],
  "ui": ["tailwindcss", "zustand"]
}
```

## 📚 How to Add New Adapters

### 1. Create Adapter Class

Create a new file in `/lib/adapters/`:

```typescript
import { ConverterAdapter, ConversionResult } from '@/lib/types';

// Example: Audio converter
export class MyAudioConverterAdapter implements ConverterAdapter {
  id = 'my-audio-converter';
  name = 'My Audio Converter';
  description = 'Convert between audio formats';
  category = 'audio' as const;
  
  supportedFormats = {
    input: ['mp3', 'wav', 'aac', 'flac'],
    output: ['mp3', 'wav', 'aac', 'flac']
  };
  
  capabilities = [
    'format-conversion',
    'quality-control',
    'bitrate-adjustment'
  ];

  optionsSchema = {
    quality: {
      type: 'select' as const,
      label: 'Quality',
      description: 'Output quality preset',
      default: 'medium',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    bitrate: {
      type: 'number' as const,
      label: 'Bitrate',
      description: 'Target bitrate in kbps',
      default: 128,
      min: 64,
      max: 320,
    },
  };

  async convert(input: ArrayBuffer | string, options: Record<string, any>): Promise<ConversionResult> {
    // 1. Validate options
    if (!this.validateOptions?.(options)) {
      return { jobId: '', success: false, error: 'Invalid options' };
    }

    // 2. Convert using WASM library
    try {
      const { quality, bitrate } = options;
      
      // Your conversion logic here
      const result = await performConversion(input, { quality, bitrate });
      
      return {
        jobId: '', // Will be set by caller
        success: true,
        data: result.buffer,
        metadata: {
          originalSize: getInputSize(input),
          convertedSize: result.size,
          format: result.format,
        },
      };
    } catch (error) {
      return {
        jobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed',
      };
    }
  }

  validateOptions(options: Record<string, any>): boolean {
    const { bitrate } = options;
    return bitrate >= 64 && bitrate <= 320;
  }

  async getMetadata(input: ArrayBuffer | string): Promise<Record<string, any>> {
    // Optional: Extract metadata from input
    return {
      duration: 120,
      sampleRate: 44100,
      channels: 2,
    };
  }
}
```

### 2. Register Adapter

Update `/lib/adapters/registry.ts`:

```typescript
import { MyAudioConverterAdapter } from './my-audio-converter';

class AdapterRegistry {
  private registerBuiltInAdapters() {
    const adapters = [
      // ... existing adapters
      new MyAudioConverterAdapter(), // Add this
    ];
    // ...
  }
}
```

### 3. Update Options Schema (Optional)

The `optionsSchema` automatically generates UI controls:

```typescript
optionsSchema = {
  // Range slider (1-100)
  quality: {
    type: 'range',
    label: 'Quality',
    min: 1,
    max: 100,
    step: 1,
    default: 85,
  },
  
  // Number input with validation
  width: {
    type: 'number',
    label: 'Width',
    min: 1,
    max: 4096,
    default: 1920,
  },
  
  // Boolean checkbox
  maintainAspectRatio: {
    type: 'boolean',
    label: 'Maintain Aspect Ratio',
    default: true,
  },
  
  // Dropdown select
  outputFormat: {
    type: 'select',
    label: 'Output Format',
    default: 'jpg',
    options: [
      { value: 'jpg', label: 'JPEG' },
      { value: 'png', label: 'PNG' },
      { value: 'webp', label: 'WebP' },
    ],
  },
  
  // Text input
  customSetting: {
    type: 'string',
    label: 'Custom Setting',
    description: 'Enter custom value',
    default: '',
  },
};
```

### 4. Add WASM Dependencies

Update `package.json`:

```json
{
  "dependencies": {
    "my-wasm-library": "^1.0.0"
  }
}
```

### 5. Update Worker

The worker automatically picks up new adapters. No changes needed!

## 🔄 Conversion Flow

### 1. File Upload
- User selects/drops file in `FileUploader`
- File converted to `ArrayBuffer`
- Input format detected from file extension

### 2. Adapter Selection
- UI shows compatible adapters for input format
- User selects conversion method and options
- Options validated against adapter schema

### 3. Job Creation
- Conversion job added to Zustand queue
- Worker receives job via Comlink
- Job tracked with unique ID

### 4. Processing
- Adapter's `convert()` method called in Web Worker
- Real-time progress updates via callbacks
- Error handling with detailed messages

### 5. Completion
- Result stored in queue state
- UI updates with download option
- Clean up completed jobs

## 🎯 WASM Library Integration

### Adding New WASM Libraries

1. **Install the library**:
```bash
npm install my-wasm-lib
```

2. **Initialize in adapter constructor**:
```typescript
export class MyAdapter implements ConverterAdapter {
  private isInitialized = false;
  
  private async ensureInitialized() {
    if (!this.isInitialized) {
      await initializeMyLibrary();
      this.isInitialized = true;
    }
  }

  async convert(input: ArrayBuffer | string, options: any) {
    await this.ensureInitialized();
    // ... conversion logic
  }
}
```

3. **Handle memory management**:
```typescript
try {
  const result = await processWithWASM(input);
  // Clean up WASM resources
  result.dispose?.();
  return result;
} catch (error) {
  // Clean up on error
  cleanupWASM();
  throw error;
}
```

## 🎨 UI Components

### Options Panel Auto-Generation

The `OptionsPanel` component automatically generates form controls based on the adapter's `optionsSchema`:

- **Range sliders** for numeric ranges
- **Number inputs** with min/max validation
- **Select dropdowns** for predefined options
- **Checkboxes** for boolean values
- **Text inputs** for string values

### Progress Tracking

Real-time progress updates with:
- Progress percentage (0-100)
- Status messages
- Stage information
- Error details

## 🔧 Configuration

### Next.js Configuration

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    // Worker support
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      loader: 'worker-loader',
    });
    
    // WASM support
    config.experiments = {
      asyncWebAssembly: true,
    };
    
    return config;
  },
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 🚦 Development Guidelines

### Adding New Conversion Types

1. **Choose appropriate WASM library**
2. **Implement `ConverterAdapter` interface**
3. **Define comprehensive options schema**
4. **Add thorough error handling**
5. **Include metadata extraction** (optional)
6. **Test with various input formats**

### Performance Considerations

- **Web Workers**: All conversions run off main thread
- **Memory Management**: Properly dispose WASM resources
- **Progress Updates**: Throttle progress callbacks for large files
- **Error Boundaries**: Handle all possible error scenarios

### Security

- **No Server Uploads**: All processing client-side
- **Input Validation**: Validate all options and file types
- **Error Sanitization**: Don't expose sensitive error details
- **Memory Cleanup**: Clear sensitive data after processing

## 🧪 Testing

### Manual Testing Checklist

- [ ] PNG → JPG conversion works
- [ ] Progress updates in real-time
- [ ] Error handling for invalid files
- [ ] UI responsive on different screen sizes
- [ ] Worker builds and loads correctly
- [ ] All adapter schemas generate correct UI
- [ ] Queue manages multiple concurrent jobs
- [ ] Memory cleaned up after completion

### Example Test Cases

```typescript
// Test PNG to JPG conversion
const testImageConversion = async () => {
  const pngFile = new File([pngData], 'test.png', { type: 'image/png' });
  const arrayBuffer = await pngFile.arrayBuffer();
  
  const result = await imageAdapter.convert(arrayBuffer, {
    quality: 85,
    outputFormat: 'jpg'
  });
  
  console.assert(result.success, 'Conversion should succeed');
  console.assert(result.data, 'Should have output data');
};
```

## 📈 Roadmap

### Phase 1 (Current)
- [x] Core architecture with Web Workers
- [x] Image conversion adapter (PNG → JPG)
- [x] Progress tracking and queue management
- [x] UI with drag-and-drop file upload
- [x] Adapter registry and type system

### Phase 2 (Next)
- [ ] Complete audio/video conversion with FFmpeg
- [ ] Document conversion adapters
- [ ] Archive creation/extraction
- [ ] Batch conversion support
- [ ] Offline capability with service workers

### Phase 3 (Future)
- [ ] Advanced image processing (filters, effects)
- [ ] Video editing capabilities
- [ ] Cloud storage integration
- [ ] Plugin system for custom adapters
- [ ] Mobile optimization

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feat/amazing-adapter`
3. Make changes following the adapter pattern
4. Test thoroughly with real files
5. Update documentation
6. Submit pull request

### Code Style

- Use TypeScript for all new code
- Follow existing interface patterns
- Add JSDoc comments for complex logic
- Include error handling for all async operations
- Use meaningful variable and function names

## 📄 License

MIT License - feel free to use this in your own projects!

## 🙏 Acknowledgments

- **Comlink** - Making Web Workers easy
- **wasm-imagemagick** - Powerful image processing
- **FFmpeg WASM** - Audio/video conversion
- **Next.js Team** - Excellent React framework
- **Tailwind CSS** - Utility-first styling

---

**Built with ❤️ for privacy-preserving, client-side file conversion**
