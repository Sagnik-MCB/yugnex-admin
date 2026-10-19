import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

const navItems: [string, string, Parameters<typeof Icon>[0]['name'], number?][] = [
  ['/pulse',       'Pulse',       'chart'],
  ['/people',      'People',      'users'],
  ['/safety',      'Safety',      'shield'],
  ['/content',     'Content',     'flag'],
  ['/creators',    'Creators',    'spark'],
  ['/commerce',    'Commerce',    'money'],
  ['/communities', 'Communities', 'chat'],
  ['/analytics',   'Analytics',   'chart'],
  ['/support',     'Support',     'chat'],
  ['/access',      'Access',      'lock'],
  ['/system',      'System',      'settings'],
]

interface AdminSidebarProps {
  open: boolean
  onClose: () => void
  safetyCount?: number
}

export default function AdminSidebar({ open, onClose, safetyCount }: AdminSidebarProps) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const { user, logout } = useAdminAuth()

  const handleNav = (to: string) => {
    nav(to)
    onClose()
  }

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <aside className={`admin-sidebar${open ? ' open' : ''}`}>
      <header>
        <span className="mark"><i/><i/><i/></span>
        <button onClick={onClose} aria-label="Close menu">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="admin-product">
        <span>YUGNEX / OS</span>
        <strong>Command<br/>center.</strong>
      </div>

      <nav>
        {navItems.map(([to, label, icon]) => (
          <button
            key={to}
            className={pathname === to || pathname.startsWith(to + '/') ? 'active' : ''}
            onClick={() => handleNav(to)}
          >
            <Icon name={icon} size={16} />
            <span>{label}</span>
            {label === 'Safety' && safetyCount ? <b>{safetyCount}</b> : null}
          </button>
        ))}
      </nav>

      <footer>
        <button onClick={handleLogout}>
          <Icon name="logout" size={15} />
          <span>Consumer app</span>
        </button>
        <div>
          <span className="person tone-0">{user?.display_name?.charAt(0) ?? 'A'}</span>
          <span>
            <strong>{user?.display_name ?? 'Admin'}</strong>
            <small>Super admin</small>
          </span>
        </div>
      </footer>
    </aside>
  )
}
