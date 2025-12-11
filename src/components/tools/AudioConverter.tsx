import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import lamejs from 'lamejs'
import { deriveFileName, formatBytes } from '../../utils/file'

type ConversionState = 'idle' | 'processing' | 'done' | 'error'

type TargetFormat = 'mp3' | 'wav'

interface ConversionResult {
  url: string
  name: string
  size: number
  duration: number
}

const AudioConverter = () => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('mp3')
  const [bitrate, setBitrate] = useState(192)
  const [status, setStatus] = useState<ConversionState>('idle')
  const [message, setMessage] = useState('All conversions happen with the Web Audio API for zero upload time.')
  const [result, setResult] = useState<ConversionResult | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url)
      }
    }
  }, [result])

  const ensureAudioContext = () => {
    if (!audioContextRef.current) {
      const Constructor =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Constructor) {
        throw new Error('AudioContext is not supported in this browser')
      }
      audioContextRef.current = new Constructor()
    }
    return audioContextRef.current
  }

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const [nextFile] = event.target.files ?? []
    handleFile(nextFile ?? null)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const [nextFile] = event.dataTransfer.files ?? []
    handleFile(nextFile ?? null)
  }

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('audio')) {
      setStatus('error')
      setMessage('Please select an audio file (MP3, WAV, OGG, ...).')
      return
    }

    setFile(nextFile)
    setStatus('idle')
    setMessage('Choose an output format and press convert.')
    setResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url)
      }
      return null
    })

    const url = URL.createObjectURL(nextFile)
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return url
    })
  }

  const convert = async () => {
    if (!file) {
      setStatus('error')
      setMessage('Select an audio file before converting.')
      return
    }

    setStatus('processing')
    setMessage('Decoding audio samples in memory...')

    try {
      const audioContext = ensureAudioContext()
      const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer())
      let blob: Blob
      let extension: TargetFormat

      if (targetFormat === 'wav') {
        blob = audioBufferToWav(audioBuffer)
        extension = 'wav'
      } else {
        blob = audioBufferToMp3(audioBuffer, bitrate)
        extension = 'mp3'
      }

      const fileName = deriveFileName(file.name, extension)
      const url = URL.createObjectURL(blob)

      setResult({ url, name: fileName, size: blob.size, duration: audioBuffer.duration })
      setStatus('done')
      setMessage('Conversion complete. Download below.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('We could not decode this audio. Try a different format.')
    }
  }

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'processing':
        return 'Processing'
      case 'done':
        return 'Ready'
      case 'error':
        return 'Needs attention'
      default:
        return 'Idle'
    }
  }, [status])

  const durationLabel = useMemo(() => {
    if (!result) {
      return null
    }
    const minutes = Math.floor(result.duration / 60)
    const seconds = Math.round(result.duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }, [result])

  return (
    <div className="tool-surface">
      <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <input id="audio-input" type="file" accept="audio/*" onChange={onFileInput} hidden />
        {previewUrl ? (
          <audio controls src={previewUrl} className="audio-preview" />
        ) : (
          <div className="dropzone__placeholder">
            <p>Drop audio or</p>
            <label htmlFor="audio-input" className="secondary-button">
              Browse files
            </label>
          </div>
        )}
        <p className="dropzone__meta">{file ? `${file.name} • ${formatBytes(file.size)}` : 'MP3, WAV, AAC, OGG supported'}</p>
      </div>

      {file && (
        <div className="control-grid">
          <div className="control">
            <label>Output format</label>
            <div className="chip-group">
              {(['mp3', 'wav'] as TargetFormat[]).map((format) => (
                <button
                  key={format}
                  type="button"
                  className={`chip ${targetFormat === format ? 'is-active' : ''}`}
                  onClick={() => setTargetFormat(format)}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {targetFormat === 'mp3' && (
            <div className="control">
              <label>Bitrate {bitrate} kbps</label>
              <input type="range" min={96} max={320} step={32} value={bitrate} onChange={(event) => setBitrate(Number(event.target.value))} />
              <small className="subtle">Higher values favor fidelity, lower values favor file size.</small>
            </div>
          )}
        </div>
      )}

      <div className="action-row">
        <div className="status-pill" data-state={status}>
          <span className="dot" />
          {statusLabel}
        </div>
        <p className="muted">{message}</p>
      </div>

      <div className="action-buttons">
        <button className="primary-button" onClick={convert} disabled={!file || status === 'processing'}>
          Convert audio
        </button>
        <button
          className="ghost-button"
          onClick={() => {
            setFile(null)
            setPreviewUrl((current) => {
              if (current) {
                URL.revokeObjectURL(current)
              }
              return null
            })
            setResult((current) => {
              if (current?.url) {
                URL.revokeObjectURL(current.url)
              }
              return null
            })
            setStatus('idle')
            setMessage('All conversions happen with the Web Audio API for zero upload time.')
          }}
        >
          Reset
        </button>
      </div>

      {result && (
        <div className="result-card">
          <div>
            <p className="result-card__label">Converted audio</p>
            <h4>{result.name}</h4>
            <p className="subtle">{formatBytes(result.size)}</p>
            {durationLabel && <p className="subtle">Duration {durationLabel}</p>}
          </div>
          <a className="primary-button" href={result.url} download={result.name}>
            Download
          </a>
        </div>
      )}
    </div>
  )
}

const audioBufferToWav = (buffer: AudioBuffer) => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataLength = buffer.length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  const channelData = []
  for (let channel = 0; channel < numChannels; channel += 1) {
    channelData.push(buffer.getChannelData(channel))
  }

  let offset = 44
  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

const audioBufferToMp3 = (buffer: AudioBuffer, bitrate: number) => {
  const numChannels = Math.min(2, buffer.numberOfChannels)
  const sampleRate = buffer.sampleRate
  const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitrate)
  const samples = buffer.length
  const blockSize = 1152
  const channelData = Array.from({ length: numChannels }, (_, index) => buffer.getChannelData(index))
  const mp3Chunks: number[] = []

  const convertBuffer = (input: Float32Array) => {
    const result = new Int16Array(input.length)
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]))
      result[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
    }
    return result
  }

  for (let offset = 0; offset < samples; offset += blockSize) {
    const left = convertBuffer(channelData[0].subarray(offset, offset + blockSize))
    const right = numChannels > 1 ? convertBuffer(channelData[1].subarray(offset, offset + blockSize)) : left
    const mp3Data = numChannels > 1 ? mp3Encoder.encodeBuffer(left, right) : mp3Encoder.encodeBuffer(left)
    mp3Chunks.push(...mp3Data)
  }

  const flush = mp3Encoder.flush()
  if (flush.length) {
    mp3Chunks.push(...flush)
  }

  return new Blob([new Uint8Array(mp3Chunks)], { type: 'audio/mpeg' })
}

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

export default AudioConverter
