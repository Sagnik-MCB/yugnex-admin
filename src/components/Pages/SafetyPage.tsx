import { useState, useEffect } from 'react'
import { getAdminReports, resolveReport } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface Report {
  id: string
  post_id: string
  post_content: string
  post_author: string
  reporter_username: string
  reported_at: string
  resolved_at: string | null
}

const severityLabels = ['Critical', 'High', 'Medium', 'Low']

export default function SafetyPage() {
  const { user } = useAdminAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedName, setSelectedName] = useState('')
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean; reportId?: string; apiAction?: string }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  useEffect(() => {
    getAdminReports({ status: 'pending' })
      .then(r => setReports(r.data.reports ?? []))
      .catch(() => {})
  }, [])

  const toCases = (rpts: Report[]) => rpts.map((r, i) => ({
    id: r.id,
    severity: severityLabels[i % 4],
    name: `Reported post by @${r.post_author}`,
    meta: `Reporter: @${r.reporter_username}`,
    age: new Date(r.reported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    policy: 'Community standards · Content review',
    evidence: r.post_content ? `"${r.post_content.slice(0, 80)}${r.post_content.length > 80 ? '…' : ''}"` : 'No content available',
  }))

  const allCases = toCases(reports)
  const filteredCases = allCases.filter(item =>
    (statusFilter === 'All' || item.severity === statusFilter) &&
    `${item.name} ${item.meta}`.toLowerCase().includes(query.toLowerCase())
  )
  const selectedCase = filteredCases.find(item => item.name === selectedName) || filteredCases[0] || allCases[0]

  const confirmAction = (label: string, target: string, danger = true, reportId?: string, apiAction?: string) => {
    setReason('')
    setAction({ label, target, danger, reportId, apiAction })
  }
  const completeAction = async () => {
    if (!action || reason.trim().length < 8) return
    if (action.reportId && action.apiAction) {
      try {
        await resolveReport(action.reportId, { action: action.apiAction })
        setReports(prev => prev.filter(r => r.id !== action.reportId))
        if (selectedCase?.name === action.target) setSelectedName('')
      } catch {}
    }
    setAudit(items => [{ action: action.label, target: action.target, time: `Just now · ${user?.display_name ?? 'Admin'}` }, ...items])
    setAction(null)
    setReason('')
  }

  const reportForCase = (caseName: string) => {
    const idx = allCases.findIndex(c => c.name === caseName)
    return reports[idx] ?? null
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Trust &amp; safety</span>
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
                <button onClick={() => confirmAction('Resolve safety case', item.name, true, item.id, 'remove')}>
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
            <button onClick={() => {
              const r = reportForCase(selectedCase.name)
              confirmAction('Escalate to senior reviewer', selectedCase.name, false, r?.id, 'escalate')
            }}>
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
