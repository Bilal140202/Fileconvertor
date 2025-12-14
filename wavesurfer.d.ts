declare module 'wavesurfer.js' {
  export default class WaveSurfer {
    static create(options: any): WaveSurfer;
    load(url: string): void;
    play(): void;
    pause(): void;
    stop(): void;
    getDuration(): number;
    getCurrentTime(): number;
    seekTo(progress: number): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    destroy(): void;
  }
}
