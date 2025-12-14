export interface ZipEntry {
  fileName: string;
  data: Uint8Array;
}

export async function zipFiles(entries: ZipEntry[]): Promise<Uint8Array> {
  const { default: JSZip } = await import('jszip');

  const zip = new JSZip();
  for (const entry of entries) {
    zip.file(entry.fileName, entry.data);
  }
  return zip.generateAsync({ type: 'uint8array' });
}
