import { readFile } from 'node:fs/promises';
import path from 'node:path';

const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures');

export async function loadFixtureText(name: string): Promise<string> {
  return readFile(path.join(fixturesDir, name), 'utf8');
}

export async function loadFixtureBytesFromBase64(name: string): Promise<Uint8Array> {
  const base64 = (await loadFixtureText(name)).trim();
  return new Uint8Array(Buffer.from(base64, 'base64'));
}
