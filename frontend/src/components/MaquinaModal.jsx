import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  TIPOS_MAQUINA,
  SITUACOES_MAQUINA,
  ANO_MINIMO,
  ANO_MAXIMO,
  listarCentrosDespesa,
} from '../services/maquinas'

const VAZIO = {
  codigo: '',
  numero_patrimonial: '',
  numero_serie: '',
  tipo: 'carro',
  marca: '',
  modelo: '',
  ano: '',
  situacao: 'ativa',
  centro_despesa_id: '',
  responsavel: '',
}

export default function MaquinaModal({ maquina, onClose, onSave }) {
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [centrosDespesa, setCentrosDespesa] = useState([])

  useEffect(() => {
    listarCentrosDespesa().then(setCentrosDespesa).catch(() => setCentrosDespesa([]))
  }, [])

  useEffect(() => {
    if (maquina) {
      setForm({ ...VAZIO, ...maquina, ano: maquina.ano ?? '', centro_despesa_id: maquina.centro_despesa_id ?? '' })
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

    if (form.ano && (Number(form.ano) < ANO_MINIMO || Number(form.ano) > ANO_MAXIMO)) {
      setErro(`Ano deve estar entre ${ANO_MINIMO} e ${ANO_MAXIMO}`)
      return
    }

    setSalvando(true)
    try {
      const payload = {
        ...form,
        ano: form.ano ? Number(form.ano) : null,
        numero_patrimonial: form.numero_patrimonial || null,
        numero_serie: form.numero_serie || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        centro_despesa_id: form.centro_despesa_id ? Number(form.centro_despesa_id) : null,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                maxLength={30}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Marca">
              <input
                value={form.marca}
                onChange={(e) => atualizarCampo('marca', e.target.value)}
                maxLength={20}
                className="input"
              />
            </Campo>
            <Campo label="Modelo">
              <input
                value={form.modelo}
                onChange={(e) => atualizarCampo('modelo', e.target.value)}
                maxLength={20}
                className="input"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Ano">
              <input
                type="number"
                value={form.ano}
                onChange={(e) => atualizarCampo('ano', e.target.value)}
                min={ANO_MINIMO}
                max={ANO_MAXIMO}
                placeholder={`${ANO_MINIMO} - ${ANO_MAXIMO}`}
                className="input"
              />
            </Campo>
            <Campo label="Nº de Série">
              <input
                value={form.numero_serie}
                onChange={(e) => atualizarCampo('numero_serie', e.target.value)}
                maxLength={30}
                placeholder="Nº de série do fabricante"
                className="input"
              />
            </Campo>
          </div>

          <Campo label="Centro de Despesa">
            <select
              value={form.centro_despesa_id}
              onChange={(e) => atualizarCampo('centro_despesa_id', e.target.value)}
              className="input"
            >
              <option value="">Selecione...</option>
              {centrosDespesa.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </Campo>

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
