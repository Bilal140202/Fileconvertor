import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileQueueStore } from '@/store/useFileQueueStore';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DropZone() {
  const addFiles = useFileQueueStore((state) => state.addFiles);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    addFiles(acceptedFiles);
  }, [addFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
        isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">
          {isDragActive ? "Drop the files here" : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports multiple files
        </p>
      </div>
    </div>
  );
}
