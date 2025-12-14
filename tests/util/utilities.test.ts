import { describe, expect, it } from 'vitest';

import {
  cmykToRgb,
  convertColor,
  hexToRgb,
  hslToRgb,
  isValidHex,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl
} from '../../lib/adapters/color-utils';
import { convertUnit, getUnitCategories } from '../../lib/adapters/unit-converter';
import { generateQrSvg } from '../../lib/adapters/qr-utils';

describe('color-utils', () => {
  it('validates hex colors', () => {
    expect(isValidHex('#fff')).toBe(true);
    expect(isValidHex('#ff00aa')).toBe(true);
    expect(isValidHex('#ff00aa80')).toBe(true);
    expect(isValidHex('nope')).toBe(false);
  });

  it('round-trips HEX -> RGB -> HEX', () => {
    const rgb = hexToRgb('#ff00aa');
    expect(rgbToHex(rgb)).toBe('#ff00aa');
  });

  it('round-trips RGB <-> HSL', () => {
    const rgb = { r: 12, g: 200, b: 34 };
    const hsl = rgbToHsl(rgb);
    const rgb2 = hslToRgb(hsl);

    expect(Math.abs(rgb2.r - rgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb2.g - rgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb2.b - rgb.b)).toBeLessThanOrEqual(1);
  });

  it('round-trips RGB <-> CMYK', () => {
    const rgb = { r: 120, g: 20, b: 220 };
    const cmyk = rgbToCmyk(rgb);
    const rgb2 = cmykToRgb(cmyk);

    expect(Math.abs(rgb2.r - rgb.r)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb2.g - rgb.g)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb2.b - rgb.b)).toBeLessThanOrEqual(1);
  });

  it('converts from any input format', () => {
    const converted = convertColor({ hex: '#00ff00' });
    expect(converted.rgb).toEqual({ r: 0, g: 255, b: 0 });
    expect(converted.hex).toBe('#00ff00');
  });
});

describe('unit-converter', () => {
  it('exposes unit categories', () => {
    const cats = getUnitCategories();
    expect(Object.keys(cats).sort()).toEqual(['length', 'temperature', 'time', 'volume', 'weight']);
    expect(cats.length.length).toBeGreaterThan(0);
    expect(cats.temperature.length).toBeGreaterThan(0);
  });

  it('converts length, weight, temperature', () => {
    expect(convertUnit(1, 'm', 'cm')).toBeCloseTo(100);
    expect(convertUnit(1, 'kg', 'g')).toBeCloseTo(1000);

    expect(convertUnit(0, 'c', 'f')).toBeCloseTo(32);
    expect(convertUnit(32, 'f', 'c')).toBeCloseTo(0);
    expect(convertUnit(0, 'c', 'k')).toBeCloseTo(273.15);
  });
});

describe('qr-utils', () => {
  it('generates an SVG QR code and supports logo overlay', async () => {
    const svg = await generateQrSvg({
      text: 'hello',
      size: 180,
      quality: 'high',
      logoDataUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZmYwMDAwIi8+PC9zdmc+' // red square
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('<image');
  });
});
