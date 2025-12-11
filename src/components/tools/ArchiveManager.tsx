import { type ChangeEvent, useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { formatBytes } from '../../utils/file'

type OperationState = 'idle' | 'processing' | 'done' | 'error'

interface GeneratedArchive {
  url: string
  name: string
  size: number
}

interface ExtractedFileInfo {
  name: string
  size: number
  url: string
}

const ArchiveManager = () => {
  const [files, setFiles] = useState<File[]>([])
  const [archiveName, setArchiveName] = useState('compressed.zip')
  const [archiveResult, setArchiveResult] = useState<GeneratedArchive | null>(null)
  const [archiveStatus, setArchiveStatus] = useState<OperationState>('idle')
  const [archiveMessage, setArchiveMessage] = useState('Bundle multiple files without leaving your browser.')

  const [zipFile, setZipFile] = useState<File | null>(null)
  const [extractedFiles, setExtractedFiles] = useState<ExtractedFileInfo[]>([])
  const [extractStatus, setExtractStatus] = useState<OperationState>('idle')
  const [extractMessage, setExtractMessage] = useState('Drop archives up to 200 MB for instant access.')

  useEffect(() => {
    return () => {
      if (archiveResult?.url) {
        URL.revokeObjectURL(archiveResult.url)
      }
    }
  }, [archiveResult])

  useEffect(() => {
    return () => {
      extractedFiles.forEach((file) => URL.revokeObjectURL(file.url))
    }
  }, [extractedFiles])

  const archiveStatusLabel = useMemo(() => {
    switch (archiveStatus) {
      case 'processing':
        return 'Processing'
      case 'done':
        return 'Ready'
      case 'error':
        return 'Needs attention'
      default:
        return 'Idle'
    }
  }, [archiveStatus])

  const extractStatusLabel = useMemo(() => {
    switch (extractStatus) {
      case 'processing':
        return 'Processing'
      case 'done':
        return 'Ready'
      case 'error':
        return 'Needs attention'
      default:
        return 'Idle'
    }
  }, [extractStatus])

  const onFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    setFiles(selectedFiles)
    setArchiveStatus('idle')
    setArchiveMessage(`${selectedFiles.length} file(s) selected.`)
  }

  const buildArchiveName = () => {
    if (!archiveName.trim()) {
      return 'compressed.zip'
    }
    return archiveName.trim().toLowerCase().endsWith('.zip') ? archiveName.trim() : `${archiveName.trim()}.zip`
  }

  const compress = async () => {
    if (!files.length) {
      setArchiveStatus('error')
      setArchiveMessage('Choose at least one file to continue.')
      return
    }

    setArchiveStatus('processing')
    setArchiveMessage('Packaging files locally...')

    try {
      const zip = new JSZip()
      files.forEach((file) => zip.file(file.name, file))
      const blob = await zip.generateAsync({ type: 'blob' })
      const name = buildArchiveName()
      const url = URL.createObjectURL(blob)

      setArchiveResult({ url, name, size: blob.size })
      setArchiveStatus('done')
      setArchiveMessage('Archive ready. Download below.')
    } catch (error) {
      console.error(error)
      setArchiveStatus('error')
      setArchiveMessage('Unable to compress these files. Try fewer or smaller assets.')
    }
  }

  const clearCompression = () => {
    setFiles([])
    setArchiveResult((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url)
      }
      return null
    })
    setArchiveStatus('idle')
    setArchiveMessage('Bundle multiple files without leaving your browser.')
  }

  const onArchiveUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? []
    if (!file) {
      return
    }
    setZipFile(file)
    setExtractStatus('idle')
    setExtractMessage(`${file.name} loaded. Extract when ready.`)
  }

  const extractArchive = async () => {
    if (!zipFile) {
      setExtractStatus('error')
      setExtractMessage('Select a .zip archive to extract.')
      return
    }

    setExtractStatus('processing')
    setExtractMessage('Decoding archive locally...')

    try {
      const zip = await JSZip.loadAsync(zipFile)
      const entries = Object.keys(zip.files)
      const extracted: ExtractedFileInfo[] = []

      for (const name of entries) {
        const entry = zip.files[name]
        if (!entry || entry.dir) {
          continue
        }
        const blob = await entry.async('blob')
        const url = URL.createObjectURL(blob)
        extracted.push({ name, size: blob.size, url })
      }

      if (!extracted.length) {
        setExtractStatus('error')
        setExtractMessage('No files found in this archive.')
        return
      }

      setExtractedFiles(extracted)
      setExtractStatus('done')
      setExtractMessage('Files ready. Download individual items below.')
    } catch (error) {
      console.error(error)
      setExtractedFiles([])
      setExtractStatus('error')
      setExtractMessage('Unable to open this archive. It may be encrypted or corrupted.')
    }
  }

  const clearExtraction = () => {
    setZipFile(null)
    setExtractedFiles([])
    setExtractStatus('idle')
    setExtractMessage('Drop archives up to 200 MB for instant access.')
  }

  return (
    <div className="split-grid">
      <section className="tool-surface">
        <h3>Create archive</h3>
        <p className="muted">Build lightweight ZIP files on the fly.</p>
        <div className="control">
          <label htmlFor="archive-files">Choose files</label>
          <input id="archive-files" type="file" multiple onChange={onFileSelection} />
        </div>
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className="subtle">{formatBytes(item.size)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="control">
          <label>Archive name</label>
          <input value={archiveName} onChange={(event) => setArchiveName(event.target.value)} />
        </div>
        <div className="action-row">
          <div className="status-pill" data-state={archiveStatus}>
            <span className="dot" />
            {archiveStatusLabel}
          </div>
          <p className="muted">{archiveMessage}</p>
        </div>
        <div className="action-buttons">
          <button className="primary-button" onClick={compress} disabled={!files.length || archiveStatus === 'processing'}>
            Create archive
          </button>
          <button className="ghost-button" onClick={clearCompression} disabled={!files.length && !archiveResult}>
            Clear
          </button>
        </div>
        {archiveResult && (
          <div className="result-card">
            <div>
              <p className="result-card__label">Archive</p>
              <h4>{archiveResult.name}</h4>
              <p className="subtle">{formatBytes(archiveResult.size)}</p>
            </div>
            <a className="primary-button" href={archiveResult.url} download={archiveResult.name}>
              Download
            </a>
          </div>
        )}
      </section>

      <section className="tool-surface">
        <h3>Extract archive</h3>
        <p className="muted">Open ZIP archives offline and grab only the files you need.</p>
        <div className="control">
          <label htmlFor="zip-import">Upload ZIP file</label>
          <input id="zip-import" type="file" accept=".zip" onChange={onArchiveUpload} />
        </div>
        {zipFile && (
          <p className="subtle">
            {zipFile.name} • {formatBytes(zipFile.size)}
          </p>
        )}
        <div className="action-row">
          <div className="status-pill" data-state={extractStatus}>
            <span className="dot" />
            {extractStatusLabel}
          </div>
          <p className="muted">{extractMessage}</p>
        </div>
        <div className="action-buttons">
          <button className="primary-button" onClick={extractArchive} disabled={!zipFile || extractStatus === 'processing'}>
            Extract files
          </button>
          <button className="ghost-button" onClick={clearExtraction} disabled={!zipFile && !extractedFiles.length}>
            Reset
          </button>
        </div>
        {extractedFiles.length > 0 && (
          <div className="file-grid">
            {extractedFiles.map((file) => (
              <div key={file.url} className="file-card">
                <div>
                  <p>{file.name}</p>
                  <p className="subtle">{formatBytes(file.size)}</p>
                </div>
                <a className="secondary-button" href={file.url} download={file.name}>
                  Save
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default ArchiveManager
