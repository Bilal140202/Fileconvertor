import { useRef } from 'react';

export interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
}

const DEFAULT_ACCEPT = [
  'image/*',
  // archives
  '.zip',
  '.7z',
  '.rar',
  '.tar',
  '.gz',
  '.tgz',
  // fonts
  '.ttf',
  '.otf',
  '.woff',
  '.woff2'
].join(',');

export function FileUploader({ onFilesSelected, accept = DEFAULT_ACCEPT }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFilesSelected(files);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}
