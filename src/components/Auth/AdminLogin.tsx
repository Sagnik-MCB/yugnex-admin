import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../../api/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'
import Icon from '../Icon'

export default function AdminLogin() {
  const nav = useNavigate()
  const { login } = useAdminAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await adminLogin(form)
      if (!data.is_admin) {
        setError('Access denied. Admin privileges required.')
        return
      }
      login(data.access_token, data)
      nav('/pulse')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <span className="mark"><i/><i/><i/></span>
        <h1>Command<br/>center.</h1>
        <p>Admin access only. Sign in with your Yugnex admin account.</p>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username or email"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading || !form.username || !form.password}>
            {loading ? 'Signing in…' : 'Enter command center'}
            <Icon name="arrow" size={16} />
          </button>
        </form>
        {error && <p className="admin-login-error">{error}</p>}
      </div>
    </div>
  )
}
