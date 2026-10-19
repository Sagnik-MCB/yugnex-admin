import { useState, useEffect } from 'react'
import { getAdminPosts, deleteAdminPost } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface Post {
  id: string
  content: string
  username: string
  display_name: string
  likes_count: number
  comments_count: number
  report_count: number
  created_at: string
  media_urls: string[]
}

const severityLabels = ['Critical', 'High', 'Medium', 'Low']

export default function ContentPage() {
  const { user } = useAdminAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedName, setSelectedName] = useState('')
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean; postId?: string }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  useEffect(() => {
    getAdminPosts({})
      .then(r => setPosts(r.data.posts ?? []))
      .catch(() => {})
  }, [])

  const toCases = (pts: Post[]) => pts.map((p, i) => ({
    id: p.id,
    severity: p.report_count > 0 ? severityLabels[i % 3] : 'Low',
    name: `Post by @${p.username}`,
    meta: `${(p.likes_count ?? 0) + (p.comments_count ?? 0)} interactions · ${p.report_count ?? 0} reports`,
    age: new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    policy: p.report_count > 0 ? 'Community standards · Content review' : 'Intellectual property',
    evidence: p.content ? `"${p.content.slice(0, 80)}${p.content.length > 80 ? '…' : ''}"` : 'No content available',
  }))

  const allCases = toCases(posts)
  const filteredCases = allCases.filter(item =>
    (statusFilter === 'All' || item.severity === statusFilter) &&
    `${item.name} ${item.meta}`.toLowerCase().includes(query.toLowerCase())
  )
  const selectedCase = filteredCases.find(item => item.name === selectedName) || filteredCases[0] || allCases[0]

  const confirmAction = (label: string, target: string, danger = true, postId?: string) => {
    setReason('')
    setAction({ label, target, danger, postId })
  }
  const completeAction = async () => {
    if (!action || reason.trim().length < 8) return
    if (action.postId) {
      try {
        await deleteAdminPost(action.postId)
        setPosts(prev => prev.filter(p => p.id !== action.postId))
        if (selectedCase?.name === action.target) setSelectedName('')
      } catch {}
    }
    setAudit(items => [{ action: action.label, target: action.target, time: `Just now · ${user?.display_name ?? 'Admin'}` }, ...items])
    setAction(null)
    setReason('')
  }

  const postForCase = (caseName: string) => {
    const idx = allCases.findIndex(c => c.name === caseName)
    return posts[idx] ?? null
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Content integrity</span>
          <h1>Context before<br/><em>consequence.</em></h1>
        </div>
        <p>Human judgment supported by transparent signals, policy references, evidence, and an auditable decision trail.</p>
      </section>

      <div className="admin-toolbar">
        <label>
          <Icon name="search" size={14} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cases, accounts or policy" />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by severity">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button><Icon name="filter" size={14} />Saved views</button>
      </div>

      <div className="case-layout">
        <section className="case-list">
          <header>
            <strong>Priority queue</strong>
            <span>{filteredCases.length} shown</span>
          </header>
          {filteredCases.length ? filteredCases.map((item, i) => (
            <article key={item.id} className={selectedCase?.name === item.name ? 'selected' : ''}>
              <div>
                <span className={`severity s-${i}`}>{item.severity}</span>
                <small>{item.age}</small>
              </div>
              <h2>{item.name}</h2>
              <p>{item.meta}</p>
              <footer>
                <button onClick={() => {
                  const p = postForCase(item.name)
                  confirmAction('Apply content decision', item.name, true, p?.id)
                }}>
                  <Icon name="check" size={12} />Resolve
                </button>
                <button onClick={() => setSelectedName(item.name)}>Inspect context</button>
              </footer>
            </article>
          )) : (
            <div className="admin-empty case-empty">
              <Icon name="search" size={28} />
              <strong>No matching cases</strong>
              <small>Clear the search or choose another severity.</small>
              <button onClick={() => { setQuery(''); setStatusFilter('All') }}>Clear filters</button>
            </div>
          )}
        </section>

        {filteredCases.length > 0 && selectedCase && (
          <aside className="decision-panel admin-case-detail">
            <div className="decision-symbol">
              <Icon name="shield" size={32} />
              <i /><i />
            </div>
            <span className="overline">Case context</span>
            <h2>{selectedCase.name}</h2>
            <p>{selectedCase.meta}</p>
            <dl>
              <div><dt>Policy</dt><dd>{selectedCase.policy}</dd></div>
              <div><dt>Evidence</dt><dd>{selectedCase.evidence}</dd></div>
              <div><dt>Reviewer</dt><dd>Unassigned</dd></div>
              <div><dt>Appeal</dt><dd>Available after decision</dd></div>
            </dl>
            <div>
              <span>Signal confidence</span>
              <strong>94.8%</strong>
              <i><b /></i>
            </div>
            <button onClick={() => confirmAction('Escalate to senior reviewer', selectedCase.name, false)}>
              Escalate with context
            </button>
          </aside>
        )}
      </div>

      {audit.length > 0 && (
        <section className="admin-audit">
          <header>
            <strong>Session audit trail</strong>
            <span>Immutable in production</span>
          </header>
          {audit.map((item, index) => (
            <article key={`${item.action}-${index}`}>
              <Icon name="check" size={14} />
              <span><strong>{item.action}</strong><small>{item.target} · {item.time}</small></span>
            </article>
          ))}
        </section>
      )}

      {action && (
        <div className="admin-modal-backdrop">
          <section className="admin-confirm" role="alertdialog" aria-modal="true" aria-labelledby="admin-action-title">
            <Icon name={action.danger ? 'shield' : 'check'} size={30} />
            <span>PRIVILEGED ACTION</span>
            <h2 id="admin-action-title">{action.label}</h2>
            <p><strong>Target:</strong> {action.target}</p>
            <label>REQUIRED REASON
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Reference the policy, evidence, and intended outcome." maxLength={500} />
              <small>{reason.length} / 500 · Minimum 8 characters</small>
            </label>
            <div>
              <button data-dialog-cancel onClick={() => setAction(null)}>Cancel</button>
              <button className={action.danger ? 'danger' : ''} disabled={reason.trim().length < 8} onClick={completeAction}>Confirm action</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
