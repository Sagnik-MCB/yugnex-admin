import { useState, useEffect } from 'react'
import { getAdminSupport, updateAdminTicket } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface Ticket {
  id: number
  subject: string
  category: string
  status: string
  priority: string
  notes: string | null
  created_at: string
  resolved_at: string | null
  username: string | null
  display_name: string | null
  agent_username: string | null
  agent_name: string | null
}

interface SupportMetrics {
  open: number
  sla_risk: number
  avg_resolution_min: number
}

export default function SupportPage() {
  const { user } = useAdminAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [metrics, setMetrics] = useState<SupportMetrics>({ open: 0, sla_risk: 0, avg_resolution_min: 0 })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean; ticketId?: number; patch?: Record<string, unknown> }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  const load = () => {
    getAdminSupport({ q: query || undefined, status: statusFilter !== 'All' ? statusFilter : undefined })
      .then(r => {
        setTickets(r.data.tickets ?? [])
        setMetrics(r.data.metrics ?? { open: 0, sla_risk: 0, avg_resolution_min: 0 })
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [query, statusFilter])

  const toRecord = (t: Ticket) => ({
    name: `SUP-${t.id}`,
    meta: `${t.subject}${t.username ? ` · ${t.display_name ?? t.username}` : ''}`,
    status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
    signal: t.priority,
    detail: `Category: ${t.category} · Priority: ${t.priority}${t.agent_name ? ` · Agent: ${t.agent_name}` : ' · Unassigned'}${t.notes ? ` · ${t.notes}` : ''}`,
    id: t.id,
  })

  const allRecords = tickets.map(toRecord)
  const selected = allRecords.find(r => r.id === selectedId) || allRecords[0]
  const statuses = ['All', ...Array.from(new Set(tickets.map(t => t.status.charAt(0).toUpperCase() + t.status.slice(1))))]

  const avgTime = metrics.avg_resolution_min >= 60
    ? `${Math.floor(metrics.avg_resolution_min / 60)}h ${metrics.avg_resolution_min % 60}m`
    : `${metrics.avg_resolution_min}m`

  const displayMetrics: [string, string, string][] = [
    ['Open tickets', metrics.open.toLocaleString(), `${metrics.sla_risk} SLA risk`],
    ['First response', avgTime, 'Avg resolution'],
    ['SLA at risk', metrics.sla_risk.toString(), `${metrics.sla_risk > 0 ? 'Needs attention' : 'On target'}`],
  ]

  const availableActions = ['Assign to me', 'Send response', 'Escalate ticket', 'Resolve ticket']

  const confirmAction = (label: string, target: string, danger = true, ticketId?: number, patch?: Record<string, unknown>) => {
    setReason('')
    setAction({ label, target, danger, ticketId, patch })
  }
  const completeAction = async () => {
    if (!action || reason.trim().length < 8) return
    if (action.ticketId && action.patch) {
      try {
        await updateAdminTicket(String(action.ticketId), action.patch)
        load()
      } catch {}
    }
    setAudit(items => [{ action: action.label, target: action.target, time: `Just now · ${user?.display_name ?? 'Admin'}` }, ...items])
    setAction(null)
    setReason('')
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Customer care</span>
          <h1>Support,<br/><em>with ownership.</em></h1>
        </div>
        <p>Manage tickets, assignment, SLAs, customer history, internal notes, escalation, and responses.</p>
      </section>

      <div className="admin-summary">
        {displayMetrics.map(item => (
          <article key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
            <small>{item[2]}</small>
          </article>
        ))}
      </div>

      <div className="admin-toolbar">
        <label>
          <Icon name="search" size={14} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search support" />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter support by status">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button><Icon name="bookmark" size={14} />Save view</button>
      </div>

      <div className="admin-operations">
        <section className="admin-records" aria-label="Support records">
          <header><span>Record</span><span>Status</span><span>Signal</span><span /></header>
          {allRecords.length ? allRecords.map((item, index) => (
            <button key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}>
              <span>
                <span className={`person tone-${index % 5}`}>{item.name.charAt(0)}</span>
                <span><strong>{item.name}</strong><small>{item.meta}</small></span>
              </span>
              <b>{item.status}</b>
              <em>{item.signal}</em>
              <Icon name="arrow" size={14} />
            </button>
          )) : (
            <div className="admin-empty">
              <Icon name="search" size={28} />
              <strong>No matching records</strong>
              <small>Clear the search or choose another status.</small>
              <button onClick={() => { setQuery(''); setStatusFilter('All') }}>Clear filters</button>
            </div>
          )}
        </section>

        {selected && (
          <aside className="admin-inspector">
            <span>INSPECTING</span>
            <h2>{selected.name}</h2>
            <p>{selected.meta}</p>
            <div className="inspector-status">
              <b>{selected.status}</b>
              <strong>{selected.signal}</strong>
            </div>
            <section>
              <span>CONTEXT</span>
              <p>{selected.detail}</p>
            </section>
            <section>
              <span>AVAILABLE ACTIONS</span>
              {availableActions.map((label, index) => (
                <button key={label} onClick={() => {
                  const patch =
                    label === 'Assign to me' ? { agent_id: user?.id } :
                    label === 'Escalate ticket' ? { status: 'escalated', priority: 'high' } :
                    label === 'Resolve ticket' ? { resolved: true } : {}
                  confirmAction(label, selected.name, index > 0, selected.id, patch)
                }}>
                  <Icon name={index === 0 ? 'check' : index === 1 ? 'shield' : 'settings'} size={14} />
                  <span>{label}</span>
                  <Icon name="arrow" size={14} />
                </button>
              ))}
            </section>
          </aside>
        )}
      </div>

      <section className="admin-audit">
        <header>
          <strong>Session audit trail</strong>
          <span>{audit.length} actions · {user?.display_name ?? 'Admin'}</span>
        </header>
        {audit.length ? audit.map((item, index) => (
          <article key={`${item.action}-${index}`}>
            <Icon name="check" size={14} />
            <span><strong>{item.action}</strong><small>{item.target} · {item.time}</small></span>
          </article>
        )) : <p>No privileged actions in this session.</p>}
      </section>

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
