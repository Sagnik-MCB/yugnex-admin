import { useState, useEffect } from 'react'
import { getAdminCreators } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface Creator {
  id: string
  username: string
  display_name: string
  total_tips_inr: number
  subscriber_count: number
  pending_payouts: number
  is_verified: boolean
}

const staticMetrics: [string, string, string][] = [
  ['Eligible creators', '84.2k', '+4.8%'],
  ['Payout holds', '28', '₹14.8L'],
  ['Verification queue', '142', 'Median 6h'],
]

const staticActions = ['Approve verification', 'Hold monetization', 'Release payout', 'Request documents']

export default function CreatorsPage() {
  const { user } = useAdminAuth()
  const [creators, setCreators] = useState<Creator[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedName, setSelectedName] = useState('')
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  useEffect(() => {
    getAdminCreators().then(r => setCreators(r.data.creators ?? [])).catch(() => {})
  }, [])

  const toRecord = (c: Creator) => ({
    name: c.display_name || `@${c.username}`,
    meta: `${c.is_verified ? 'Verified · ' : ''}@${c.username}`,
    status: c.pending_payouts > 0 ? 'Review' : c.is_verified ? 'Eligible' : 'Applicant',
    signal: `₹${(c.total_tips_inr ?? 0).toLocaleString()} earned`,
    detail: `Subscribers: ${c.subscriber_count ?? 0} · Tips: ₹${(c.total_tips_inr ?? 0).toLocaleString()} · Pending: ${c.pending_payouts ?? 0}`,
  })

  const allRecords = creators.map(toRecord)
  const records = allRecords.filter(item =>
    (statusFilter === 'All' || item.status === statusFilter) &&
    `${item.name} ${item.meta} ${item.signal}`.toLowerCase().includes(query.toLowerCase())
  )
  const selected = records.find(item => item.name === selectedName) || records[0] || allRecords[0]
  const statuses = ['All', ...Array.from(new Set(allRecords.map(item => item.status)))]

  const confirmAction = (label: string, target: string, danger = true) => { setReason(''); setAction({ label, target, danger }) }
  const completeAction = () => {
    if (!action || reason.trim().length < 8) return
    setAudit(items => [{ action: action.label, target: action.target, time: `Just now · ${user?.display_name ?? 'Admin'}` }, ...items])
    setAction(null)
    setReason('')
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Creative economy</span>
          <h1>Creators,<br/><em>sustainably.</em></h1>
        </div>
        <p>Manage verification, monetization, partnerships, policy standing, and payouts with transparent eligibility.</p>
      </section>

      <div className="admin-summary">
        {staticMetrics.map(item => (
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search creators" />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter creators by status">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button><Icon name="bookmark" size={14} />Save view</button>
      </div>

      <div className="admin-operations">
        <section className="admin-records" aria-label="Creators records">
          <header><span>Record</span><span>Status</span><span>Signal</span><span /></header>
          {records.length ? records.map((item, index) => (
            <button key={item.name} className={selected?.name === item.name ? 'selected' : ''} onClick={() => setSelectedName(item.name)}>
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
              {staticActions.map((label, index) => (
                <button key={label} onClick={() => confirmAction(label, selected.name, index > 0)}>
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
