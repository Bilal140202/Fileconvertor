import { describe, expect, it } from 'vitest';

import { InvalidPasswordError } from '../../lib/errors.js';
import { createArchive, extractArchive } from '../../lib/adapters/archive-converter.js';

const enc = new TextEncoder();

describe('archive-converter', () => {
  it('creates and extracts ZIP archives', async () => {
    const files = [
      { path: 'hello.txt', data: enc.encode('hello') },
      { path: 'nested/world.txt', data: enc.encode('world') }
    ];

    const zip = await createArchive(files, { format: 'zip', compressionLevel: 9 });
    const extracted = await extractArchive(zip, { format: 'zip' });

    expect(extracted.map((f) => f.path).sort()).toEqual(['hello.txt', 'nested/world.txt']);
    expect(new TextDecoder().decode(extracted.find((f) => f.path === 'hello.txt')!.data)).toBe('hello');
    expect(new TextDecoder().decode(extracted.find((f) => f.path === 'nested/world.txt')!.data)).toBe('world');
  });

  it('supports include/exclude filters for creation', async () => {
    const files = [
      { path: 'a.txt', data: enc.encode('a') },
      { path: 'b.txt', data: enc.encode('b') }
    ];

    const zip = await createArchive(files, { format: 'zip', exclude: ['b.txt'] });
    const extracted = await extractArchive(zip, { format: 'zip' });

    expect(extracted.map((f) => f.path)).toEqual(['a.txt']);
  });

  it('fails extraction when ZIP password is incorrect', async () => {
    const files = [{ path: 'secret.txt', data: enc.encode('top secret') }];

    const zip = await createArchive(files, { format: 'zip', password: 'correct' });

    await expect(extractArchive(zip, { format: 'zip', password: 'wrong' })).rejects.toBeInstanceOf(InvalidPasswordError);
    const extracted = await extractArchive(zip, { format: 'zip', password: 'correct' });
    expect(new TextDecoder().decode(extracted[0]!.data)).toBe('top secret');
  });
});
