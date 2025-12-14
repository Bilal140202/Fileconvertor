import picomatch from 'picomatch';

export type PathFilter = string | RegExp;

export function pathMatchesAny(path: string, filters: PathFilter[]): boolean {
  for (const filter of filters) {
    if (typeof filter === 'string') {
      const isMatch = picomatch.isMatch(path, filter, { dot: true });
      if (isMatch) return true;
    } else {
      if (filter.test(path)) return true;
    }
  }

  return false;
}

export function shouldIncludePath(
  path: string,
  opts: { include?: PathFilter[]; exclude?: PathFilter[] }
): boolean {
  if (opts.include?.length && !pathMatchesAny(path, opts.include)) return false;
  if (opts.exclude?.length && pathMatchesAny(path, opts.exclude)) return false;
  return true;
}
