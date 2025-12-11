import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { deriveFileName, formatBytes, stripExtension } from '../../utils/file'

type ConversionState = 'idle' | 'processing' | 'done' | 'error'

interface ConversionResult {
  url: string
  name: string
  size: number
}

const starterCopy = `## Browser-native PDF builder

- Drop .txt or .md files
- Paste snippets from anywhere
- Add a title and author credit

Everything renders locally so drafts stay private.`

const TextToPdfConverter = () => {
  const [text, setText] = useState(starterCopy)
  const [title, setTitle] = useState('Untitled drop')
  const [author, setAuthor] = useState('Online Convert Clone')
  const [fontSize, setFontSize] = useState(12)
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [status, setStatus] = useState<ConversionState>('idle')
  const [message, setMessage] = useState('Drop markdown or TXT files. Rendering never leaves the browser.')
  const [result, setResult] = useState<ConversionResult | null>(null)

  useEffect(() => {
    return () => {
      if (result?.url) {
        URL.revokeObjectURL(result.url)
      }
    }
  }, [result])

  const importFile = async (file: File | null) => {
    if (!file) {
      return
    }

    const content = await file.text()
    setText(content)
    setSourceName(file.name)
    setTitle(stripExtension(file.name))
    setStatus('idle')
    setMessage(`${file.name} loaded. Configure metadata below.`)
  }

  const onFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const [nextFile] = event.target.files ?? []
    void importFile(nextFile ?? null)
    event.target.value = ''
  }

  const convert = async () => {
    if (!text.trim()) {
      setStatus('error')
      setMessage('Add some text or import a file first.')
      return
    }

    setStatus('processing')
    setMessage('Rendering vector-perfect pages...')

    try {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.setTitle(title.trim() || 'Browser PDF Draft')
      pdfDoc.setAuthor(author.trim() || 'Local conversion')

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const margin = 48
      const width = 612
      const height = 792
      const lineHeight = fontSize * 1.4
      const maxWidth = width - margin * 2

      const lines = buildLines(text, font, fontSize, maxWidth)
      let page = pdfDoc.addPage([width, height])
      let cursorY = height - margin

      for (const line of lines) {
        if (line === '\u0000') {
          cursorY -= lineHeight
          continue
        }

        if (cursorY <= margin) {
          page = pdfDoc.addPage([width, height])
          cursorY = height - margin
        }

        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          color: rgb(0.15, 0.15, 0.2),
        })
        cursorY -= lineHeight
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const fallback = `${title.replace(/\s+/g, '-').toLowerCase() || 'document'}.pdf`
      const fileName = sourceName ? deriveFileName(sourceName, 'pdf') : fallback
      const url = URL.createObjectURL(blob)

      setResult({ url, name: fileName, size: blob.size })
      setStatus('done')
      setMessage('PDF ready. Download below.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('We were unable to compose the PDF. Try simpler content.')
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

  return (
    <div className="tool-surface">
      <div className="control">
        <label htmlFor="text-import">Import text or markdown</label>
        <input id="text-import" type="file" accept=".txt,.md,.markdown,.csv,.json,.log" onChange={onFileInput} />
      </div>

      <div className="text-board">
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={14} spellCheck="false" />
        <div className="text-board__meta">
          <span>{text.split('\n').length} lines</span>
          <span>{text.length} characters</span>
          {sourceName && <span>Source: {sourceName}</span>}
        </div>
      </div>

      <div className="control-grid">
        <div className="control">
          <label>Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="control">
          <label>Author</label>
          <input value={author} onChange={(event) => setAuthor(event.target.value)} />
        </div>
        <div className="control">
          <label>Font size {fontSize} pt</label>
          <input type="range" min={10} max={18} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
        </div>
      </div>

      <div className="action-row">
        <div className="status-pill" data-state={status}>
          <span className="dot" />
          {statusLabel}
        </div>
        <p className="muted">{message}</p>
      </div>

      <div className="action-buttons">
        <button className="primary-button" onClick={convert} disabled={status === 'processing' || !text.trim()}>
          Create PDF
        </button>
        <button
          className="ghost-button"
          onClick={() => {
            setText('')
            setSourceName(null)
            setStatus('idle')
            setMessage('Drop markdown or TXT files. Rendering never leaves the browser.')
          }}
        >
          Clear text
        </button>
      </div>

      {result && (
        <div className="result-card">
          <div>
            <p className="result-card__label">Generated PDF</p>
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

const buildLines = (content: string, font: PDFFont, fontSize: number, maxWidth: number) => {
  const sanitized = content.replace(/\r/g, '')
  const rawLines = sanitized.split('\n')
  const lines: string[] = []

  const measure = (value: string) => font.widthOfTextAtSize(value, fontSize)

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) {
      lines.push('\u0000')
      continue
    }

    let current = ''
    const words = rawLine.split(/\s+/)

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (measure(candidate) <= maxWidth) {
        current = candidate
        continue
      }

      if (current) {
        lines.push(current)
      }

      if (measure(word) <= maxWidth) {
        current = word
        continue
      }

      let chunk = ''
      for (const char of word) {
        const nextChunk = chunk + char
        if (measure(nextChunk) > maxWidth && chunk) {
          lines.push(chunk)
          chunk = char
        } else {
          chunk = nextChunk
        }
      }
      current = chunk
    }

    if (current) {
      lines.push(current)
    }
  }

  return lines
}

export default TextToPdfConverter
