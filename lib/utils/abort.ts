export function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw new DOMException('The operation was aborted.', 'AbortError');
}
