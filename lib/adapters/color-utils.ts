export type RGB = { r: number; g: number; b: number; a?: number };
export type HSL = { h: number; s: number; l: number; a?: number };
export type CMYK = { c: number; m: number; y: number; k: number };

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function isValidHex(input: string): boolean {
  const s = input.trim();
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s);
}

export function hexToRgb(hex: string): RGB {
  const s = hex.trim().replace(/^#/, '');
  if (!isValidHex(hex)) {
    throw new Error('Invalid HEX color');
  }

  const normalized =
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s.length === 4
        ? s
            .split('')
            .map((c) => c + c)
            .join('')
        : s;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const a = normalized.length === 8 ? parseInt(normalized.slice(6, 8), 16) / 255 : undefined;

  return { r, g, b, ...(a == null ? {} : { a }) };
}

export function rgbToHex(rgb: RGB, opts: { includeAlpha?: boolean } = {}): string {
  const r = clamp(Math.round(rgb.r), 0, 255);
  const g = clamp(Math.round(rgb.g), 0, 255);
  const b = clamp(Math.round(rgb.b), 0, 255);
  const a = rgb.a == null ? undefined : clamp(Math.round(rgb.a * 255), 0, 255);

  const to2 = (n: number) => n.toString(16).padStart(2, '0');

  const base = `#${to2(r)}${to2(g)}${to2(b)}`;
  if (opts.includeAlpha && a != null) return `${base}${to2(a)}`;
  return base;
}

export function rgbToHsl(rgb: RGB): HSL {
  const r = clamp(rgb.r / 255, 0, 1);
  const g = clamp(rgb.g / 255, 0, 1);
  const b = clamp(rgb.b / 255, 0, 1);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: s * 100,
    l: l * 100,
    ...(rgb.a == null ? {} : { a: rgb.a })
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp(hsl.s / 100, 0, 1);
  const l = clamp(hsl.l / 100, 0, 1);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
    ...(hsl.a == null ? {} : { a: hsl.a })
  };
}

export function rgbToCmyk(rgb: RGB): CMYK {
  const r = clamp(rgb.r / 255, 0, 1);
  const g = clamp(rgb.g / 255, 0, 1);
  const b = clamp(rgb.b / 255, 0, 1);

  const k = 1 - Math.max(r, g, b);
  if (k >= 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: c * 100,
    m: m * 100,
    y: y * 100,
    k: k * 100
  };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = clamp(cmyk.c / 100, 0, 1);
  const m = clamp(cmyk.m / 100, 0, 1);
  const y = clamp(cmyk.y / 100, 0, 1);
  const k = clamp(cmyk.k / 100, 0, 1);

  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k))
  };
}

export function convertColor(input: { hex?: string; rgb?: RGB; hsl?: HSL; cmyk?: CMYK }): {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  cmyk: CMYK;
} {
  let rgb: RGB | undefined = input.rgb;

  if (!rgb && input.hex) rgb = hexToRgb(input.hex);
  if (!rgb && input.hsl) rgb = hslToRgb(input.hsl);
  if (!rgb && input.cmyk) rgb = cmykToRgb(input.cmyk);

  if (!rgb) {
    throw new Error('No color provided');
  }

  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  const hex = rgbToHex(rgb);
  return { hex, rgb, hsl, cmyk };
}
