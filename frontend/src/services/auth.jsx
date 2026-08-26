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

  const registrar = useCallback(async (nome, usuario, senha) => {
    const { data } = await api.post('/auth/registrar', { nome, usuario, senha })
    const sessao = { token: data.token, usuario: data.usuario, nome: data.nome, papel: data.papel }
    localStorage.setItem('auth', JSON.stringify(sessao))
    setAuth(sessao)
    return sessao
  }, [])

  const entrarComoObservador = useCallback(() => {
    const sessao = { token: null, usuario: 'observador', nome: 'Observador', papel: 'observador' }
    localStorage.setItem('auth', JSON.stringify(sessao))
    setAuth(sessao)
    return sessao
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setAuth(null)
  }, [])

  const isAdmin = auth?.papel === 'admin'
  const isDiretor = auth?.papel === 'diretor'
  const isMecanico = auth?.papel === 'mecanico'
  const isObservador = auth?.papel === 'observador'

  return (
    <AuthContext.Provider value={{ auth, login, registrar, entrarComoObservador, logout, isAdmin, isDiretor, isMecanico, isObservador }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
