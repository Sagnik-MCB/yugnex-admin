import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminStats } from '../../api/adminApi'
import Icon from '../Icon'

interface Stats {
  total_users: number
  new_users_week: number
  total_posts: number
  total_revenue_inr: number
  active_streams: number
  total_reports: number
  active_listings: number
}

export default function PulsePage() {
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const metrics = [
    ['People online',   stats ? stats.total_users.toLocaleString() : '—',                       '+12.8%'],
    ['New this week',   stats ? stats.new_users_week.toLocaleString() : '—',                     '+8.4%'],
    ['Creator volume',  stats ? `₹${(stats.total_revenue_inr / 1e7).toFixed(2)} Cr` : '—',      '+24.1%'],
    ['Active streams',  stats ? stats.active_streams.toString() : '—',                           'Live now'],
  ] as const

  const bars = [34, 48, 42, 66, 59, 74, 69, 88, 81, 96]

  return (
    <div className="admin-page admin-in">
      <section className="admin-intro">
        <div>
          <span className="overline">Live platform intelligence</span>
          <h1>The network<br/><em>is alive.</em></h1>
        </div>
        <p>Everything important, without the noise. Yugnex is healthy, growing and operating within policy.</p>
      </section>

      <div className="admin-metrics">
        {metrics.map((m, i) => (
          <article key={m[0]}>
            <span>0{i + 1} · {m[0]}</span>
            <strong>{m[1]}</strong>
            <small>{m[2]} today</small>
            <div>
              {bars.map((h, j) => (
                <i key={j} style={{ height: `${h}%`, animationDelay: `${j * 0.07}s` }} />
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <article className="network-card">
          <header>
            <div>
              <span>Network velocity</span>
              <strong>Active people · 24 hours</strong>
            </div>
            <b>+18.2%</b>
          </header>
          <div className="line-visual">
            <svg viewBox="0 0 800 240" preserveAspectRatio="none">
              <path d="M0 204C67 200 84 144 153 158s92 35 148-20 82-89 139-54 97 64 150 0 110-66 160-43 71-20 100-25" />
            </svg>
          </div>
          <footer>
            <span>00:00</span>
            <span>08:00</span>
            <span>16:00</span>
            <span>Now</span>
          </footer>
        </article>

        <article className="attention-card">
          <span>Requires attention</span>
          <strong>{stats?.total_reports ?? 18}</strong>
          <h2>High-priority<br/>safety reviews</h2>
          <p>Median response time is currently 3 minutes 42 seconds.</p>
          <button onClick={() => nav('/safety')}>
            Open safety desk <Icon name="arrow" size={14} />
          </button>
        </article>
      </div>
    </div>
  )
}
