import { createContext, useContext, useState, useCallback } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const salvo = localStorage.getItem('auth')
    return salvo ? JSON.parse(salvo) : null
  })

  const login = useCallback(async (usuario, senha) => {
    const { data } = await api.post('/auth/login', { usuario, senha })
    const sessao = { token: data.token, usuario: data.usuario, nome: data.nome, papel: data.papel }
    localStorage.setItem('auth', JSON.stringify(sessao))
    setAuth(sessao)
    return sessao
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setAuth(null)
  }, [])

  const isAdmin = auth?.papel === 'admin'

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
