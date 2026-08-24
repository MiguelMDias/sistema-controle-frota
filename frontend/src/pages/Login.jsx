import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { useAuth } from '../services/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [entrando, setEntrando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setEntrando(true)
    try {
      await login(usuario, senha)
      navigate('/')
    } catch (err) {
      setErro(err.response?.data?.detail || 'Usuário ou senha inválidos')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
            <Truck className="text-primary" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Controle de Frota</h1>
          <p className="text-sm text-gray-500 mt-1">Entre com seu usuário e senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>
          )}

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Usuário</span>
            <input
              required
              autoFocus
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Senha</span>
            <input
              required
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="input"
            />
          </label>

          <button
            type="submit"
            disabled={entrando}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
