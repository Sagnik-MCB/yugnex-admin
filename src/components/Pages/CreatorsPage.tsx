import { useState, useEffect } from 'react'
import { getAdminCreators, getAdminPayouts } from '../../api/adminApi'
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

interface Payout {
  id: string
  creator_username: string
  amount_inr: number
  status: string
  requested_at: string
}

const bars = [35, 68, 48, 82, 64, 91]

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [tab, setTab] = useState<'creators' | 'payouts'>('creators')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tab === 'creators') {
      setLoading(true)
      getAdminCreators().then(r => setCreators(r.data.creators ?? [])).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(true)
      getAdminPayouts().then(r => setPayouts(r.data)).catch(() => {}).finally(() => setLoading(false))
    }
  }, [tab])

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Creator economy</span>
          <h1>Creators<br/><em>with clarity.</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['creators', 'payouts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '9px 16px', border: '1px solid rgba(17,17,15,.14)', borderRadius: 99, background: tab === t ? '#11110f' : 'transparent', color: tab === t ? 'white' : '#11110f', fontSize: 9, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : tab === 'creators' ? (
        <div className="admin-table">
          <header>
            <span>Creator</span>
            <span>Status</span>
            <span>Earnings</span>
            <span>Signal</span>
            <span />
          </header>
          {creators.map((c, index) => (
            <div key={c.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{c.display_name?.charAt(0) ?? '?'}</span>
                <strong>@{c.username}</strong>
              </span>
              <span>
                <i style={{ background: c.is_verified ? '#21855b' : '#e87c22' }} />
                {c.is_verified ? 'Verified' : 'Unverified'}
              </span>
              <span>₹{(c.total_tips_inr ?? 0).toLocaleString()}</span>
              <span className="micro-bars">
                {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}
              </span>
              <button><Icon name="more" size={16} /></button>
            </div>
          ))}
          {creators.length === 0 && <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No creators found</p>}
        </div>
      ) : (
        <div className="admin-table">
          <header>
            <span>Creator</span>
            <span>Status</span>
            <span>Amount</span>
            <span>Requested</span>
            <span />
          </header>
          {payouts.map((p, index) => (
            <div key={p.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{p.creator_username?.charAt(0) ?? '?'}</span>
                <strong>@{p.creator_username}</strong>
              </span>
              <span>
                <i style={{ background: p.status === 'processed' ? '#21855b' : '#e87c22' }} />
                {p.status}
              </span>
              <span>₹{p.amount_inr.toLocaleString()}</span>
              <span>{new Date(p.requested_at).toLocaleDateString('en-IN')}</span>
              <button><Icon name="more" size={16} /></button>
            </div>
          ))}
          {payouts.length === 0 && <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No payouts found</p>}
        </div>
      )}
    </div>
  )
}
