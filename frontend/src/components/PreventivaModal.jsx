import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const VAZIO = {
  maquina_id: '',
  descricao: '',
  intervalo_horimetro: '',
  intervalo_km: '',
  intervalo_dias: '',
}

export default function PreventivaModal({ maquinas, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => setForm(VAZIO), [])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (!form.intervalo_horimetro && !form.intervalo_km && !form.intervalo_dias) {
      setErro('Informe pelo menos um critério: horímetro, km ou dias.')
      return
    }

    setSalvando(true)
    try {
      await onSave({
        maquina_id: Number(form.maquina_id),
        descricao: form.descricao,
        intervalo_horimetro: form.intervalo_horimetro ? Number(form.intervalo_horimetro) : null,
        intervalo_km: form.intervalo_km ? Number(form.intervalo_km) : null,
        intervalo_dias: form.intervalo_dias ? Number(form.intervalo_dias) : null,
      })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar plano de preventiva')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Novo Plano de Preventiva</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

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

          <Campo label="Descrição *">
            <input
              required
              value={form.descricao}
              onChange={(e) => atualizarCampo('descricao', e.target.value)}
              placeholder="Troca de óleo a cada 250h"
              className="input"
            />
          </Campo>

          <p className="text-xs text-gray-500">
            Informe pelo menos um critério de recorrência. Se preencher mais de um, a preventiva
            vence assim que qualquer um deles for atingido primeiro.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo label="A cada (horas)">
              <input
                type="number"
                value={form.intervalo_horimetro}
                onChange={(e) => atualizarCampo('intervalo_horimetro', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="A cada (km)">
              <input
                type="number"
                value={form.intervalo_km}
                onChange={(e) => atualizarCampo('intervalo_km', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="A cada (dias)">
              <input
                type="number"
                value={form.intervalo_dias}
                onChange={(e) => atualizarCampo('intervalo_dias', e.target.value)}
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
