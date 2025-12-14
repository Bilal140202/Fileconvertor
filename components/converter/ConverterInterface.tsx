import { useMemo, useState } from 'react';

import type { ImageConvertOptions } from '../../lib/types/conversion';
import { isSupportedImageMimeType } from '../../lib/utils/mime';
import { createWorkerClient } from '../../lib/utils/worker-client';
import { FileUploader } from './FileUploader';
import { OptionsPanel } from './OptionsPanel';
import { ProgressTracker } from './ProgressTracker';

export function ConverterInterface() {
  const [options, setOptions] = useState<ImageConvertOptions>({
    outputFormat: 'jpeg',
    quality: 80,
    backgroundColor: '#ffffff',
    rotate: 0,
    flip: false,
    flop: false,
    filters: { brightness: 0, contrast: 0, saturation: 0, hue: 0 }
  });

  const client = useMemo(() => createWorkerClient(), []);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <FileUploader
        onFilesSelected={async (files) => {
          const batchId = crypto.randomUUID();

          for (const file of files) {
            if (!isSupportedImageMimeType(file.type)) {
              window.alert(`Unsupported image format: ${file.type || file.name}`);
              continue;
            }

            const buf = new Uint8Array(await file.arrayBuffer());

            client.enqueueConversion(
              {
                fileName: file.name,
                mimeType: file.type,
                data: buf
              },
              options,
              batchId
            );
          }
        }}
      />

      <OptionsPanel options={options} onChange={setOptions} />

      <ProgressTracker />
    </div>
  );
}
