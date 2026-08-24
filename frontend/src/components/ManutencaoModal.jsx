import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TIPOS_MANUTENCAO, STATUS_MANUTENCAO } from '../services/manutencoes'

const VAZIO = {
  maquina_id: '',
  fornecedor_id: '',
  data: new Date().toISOString().slice(0, 10),
  tipo: 'corretiva',
  descricao: '',
  horimetro: '',
  km: '',
  custo: '',
  status: 'concluida',
}

export default function ManutencaoModal({ manutencao, maquinas, fornecedores, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (manutencao) {
      setForm({
        ...VAZIO,
        ...manutencao,
        maquina_id: manutencao.maquina_id ?? '',
        fornecedor_id: manutencao.fornecedor_id ?? '',
        horimetro: manutencao.horimetro ?? '',
        km: manutencao.km ?? '',
        custo: manutencao.custo ?? '',
      })
    } else {
      setForm(VAZIO)
    }
  }, [manutencao])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      const payload = {
        ...form,
        maquina_id: Number(form.maquina_id),
        fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
        horimetro: form.horimetro !== '' ? Number(form.horimetro) : null,
        km: form.km !== '' ? Number(form.km) : null,
        custo: form.custo !== '' ? Number(form.custo) : null,
      }
      await onSave(payload)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar manutenção')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {manutencao ? 'Editar Manutenção' : 'Nova Manutenção'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Máquina *">
              <select
                required
                value={form.maquina_id}
                onChange={(e) => atualizarCampo('maquina_id', e.target.value)}
                className="input"
              >
                <option value="">Selecione...</option>
                {maquinas.map((m) => (
                  <option key={m.id} value={m.id}>{m.codigo}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Data *">
              <input
                required
                type="date"
                value={form.data}
                onChange={(e) => atualizarCampo('data', e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Tipo *">
              <select
                required
                value={form.tipo}
                onChange={(e) => atualizarCampo('tipo', e.target.value)}
                className="input"
              >
                {TIPOS_MANUTENCAO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Status *">
              <select
                required
                value={form.status}
                onChange={(e) => atualizarCampo('status', e.target.value)}
                className="input"
              >
                {STATUS_MANUTENCAO.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Descrição *">
            <textarea
              required
              rows={3}
              value={form.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              placeholder="Troca de óleo e filtro..."
              className="input"
            />
          </Campo>

          <Campo label="Fornecedor / Oficina">
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

          <div className="grid grid-cols-3 gap-4">
            <Campo label="Horímetro">
              <input
                type="number"
                step="0.1"
                value={form.horimetro}
                onChange={(e) => atualizarCampo('horimetro', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Km">
              <input
                type="number"
                step="0.1"
                value={form.km}
                onChange={(e) => atualizarCampo('km', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Custo (R$)">
              <input
                type="number"
                step="0.01"
                value={form.custo}
                onChange={(e) => atualizarCampo('custo', e.target.value)}
                className="input"
              />
            </Campo>
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

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
