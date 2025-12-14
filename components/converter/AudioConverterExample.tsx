import { useState } from 'react';
import type { AudioConvertOptions } from '../../lib/types/conversion';
import { AudioOptionsPanel } from './AudioOptionsPanel';
import { AudioPreview } from './AudioPreview';

export function AudioConverterExample() {
  const [options, setOptions] = useState<AudioConvertOptions>({
    outputFormat: 'mp3',
    bitrate: '192k',
    sampleRate: 44100,
    channels: 2
  });

  const [sourceAudio, setSourceAudio] = useState<{
    fileName: string;
    mimeType: string;
    data: Uint8Array;
  } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    setSourceAudio({
      fileName: file.name,
      mimeType: file.type,
      data: new Uint8Array(buffer)
    });
  };

  const handleTrimChange = (start: number, end: number) => {
    setOptions({
      ...options,
      trim: { start, end }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px' }}>
      <div>
        <h2>Audio Options</h2>
        <input type="file" accept="audio/*" onChange={handleFileUpload} />
        <AudioOptionsPanel options={options} onChange={setOptions} />
      </div>

      <div>
        <h2>Preview</h2>
        {sourceAudio && (
          <AudioPreview
            title="Source Audio"
            fileName={sourceAudio.fileName}
            mimeType={sourceAudio.mimeType}
            data={sourceAudio.data}
            onTrimChange={handleTrimChange}
          />
        )}
      </div>
    </div>
  );
}
