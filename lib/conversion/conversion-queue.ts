import type { ConversionOutput, ConversionInput, DocumentConversionOptions } from '../adapters/document-converter';

export type QueueItemStatus = 'queued' | 'running' | 'done' | 'error';

export type ConversionQueueItem = {
  id: string;
  inputs: ConversionInput[];
  options: DocumentConversionOptions;
  status: QueueItemStatus;
  progress: number;
  stage?: string;
  outputs?: ConversionOutput[];
  error?: string;
};

export type ConversionQueueListener = (item: ConversionQueueItem) => void;

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export class ConversionQueue {
  private worker?: Worker;
  private items: ConversionQueueItem[] = [];
  private listeners = new Set<ConversionQueueListener>();
  private running = false;

  constructor(workerFactory?: () => Worker) {
    if (typeof window !== 'undefined') {
      this.worker = workerFactory
        ? workerFactory()
        : new Worker(new URL('./document-converter.worker.ts', import.meta.url), { type: 'module' });

      this.worker.onmessage = (event: MessageEvent<any>) => {
        const msg = event.data;
        const item = this.items.find((i) => i.id === msg.id);
        if (!item) return;

        if (msg.type === 'progress') {
          item.status = 'running';
          item.stage = msg.stage;
          item.progress = msg.overallProgress;
          this.emit(item);
        } else if (msg.type === 'result') {
          item.status = 'done';
          item.progress = 1;
          item.outputs = msg.outputs.map((o: any) => ({
            data: new Uint8Array(o.data),
            filename: o.filename,
            format: o.format,
            mimeType: o.mimeType
          }));
          this.emit(item);
          this.running = false;
          void this.runNext();
        } else if (msg.type === 'error') {
          item.status = 'error';
          item.error = msg.message;
          this.emit(item);
          this.running = false;
          void this.runNext();
        }
      };
    }
  }

  subscribe(listener: ConversionQueueListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getItems() {
    return [...this.items];
  }

  enqueue(inputs: ConversionInput[], options: DocumentConversionOptions): ConversionQueueItem {
    const item: ConversionQueueItem = {
      id: createId(),
      inputs,
      options,
      status: 'queued',
      progress: 0
    };

    this.items.unshift(item);
    this.emit(item);
    void this.runNext();
    return item;
  }

  private emit(item: ConversionQueueItem) {
    for (const l of this.listeners) l(item);
  }

  private async runNext() {
    if (this.running) return;

    const next = this.items.find((i) => i.status === 'queued');
    if (!next) return;
    if (!this.worker) {
      next.status = 'error';
      next.error = 'Web Worker is not available in this environment.';
      this.emit(next);
      return;
    }

    this.running = true;
    next.status = 'running';
    next.progress = 0;
    this.emit(next);

    this.worker.postMessage({
      id: next.id,
      inputs: next.inputs.map((i) => ({
        data: i.data.buffer.slice(i.data.byteOffset, i.data.byteOffset + i.data.byteLength),
        filename: i.filename,
        format: i.format
      })),
      options: next.options
    });
  }
}
