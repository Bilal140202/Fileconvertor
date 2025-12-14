const JSZip = require('jszip');

function stripXml(value) {
  return value.replace(/<[^>]+>/g, '');
}

function parseSharedStrings(xml) {
  const items = [];
  const siMatches = xml.match(/<si>[\s\S]*?<\/si>/g) || [];
  for (const si of siMatches) {
    const tMatches = si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || [];
    items.push(tMatches.map((t) => stripXml(t)).join(''));
  }
  return items;
}

function parseSheetCells(xml, sharedStrings) {
  const cellRegex = /<c[^>]*r="([A-Z]+)(\d+)"[^>]*?(?:t="(s)")?[^>]*>([\s\S]*?)<\/c>/g;
  const rows = new Map();

  let match;
  while ((match = cellRegex.exec(xml))) {
    const colLetters = match[1];
    const rowNum = Number(match[2]);
    const type = match[3];
    const inner = match[4];
    const vMatch = inner.match(/<v>([\s\S]*?)<\/v>/);

    const colIndex = colLetters
      .split('')
      .reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);

    const rawValue = vMatch ? vMatch[1] : '';
    const value = type === 's' ? sharedStrings[Number(rawValue)] ?? '' : rawValue;

    const row = rows.get(rowNum) ?? new Map();
    row.set(colIndex, value);
    rows.set(rowNum, row);
  }

  const sortedRowNums = Array.from(rows.keys()).sort((a, b) => a - b);
  const maxCol = Math.max(
    0,
    ...sortedRowNums.flatMap((r) => Array.from(rows.get(r).keys()))
  );

  return sortedRowNums.map((r) => {
    const row = rows.get(r);
    const cols = [];
    for (let c = 1; c <= maxCol; c += 1) {
      const v = row.get(c) ?? '';
      const escaped = String(v).includes(',') || String(v).includes('"')
        ? '"' + String(v).replace(/"/g, '""') + '"'
        : String(v);
      cols.push(escaped);
    }
    return cols.join(',');
  });
}

async function xlsxToCsv(input, options = {}) {
  const zip = await JSZip.loadAsync(input);
  const wbXml = await zip.file('xl/workbook.xml')?.async('string');
  if (!wbXml) throw new Error('Invalid XLSX: missing xl/workbook.xml');

  const sheetEntries = wbXml.match(/<sheet[^>]*name="([^"]+)"[^>]*sheetId="(\d+)"[^>]*r:id="([^"]+)"[^>]*\/>/g) || [];
  const sheetNames = sheetEntries.map((e) => (e.match(/name="([^"]+)"/) || [])[1]);

  const sheet = options.sheet ?? 0;
  let sheetIndex = 0;
  if (typeof sheet === 'number') sheetIndex = sheet;
  else {
    const idx = sheetNames.findIndex((n) => n === sheet);
    sheetIndex = idx === -1 ? 0 : idx;
  }

  const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('string');
  if (!relsXml) throw new Error('Invalid XLSX: missing xl/_rels/workbook.xml.rels');

  const relMatches = relsXml.match(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/>/g) || [];
  const rels = new Map(
    relMatches.map((r) => {
      const id = (r.match(/Id="([^"]+)"/) || [])[1];
      const target = (r.match(/Target="([^"]+)"/) || [])[1];
      return [id, target];
    })
  );

  const relId = (sheetEntries[sheetIndex]?.match(/r:id="([^"]+)"/) || [])[1];
  const target = relId ? rels.get(relId) : undefined;
  const sheetPath = target ? `xl/${target.replace(/^\//, '')}` : 'xl/worksheets/sheet1.xml';

  const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  const sharedStrings = sharedStringsXml ? parseSharedStrings(sharedStringsXml) : [];

  const sheetXml = await zip.file(sheetPath)?.async('string');
  if (!sheetXml) throw new Error(`Invalid XLSX: missing ${sheetPath}`);

  const lines = parseSheetCells(sheetXml, sharedStrings);
  return lines.join('\n');
}

module.exports = {
  xlsxToCsv
};
