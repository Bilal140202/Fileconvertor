import { useMemo } from 'react'
import { toolCategories, type ToolDefinition } from '../data/toolRegistry'

interface ToolWorkspaceProps {
  tool: ToolDefinition
  availableTools: ToolDefinition[]
  onSelectTool: (toolId: string) => void
}

const ToolWorkspace = ({ tool, availableTools, onSelectTool }: ToolWorkspaceProps) => {
  const ToolComponent = tool.component
  const meta = toolCategories[tool.category]

  const recommendations = useMemo(() => {
    return availableTools.filter((entry) => entry.id !== tool.id).slice(0, 3)
  }, [availableTools, tool.id])

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="workspace__category" style={{ color: meta.accent }}>
            {meta.label}
          </p>
          <h2>{tool.name}</h2>
          <p className="workspace__description">{tool.description}</p>
          <div className="chip-row">
            {tool.keywords.map((keyword) => (
              <span key={keyword} className="chip --ghost">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="workspace__body">
        <div className="workspace__primary">
          <ToolComponent />
        </div>
        <div className="workspace__secondary">
          {tool.highlights.length > 0 && (
            <div className="info-card">
              <p className="info-card__label">Why creators love it</p>
              <ul>
                {tool.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="info-card">
            <p className="info-card__label">Workflow</p>
            <ol>
              {tool.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          {recommendations.length > 0 && (
            <div className="info-card">
              <p className="info-card__label">Need another tool?</p>
              <div className="chip-column">
                {recommendations.map((entry) => (
                  <button key={entry.id} className="chip --action" type="button" onClick={() => onSelectTool(entry.id)}>
                    {entry.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ToolWorkspace
