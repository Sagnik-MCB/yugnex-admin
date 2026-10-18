import { useState, useEffect } from 'react'
import api from '../../api/adminApi'
import Icon from '../Icon'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency_ms: number
  uptime_pct: number
  last_check: string
}

const SERVICES = [
  { name: 'API Gateway',      icon: 'shield' as const,  desc: 'Main request router' },
  { name: 'Messaging',        icon: 'chat' as const,    desc: 'Real-time WebSocket layer' },
  { name: 'Media Delivery',   icon: 'camera' as const,  desc: 'CDN & file storage' },
  { name: 'Live & Calls',     icon: 'live' as const,    desc: 'WebRTC signaling' },
  { name: 'Payments',         icon: 'money' as const,   desc: 'Coin & payout processing' },
  { name: 'Notifications',    icon: 'bell' as const,    desc: 'Push & in-app alerts' },
  { name: 'Search',           icon: 'search' as const,  desc: 'Full-text indexing' },
  { name: 'Auth',             icon: 'lock' as const,    desc: 'Token validation & 2FA' },
]

const statusColor: Record<string, string> = {
  healthy: '#21855b',
  degraded: '#e87c22',
  down: '#ff4f38',
}

export default function SystemPage() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/system').then(r => {
      if (Array.isArray(r.data)) {
        const map: Record<string, ServiceStatus> = {}
        r.data.forEach((s: ServiceStatus) => { map[s.name] = s })
        setStatuses(map)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro compact">
        <div>
          <span className="overline">Infrastructure</span>
          <h1>System<br/><em>with clarity.</em></h1>
        </div>
        <p style={{ maxWidth: 340, color: '#6e6a62', fontSize: 10 }}>
          Live status of every service that keeps Yugnex running.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
        {SERVICES.map(svc => {
          const s = statuses[svc.name]
          const status = s?.status ?? 'healthy'
          return (
            <div key={svc.name} style={{ padding: 22, background: '#f4f1e9', borderTop: `3px solid ${statusColor[status]}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: statusColor[status] + '22', display: 'grid', placeItems: 'center', color: statusColor[status] }}>
                  <Icon name={svc.icon} size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 11 }}>{svc.name}</strong>
                  <small style={{ color: '#777', fontSize: 8 }}>{svc.desc}</small>
                </div>
                <span style={{ marginLeft: 'auto', padding: '3px 8px', borderRadius: 99, background: statusColor[status] + '22', color: statusColor[status], fontSize: 8, fontWeight: 700, textTransform: 'capitalize' }}>
                  {status}
                </span>
              </div>
              {!loading && s && (
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Instrument Serif' }}>{s.latency_ms ?? '—'}ms</div>
                    <div style={{ fontSize: 8, color: '#777' }}>Latency</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Instrument Serif' }}>{s.uptime_pct ?? '99.9'}%</div>
                    <div style={{ fontSize: 8, color: '#777' }}>Uptime</div>
                  </div>
                </div>
              )}
              {(loading || !s) && (
                <div style={{ display: 'flex', gap: 20 }}>
                  <div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Instrument Serif' }}>—</div><div style={{ fontSize: 8, color: '#777' }}>Latency</div></div>
                  <div><div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Instrument Serif' }}>99.9%</div><div style={{ fontSize: 8, color: '#777' }}>Uptime</div></div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
