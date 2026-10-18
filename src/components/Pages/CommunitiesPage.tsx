import { useState, useEffect } from 'react'
import api from '../../api/adminApi'
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

const bars = [35, 68, 48, 82, 64, 91]

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/communities').then(r => setCommunities(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Community health</span>
          <h1>Communities<br/><em>with clarity.</em></h1>
        </div>
        <button className="admin-action">
          <Icon name="plus" size={14} /> New action
        </button>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : (
        <div className="admin-table">
          <header>
            <span>Community</span>
            <span>Status</span>
            <span>Members</span>
            <span>Signal</span>
            <span />
          </header>
          {communities.map((c, index) => (
            <div key={c.id}>
              <span>
                <span className={`person tone-${index % 5}`}>{c.name?.charAt(0) ?? '?'}</span>
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 8, color: '#777', marginTop: 2 }}>owner: @{c.owner_username}</div>
                </div>
              </span>
              <span>
                <i style={{ background: c.is_verified ? '#21855b' : '#777' }} />
                {c.is_verified ? 'Verified' : 'Active'}
              </span>
              <span>{(c.subscribers_count ?? 0).toLocaleString()}</span>
              <span className="micro-bars">
                {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}
              </span>
              <button><Icon name="more" size={16} /></button>
            </div>
          ))}
          {communities.length === 0 && !loading && (
            <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No communities found</p>
          )}
        </div>
      )}
    </div>
  )
}
