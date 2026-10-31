import { useState, useEffect } from 'react'
import { getRecoveryRequests, resolveRecoveryRequest } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

interface RecoveryRequest {
  id: string
  user_id: number | null
  contact_identifier: string
  recovery_type: string
  status: 'pending' | 'approved' | 'rejected'
  selfie_url: string | null
  notes: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: number | null
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--amber, #f59e0b)',
  approved: 'var(--green, #22c55e)',
  rejected: 'var(--red, #ef4444)',
}

export default function RecoveryPage() {
  const { user } = useAdminAuth()
  const [requests, setRequests] = useState<RecoveryRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [action, setAction] = useState<null | { type: 'approve' | 'reject'; requestId: string }>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [audit, setAudit] = useState<{ action: string; target: string; time: string }[]>([])

  const load = (status: string) => {
    setLoading(true)
    getRecoveryRequests({ status })
      .then(r => {
        setRequests(r.data.requests ?? [])
        setSelectedId(null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  const selected = requests.find(r => r.id === selectedId) ?? requests[0] ?? null

  const handleAction = (type: 'approve' | 'reject', requestId: string) => {
    setNotes('')
    setAction({ type, requestId })
  }

  const confirmAction = async () => {
    if (!action) return
    setSubmitting(true)
    try {
      await resolveRecoveryRequest(action.requestId, { action: action.type, notes })
      const req = requests.find(r => r.id === action.requestId)
      setAudit(prev => [{
        action: action.type === 'approve' ? 'Approved recovery' : 'Rejected recovery',
        target: req?.contact_identifier ?? action.requestId,
        time: `Just now · ${user?.display_name ?? 'Admin'}`,
      }, ...prev])
      setRequests(prev => prev.filter(r => r.id !== action.requestId))
      if (selectedId === action.requestId) setSelectedId(null)
      setAction(null)
    } catch (ex: any) {
      alert(ex.response?.data?.detail ?? 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Identity recovery</span>
          <h1>Account recovery<br/><em>requests.</em></h1>
        </div>
        <p>Review video selfie submissions and approve or reject account recovery attempts.</p>
      </section>

      {/* Filter tabs */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={statusFilter === s ? 'active' : ''} onClick={() => setStatusFilter(s)}
            style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="admin-split">
        {/* Left — list */}
        <div className="admin-list">
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txM)' }}>Loading…</div>
          )}
          {!loading && requests.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--txM)' }}>
              No {statusFilter} requests.
            </div>
          )}
          {requests.map(req => (
            <button key={req.id} className={`admin-list-item${selected?.id === req.id ? ' active' : ''}`}
              onClick={() => setSelectedId(req.id)}>
              <div className="admin-list-item-main">
                <span className="admin-list-item-title">{req.contact_identifier || `User #${req.user_id}`}</span>
                <span className="admin-list-item-meta">
                  {req.recovery_type.replace('_', ' ')} · {fmt(req.created_at)}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLOR[req.status] ?? 'var(--txM)', flexShrink: 0 }}>
                {req.status}
              </span>
            </button>
          ))}
        </div>

        {/* Right — detail */}
        <div className="admin-detail">
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--txM)', flexDirection: 'column', gap: 8 }}>
              <Icon name="camera" size={32} />
              <p style={{ margin: 0, fontSize: 13 }}>Select a request to review</p>
            </div>
          ) : (
            <>
              <div className="admin-detail-header">
                <div>
                  <h2>{selected.contact_identifier || `User #${selected.user_id}`}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--txS)' }}>
                    {selected.recovery_type.replace(/_/g, ' ')} · Submitted {fmt(selected.created_at)}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: STATUS_COLOR[selected.status] ?? 'var(--txM)', padding: '4px 10px', borderRadius: 20, border: `1px solid ${STATUS_COLOR[selected.status] ?? 'var(--bd)'}` }}>
                  {selected.status}
                </span>
              </div>

              {/* Selfie media */}
              {selected.selfie_url ? (
                <div style={{ margin: '16px 0' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--txS)', margin: '0 0 8px' }}>Submitted media</p>
                  {selected.selfie_url.match(/\.(mp4|mov|webm|ogg)$/i) ? (
                    <video src={selected.selfie_url} controls
                      style={{ width: '100%', borderRadius: 12, maxHeight: 300, background: '#000' }} />
                  ) : (
                    <img src={selected.selfie_url} alt="Selfie submission"
                      style={{ width: '100%', borderRadius: 12, maxHeight: 300, objectFit: 'cover' }} />
                  )}
                  <a href={selected.selfie_url} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'var(--blue)' }}>
                    Open original ↗
                  </a>
                </div>
              ) : (
                <div style={{ margin: '16px 0', padding: '20px', background: 'var(--sf)', borderRadius: 12, textAlign: 'center', color: 'var(--txM)', fontSize: 13, border: '1px dashed var(--bd)' }}>
                  No media attached
                </div>
              )}

              {/* User notes */}
              {selected.notes && (
                <div style={{ margin: '0 0 16px', padding: '12px 14px', background: 'var(--sf)', borderRadius: 10, border: '1px solid var(--bd)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--txS)' }}>User notes</p>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--tx)' }}>{selected.notes}</p>
                </div>
              )}

              {/* Resolution info */}
              {selected.status !== 'pending' && (
                <div style={{ margin: '0 0 16px', padding: '12px 14px', background: 'var(--sf)', borderRadius: 10, border: `1px solid ${STATUS_COLOR[selected.status]}` }}>
                  <p style={{ margin: '0 0 2px', fontSize: 12, color: STATUS_COLOR[selected.status], fontWeight: 700 }}>
                    {selected.status === 'approved' ? 'Approved' : 'Rejected'} {fmt(selected.resolved_at)}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {selected.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
                  <button onClick={() => handleAction('approve', selected.id)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--green, #22c55e)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    <Icon name="check" size={14} /> Approve
                  </button>
                  <button onClick={() => handleAction('reject', selected.id)}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--red, #ef4444)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    <Icon name="close" size={14} /> Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Audit log */}
      {audit.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--txS)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Session audit log
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {audit.map((entry, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--sf)', borderRadius: 10, border: '1px solid var(--bd)' }}>
                <Icon name="check" size={14} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{entry.action}</span>
                  <span style={{ color: 'var(--txS)', fontSize: 13 }}> — {entry.target}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--txM)' }}>{entry.time}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirm modal */}
      {action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: 360, maxWidth: '90vw', border: '1px solid var(--bd)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>
              {action.type === 'approve' ? 'Approve recovery' : 'Reject recovery'}
            </h3>
            <p style={{ color: 'var(--txS)', fontSize: 13, margin: '0 0 16px' }}>
              {action.type === 'approve'
                ? 'The user will be notified and can set a new password.'
                : 'The user will be notified that their request was denied.'}
            </p>
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--cd)', border: '1px solid var(--bd)', borderRadius: 10, color: 'var(--tx)', fontSize: 14, resize: 'vertical', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setAction(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--bd)', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={confirmAction} disabled={submitting}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: action.type === 'approve' ? 'var(--green, #22c55e)' : 'var(--red, #ef4444)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Processing…' : action.type === 'approve' ? 'Confirm Approval' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
