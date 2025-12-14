export type ParsedRange = {
  raw: string;
  indices: number[];
};

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function parsePositiveInt(value: string, label: string): number {
  if (!/^[0-9]+$/.test(value)) {
    throw new RangeError(`${label} must be a positive integer`);
  }

  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new RangeError(`${label} must be a positive integer`);
  }

  return n;
}

export function parseNumberRangeSpec(spec: string | undefined, max?: number): number[] {
  if (!spec) return [];

  const normalized = spec
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const indices: number[] = [];

  for (const part of normalized) {
    const dashCount = (part.match(/-/g) || []).length;
    if (dashCount > 1) throw new RangeError(`Invalid range segment: "${part}"`);

    if (!part.includes('-')) {
      const n = parsePositiveInt(part, 'Range value');
      indices.push(n);
      continue;
    }

    const [startRaw, endRaw] = part.split('-');

    const start = startRaw ? parsePositiveInt(startRaw, 'Range start') : 1;
    const end = endRaw ? parsePositiveInt(endRaw, 'Range end') : max ?? Number.POSITIVE_INFINITY;

    if (end < start) {
      throw new RangeError(`Range start must be <= end ("${part}")`);
    }

    if (!Number.isFinite(end)) {
      throw new RangeError(`Open-ended range requires a max value ("${part}")`);
    }

    for (let i = start; i <= end; i += 1) indices.push(i);
  }

  const out = uniqueSorted(indices);

  if (max !== undefined) {
    const tooLarge = out.find((n) => n > max);
    if (tooLarge !== undefined) {
      throw new RangeError(`Range value ${tooLarge} exceeds max ${max}`);
    }
  }

  return out;
}

export function parsePageRangeSpec(spec: string | undefined, pageCount?: number): number[] {
  return parseNumberRangeSpec(spec, pageCount);
}

export function formatRange(indices: number[]): string {
  const sorted = uniqueSorted(indices);
  if (sorted.length === 0) return '';

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }

    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = n;
    prev = n;
  }

  parts.push(start === prev ? String(start) : `${start}-${prev}`);
  return parts.join(',');
}
