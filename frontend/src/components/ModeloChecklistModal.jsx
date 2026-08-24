import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { TIPOS_MAQUINA } from '../services/maquinas'

export default function ModeloChecklistModal({ onClose, onSave }) {
  const [nome, setNome] = useState('')
  const [tipoMaquina, setTipoMaquina] = useState('carro')
  const [itens, setItens] = useState([{ item: '', obrigatorio: true }])
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  function atualizarItem(index, campo, valor) {
    setItens((lista) => lista.map((it, i) => (i === index ? { ...it, [campo]: valor } : it)))
  }

  function adicionarItem() {
    setItens((lista) => [...lista, { item: '', obrigatorio: true }])
  }

  function removerItem(index) {
    setItens((lista) => lista.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    const itensValidos = itens.filter((it) => it.item.trim())
    if (itensValidos.length === 0) {
      setErro('Adicione pelo menos um item ao checklist.')
      return
    }

    setSalvando(true)
    try {
      await onSave({ nome, tipo_maquina: tipoMaquina, itens: itensValidos })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar modelo de checklist')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Novo Modelo de Checklist</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Nome *</span>
              <input
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Inspeção diária"
                className="input"
              />
            </label>
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Tipo de Máquina *</span>
              <select value={tipoMaquina} onChange={(e) => setTipoMaquina(e.target.value)} className="input">
                {TIPOS_MAQUINA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="block text-sm text-gray-600 mb-2">Itens do checklist</span>
            <div className="space-y-2">
              {itens.map((it, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={it.item}
                    onChange={(e) => atualizarItem(index, 'item', e.target.value)}
                    placeholder="Nível de óleo"
                    className="input flex-1"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                    <input
                      type="checkbox"
                      checked={it.obrigatorio}
                      onChange={(e) => atualizarItem(index, 'obrigatorio', e.target.checked)}
                    />
                    Obrigatório
                  </label>
                  {itens.length > 1 && (
                    <button type="button" onClick={() => removerItem(index)} className="text-gray-400 hover:text-red-600 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={adicionarItem}
              className="flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
            >
              <Plus size={14} /> Adicionar item
            </button>
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
              {salvando ? 'Salvando...' : 'Salvar Modelo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
