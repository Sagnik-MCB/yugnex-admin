import { useState, useEffect } from 'react'
import { getAdminCommunities } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface Community {
  id: string
  name: string
  description: string
  owner_username: string
  subscribers_count: number
  posts_count: number
  is_verified: boolean
}

const staticMetrics: [string, string, string][] = [
  ['Active spaces', '284k', '+8.2%'],
  ['Admin disputes', '32', '8 urgent'],
  ['Restricted groups', '18', '0.006%'],
]

const staticActions = ['Change ownership', 'Restrict community', 'Remove administrator', 'Approve appeal']

export default function CommunitiesPage() {
  const { user } = useAdminAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedName, setSelectedName] = useState('')
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  useEffect(() => {
    getAdminCommunities().then(r => setCommunities(r.data.communities ?? [])).catch(() => {})
  }, [])

  const toRecord = (c: Community) => ({
    name: c.name,
    meta: `owner: @${c.owner_username} · ${(c.subscribers_count ?? 0).toLocaleString()} members`,
    status: c.is_verified ? 'Healthy' : 'Review',
    signal: `${c.posts_count ?? 0} posts`,
    detail: `Owner: @${c.owner_username} · Members: ${(c.subscribers_count ?? 0).toLocaleString()} · Posts: ${c.posts_count ?? 0} · ${c.description || 'No description'}`,
  })

  const allRecords = communities.map(toRecord)
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
          <span className="overline">Collective safety</span>
          <h1>Communities,<br/><em>responsibly.</em></h1>
        </div>
        <p>Resolve ownership, administrator, coordinated-abuse, membership, and channel-policy issues.</p>
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search communities" />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter communities by status">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button><Icon name="bookmark" size={14} />Save view</button>
      </div>

      <div className="admin-operations">
        <section className="admin-records" aria-label="Communities records">
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
