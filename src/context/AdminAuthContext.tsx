import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AdminUser {
  id: string
  username: string
  display_name: string
  is_admin: boolean
}

interface AdminAuthContextValue {
  user: AdminUser | null
  token: string | null
  login: (token: string, user: AdminUser) => void
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'))
  const [user, setUser] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('admin_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback((t: string, u: AdminUser) => {
    localStorage.setItem('admin_token', t)
    localStorage.setItem('admin_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
