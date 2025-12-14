import React from 'react';

export const DEFAULT_ACCEPT = [
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
  '.woff2',
  // images for QR logo overlays
  '.png',
  '.jpg',
  '.jpeg',
  '.svg'
].join(',');

export interface FileUploaderProps {
  multiple?: boolean;
  accept?: string;
  onFiles: (files: FileList) => void;
}

export function FileUploader({ multiple = true, accept = DEFAULT_ACCEPT, onFiles }: FileUploaderProps): JSX.Element {
  return (
    <input
      type="file"
      multiple={multiple}
      accept={accept}
      onChange={(e) => {
        if (e.target.files) onFiles(e.target.files);
      }}
    />
  );
}
