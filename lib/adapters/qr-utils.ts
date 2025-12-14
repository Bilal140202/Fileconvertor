import QRCode from 'qrcode';

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QRQuality = 'low' | 'medium' | 'quartile' | 'high';

export interface QRGenerateOptions {
  text: string;
  size?: number;
  margin?: number;
  quality?: QRQuality;
  errorCorrectionLevel?: QRErrorCorrection;
  darkColor?: string;
  lightColor?: string;
  logoDataUrl?: string;
  logoSizeRatio?: number; // 0..1, relative to QR width
}

function qualityToEcc(q?: QRQuality): QRErrorCorrection {
  switch (q) {
    case 'low':
      return 'L';
    case 'medium':
      return 'M';
    case 'quartile':
      return 'Q';
    case 'high':
      return 'H';
    default:
      return 'M';
  }
}

export async function generateQrSvg(opts: QRGenerateOptions): Promise<string> {
  const size = opts.size ?? 256;
  const margin = opts.margin ?? 2;
  const errorCorrectionLevel = opts.errorCorrectionLevel ?? qualityToEcc(opts.quality);

  const svg = await QRCode.toString(opts.text, {
    type: 'svg',
    errorCorrectionLevel,
    margin,
    width: size,
    color: {
      dark: opts.darkColor ?? '#000000',
      light: opts.lightColor ?? '#ffffff'
    }
  });

  if (!opts.logoDataUrl) return svg;

  const logoRatio = Math.min(0.5, Math.max(0.05, opts.logoSizeRatio ?? 0.2));
  const logoSize = size * logoRatio;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;

  const insert = `<image href="${opts.logoDataUrl}" x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;

  const idx = svg.indexOf('>');
  if (idx === -1) return svg;

  return `${svg.slice(0, idx + 1)}${insert}${svg.slice(idx + 1)}`;
}
