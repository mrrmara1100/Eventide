// Global auth state, per section 4 of the proposal: tracks the logged-in user
// and the Sanctum token, and rehydrates the session on a page refresh.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, TOKEN_KEY } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Starts true: until the token check resolves we do not know whether we have
  // a session, and ProtectedRoute must not bounce people to /login meanwhile.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    authApi
      .me()
      .then(({ user }) => {
        if (!cancelled) setUser(user)
      })
      .catch(() => {
        // Token is stale or the user was removed — drop it.
        localStorage.removeItem(TOKEN_KEY)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isOrganizer: user?.role === 'organizer',

      async login(credentials) {
        const { user, token } = await authApi.login(credentials)
        localStorage.setItem(TOKEN_KEY, token)
        setUser(user)
        return user
      },

      async register(payload) {
        const { user, token } = await authApi.register(payload)
        localStorage.setItem(TOKEN_KEY, token)
        setUser(user)
        return user
      },

      logout() {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
