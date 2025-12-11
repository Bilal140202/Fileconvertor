import { useEffect, useMemo, useState } from 'react'
import ToolSidebar from './components/ToolSidebar'
import ToolWorkspace from './components/ToolWorkspace'
import { quickStartTools, toolRegistry, type ToolDefinition } from './data/toolRegistry'
import './App.css'

const App = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeToolId, setActiveToolId] = useState(toolRegistry[0].id)

  const filteredTools = useMemo(() => {
    if (!searchTerm.trim()) {
      return toolRegistry
    }
    const query = searchTerm.toLowerCase()
    return toolRegistry.filter((tool) => {
      const haystack = `${tool.name} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [searchTerm])

  useEffect(() => {
    if (filteredTools.length === 0) {
      return
    }
    const existsInFiltered = filteredTools.some((tool) => tool.id === activeToolId)
    if (!existsInFiltered) {
      setActiveToolId(filteredTools[0].id)
    }
  }, [filteredTools, activeToolId])

  const activeTool: ToolDefinition | undefined = useMemo(() => {
    return filteredTools.find((tool) => tool.id === activeToolId) ?? filteredTools[0]
  }, [filteredTools, activeToolId])

  const heroLinks = useMemo(() => {
    return quickStartTools
      .map((toolId) => toolRegistry.find((tool) => tool.id === toolId))
      .filter((tool): tool is ToolDefinition => Boolean(tool))
  }, [])

  const workspaceTools = filteredTools.length > 0 ? filteredTools : toolRegistry

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="hero__eyebrow">Private conversion suite</p>
          <h1>Universal file conversion, fully in-browser</h1>
          <p className="hero__description">
            Chain jobs across audio, video, document, and archive workflows without uploading a single byte. Perfect for
            journalists, creators, and privacy-focused teams.
          </p>
          <div className="hero__actions">
            {heroLinks.map((tool) => (
              <button key={tool.id} className="secondary-button" onClick={() => setActiveToolId(tool.id)}>
                {tool.name}
              </button>
            ))}
          </div>
        </div>
        <div className="hero__metrics">
          <div className="metric-card">
            <p className="metric-card__value">0 uploads</p>
            <p className="metric-card__label">Local-only processing</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__value">50+ formats</p>
            <p className="metric-card__label">Images, docs, audio, archives</p>
          </div>
          <div className="metric-card">
            <p className="metric-card__value">Realtime</p>
            <p className="metric-card__label">Latency under 80ms</p>
          </div>
        </div>
      </header>

      <div className="core-layout">
        <ToolSidebar
          tools={filteredTools}
          activeToolId={activeToolId}
          onSelect={setActiveToolId}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />

        {activeTool ? (
          <ToolWorkspace tool={activeTool} availableTools={workspaceTools} onSelectTool={setActiveToolId} />
        ) : (
          <section className="workspace placeholder">
            <div className="placeholder__content">
              <p>No tools match your search yet.</p>
              <button className="secondary-button" onClick={() => setSearchTerm('')}>
                Reset filters
              </button>
            </div>
          </section>
        )}
      </div>

      <section className="promise-grid">
        {[
          {
            title: 'Pixel-perfect fidelity',
            copy: 'Canvas-based rendering maintains sharpness for high-DPI assets and vector-safe PDFs.',
          },
          {
            title: 'Automation ready',
            copy: 'Every tool exposes deterministic settings so you can repeat workflows with confidence.',
          },
          {
            title: 'Secure by design',
            copy: 'No uploads, no waiting. Your files never leave the tab.',
          },
        ].map((item) => (
          <article key={item.title} className="promise-card">
            <h4>{item.title}</h4>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default App
