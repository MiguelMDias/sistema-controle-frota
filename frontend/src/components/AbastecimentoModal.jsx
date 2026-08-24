import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TIPOS_COMBUSTIVEL, unidadeQuantidade } from '../services/abastecimentos'

const VAZIO = {
  maquina_id: '',
  fornecedor_id: '',
  data: new Date().toISOString().slice(0, 10),
  tipo_combustivel: 'diesel',
  quantidade: '',
  valor_total: '',
  horimetro: '',
  km: '',
}

export default function AbastecimentoModal({ abastecimento, maquinas, fornecedores, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const maquinaSelecionada = maquinas.find((m) => String(m.id) === String(form.maquina_id))
  const usaKm = maquinaSelecionada?.tipo === 'carro'

  useEffect(() => {
    if (abastecimento) {
      setForm({
        ...VAZIO,
        ...abastecimento,
        maquina_id: abastecimento.maquina_id ?? '',
        fornecedor_id: abastecimento.fornecedor_id ?? '',
        horimetro: abastecimento.horimetro ?? '',
        km: abastecimento.km ?? '',
      })
    } else {
      setForm(VAZIO)
    }
  }, [abastecimento])

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
        quantidade: Number(form.quantidade),
        valor_total: Number(form.valor_total),
        horimetro: form.horimetro !== '' ? Number(form.horimetro) : null,
        km: form.km !== '' ? Number(form.km) : null,
      }
      await onSave(payload)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar abastecimento')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {abastecimento ? 'Editar Abastecimento' : 'Novo Abastecimento'}
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
            <Campo label="Tipo de Combustível *">
              <select
                required
                value={form.tipo_combustivel}
                onChange={(e) => atualizarCampo('tipo_combustivel', e.target.value)}
                className="input"
              >
                {TIPOS_COMBUSTIVEL.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Fornecedor / Posto">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label={`Quantidade (${unidadeQuantidade(form.tipo_combustivel)}) *`}>
              <input
                required
                type="number"
                step="0.01"
                value={form.quantidade}
                onChange={(e) => atualizarCampo('quantidade', e.target.value)}
                className="input"
              />
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

          <Campo label={usaKm ? 'Km no momento' : 'Horímetro no momento'}>
            <input
              type="number"
              step="0.1"
              value={usaKm ? form.km : form.horimetro}
              onChange={(e) => atualizarCampo(usaKm ? 'km' : 'horimetro', e.target.value)}
              placeholder={maquinaSelecionada ? '' : 'Selecione a máquina primeiro'}
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
