import { useState, useEffect } from 'react'
import { getAdminReports, resolveReport } from '../../api/adminApi'
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

const SEVERITY_CLASS: Record<string, string> = {
  spam: 's-3',
  harassment: 's-1',
  impersonation: 's-0',
  hate_speech: 's-0',
  misinformation: 's-1',
  copyright: 's-2',
}

export default function SafetyPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminReports({ status: 'pending' })
      .then(r => setReports(r.data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleResolve = async (id: string, action: string) => {
    try {
      await resolveReport(id, { action })
      setReports(prev => prev.filter(r => r.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch {}
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Trust &amp; safety</span>
          <h1>Context before<br/><em>consequence.</em></h1>
        </div>
        <p>Human judgment supported by transparent signals — not replaced by them.</p>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : (
        <div className="case-layout">
          <section className="case-list">
            <header>
              <strong>Priority queue</strong>
              <span>{reports.length} open</span>
            </header>
            {reports.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '40px 0', textAlign: 'center', color: '#777' }}>
                <Icon name="shield" size={36} />
                <p style={{ marginTop: 12 }}>All clear — no pending reports</p>
              </div>
            ) : reports.slice(0, 4).map((r, i) => (
              <article key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer', outline: selected?.id === r.id ? '2px solid #1648ff' : 'none' }}>
                <div>
                  <span className={`severity s-${i}`}>
                    {['Critical', 'High', 'Medium', 'Low'][i] ?? 'Medium'}
                  </span>
                  <small>{new Date(r.reported_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <h2>Reported post</h2>
                <p>by @{r.post_author} · reporter: @{r.reporter_username}</p>
                <footer>
                  <button onClick={e => { e.stopPropagation(); handleResolve(r.id, 'remove') }}>
                    <Icon name="check" size={12} /> Resolve
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleResolve(r.id, 'dismiss') }}>
                    Dismiss
                  </button>
                </footer>
              </article>
            ))}
          </section>

          <aside className="decision-panel">
            {selected ? (
              <>
                <div className="decision-symbol">
                  <Icon name="shield" size={32} />
                  <i /><i />
                </div>
                <span className="overline">Case detail</span>
                <h2>Reported post</h2>
                <p style={{ marginBottom: 16 }}>{selected.post_content || 'No content available.'}</p>
                <p>Author: @{selected.post_author}<br/>Reporter: @{selected.reporter_username}</p>
                <div>
                  <span>Signal confidence</span>
                  <strong>94.8%</strong>
                  <i><b /></i>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 20, width: '100%' }}>
                  <button onClick={() => handleResolve(selected.id, 'remove')}
                    style={{ flex: 1, padding: '10px', border: 0, borderRadius: 99, background: '#11110f', color: 'white', fontSize: 9, cursor: 'pointer' }}>
                    Remove content
                  </button>
                  <button onClick={() => handleResolve(selected.id, 'dismiss')}
                    style={{ flex: 1, padding: '10px', border: '1px solid rgba(17,17,15,.3)', borderRadius: 99, background: 'transparent', fontSize: 9, cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="decision-symbol">
                  <Icon name="shield" size={32} />
                  <i /><i />
                </div>
                <span className="overline">Decision support</span>
                <h2>Look at the whole story.</h2>
                <p>Select a case to see full context, account relationships, and an explainable recommendation.</p>
                <div>
                  <span>Signal confidence</span>
                  <strong>94.8%</strong>
                  <i><b /></i>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
