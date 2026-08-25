import { useState } from 'react'
import { X } from 'lucide-react'

export default function ConcluirPreventivaModal({ plano, fornecedores, onClose, onConcluir }) {
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    descricao: plano.descricao,
    fornecedor_id: '',
    horimetro: '',
    km: '',
    custo: '',
  })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (plano.intervalo_horimetro && !form.horimetro) {
      setErro('Este plano é baseado em horímetro -- informe a leitura atual.')
      return
    }
    if (plano.intervalo_km && !form.km) {
      setErro('Este plano é baseado em km -- informe a leitura atual.')
      return
    }

    setSalvando(true)
    try {
      await onConcluir(plano.id, {
        data: form.data,
        descricao: form.descricao,
        fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
        horimetro: form.horimetro !== '' ? Number(form.horimetro) : null,
        km: form.km !== '' ? Number(form.km) : null,
        custo: form.custo !== '' ? Number(form.custo) : null,
      })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao concluir preventiva')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Concluir Preventiva</h2>
            <p className="text-sm text-gray-500">{plano.maquina_codigo} — {plano.descricao}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Isso registra a execução no histórico de manutenções e recalcula automaticamente
            a próxima data/leitura de vencimento deste plano.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Data de execução *">
              <input
                required
                type="date"
                value={form.data}
                onChange={(e) => atualizarCampo('data', e.target.value)}
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
          </div>

          <Campo label="Descrição *">
            <textarea
              required
              rows={2}
              value={form.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              className="input"
            />
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plano.intervalo_horimetro != null && (
              <Campo label="Horímetro atual *">
                <input
                  type="number"
                  step="0.1"
                  value={form.horimetro}
                  onChange={(e) => atualizarCampo('horimetro', e.target.value)}
                  className="input"
                />
              </Campo>
            )}
            {plano.intervalo_km != null && (
              <Campo label="Km atual *">
                <input
                  type="number"
                  step="0.1"
                  value={form.km}
                  onChange={(e) => atualizarCampo('km', e.target.value)}
                  className="input"
                />
              </Campo>
            )}
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
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {salvando ? 'Concluindo...' : 'Concluir Preventiva'}
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
