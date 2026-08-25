import { useState } from 'react'
import { X } from 'lucide-react'

export default function ExecutarChecklistModal({ maquina, modelo, onClose, onSave }) {
  const usaKm = maquina.tipo === 'carro'
  const [operador, setOperador] = useState('')
  const [leitura, setLeitura] = useState('')
  const [respostas, setRespostas] = useState(
    modelo.itens.map((it) => ({ item: it.item, ok: true, obs: '' }))
  )
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  function atualizarResposta(index, campo, valor) {
    setRespostas((lista) => lista.map((r, i) => (i === index ? { ...r, [campo]: valor } : r)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await onSave({
        maquina_id: maquina.id,
        modelo_id: modelo.id,
        operador: operador || null,
        horimetro: !usaKm && leitura !== '' ? Number(leitura) : null,
        km: usaKm && leitura !== '' ? Number(leitura) : null,
        respostas,
      })
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao registrar checklist')
    } finally {
      setSalvando(false)
    }
  }

  const temPendencia = respostas.some((r) => !r.ok)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{modelo.nome}</h2>
            <p className="text-sm text-gray-500">{maquina.codigo}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Operador</span>
              <input value={operador} onChange={(e) => setOperador(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">{usaKm ? 'Km atual' : 'Horímetro atual'}</span>
              <input type="number" step="0.1" value={leitura} onChange={(e) => setLeitura(e.target.value)} className="input" />
            </label>
          </div>

          <div className="space-y-2">
            {respostas.map((r, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{r.item}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => atualizarResposta(index, 'ok', true)}
                      className={`px-3 py-1 text-xs rounded-full ${r.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      onClick={() => atualizarResposta(index, 'ok', false)}
                      className={`px-3 py-1 text-xs rounded-full ${!r.ok ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}
                    >
                      Pendência
                    </button>
                  </div>
                </div>
                {!r.ok && (
                  <input
                    value={r.obs}
                    onChange={(e) => atualizarResposta(index, 'obs', e.target.value)}
                    placeholder="Descreva a pendência..."
                    className="input text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          {temPendencia && (
            <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              Este checklist será salvo com pendência(s) sinalizada(s).
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Finalizar Checklist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
