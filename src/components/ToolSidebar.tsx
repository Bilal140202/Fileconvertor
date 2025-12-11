import { type ChangeEvent, useMemo } from 'react'
import { toolCategories, type ToolCategory, type ToolDefinition } from '../data/toolRegistry'

interface ToolSidebarProps {
  tools: ToolDefinition[]
  activeToolId: string
  onSelect: (toolId: string) => void
  searchTerm: string
  onSearch: (value: string) => void
}

const categoryOrder: ToolCategory[] = ['image', 'document', 'audio', 'archive']

const ToolSidebar = ({ tools, activeToolId, onSelect, searchTerm, onSearch }: ToolSidebarProps) => {
  const grouped = useMemo(() => {
    const bucket = new Map<ToolCategory, ToolDefinition[]>()
    for (const tool of tools) {
      const list = bucket.get(tool.category) ?? []
      list.push(tool)
      bucket.set(tool.category, list)
    }
    return bucket
  }, [tools])

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__search">
        <input type="search" placeholder="Search tools" value={searchTerm} onChange={handleSearch} />
        {searchTerm && (
          <button className="ghost-button" onClick={() => onSearch('')}>
            Clear
          </button>
        )}
      </div>

      {tools.length === 0 && <p className="muted">No tools match your search just yet.</p>}

      {categoryOrder.map((category) => {
        const entries = grouped.get(category)
        if (!entries || entries.length === 0) {
          return null
        }
        const meta = toolCategories[category]
        return (
          <section key={category} className="sidebar__section">
            <div className="sidebar__sectionHeader">
              <div>
                <p className="sidebar__category" style={{ color: meta.accent }}>
                  {meta.label}
                </p>
                <p className="sidebar__description">{meta.description}</p>
              </div>
            </div>
            <ul className="sidebar__list">
              {entries.map((tool) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    className={`sidebar__tool ${tool.id === activeToolId ? 'is-active' : ''}`}
                    onClick={() => onSelect(tool.id)}
                  >
                    <div>
                      <p className="sidebar__toolName">{tool.name}</p>
                      <p className="sidebar__toolMeta">{tool.description}</p>
                      <div className="chip-row">
                        {tool.keywords.slice(0, 3).map((keyword) => (
                          <span key={keyword} className="chip --ghost">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    {tool.badge && <span className="badge">{tool.badge}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </aside>
  )
}

export default ToolSidebar
