import JSZip from 'jszip';
import * as tar from 'tar-stream';
import { gunzipSync, gzipSync } from 'node:zlib';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync
} from 'node:crypto';

import { InvalidPasswordError, UnsupportedArchiveFormatError } from '../errors.js';
import type { FileEntry, ProgressCallback } from '../types.js';
import { shouldIncludePath, type PathFilter } from '../utils/filters.js';

export type ArchiveFormat = 'zip' | 'tar' | 'tar.gz' | 'tgz' | '7z' | 'rar';

export interface ArchiveFilters {
  include?: PathFilter[];
  exclude?: PathFilter[];
}

export interface ArchiveCreateOptions extends ArchiveFilters {
  format: ArchiveFormat;
  compressionLevel?: number; // 0..9
  password?: string;
  onProgress?: ProgressCallback;
}

export interface ArchiveExtractOptions extends ArchiveFilters {
  format: ArchiveFormat;
  password?: string;
  onProgress?: ProgressCallback;
}

export interface ArchiveBatch {
  name: string;
  files: FileEntry[];
}

export interface FileTreeItem {
  path: string;
  size: number;
  ratio?: number;
}

export interface ArchivePreview {
  entries: FileTreeItem[];
  totalUncompressedSize: number;
  archiveSize: number;
  ratio: number;
}

const META_PATH = '.cto-archive-meta.json';

function normalizeFormat(format: ArchiveFormat): ArchiveFormat {
  if (format === 'tgz') return 'tar.gz';
  return format;
}

function clampLevel(level: number | undefined, { min = 0, max = 9 } = {}): number {
  if (level == null || Number.isNaN(level)) return 6;
  return Math.min(max, Math.max(min, Math.round(level)));
}

function uint8Concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function encryptFileContents(
  plaintext: Uint8Array,
  opts: { password: string; salt: Uint8Array; iv: Uint8Array }
): { ciphertextWithTag: Uint8Array } {
  const key = scryptSync(opts.password, opts.salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, opts.iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertextWithTag: uint8Concat(ciphertext, tag) };
}

function decryptFileContents(
  ciphertextWithTag: Uint8Array,
  opts: { password: string; salt: Uint8Array; iv: Uint8Array }
): Uint8Array {
  const tagLength = 16;
  if (ciphertextWithTag.length < tagLength) {
    throw new InvalidPasswordError('Corrupt encrypted payload');
  }

  const key = scryptSync(opts.password, opts.salt, 32);
  const decipher = createDecipheriv('aes-256-gcm', key, opts.iv);

  const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - tagLength);
  const tag = ciphertextWithTag.subarray(ciphertextWithTag.length - tagLength);
  decipher.setAuthTag(tag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return new Uint8Array(plaintext);
  } catch {
    throw new InvalidPasswordError();
  }
}

type ZipMeta = {
  version: 1;
  encryption: {
    algo: 'aes-256-gcm';
    kdf: 'scrypt';
    saltB64: string;
  };
  files: Record<string, { ivB64: string; originalSize: number }>;
};

async function createZip(files: FileEntry[], opts: ArchiveCreateOptions): Promise<Uint8Array> {
  const zip = new JSZip();
  const level = clampLevel(opts.compressionLevel);

  const filtered = files.filter((f) => shouldIncludePath(f.path, opts));

  const meta: ZipMeta | undefined = opts.password
    ? {
        version: 1,
        encryption: {
          algo: 'aes-256-gcm',
          kdf: 'scrypt',
          saltB64: randomBytes(16).toString('base64')
        },
        files: {}
      }
    : undefined;

  for (let i = 0; i < filtered.length; i++) {
    const file = filtered[i]!;
    opts.onProgress?.({
      progress: filtered.length ? i / filtered.length : 1,
      message: `Adding ${file.path}`
    });

    const data = file.data;
    let payload = data;

    if (opts.password && meta) {
      const iv = randomBytes(12);
      const salt = Buffer.from(meta.encryption.saltB64, 'base64');
      const encrypted = encryptFileContents(data, { password: opts.password, salt, iv });
      payload = encrypted.ciphertextWithTag;
      meta.files[file.path] = { ivB64: iv.toString('base64'), originalSize: data.length };
    }

    zip.file(file.path, payload, { date: file.mtime });
  }

  if (meta) {
    zip.file(META_PATH, JSON.stringify(meta));
  }

  opts.onProgress?.({ progress: 1, message: 'Generating ZIP' });

  const compression = level === 0 ? 'STORE' : 'DEFLATE';

  return zip.generateAsync({
    type: 'uint8array',
    compression,
    compressionOptions: { level }
  });
}

async function extractZip(data: Uint8Array, opts: ArchiveExtractOptions): Promise<FileEntry[]> {
  const zip = await JSZip.loadAsync(data);
  const metaFile = zip.file(META_PATH);
  const meta = metaFile ? (JSON.parse(await metaFile.async('text')) as ZipMeta) : undefined;

  const entries = Object.values(zip.files).filter((f) => !f.dir && f.name !== META_PATH);
  const out: FileEntry[] = [];

  const salt = meta ? Buffer.from(meta.encryption.saltB64, 'base64') : undefined;
  const password = opts.password;

  if (meta && !password) {
    throw new InvalidPasswordError('Password required');
  }

  for (let i = 0; i < entries.length; i++) {
    const file = entries[i]!;
    if (!shouldIncludePath(file.name, opts)) continue;

    opts.onProgress?.({
      progress: entries.length ? i / entries.length : 1,
      message: `Extracting ${file.name}`
    });

    let payload = await file.async('uint8array');

    if (meta && salt) {
      const record = meta.files[file.name];
      if (!record) {
        throw new InvalidPasswordError('Archive metadata mismatch');
      }

      const iv = Buffer.from(record.ivB64, 'base64');
      payload = decryptFileContents(payload, { password: password!, salt, iv });
    }

    out.push({ path: file.name, data: payload });
  }

  opts.onProgress?.({ progress: 1, message: 'Done' });
  return out;
}

function streamToUint8Array(stream: NodeJS.ReadableStream): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    stream.on('error', reject);
  });
}

async function createTar(files: FileEntry[], opts: ArchiveCreateOptions): Promise<Uint8Array> {
  const pack = tar.pack();
  const filtered = files.filter((f) => shouldIncludePath(f.path, opts));

  for (let i = 0; i < filtered.length; i++) {
    const file = filtered[i]!;
    opts.onProgress?.({
      progress: filtered.length ? i / filtered.length : 1,
      message: `Adding ${file.path}`
    });

    pack.entry(
      {
        name: file.path,
        size: file.data.length,
        mtime: file.mtime
      },
      Buffer.from(file.data)
    );
  }

  pack.finalize();
  const tarData = await streamToUint8Array(pack);

  if (normalizeFormat(opts.format) === 'tar') {
    return tarData;
  }

  const level = clampLevel(opts.compressionLevel);
  return new Uint8Array(gzipSync(tarData, { level }));
}

async function extractTar(tarData: Uint8Array, opts: ArchiveExtractOptions): Promise<FileEntry[]> {
  const data = normalizeFormat(opts.format) === 'tar.gz' ? new Uint8Array(gunzipSync(tarData)) : tarData;

  const extract = tar.extract();
  const out: FileEntry[] = [];

  const pending = new Promise<void>((resolve, reject) => {
    extract.on('entry', (header, stream, next) => {
      const name = header.name;
      if (!shouldIncludePath(name, opts)) {
        stream.resume();
        stream.on('end', next);
        return;
      }

      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => {
        out.push({ path: name, data: new Uint8Array(Buffer.concat(chunks)) });
        next();
      });
      stream.on('error', reject);
    });
    extract.on('finish', () => resolve());
    extract.on('error', reject);
  });

  extract.end(Buffer.from(data));
  await pending;

  opts.onProgress?.({ progress: 1, message: 'Done' });
  return out;
}

export async function createArchive(files: FileEntry[], opts: ArchiveCreateOptions): Promise<Uint8Array> {
  const format = normalizeFormat(opts.format);

  if (format === 'zip') return createZip(files, opts);
  if (format === 'tar' || format === 'tar.gz') return createTar(files, opts);

  if (format === '7z' || format === 'rar') {
    throw new UnsupportedArchiveFormatError(`${format} creation is not supported`);
  }

  throw new UnsupportedArchiveFormatError();
}

export async function extractArchive(data: Uint8Array, opts: ArchiveExtractOptions): Promise<FileEntry[]> {
  const format = normalizeFormat(opts.format);

  if (format === 'zip') return extractZip(data, opts);
  if (format === 'tar' || format === 'tar.gz') return extractTar(data, opts);

  if (format === '7z' || format === 'rar') {
    throw new UnsupportedArchiveFormatError(`${format} extraction is not supported in this build`);
  }

  throw new UnsupportedArchiveFormatError();
}

export async function createArchives(
  batches: ArchiveBatch[],
  opts: Omit<ArchiveCreateOptions, 'format'> & { format: ArchiveFormat }
): Promise<Record<string, Uint8Array>> {
  const out: Record<string, Uint8Array> = {};
  for (const batch of batches) {
    out[batch.name] = await createArchive(batch.files, { ...opts, format: opts.format });
  }
  return out;
}

export async function previewArchive(data: Uint8Array, opts: ArchiveExtractOptions): Promise<ArchivePreview> {
  const files = await extractArchive(data, { ...opts, onProgress: undefined });
  const totalUncompressedSize = files.reduce((sum, f) => sum + f.data.length, 0);
  const archiveSize = data.length;
  const ratio = totalUncompressedSize ? archiveSize / totalUncompressedSize : 1;

  const entries: FileTreeItem[] = files.map((f) => ({
    path: f.path,
    size: f.data.length,
    ratio
  }));

  return { entries, totalUncompressedSize, archiveSize, ratio };
}
