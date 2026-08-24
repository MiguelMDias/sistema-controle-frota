import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const VAZIO = { nome: '', cnpj: '', telefone: '', email: '', contato: '' }

export default function FornecedorModal({ fornecedor, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    setForm(fornecedor ? { ...VAZIO, ...fornecedor } : VAZIO)
  }, [fornecedor])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await onSave({
        ...form,
        cnpj: form.cnpj || null,
        telefone: form.telefone || null,
        email: form.email || null,
        contato: form.contato || null,
      })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar fornecedor')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <Campo label="Nome *">
            <input
              required
              value={form.nome}
              onChange={(e) => atualizarCampo('nome', e.target.value)}
              className="input"
            />
          </Campo>

          <Campo label="CNPJ">
            <input
              value={form.cnpj}
              onChange={(e) => atualizarCampo('cnpj', e.target.value)}
              placeholder="00000000000000"
              className="input"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Telefone">
              <input
                value={form.telefone}
                onChange={(e) => atualizarCampo('telefone', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => atualizarCampo('email', e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <Campo label="Contato">
            <input
              value={form.contato}
              onChange={(e) => atualizarCampo('contato', e.target.value)}
              placeholder="Nome da pessoa de contato"
              className="input"
            />
          </Campo>

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

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
