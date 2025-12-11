import { type ChangeEvent, type DragEvent, useEffect, useMemo, useState } from 'react'
import { canvasToBlob, getCanvasContext, loadImageElement } from '../../utils/image'
import { deriveFileName, formatBytes, getAspectRatio } from '../../utils/file'

const formatOptions = [
  { value: 'image/png', label: 'PNG (.png)', extension: 'png' },
  { value: 'image/jpeg', label: 'JPEG (.jpg)', extension: 'jpg' },
  { value: 'image/webp', label: 'WEBP (.webp)', extension: 'webp' },
]

type ConversionState = 'idle' | 'processing' | 'done' | 'error'

interface ConversionResult {
  url: string
  name: string
  size: number
}

const ImageResizer = () => {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null)
  const [dimensions, setDimensions] = useState({ width: 2048, height: 2048 })
  const [scale, setScale] = useState(100)
  const [maintainAspect, setMaintainAspect] = useState(true)
  const [outputFormat, setOutputFormat] = useState(formatOptions[0])
  const [quality, setQuality] = useState(90)
  const [status, setStatus] = useState<ConversionState>('idle')
  const [message, setMessage] = useState('Adaptive resizing runs locally to keep assets private.')
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

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      setStatus('error')
      setMessage('Select an image to continue.')
      return
    }

    setFile(nextFile)
    setStatus('idle')
    setResult(null)
    setMessage('Tune the target size and export when ready.')

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
      setDimensions({ width: image.width, height: image.height })
      setScale(100)
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

  const handleWidthChange = (value: number) => {
    setDimensions((current) => {
      const nextWidth = Math.max(16, value)
      if (maintainAspect && imageInfo) {
        const ratio = imageInfo.height / imageInfo.width
        return { width: nextWidth, height: Math.max(16, Math.round(nextWidth * ratio)) }
      }
      return { ...current, width: nextWidth }
    })
  }

  const handleHeightChange = (value: number) => {
    setDimensions((current) => {
      const nextHeight = Math.max(16, value)
      if (maintainAspect && imageInfo) {
        const ratio = imageInfo.width / imageInfo.height
        return { width: Math.max(16, Math.round(nextHeight * ratio)), height: nextHeight }
      }
      return { ...current, height: nextHeight }
    })
  }

  const handleScaleChange = (value: number) => {
    if (!imageInfo) {
      return
    }
    setScale(value)
    const factor = value / 100
    setDimensions({ width: Math.max(16, Math.round(imageInfo.width * factor)), height: Math.max(16, Math.round(imageInfo.height * factor)) })
  }

  const convert = async () => {
    if (!file) {
      setStatus('error')
      setMessage('Select an image first.')
      return
    }

    setStatus('processing')
    setMessage('Building a high fidelity canvas...')

    try {
      const image = await loadImageElement(file)
      const canvas = document.createElement('canvas')
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const context = getCanvasContext(canvas)
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height)

      const normalizedQuality = outputFormat.value === 'image/png' ? undefined : quality / 100
      const blob = await canvasToBlob(canvas, outputFormat.value, normalizedQuality)
      const url = URL.createObjectURL(blob)
      const name = deriveFileName(file.name, outputFormat.extension)

      setResult({ url, name, size: blob.size })
      setStatus('done')
      setMessage('Resized file is ready to download.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('Unable to resize this file. Try another asset or smaller dimensions.')
    }
  }

  const clearSelection = () => {
    setFile(null)
    setResult(null)
    setImageInfo(null)
    setDimensions({ width: 2048, height: 2048 })
    setScale(100)
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return null
    })
    setStatus('idle')
    setMessage('Adaptive resizing runs locally to keep assets private.')
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
        <input id="image-resizer-input" type="file" accept="image/*" onChange={onFileInput} hidden />
        {previewUrl ? (
          <img src={previewUrl} alt="Selected preview" className="dropzone__preview" />
        ) : (
          <div className="dropzone__placeholder">
            <p>Drop an image or</p>
            <label htmlFor="image-resizer-input" className="secondary-button">
              Browse files
            </label>
          </div>
        )}
        <p className="dropzone__meta">{file ? `${file.name} • ${formatBytes(file.size)}` : 'Supports ultra high-res images'}</p>
        {imageInfo && (
          <p className="dropzone__meta subtle">
            {imageInfo.width} × {imageInfo.height} px • Ratio {getAspectRatio(imageInfo.width, imageInfo.height)}
          </p>
        )}
      </div>

      {file && (
        <div className="control-grid --three">
          <div className="control">
            <label>Width (px)</label>
            <input
              type="number"
              min={16}
              value={dimensions.width}
              onChange={(event) => handleWidthChange(Number(event.target.value))}
            />
          </div>
          <div className="control">
            <label>Height (px)</label>
            <input
              type="number"
              min={16}
              value={dimensions.height}
              onChange={(event) => handleHeightChange(Number(event.target.value))}
            />
          </div>
          <div className="control">
            <label>Scale {scale}%</label>
            <input type="range" min={10} max={200} value={scale} onChange={(event) => handleScaleChange(Number(event.target.value))} />
            <small className="subtle">Quickly resize relative to the source dimensions.</small>
          </div>
        </div>
      )}

      {file && (
        <div className="control-grid">
          <div className="control">
            <label>Aspect lock</label>
            <div className="chip-group">
              <button
                type="button"
                className={`chip ${maintainAspect ? 'is-active' : ''}`}
                onClick={() => setMaintainAspect(true)}
              >
                Locked
              </button>
              <button
                type="button"
                className={`chip ${!maintainAspect ? 'is-active' : ''}`}
                onClick={() => setMaintainAspect(false)}
              >
                Freeform
              </button>
            </div>
          </div>
          <div className="control">
            <label>Output format</label>
            <select value={outputFormat.value} onChange={(event) => {
              const next = formatOptions.find((option) => option.value === event.target.value)
              if (next) {
                setOutputFormat(next)
              }
            }}>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {outputFormat.value !== 'image/png' && (
            <div className="control">
              <label>Quality {quality}%</label>
              <input type="range" min={40} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
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
          Resize & download
        </button>
        <button className="ghost-button" onClick={clearSelection}>
          Clear selection
        </button>
      </div>

      {result && (
        <div className="result-card">
          <div>
            <p className="result-card__label">Resized file</p>
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

export default ImageResizer
