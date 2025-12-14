/// <reference lib="webworker" />

import { convertDocuments, type ConversionInput, type DocumentConversionOptions } from '../adapters/document-converter';
import { ConversionContext } from './conversion-context';

type WorkerRequest = {
  id: string;
  inputs: Array<{ data: ArrayBuffer; filename?: string; format?: string }>;
  options: DocumentConversionOptions;
};

type WorkerProgress = {
  id: string;
  type: 'progress';
  stage: string;
  stageProgress: number;
  overallProgress: number;
  message?: string;
  meta?: Record<string, unknown>;
};

type WorkerResult = {
  id: string;
  type: 'result';
  outputs: Array<{ data: ArrayBuffer; filename: string; format: string; mimeType: string }>;
};

type WorkerError = {
  id: string;
  type: 'error';
  message: string;
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;

  try {
    const inputs: ConversionInput[] = req.inputs.map((i) => ({
      data: new Uint8Array(i.data),
      filename: i.filename,
      format: i.format as any
    }));

    const context = new ConversionContext({
      onProgress: (p) => {
        const msg: WorkerProgress = {
          id: req.id,
          type: 'progress',
          stage: p.stage,
          stageProgress: p.stageProgress,
          overallProgress: p.overallProgress,
          message: p.message,
          meta: p.meta
        };
        ctx.postMessage(msg);
      }
    });

    const outputs = await convertDocuments(inputs, req.options, context);

    const res: WorkerResult = {
      id: req.id,
      type: 'result',
      outputs: outputs.map((o) => ({
        data: o.data.buffer.slice(o.data.byteOffset, o.data.byteOffset + o.data.byteLength) as ArrayBuffer,
        filename: o.filename,
        format: o.format,
        mimeType: o.mimeType
      }))
    };

    ctx.postMessage(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown worker error';
    const err: WorkerError = { id: req.id, type: 'error', message };
    ctx.postMessage(err);
  }
};
