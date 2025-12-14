import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it, vi } from 'vitest';

import { convertDocuments } from '../../lib/adapters/document-converter';
import { parseNumberRangeSpec } from '../../lib/utils/ranges';

function encoder(text: string) {
  return new TextEncoder().encode(text);
}

async function createTinyPdf(pageCount = 2): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i += 1) pdf.addPage();
  return pdf.save();
}

async function createTinyDocx(text: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
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
      `<w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`
  );
  return zip.generateAsync({ type: 'uint8array' });
}

async function createTinyXlsx(): Promise<Uint8Array> {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
      `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
      `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>` +
      `</Types>`
  );

  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`
  );

  zip.folder('xl')?.file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>` +
      `</workbook>`
  );

  zip.folder('xl')?.folder('_rels')?.file(
    'workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
      `</Relationships>`
  );

  zip.folder('xl')?.file(
    'sharedStrings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">` +
      `<si><t>Name</t></si>` +
      `<si><t>Age</t></si>` +
      `<si><t>Alice</t></si>` +
      `<si><t>30</t></si>` +
      `</sst>`
  );

  zip.folder('xl')?.folder('worksheets')?.file(
    'sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
      `<sheetData>` +
      `<row r="1">` +
      `<c r="A1" t="s"><v>0</v></c>` +
      `<c r="B1" t="s"><v>1</v></c>` +
      `</row>` +
      `<row r="2">` +
      `<c r="A2" t="s"><v>2</v></c>` +
      `<c r="B2" t="s"><v>3</v></c>` +
      `</row>` +
      `</sheetData>` +
      `</worksheet>`
  );

  return zip.generateAsync({ type: 'uint8array' });
}

vi.mock('docx-wasm', () => {
  return {
    docxToPdf: async (_docxBytes: Uint8Array) => {
      const pdf = await PDFDocument.create();
      pdf.addPage();
      return pdf.save();
    },
    pdfToDocx: async (_pdfBytes: Uint8Array) => {
      return createTinyDocx('From PDF');
    }
  };
});

describe('document-converter adapter', () => {
  it('PDF → DOCX', async () => {
    const pdfBytes = await createTinyPdf(2);

    const [out] = await convertDocuments([{ data: pdfBytes, filename: 'in.pdf', format: 'pdf' }], { to: 'docx' });

    expect(out.format).toBe('docx');
    expect(out.filename).toBe('in.docx');
    expect(out.data.byteLength).toBeGreaterThan(100);

    const zip = await JSZip.loadAsync(out.data);
    const docXml = await zip.file('word/document.xml')?.async('string');
    expect(docXml).toContain('From PDF');
  });

  it('DOCX → PDF', async () => {
    const docxBytes = await createTinyDocx('Hello');

    const [out] = await convertDocuments([{ data: docxBytes, filename: 'in.docx', format: 'docx' }], { to: 'pdf' });

    expect(out.format).toBe('pdf');
    expect(out.filename).toBe('in.pdf');
    expect(new TextDecoder().decode(out.data.slice(0, 4))).toBe('%PDF');
    expect(out.metadata?.pageCount).toBe(1);
  });

  it('XLSX → CSV', async () => {
    const xlsxBytes = await createTinyXlsx();

    const [out] = await convertDocuments([{ data: xlsxBytes, filename: 'in.xlsx', format: 'xlsx' }], { to: 'csv' });

    expect(out.format).toBe('csv');
    const text = new TextDecoder().decode(out.data);
    expect(text.trim()).toBe('Name,Age\nAlice,30');
  });

  it('HTML → PDF', async () => {
    const html = encoder('<h1>Hello</h1><p>World</p>');

    const [out] = await convertDocuments([{ data: html, filename: 'in.html', format: 'html' }], { to: 'pdf' });

    expect(out.format).toBe('pdf');
    expect(new TextDecoder().decode(out.data.slice(0, 4))).toBe('%PDF');
  });
});

describe('page range parsing', () => {
  it('parses segments and dedupes', () => {
    expect(parseNumberRangeSpec('1-3,3,5')).toEqual([1, 2, 3, 5]);
  });

  it('requires max for open-ended ranges', () => {
    expect(() => parseNumberRangeSpec('2-', undefined)).toThrow(/requires a max/i);
    expect(parseNumberRangeSpec('2-', 4)).toEqual([2, 3, 4]);
  });

  it('rejects out-of-bounds', () => {
    expect(() => parseNumberRangeSpec('1,4', 3)).toThrow(/exceeds max/);
  });
});
