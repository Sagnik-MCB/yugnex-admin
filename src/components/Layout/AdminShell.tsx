import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import Icon from '../Icon'
import { useAdminAuth } from '../../context/AdminAuthContext'

const pageTitles: Record<string, string> = {
  '/pulse':       'Pulse',
  '/people':      'People',
  '/safety':      'Safety',
  '/content':     'Content',
  '/creators':    'Creators',
  '/commerce':    'Commerce',
  '/communities': 'Communities',
  '/analytics':   'Analytics',
  '/support':     'Support',
  '/access':      'Access',
  '/system':      'System',
}

function getDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function AdminShell() {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAdminAuth()
  const title = pageTitles[pathname] ?? 'Admin'

  return (
    <div className="admin-world">
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 35, background: 'rgba(0,0,0,.5)' }}
        />
      )}
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <section className="admin-content">
        <header className="admin-header">
          <button className="admin-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Icon name="menu" size={20} />
          </button>
          <div>
            <span>{getDate()}</span>
            <strong>{title}</strong>
          </div>
          <button className="admin-search">
            <Icon name="search" size={15} />
            <span>Search command center</span>
          </button>
          <div>
            <button aria-label="Notifications">
              <Icon name="bell" size={18} />
              <i />
            </button>
            <span className="person tone-0">{(user?.display_name ?? 'A').charAt(0)}</span>
          </div>
        </header>

        <Outlet />
      </section>
    </div>
  )
}
