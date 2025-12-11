import type { LucideIcon } from "lucide-react";
import {
  AudioWaveform,
  Binary,
  FileArchive,
  FileCode2,
  FileText,
  Image,
  Layers3,
  Video,
} from "lucide-react";

type ToolStatus = "available" | "beta" | "soon";

export type ConverterTool = {
  name: string;
  summary: string;
  status: ToolStatus;
  href: string;
};

export type ConverterCategory = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  tools: ConverterTool[];
  highlights: string[];
};

export const converterCategories: ConverterCategory[] = [
  {
    slug: "images",
    title: "Image Studio",
    description: "Compress, resize, watermark, and convert every visual asset without leaving the browser.",
    icon: Image,
    badge: "Most used",
    highlights: [
      "Presets for marketing and product catalogs",
      "Lossless + lossy compression tiers",
      "Batch rename with metadata scrubbing",
    ],
    tools: [
      {
        name: "HEIC → JPG",
        summary: "Instantly convert Apple photos while respecting EXIF privacy settings.",
        status: "available",
        href: "/tools/images",
      },
      {
        name: "Background Cleanup",
        summary: "One-click background removal powered by on-device WebGL.",
        status: "beta",
        href: "/tools/images",
      },
      {
        name: "Sprite Sheet Builder",
        summary: "Assemble animation sprites without Photoshop or Figma.",
        status: "soon",
        href: "/tools/images",
      },
    ],
  },
  {
    slug: "video",
    title: "Video Lab",
    description: "Trim, transcode, and optimize trailers or social clips with GPU acceleration in the browser.",
    icon: Video,
    highlights: [
      "Smart bitrate + caption profiles",
      "Auto aspect-ratio safe zones",
      "Storyboarding timeline",
    ],
    tools: [
      {
        name: "MP4 → WebM",
        summary: "Ship lighter embeds that autoplay everywhere.",
        status: "available",
        href: "/tools/video",
      },
      {
        name: "Subtitle Sync",
        summary: "Align SRT/VTT files with timeline scrubbing.",
        status: "beta",
        href: "/tools/video",
      },
      {
        name: "HDR Preview",
        summary: "Tone-map footage for SDR clients in seconds.",
        status: "soon",
        href: "/tools/video",
      },
    ],
  },
  {
    slug: "audio",
    title: "Audio Desk",
    description: "Waveform editing, format conversion, and mastering cues ready for podcasts or product clips.",
    icon: AudioWaveform,
    highlights: [
      "Noise print suppression",
      "Auto loudness normalization",
      "Loop-friendly exports",
    ],
    tools: [
      {
        name: "WAV → MP3",
        summary: "Share lossless recordings in seconds.",
        status: "available",
        href: "/tools/audio",
      },
      {
        name: "Audiogram",
        summary: "Generate branded waveforms for social teasers.",
        status: "beta",
        href: "/tools/audio",
      },
      {
        name: "Stem Splitter",
        summary: "Isolate vocals and instruments entirely offline.",
        status: "soon",
        href: "/tools/audio",
      },
    ],
  },
  {
    slug: "documents",
    title: "Document Forge",
    description: "Convert massive decks, contracts, and tables without sending them to third-party servers.",
    icon: FileText,
    highlights: [
      "PII-aware redaction",
      "Page range + merge queues",
      "Optical text cleanup",
    ],
    tools: [
      {
        name: "PDF → DOCX",
        summary: " Editable outputs that preserve brand fonts.",
        status: "available",
        href: "/tools/documents",
      },
      {
        name: "Slides to Video",
        summary: "Narrate decks and export ready-to-post clips.",
        status: "beta",
        href: "/tools/documents",
      },
      {
        name: "AI Summary",
        summary: "Condense research packets locally for compliance.",
        status: "soon",
        href: "/tools/documents",
      },
    ],
  },
  {
    slug: "archives",
    title: "Archive Ops",
    description: "Compress, encrypt, and verify shipments meant for clients or internal hand-offs.",
    icon: FileArchive,
    highlights: [
      "Password-less link sharing",
      "Immutable audit history",
      "Chunked uploads for huge folders",
    ],
    tools: [
      {
        name: "ZIP Health Check",
        summary: "Validate and repair corrupted archives.",
        status: "available",
        href: "/tools/archives",
      },
      {
        name: "Smart Split",
        summary: "Shard deliveries for email or legacy SFTP systems.",
        status: "beta",
        href: "/tools/archives",
      },
      {
        name: "Checksum Monitor",
        summary: "Watch digest drift during large uploads.",
        status: "soon",
        href: "/tools/archives",
      },
    ],
  },
  {
    slug: "developer",
    title: "Developer Sandbox",
    description: "Lint, convert, and diff source files inside secure sandboxes.",
    icon: FileCode2,
    highlights: [
      "One-click API playground",
      "Infrastructure as code previews",
      "Binary diff visualizer",
    ],
    tools: [
      {
        name: "OpenAPI Cleaner",
        summary: "Compact specs before persisting to git.",
        status: "available",
        href: "/tools/developer",
      },
      {
        name: "Binary Inspector",
        summary: "Peek into WASM bundles from the browser.",
        status: "beta",
        href: "/tools/developer",
      },
      {
        name: "Stack Profiler",
        summary: "Surface slow paths without remote agents.",
        status: "soon",
        href: "/tools/developer",
      },
    ],
  },
  {
    slug: "3d",
    title: "3D + CAD",
    description: "Preview, convert, and decimate heavy meshes for real-time workflows.",
    icon: Layers3,
    highlights: [
      "USDZ + glTF round-tripping",
      "Texture baking presets",
      "WebGPU powered viewport",
    ],
    tools: [
      {
        name: "glTF Optimizer",
        summary: "Compress and preview scenes in AR.",
        status: "available",
        href: "/tools/3d",
      },
      {
        name: "CAD to SVG",
        summary: "Share lightweight drawings with stakeholders.",
        status: "beta",
        href: "/tools/3d",
      },
      {
        name: "Material Library",
        summary: "Sync textures across engines without drift.",
        status: "soon",
        href: "/tools/3d",
      },
    ],
  },
  {
    slug: "ai",
    title: "AI + ML",
    description: "Prepare datasets, quantize checkpoints, and audit prompts in air-gapped environments.",
    icon: Binary,
    highlights: [
      "On-device tokenizer hooks",
      "GPU aware packaging",
      "Prompt provenance trails",
    ],
    tools: [
      {
        name: "Model Quantizer",
        summary: "Shrink GGUF + ONNX artifacts without accuracy cliffs.",
        status: "available",
        href: "/tools/ai",
      },
      {
        name: "Prompt Replayer",
        summary: "Re-run generations deterministically for reviews.",
        status: "beta",
        href: "/tools/ai",
      },
      {
        name: "Dataset Redactor",
        summary: "Strip PII and secrets pre-training.",
        status: "soon",
        href: "/tools/ai",
      },
    ],
  },
];

export function getCategory(slug: string) {
  return converterCategories.find((category) => category.slug === slug);
}
