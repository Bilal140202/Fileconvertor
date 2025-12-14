export type ConversionProgressEvent = {
  stage: string;
  stageProgress: number;
  overallProgress: number;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ConversionContextOptions = {
  onProgress?: (event: ConversionProgressEvent) => void;
  signal?: AbortSignal;
  stageWeights?: Record<string, number>;
};

type StageState = {
  name: string;
  weight: number;
  progress: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export class ConversionContext {
  private onProgress?: (event: ConversionProgressEvent) => void;
  private signal?: AbortSignal;
  private stages: Map<string, StageState>;
  private ordered: string[];

  constructor(options: ConversionContextOptions = {}) {
    this.onProgress = options.onProgress;
    this.signal = options.signal;
    this.stages = new Map();
    this.ordered = [];

    for (const [name, weight] of Object.entries(options.stageWeights ?? {})) {
      this.registerStage(name, weight);
    }
  }

  throwIfAborted() {
    if (!this.signal?.aborted) return;
    const err = new Error('Conversion aborted');
    (err as any).name = 'AbortError';
    throw err;
  }

  registerStage(name: string, weight = 1): void {
    if (this.stages.has(name)) return;
    this.stages.set(name, { name, weight, progress: 0 });
    this.ordered.push(name);
  }

  private computeOverallProgress(): number {
    const stages = Array.from(this.stages.values());
    if (stages.length === 0) return 0;

    const totalWeight = stages.reduce((acc, s) => acc + s.weight, 0) || 1;
    const weighted = stages.reduce((acc, s) => acc + s.weight * clamp01(s.progress), 0);
    return weighted / totalWeight;
  }

  report(stage: string, stageProgress: number, message?: string, meta?: Record<string, unknown>) {
    this.throwIfAborted();

    if (!this.stages.has(stage)) this.registerStage(stage, 1);

    const state = this.stages.get(stage)!;
    state.progress = clamp01(stageProgress);

    this.onProgress?.({
      stage,
      stageProgress: state.progress,
      overallProgress: this.computeOverallProgress(),
      message,
      meta
    });
  }

  child(prefix: string, weight = 1): ConversionContext {
    const parent = this;

    return new ConversionContext({
      signal: this.signal,
      onProgress(event) {
        parent.report(`${prefix}:${event.stage}`, event.stageProgress, event.message, event.meta);
      },
      stageWeights: {
        [`${prefix}:main`]: weight
      }
    });
  }
}
