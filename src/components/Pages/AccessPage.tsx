import { useState, useEffect } from 'react'
import { getAdminAccess, updateAdminAccess } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface AdminUser {
  id: number
  username: string
  display_name: string | null
  email: string | null
  is_admin: boolean
  is_verified: boolean
  is_banned: boolean
  pro_tier: string
  created_at: string
  posts_count: number
  last_active: string | null
}

interface AccessMetrics {
  total_admins: number
  banned_users: number
  elevated_users: number
}

export default function AccessPage() {
  const { user } = useAdminAuth()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [metrics, setMetrics] = useState<AccessMetrics>({ total_admins: 0, banned_users: 0, elevated_users: 0 })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [action, setAction] = useState<null | { label: string; target: string; danger: boolean; userId?: number; patch?: Record<string, unknown> }>(null)
  const [reason, setReason] = useState('')
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  const load = () => {
    getAdminAccess()
      .then(r => {
        setAdmins(r.data.admins ?? [])
        setMetrics(r.data.metrics ?? { total_admins: 0, banned_users: 0, elevated_users: 0 })
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const toRecord = (u: AdminUser) => ({
    name: u.display_name || `@${u.username}`,
    meta: `Super admin · @${u.username}`,
    status: u.is_banned ? 'Suspended' : 'Active',
    signal: u.is_verified ? 'Verified' : 'Unverified',
    detail: `Email: ${u.email ?? '—'} · Tier: ${u.pro_tier} · Posts: ${u.posts_count} · Joined: ${new Date(u.created_at).toLocaleDateString('en-IN')}${u.last_active ? ` · Last active: ${new Date(u.last_active).toLocaleString('en-IN')}` : ''}`,
    id: u.id,
  })

  const allRecords = admins
    .map(toRecord)
    .filter(item =>
      (statusFilter === 'All' || item.status === statusFilter) &&
      `${item.name} ${item.meta} ${item.signal}`.toLowerCase().includes(query.toLowerCase())
    )

  const selected = allRecords.find(r => r.id === selectedId) || allRecords[0]
  const statuses = ['All', ...Array.from(new Set(admins.map(u => u.is_banned ? 'Suspended' : 'Active')))]

  const displayMetrics: [string, string, string][] = [
    ['Privileged users', metrics.total_admins.toString(), 'Admin accounts'],
    ['Elevated accounts', metrics.elevated_users.toString(), 'Non-free tier'],
    ['Access reviews', metrics.banned_users.toString(), 'Suspended users'],
  ]

  const availableActions = ['Grant temporary access', 'Revoke sessions', 'Reduce role', 'Approve access review']

  const confirmAction = (label: string, target: string, danger = true, userId?: number, patch?: Record<string, unknown>) => {
    setReason('')
    setAction({ label, target, danger, userId, patch })
  }
  const completeAction = async () => {
    if (!action || reason.trim().length < 8) return
    if (action.userId && action.patch) {
      try {
        await updateAdminAccess(String(action.userId), action.patch as { is_admin?: boolean; is_banned?: boolean })
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
          <span className="overline">Privileged access</span>
          <h1>Access,<br/><em>least privileged.</em></h1>
        </div>
        <p>Administer roles, approvals, temporary elevation, session revocation, and periodic access reviews.</p>
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
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search access" />
        </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter access by status">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button><Icon name="bookmark" size={14} />Save view</button>
      </div>

      <div className="admin-operations">
        <section className="admin-records" aria-label="Access records">
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
                    label === 'Reduce role' ? { is_admin: false } :
                    label === 'Revoke sessions' ? { is_banned: true } :
                    label === 'Approve access review' ? { is_banned: false } : {}
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
