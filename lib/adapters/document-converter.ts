import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { z } from 'zod';

import { ConversionContext } from '../conversion/conversion-context';
import { parseNumberRangeSpec } from '../utils/ranges';

export type DocumentFormat =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'csv'
  | 'html';

export type PageOrientation = 'portrait' | 'landscape';

export type PageMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MergeOrderItem = {
  inputIndex: number;
  pageIndex: number; // 1-based
};

export type DocumentMetadata = {
  format: DocumentFormat;
  title?: string;
  author?: string;
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
  sizeBytes?: number;
};

export type ConversionInput = {
  data: Uint8Array;
  filename?: string;
  format?: DocumentFormat;
  mimeType?: string;
};

export type ConversionOutput = {
  data: Uint8Array;
  filename: string;
  format: DocumentFormat;
  mimeType: string;
  metadata?: DocumentMetadata;
};

export type DocumentConversionOptions = {
  to: DocumentFormat;
  from?: DocumentFormat;

  pageRange?: string;
  sheetRange?: string;
  slideRange?: string;

  orientation?: PageOrientation;
  margins?: Partial<PageMargins>;
  compressionLevel?: number;

  paperSize?: 'A4' | 'Letter';

  password?: string;
  watermarkText?: string;

  merge?: boolean;
  mergeOrder?: MergeOrderItem[];
};

const DEFAULT_MARGINS: PageMargins = { top: 36, right: 36, bottom: 36, left: 36 };

const optionsSchema = z
  .object({
    to: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'html']),
    from: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'csv', 'html']).optional(),
    pageRange: z.string().optional(),
    sheetRange: z.string().optional(),
    slideRange: z.string().optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    margins: z
      .object({
        top: z.number().optional(),
        right: z.number().optional(),
        bottom: z.number().optional(),
        left: z.number().optional()
      })
      .optional(),
    compressionLevel: z.number().min(0).max(9).optional(),
    paperSize: z.enum(['A4', 'Letter']).optional(),
    password: z.string().optional(),
    watermarkText: z.string().optional(),
    merge: z.boolean().optional(),
    mergeOrder: z
      .array(
        z.object({
          inputIndex: z.number().int().nonnegative(),
          pageIndex: z.number().int().positive()
        })
      )
      .optional()
  })
  .strict();

const MIME_BY_FORMAT: Record<DocumentFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html'
};

function extToFormat(filename?: string): DocumentFormat | undefined {
  const ext = filename?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'docx':
      return 'docx';
    case 'xlsx':
      return 'xlsx';
    case 'pptx':
      return 'pptx';
    case 'txt':
      return 'txt';
    case 'csv':
      return 'csv';
    case 'html':
    case 'htm':
      return 'html';
    default:
      return undefined;
  }
}

function withExt(filename: string, format: DocumentFormat): string {
  const base = filename.replace(/\.[^/.]+$/, '');
  return `${base}.${format}`;
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function getPaperSize(paperSize: 'A4' | 'Letter' | undefined, orientation: PageOrientation | undefined) {
  const a4 = { width: 595.28, height: 841.89 };
  const letter = { width: 612, height: 792 };

  const base = paperSize === 'Letter' ? letter : a4;
  if (orientation === 'landscape') return { width: base.height, height: base.width };
  return base;
}

async function loadDocxWasm() {
  const mod: any = await import('docx-wasm');
  return mod?.default ?? mod;
}

async function loadXlsxWasm() {
  const mod: any = await import('xlsx-wasm');
  return mod?.default ?? mod;
}

async function loadPdfJs() {
  const mod: any = await import('pdfjs-dist');
  return mod?.default ?? mod;
}

async function loadHtml2Pdf() {
  const mod: any = await import('html2pdf.js');
  return mod?.default ?? mod;
}

function getDocxText(docxBytes: Uint8Array): Promise<string> {
  return JSZip.loadAsync(docxBytes).then(async (zip) => {
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!documentXml) return '';
    const textPieces = Array.from(documentXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)).map(
      (m) => m[1]
    );
    return normalizeText(textPieces.join(' ')).trim();
  });
}

async function createDocxFromText(text: string): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `</Relationships>`
  );

  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:body><w:p><w:r><w:t>${text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</w:t></w:r></w:p></w:body></w:document>`
  );

  const buf = await zip.generateAsync({ type: 'uint8array' });
  return buf;
}

async function createPdfFromText(
  text: string,
  options: Pick<DocumentConversionOptions, 'paperSize' | 'orientation' | 'margins' | 'watermarkText'>
): Promise<Uint8Array> {
  const size = getPaperSize(options.paperSize, options.orientation);
  const margins: PageMargins = { ...DEFAULT_MARGINS, ...(options.margins ?? {}) };

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([size.width, size.height]);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;

  const maxWidth = size.width - margins.left - margins.right;

  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(next, fontSize);
    if (width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = w;
  }
  if (current) lines.push(current);

  let y = size.height - margins.top - fontSize;
  for (const line of lines) {
    if (y < margins.bottom) break;
    page.drawText(line, {
      x: margins.left,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    });
    y -= fontSize * 1.3;
  }

  if (options.watermarkText) {
    page.drawText(options.watermarkText, {
      x: margins.left,
      y: margins.bottom,
      size: 10,
      font,
      color: rgb(0.7, 0.7, 0.7)
    });
  }

  return pdf.save();
}

async function subsetPdfPages(pdfBytes: Uint8Array, pageRange: string | undefined): Promise<Uint8Array> {
  if (!pageRange) return pdfBytes;

  const pdf = await PDFDocument.load(pdfBytes);
  const pageCount = pdf.getPageCount();
  const indices1 = parseNumberRangeSpec(pageRange, pageCount);

  if (indices1.length === 0) return pdfBytes;

  const outPdf = await PDFDocument.create();

  const copied = await outPdf.copyPages(
    pdf,
    indices1.map((n) => n - 1)
  );
  for (const p of copied) outPdf.addPage(p);

  return outPdf.save();
}

async function mergePdfDocuments(pdfDocs: Uint8Array[], mergeOrder?: MergeOrderItem[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  if (mergeOrder && mergeOrder.length > 0) {
    const loaded = await Promise.all(pdfDocs.map((b) => PDFDocument.load(b)));

    for (const item of mergeOrder) {
      const doc = loaded[item.inputIndex];
      if (!doc) continue;
      const idx = item.pageIndex - 1;
      if (idx < 0 || idx >= doc.getPageCount()) continue;

      const [page] = await merged.copyPages(doc, [idx]);
      merged.addPage(page);
    }

    return merged.save();
  }

  for (const bytes of pdfDocs) {
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const p of pages) merged.addPage(p);
  }

  return merged.save();
}

async function convertOne(
  input: ConversionInput,
  options: DocumentConversionOptions,
  ctx: ConversionContext
): Promise<ConversionOutput> {
  const inferred = options.from ?? input.format ?? extToFormat(input.filename);
  if (!inferred) {
    throw new Error('Unable to infer input format. Provide options.from or input.format.');
  }

  const to = options.to;

  ctx.report('metadata', 0);
  const metadata = await extractDocumentMetadata({ ...input, format: inferred });
  ctx.report('metadata', 1);

  if (inferred === to) {
    return {
      data: input.data,
      filename: withExt(input.filename ?? `output.${to}`, to),
      format: to,
      mimeType: MIME_BY_FORMAT[to],
      metadata
    };
  }

  if (options.password) {
    // pdf-lib/jszip do not support encryption in this implementation.
    throw new Error('Password protection is not supported in this build.');
  }

  ctx.report('convert', 0, `${inferred} → ${to}`);

  let outBytes: Uint8Array;

  if (inferred === 'html' && to === 'pdf') {
    outBytes = await convertHtmlToPdf(input.data, options, ctx);
  } else if (inferred === 'pdf' && to === 'docx') {
    outBytes = await convertPdfToDocx(input.data, ctx);
  } else if (inferred === 'docx' && to === 'pdf') {
    outBytes = await convertDocxToPdf(input.data, options, ctx);
  } else if (inferred === 'xlsx' && to === 'csv') {
    outBytes = await convertXlsxToCsv(input.data, options, ctx);
  } else if (to === 'pdf') {
    outBytes = await convertAnythingToPdf(input.data, inferred, options, ctx);
  } else if (to === 'txt') {
    outBytes = await convertAnythingToText(input.data, inferred, ctx);
  } else if (to === 'docx') {
    outBytes = await convertAnythingToDocx(input.data, inferred, ctx);
  } else if (to === 'csv') {
    outBytes = await convertAnythingToCsv(input.data, inferred, options, ctx);
  } else {
    throw new Error(`Unsupported conversion: ${inferred} → ${to}`);
  }

  if (to === 'pdf') {
    outBytes = await subsetPdfPages(outBytes, options.pageRange);
  }

  ctx.report('convert', 1);

  return {
    data: outBytes,
    filename: withExt(input.filename ?? `output.${to}`, to),
    format: to,
    mimeType: MIME_BY_FORMAT[to],
    metadata: await extractDocumentMetadata({ data: outBytes, format: to })
  };
}

async function convertHtmlToPdf(
  htmlBytes: Uint8Array,
  options: DocumentConversionOptions,
  ctx: ConversionContext
): Promise<Uint8Array> {
  ctx.report('html2pdf', 0);

  const html = new TextDecoder().decode(htmlBytes);

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const html2pdf = await loadHtml2Pdf();
    if (typeof html2pdf === 'function') {
      const container = document.createElement('div');
      container.innerHTML = html;
      const worker = html2pdf().from(container);
      const arrayBuffer = await worker.outputPdf('arraybuffer');
      ctx.report('html2pdf', 1);
      return new Uint8Array(arrayBuffer);
    }
  }

  const fallback = await createPdfFromText(`HTML\n\n${html}`, options);
  ctx.report('html2pdf', 1, 'Rendered with fallback (no DOM)');
  return fallback;
}

async function convertDocxToPdf(
  docxBytes: Uint8Array,
  options: DocumentConversionOptions,
  ctx: ConversionContext
): Promise<Uint8Array> {
  ctx.report('docx-wasm', 0);

  try {
    const docxWasm = await loadDocxWasm();

    const fn =
      docxWasm?.docxToPdf ??
      docxWasm?.convertDocxToPdf ??
      docxWasm?.convert ??
      docxWasm?.default?.docxToPdf;

    if (typeof fn === 'function') {
      const result = await fn(docxBytes, { output: 'pdf' });
      ctx.report('docx-wasm', 1);
      return result instanceof Uint8Array ? result : new Uint8Array(result);
    }
  } catch {
    // fall through
  }

  const text = await getDocxText(docxBytes);
  const fallback = await createPdfFromText(text || 'DOCX document', options);
  ctx.report('docx-wasm', 1, 'Converted with fallback');
  return fallback;
}

async function convertPdfToDocx(pdfBytes: Uint8Array, ctx: ConversionContext): Promise<Uint8Array> {
  ctx.report('docx-wasm', 0);

  try {
    const docxWasm = await loadDocxWasm();

    const fn =
      docxWasm?.pdfToDocx ??
      docxWasm?.convertPdfToDocx ??
      docxWasm?.convert ??
      docxWasm?.default?.pdfToDocx;

    if (typeof fn === 'function') {
      const result = await fn(pdfBytes, { output: 'docx' });
      ctx.report('docx-wasm', 1);
      return result instanceof Uint8Array ? result : new Uint8Array(result);
    }
  } catch {
    // fall through
  }

  const fallback = await createDocxFromText('Converted from PDF');
  ctx.report('docx-wasm', 1, 'Converted with fallback');
  return fallback;
}

async function convertXlsxToCsv(
  xlsxBytes: Uint8Array,
  options: DocumentConversionOptions,
  ctx: ConversionContext
): Promise<Uint8Array> {
  ctx.report('xlsx-wasm', 0);

  const xlsxWasm = await loadXlsxWasm();
  const fn = xlsxWasm?.xlsxToCsv ?? xlsxWasm?.convert?.xlsxToCsv;
  if (typeof fn !== 'function') throw new Error('xlsx-wasm: missing xlsxToCsv');

  const csvText = await fn(xlsxBytes, {
    sheet: options.sheetRange ? parseNumberRangeSpec(options.sheetRange)[0] - 1 : 0
  });

  ctx.report('xlsx-wasm', 1);
  return new TextEncoder().encode(normalizeText(csvText));
}

async function convertAnythingToPdf(
  inputBytes: Uint8Array,
  from: DocumentFormat,
  options: DocumentConversionOptions,
  ctx: ConversionContext
): Promise<Uint8Array> {
  if (from === 'pdf') return inputBytes;
  if (from === 'docx') return convertDocxToPdf(inputBytes, options, ctx);
  if (from === 'html') return convertHtmlToPdf(inputBytes, options, ctx);

  const text = await convertAnythingToText(inputBytes, from, ctx);
  return createPdfFromText(new TextDecoder().decode(text), options);
}

async function convertAnythingToText(inputBytes: Uint8Array, from: DocumentFormat, ctx: ConversionContext) {
  if (from === 'txt') return new TextEncoder().encode(normalizeText(new TextDecoder().decode(inputBytes)));
  if (from === 'csv') return new TextEncoder().encode(normalizeText(new TextDecoder().decode(inputBytes)));
  if (from === 'docx') {
    const text = await getDocxText(inputBytes);
    return new TextEncoder().encode(text);
  }

  if (from === 'pdf') {
    ctx.report('pdfjs', 0);
    try {
      const pdfjs = await loadPdfJs();
      const getDocument = pdfjs?.getDocument ?? pdfjs?.default?.getDocument;
      if (typeof getDocument === 'function') {
        const loadingTask = getDocument({ data: inputBytes });
        const doc = await loadingTask.promise;
        const pieces: string[] = [];
        for (let i = 1; i <= doc.numPages; i += 1) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
            .filter(Boolean)
            .join(' ');
          pieces.push(pageText);
        }
        ctx.report('pdfjs', 1);
        return new TextEncoder().encode(normalizeText(pieces.join('\n\n')).trim());
      }
    } catch {
      // fall through
    }
    ctx.report('pdfjs', 1, 'Extracted text with fallback');
    return new TextEncoder().encode('');
  }

  ctx.report('text', 1, `No text extractor for ${from}`);
  return new TextEncoder().encode('');
}

async function convertAnythingToDocx(inputBytes: Uint8Array, from: DocumentFormat, ctx: ConversionContext) {
  if (from === 'docx') return inputBytes;
  if (from === 'pdf') return convertPdfToDocx(inputBytes, ctx);

  const text = await convertAnythingToText(inputBytes, from, ctx);
  return createDocxFromText(new TextDecoder().decode(text));
}

async function convertAnythingToCsv(
  inputBytes: Uint8Array,
  from: DocumentFormat,
  options: DocumentConversionOptions,
  ctx: ConversionContext
) {
  if (from === 'csv') return new TextEncoder().encode(normalizeText(new TextDecoder().decode(inputBytes)));
  if (from === 'xlsx') return convertXlsxToCsv(inputBytes, options, ctx);

  const text = await convertAnythingToText(inputBytes, from, ctx);
  return new TextEncoder().encode(normalizeText(new TextDecoder().decode(text)));
}

export async function extractDocumentMetadata(input: ConversionInput): Promise<DocumentMetadata> {
  const format = input.format ?? extToFormat(input.filename);
  if (!format) throw new Error('Unable to infer format for metadata extraction');

  const sizeBytes = input.data.byteLength;

  if (format === 'pdf') {
    const pdf = await PDFDocument.load(input.data);
    const title = pdf.getTitle() ?? undefined;
    const author = pdf.getAuthor() ?? undefined;
    return { format, pageCount: pdf.getPageCount(), title, author, sizeBytes };
  }

  if (format === 'xlsx') {
    try {
      const zip = await JSZip.loadAsync(input.data);
      const wbXml = await zip.file('xl/workbook.xml')?.async('string');
      const sheetCount = wbXml ? (wbXml.match(/<sheet\b/g) || []).length : undefined;
      return { format, sheetCount, sizeBytes };
    } catch {
      return { format, sizeBytes };
    }
  }

  if (format === 'pptx') {
    try {
      const zip = await JSZip.loadAsync(input.data);
      const slideFiles = Object.keys(zip.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
      return { format, slideCount: slideFiles.length || undefined, sizeBytes };
    } catch {
      return { format, sizeBytes };
    }
  }

  if (format === 'docx') {
    try {
      const text = await getDocxText(input.data);
      const title = text ? text.slice(0, 64) : undefined;
      return { format, title, sizeBytes };
    } catch {
      return { format, sizeBytes };
    }
  }

  return { format, sizeBytes };
}

export async function convertDocuments(
  inputs: ConversionInput[],
  options: DocumentConversionOptions,
  ctx: ConversionContext = new ConversionContext()
): Promise<ConversionOutput[]> {
  const parsedOptions = optionsSchema.parse(options);

  if (inputs.length === 0) return [];

  if (parsedOptions.merge && parsedOptions.to === 'pdf' && inputs.length > 1) {
    ctx.registerStage('merge', 1);

    const pdfBytes: Uint8Array[] = [];
    for (let i = 0; i < inputs.length; i += 1) {
      const sub = new ConversionContext({
        onProgress: (e) => ctx.report(`input-${i}:${e.stage}`, e.stageProgress, e.message, e.meta)
      });
      const out = await convertOne(inputs[i], { ...parsedOptions, to: 'pdf' }, sub);
      pdfBytes.push(out.data);
    }

    const merged = await mergePdfDocuments(pdfBytes, parsedOptions.mergeOrder);

    const filenameBase = inputs[0].filename ? inputs[0].filename.replace(/\.[^/.]+$/, '') : 'merged';

    return [
      {
        data: merged,
        filename: `${filenameBase}.pdf`,
        format: 'pdf',
        mimeType: MIME_BY_FORMAT.pdf,
        metadata: await extractDocumentMetadata({ data: merged, format: 'pdf' })
      }
    ];
  }

  const outputs: ConversionOutput[] = [];
  for (let i = 0; i < inputs.length; i += 1) {
    const child = new ConversionContext({
      onProgress: (e) => ctx.report(`input-${i}:${e.stage}`, e.stageProgress, e.message, e.meta)
    });
    outputs.push(await convertOne(inputs[i], parsedOptions, child));
  }

  return outputs;
}
