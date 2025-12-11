import type { ComponentType } from 'react'
import ArchiveManager from '../components/tools/ArchiveManager'
import AudioConverter from '../components/tools/AudioConverter'
import ImageFormatConverter from '../components/tools/ImageFormatConverter'
import ImageResizer from '../components/tools/ImageResizer'
import TextToPdfConverter from '../components/tools/TextToPdfConverter'

export type ToolCategory = 'image' | 'document' | 'archive' | 'audio'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  keywords: string[]
  component: ComponentType
  highlights: string[]
  steps: string[]
  badge?: string
}

export const toolCategories: Record<ToolCategory, { label: string; description: string; accent: string }> = {
  image: {
    label: 'Image Studio',
    description: 'Format shifts, resizing, and optimization',
    accent: '#60a5fa',
  },
  document: {
    label: 'Document Lab',
    description: 'PDF authoring and document cleanup',
    accent: '#c084fc',
  },
  archive: {
    label: 'Archive Tools',
    description: 'Compress, bundle, and inspect files',
    accent: '#f97316',
  },
  audio: {
    label: 'Audio Lab',
    description: 'Waveform editing and exports',
    accent: '#34d399',
  },
}

export const toolRegistry: ToolDefinition[] = [
  {
    id: 'image-format-converter',
    name: 'Image Format Converter',
    description: 'Convert PNG, JPG, and WEBP instantly with granular quality control and live previews.',
    category: 'image',
    keywords: ['png', 'jpg', 'webp', 'optimize', 'metadata'],
    component: ImageFormatConverter,
    highlights: ['Drag-and-drop previews', 'Quality slider with metadata stripping', 'Offline-first privacy'],
    steps: ['Drop or browse for an image file', 'Choose an output format and adjust quality if needed', 'Press Convert & download to save the new file'],
    badge: 'Popular',
  },
  {
    id: 'image-resizer',
    name: 'Responsive Image Resizer',
    description: 'Batch-perfect dimensions with aspect guards, scaling presets, and multi-format export.',
    category: 'image',
    keywords: ['resize', 'scale', 'webp', 'jpg'],
    component: ImageResizer,
    highlights: ['Aspect locking or freeform resizing', 'Scale slider anchored to original resolution', 'Export to PNG, JPG, or WEBP'],
    steps: ['Drop a high-resolution asset into the canvas', 'Set target dimensions or use the scale slider', 'Choose an output format and hit Resize & download'],
  },
  {
    id: 'text-to-pdf',
    name: 'Text & Markdown to PDF',
    description: 'Author polished PDFs with custom titles, authors, and consistent typography from any text source.',
    category: 'document',
    keywords: ['markdown', 'pdf', 'txt', 'authoring'],
    component: TextToPdfConverter,
    highlights: ['Realtime word count and metadata hints', 'Selectable font sizing for different outputs', 'Searchable vector PDF output'],
    steps: ['Import a .txt or .md file (or just paste content)', 'Set title, author, and typography preferences', 'Generate and download the PDF with one click'],
    badge: 'New',
  },
  {
    id: 'archive-orchestrator',
    name: 'Archive Orchestrator',
    description: 'Create lightweight ZIPs or inspect existing archives entirely client-side.',
    category: 'archive',
    keywords: ['zip', 'compress', 'extract'],
    component: ArchiveManager,
    highlights: ['Zero upload compression', 'Readable download manifest', 'Dual-pane create and extract flows'],
    steps: ['Select files to compress or import a ZIP archive', 'Preview file sizes and configure archive naming', 'Download the generated archive or save extracted items'],
  },
  {
    id: 'audio-lab',
    name: 'Hi-Fi Audio Converter',
    description: 'Transcode audio between WAV and MP3 with adjustable bitrate control and inline previewing.',
    category: 'audio',
    keywords: ['mp3', 'wav', 'audio', 'bitrate'],
    component: AudioConverter,
    highlights: ['Runs with the Web Audio API and LAME encoder', 'No uploads: privacy-first music prep', 'Flexible bitrate presets for streaming or archiving'],
    steps: ['Drop an audio file or browse your library', 'Choose MP3 or WAV output and tweak bitrate if needed', 'Start conversion and download the optimized track'],
  },
]

export const quickStartTools = ['image-format-converter', 'audio-lab', 'text-to-pdf']
