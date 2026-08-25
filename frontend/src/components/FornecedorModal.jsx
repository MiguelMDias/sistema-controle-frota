import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const VAZIO = { nome: '', cnpj: '', telefone: '', email: '', contato: '' }

// Remove tudo que não for dígito
function apenasDigitos(valor) {
  return valor.replace(/\D/g, '')
}

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

    if (form.cnpj.length !== 14) {
      setErro('CNPJ deve ter exatamente 14 dígitos')
      return
    }

    setSalvando(true)
    try {
      await onSave({
        ...form,
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
              maxLength={200}
              className="input"
            />
          </Campo>

          <Campo label="CNPJ *">
            <input
              required
              value={form.cnpj}
              onChange={(e) => atualizarCampo('cnpj', apenasDigitos(e.target.value))}
              maxLength={14}
              inputMode="numeric"
              placeholder="00000000000000 (só números)"
              className="input"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Telefone">
              <input
                value={form.telefone}
                onChange={(e) => atualizarCampo('telefone', apenasDigitos(e.target.value))}
                maxLength={13}
                inputMode="numeric"
                placeholder="DDD + número"
                className="input"
              />
            </Campo>
            <Campo label="E-mail">
              <input
                type="email"
                value={form.email}
                onChange={(e) => atualizarCampo('email', e.target.value)}
                maxLength={50}
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
