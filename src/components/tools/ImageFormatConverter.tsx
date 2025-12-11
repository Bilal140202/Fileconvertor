import { type ChangeEvent, type DragEvent, useEffect, useMemo, useState } from 'react'
import { canvasToBlob, loadImageElement } from '../../utils/image'
import { deriveFileName, formatBytes, getAspectRatio } from '../../utils/file'

const formatOptions = [
  { value: 'image/jpeg', label: 'JPEG (.jpg)', extension: 'jpg' },
  { value: 'image/png', label: 'PNG (.png)', extension: 'png' },
  { value: 'image/webp', label: 'WEBP (.webp)', extension: 'webp' },
]

type ConversionState = 'idle' | 'processing' | 'done' | 'error'

interface ConversionResult {
  url: string
  name: string
  size: number
}

const ImageFormatConverter = () => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null)
  const [targetFormat, setTargetFormat] = useState(formatOptions[0])
  const [quality, setQuality] = useState(90)
  const [status, setStatus] = useState<ConversionState>('idle')
  const [message, setMessage] = useState('Drop an image or browse your device to get started.')
  const [result, setResult] = useState<ConversionResult | null>(null)

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

  const requiresQualityControl = targetFormat.value !== 'image/png'

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      setMessage('Please select an image file (PNG, JPG, WEBP, ...).')
      setStatus('error')
      return
    }

    setFile(nextFile)
    setResult(null)
    setStatus('idle')
    setMessage('Choose an output format and convert when ready.')

    const url = URL.createObjectURL(nextFile)
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return url
    })

    const image = new Image()
    image.onload = () => {
      setImageInfo({ width: image.width, height: image.height })
    }
    image.src = url
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

  const convert = async () => {
    if (!file) {
      setMessage('Select an image before converting.')
      setStatus('error')
      return
    }

    setStatus('processing')
    setMessage('Rendering new image in your browser...')

    try {
      const image = await loadImageElement(file)
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Canvas is not supported in this browser')
      }

      context.drawImage(image, 0, 0)

      const normalizedQuality = requiresQualityControl ? quality / 100 : undefined
      const blob = await canvasToBlob(canvas, targetFormat.value, normalizedQuality)
      const url = URL.createObjectURL(blob)
      const outputName = deriveFileName(file.name, targetFormat.extension)

      setResult({ url, name: outputName, size: blob.size })
      setStatus('done')
      setMessage('Conversion finished. Download is ready below.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('We could not convert this file. Try another format or image.')
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setImageInfo(null)
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return null
    })
    setStatus('idle')
    setMessage('Drop an image or browse your device to get started.')
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

  return (
    <div className="tool-surface">
      <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        <input id="image-format-input" type="file" accept="image/*" onChange={onFileInput} hidden />
        {previewUrl ? (
          <img src={previewUrl} alt="Selected preview" className="dropzone__preview" />
        ) : (
          <div className="dropzone__placeholder">
            <p>Drop an image here or</p>
            <label htmlFor="image-format-input" className="secondary-button">
              Browse files
            </label>
          </div>
        )}
        <p className="dropzone__meta">{file ? `${file.name} • ${formatBytes(file.size)}` : 'PNG, JPG, WEBP, AVIF supported'}</p>
        {imageInfo && (
          <p className="dropzone__meta subtle">
            {imageInfo.width} × {imageInfo.height} px • Ratio {getAspectRatio(imageInfo.width, imageInfo.height)}
          </p>
        )}
      </div>

      {file && (
        <div className="control-grid">
          <div className="control">
            <label htmlFor="target-format">Output format</label>
            <select
              id="target-format"
              value={targetFormat.value}
              onChange={(event) => {
                const next = formatOptions.find((option) => option.value === event.target.value)
                if (next) {
                  setTargetFormat(next)
                }
              }}
            >
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="control">
            <label htmlFor="quality">
              Quality {requiresQualityControl ? `${quality}%` : '(lossless)'}
            </label>
            <input
              id="quality"
              type="range"
              min={50}
              max={100}
              step={1}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              disabled={!requiresQualityControl}
            />
          </div>
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
          Convert & download
        </button>
        <button className="ghost-button" onClick={reset} disabled={!file}>
          Reset
        </button>
      </div>

      {result && (
        <div className="result-card">
          <div>
            <p className="result-card__label">Optimized file</p>
            <h4>{result.name}</h4>
            <p className="subtle">{formatBytes(result.size)}</p>
          </div>
          <a className="primary-button" href={result.url} download={result.name}>
            Download
          </a>
        </div>
      )}
    </div>
  )
}

export default ImageFormatConverter
