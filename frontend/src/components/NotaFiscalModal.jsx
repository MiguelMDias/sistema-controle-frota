import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TIPOS_NOTA } from '../services/notasFiscais'

const VAZIO = {
  numero: '',
  serie: '1',
  fornecedor_id: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  tipo: 'peca',
  valor_total: '',
  observacoes: '',
  maquina_ids: [],
}

export default function NotaFiscalModal({ nota, maquinas, fornecedores, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (nota) {
      const idsAtuais = maquinas.filter((m) => nota.maquinas?.includes(m.codigo)).map((m) => m.id)
      setForm({
        ...VAZIO,
        ...nota,
        fornecedor_id: nota.fornecedor_id ?? '',
        maquina_ids: idsAtuais,
      })
    } else {
      setForm(VAZIO)
    }
  }, [nota, maquinas])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function alternarMaquina(id) {
    setForm((f) => ({
      ...f,
      maquina_ids: f.maquina_ids.includes(id)
        ? f.maquina_ids.filter((m) => m !== id)
        : [...f.maquina_ids, id],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const payload = {
        ...form,
        fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
        valor_total: Number(form.valor_total),
      }
      await onSave(payload)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar nota fiscal')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {nota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <div className="grid grid-cols-3 gap-4">
            <Campo label="Número *" className="col-span-2">
              <input
                required
                value={form.numero}
                onChange={(e) => atualizarCampo('numero', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Série">
              <input
                value={form.serie}
                onChange={(e) => atualizarCampo('serie', e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Data de Emissão *">
              <input
                required
                type="date"
                value={form.data_emissao}
                onChange={(e) => atualizarCampo('data_emissao', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Tipo *">
              <select
                required
                value={form.tipo}
                onChange={(e) => atualizarCampo('tipo', e.target.value)}
                className="input"
              >
                {TIPOS_NOTA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Fornecedor">
              <select
                value={form.fornecedor_id}
                onChange={(e) => atualizarCampo('fornecedor_id', e.target.value)}
                className="input"
              >
                <option value="">Não informado</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Valor Total (R$) *">
              <input
                required
                type="number"
                step="0.01"
                value={form.valor_total}
                onChange={(e) => atualizarCampo('valor_total', e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <div>
            <span className="block text-sm text-gray-600 mb-2">Máquinas vinculadas</span>
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
              {maquinas.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.maquina_ids.includes(m.id)}
                    onChange={() => alternarMaquina(m.id)}
                    className="rounded"
                  />
                  {m.codigo}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Deixe em branco se a nota não for de peça/serviço vinculado a máquina específica.</p>
          </div>

          <Campo label="Observações">
            <textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => atualizarCampo('observacoes', e.target.value)}
              placeholder="Detalhes adicionais sobre esta nota..."
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

function Campo({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
