import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../services/auth'

export default function Cadastro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await registrar(nome, usuario, senha)
      navigate('/')
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível criar a conta')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
            <Truck className="text-primary" size={24} />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Criar conta</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Sua conta é criada com permissão de Operador/Mecânico.
            Um administrador pode alterar isso depois.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>
          )}

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Nome *</span>
            <input
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Código de usuário *</span>
            <input
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Senha *</span>
            <div className="relative">
              <input
                required
                minLength={4}
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {enviando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Já tenho uma conta
          </Link>
        </div>
      </div>
    </div>
  )
}
