import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../services/auth'
import UsuarioModal from '../components/UsuarioModal'

export default function Usuarios() {
  const { isAdmin, auth } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data } = await api.get('/usuarios')
      setUsuarios(data)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Não foi possível carregar os usuários.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ShieldAlert size={40} className="mb-3" />
        <p>Apenas administradores podem gerenciar usuários.</p>
      </div>
    )
  }

  async function salvar(payload) {
    if (editando) {
      await api.patch(`/usuarios/${editando.id}`, payload)
    } else {
      await api.post('/usuarios', payload)
    }
    setModalAberto(false)
    carregar()
  }

  async function excluir(usuario) {
    if (!confirm(`Excluir o usuário ${usuario.usuario}?`)) return
    try {
      await api.delete(`/usuarios/${usuario.id}`)
      carregar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao excluir usuário')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Usuários</h1>
        <button
          onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
        >
          <Plus size={16} /> Novo Usuário
        </button>
      </div>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {!carregando && usuarios.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-700">{u.nome}</td>
                <td className="px-4 py-3">{u.usuario}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.papel === 'admin' ? 'bg-indigo-100 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                    {u.papel === 'admin' ? 'Administrador' : 'Operador'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditando(u); setModalAberto(true) }} className="text-gray-400 hover:text-primary mr-3">
                    <Pencil size={16} />
                  </button>
                  {u.id !== auth.id && (
                    <button onClick={() => excluir(u)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <UsuarioModal
          usuario={editando}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
        />
      )}
    </div>
  )
}
