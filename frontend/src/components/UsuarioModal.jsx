import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const VAZIO = { nome: '', usuario: '', senha: '', papel: 'mecanico', ativo: true }

export default function UsuarioModal({ usuario, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (usuario) {
      setForm({ ...VAZIO, ...usuario, senha: '' })
    } else {
      setForm(VAZIO)
    }
  }, [usuario])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (!usuario && !form.senha) {
      setErro('Informe uma senha para o novo usuário.')
      return
    }

    setSalvando(true)
    try {
      const payload = usuario
        ? { nome: form.nome, papel: form.papel, ativo: form.ativo, ...(form.senha ? { senha: form.senha } : {}) }
        : { nome: form.nome, usuario: form.usuario, senha: form.senha, papel: form.papel }
      await onSave(payload)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar usuário')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {usuario ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Nome *</span>
            <input
              required
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">Código de usuário *</span>
            <input
              required
              disabled={!!usuario}
              value={form.usuario}
              onChange={(e) => atualizarCampo('usuario', e.target.value)}
              className="input disabled:bg-gray-50 disabled:text-gray-400"
            />
          </label>

          <label className="block">
            <span className="block text-sm text-gray-600 mb-1">
              {usuario ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}
            </span>
            <input
              required={!usuario}
              type="password"
              value={form.senha}
              onChange={(e) => atualizarCampo('senha', e.target.value)}
              className="input"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Papel</span>
              <select
                value={form.papel}
                onChange={(e) => atualizarCampo('papel', e.target.value)}
                className="input"
              >
                <option value="mecanico">Mecânico</option>
                <option value="diretor">Diretor</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            {usuario && (
              <label className="block">
                <span className="block text-sm text-gray-600 mb-1">Status</span>
                <select
                  value={form.ativo ? '1' : '0'}
                  onChange={(e) => atualizarCampo('ativo', e.target.value === '1')}
                  className="input"
                >
                  <option value="1">Ativo</option>
                  <option value="0">Inativo</option>
                </select>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
