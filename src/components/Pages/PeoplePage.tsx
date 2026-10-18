import { useState, useEffect } from 'react'
import { getAdminUsers, updateAdminUser } from '../../api/adminApi'
import Icon from '../Icon'

interface User {
  id: string
  username: string
  display_name: string
  email: string
  is_verified: boolean
  is_banned: boolean
  pro_tier: string
  posts_count: number
  followers_count: number
  created_at: string
}

const TIERS = ['free', 'pro', 'pro_plus', 'student']
const bars = [35, 68, 48, 82, 64, 91]

export default function PeoplePage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionUser, setActionUser] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      getAdminUsers({ q: search || undefined })
        .then(r => setUsers(r.data.users ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleUpdate = async (id: string, patch: Record<string, unknown>) => {
    try {
      const { data } = await updateAdminUser(id, patch)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
    } catch {}
    setActionUser(null)
  }

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">User management</span>
          <h1>People<br/><em>with clarity.</em></h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            style={{ padding: '9px 14px', border: '1px solid rgba(17,17,15,.14)', borderRadius: 99, background: 'transparent', fontSize: 11, width: 220 }}
          />
        </div>
      </section>

      {loading ? (
        <p style={{ color: '#777', textAlign: 'center', padding: 40 }}>Loading…</p>
      ) : (
        <div className="admin-table">
          <header>
            <span>User</span>
            <span>Status</span>
            <span>Posts</span>
            <span>Signal</span>
            <span />
          </header>
          {users.map((user, index) => (
            <div key={user.id} style={{ position: 'relative' }}>
              <span>
                <span className={`person tone-${index % 5}`}>{user.display_name?.charAt(0) ?? '?'}</span>
                <strong>@{user.username}</strong>
              </span>
              <span>
                {user.is_banned ? (
                  <><i style={{ background: '#ef4444' }} />Banned</>
                ) : (
                  <><i />Active</>
                )}
              </span>
              <span>{user.posts_count ?? 0}</span>
              <span className="micro-bars">
                {bars.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }} />)}
              </span>
              <button onClick={() => setActionUser(actionUser === user.id ? null : user.id)}>
                <Icon name="more" size={16} />
              </button>

              {actionUser === user.id && (
                <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, background: '#f4f1e9', border: '1px solid rgba(17,17,15,.14)', borderRadius: 10, padding: '6px 0', minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
                  <button onClick={() => handleUpdate(user.id, { is_verified: !user.is_verified })}
                    style={{ display: 'flex', width: '100%', gap: 8, padding: '8px 14px', border: 0, background: 'none', fontSize: 11, cursor: 'pointer', color: '#11110f' }}>
                    <Icon name="check" size={14} /> {user.is_verified ? 'Remove verify' : 'Verify user'}
                  </button>
                  <button onClick={() => handleUpdate(user.id, { is_banned: !user.is_banned })}
                    style={{ display: 'flex', width: '100%', gap: 8, padding: '8px 14px', border: 0, background: 'none', fontSize: 11, cursor: 'pointer', color: user.is_banned ? '#278057' : '#ff4f38' }}>
                    <Icon name="shield" size={14} /> {user.is_banned ? 'Unban user' : 'Ban user'}
                  </button>
                  <div style={{ padding: '6px 14px 4px', borderTop: '1px solid rgba(17,17,15,.1)', marginTop: 4 }}>
                    <p style={{ fontSize: 9, color: '#777', margin: '0 0 5px' }}>Set tier</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {TIERS.map(t => (
                        <button key={t} onClick={() => handleUpdate(user.id, { pro_tier: t })}
                          style={{ padding: '3px 8px', border: '1px solid rgba(17,17,15,.2)', borderRadius: 99, fontSize: 8, background: user.pro_tier === t ? '#11110f' : 'transparent', color: user.pro_tier === t ? 'white' : '#11110f', cursor: 'pointer' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && !loading && (
            <p style={{ padding: '40px 10px', color: '#777', textAlign: 'center' }}>No users found</p>
          )}
        </div>
      )}
    </div>
  )
}
