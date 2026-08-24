import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TIPOS_MAQUINA, SITUACOES_MAQUINA } from '../services/maquinas'

const VAZIO = {
  codigo: '',
  numero_patrimonial: '',
  tipo: 'carro',
  marca: '',
  modelo: '',
  ano: '',
  situacao: 'ativa',
  centro_custo: '',
  responsavel: '',
}

export default function MaquinaModal({ maquina, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (maquina) {
      setForm({ ...VAZIO, ...maquina, ano: maquina.ano ?? '' })
    } else {
      setForm(VAZIO)
    }
  }, [maquina])

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
        ano: form.ano ? Number(form.ano) : null,
        numero_patrimonial: form.numero_patrimonial || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        centro_custo: form.centro_custo || null,
        responsavel: form.responsavel || null,
      }
      await onSave(payload)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao salvar máquina')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {maquina ? 'Editar Máquina' : 'Nova Máquina'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Código *">
              <input
                required
                value={form.codigo}
                onChange={(e) => atualizarCampo('codigo', e.target.value)}
                placeholder="MAQ-0012"
                className="input"
              />
            </Campo>
            <Campo label="Nº Patrimonial / Placa">
              <input
                value={form.numero_patrimonial}
                onChange={(e) => atualizarCampo('numero_patrimonial', e.target.value)}
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
                {TIPOS_MAQUINA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Situação *">
              <select
                required
                value={form.situacao}
                onChange={(e) => atualizarCampo('situacao', e.target.value)}
                className="input"
              >
                {SITUACOES_MAQUINA.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Marca">
              <input
                value={form.marca}
                onChange={(e) => atualizarCampo('marca', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Modelo">
              <input
                value={form.modelo}
                onChange={(e) => atualizarCampo('modelo', e.target.value)}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Ano">
              <input
                type="number"
                value={form.ano}
                onChange={(e) => atualizarCampo('ano', e.target.value)}
                className="input"
              />
            </Campo>
            <Campo label="Centro de Custo">
              <input
                value={form.centro_custo}
                onChange={(e) => atualizarCampo('centro_custo', e.target.value)}
                placeholder="Logística, Mecânico, Geral..."
                className="input"
              />
            </Campo>
          </div>

          <Campo label="Responsável">
            <input
              value={form.responsavel}
              onChange={(e) => atualizarCampo('responsavel', e.target.value)}
              placeholder="Nome do colaborador (para carros de uso individual)"
              className="input"
            />
          </Campo>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
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
