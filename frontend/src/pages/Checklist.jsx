import { useEffect, useState, useCallback } from 'react'
import { Plus, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { listarMaquinas } from '../services/maquinas'
import { listarModelos, criarModelo, listarExecucoes, registrarExecucao } from '../services/checklist'
import ModeloChecklistModal from '../components/ModeloChecklistModal'
import ExecutarChecklistModal from '../components/ExecutarChecklistModal'
import { useAuth } from '../services/auth'
import AcessoNegado from '../components/AcessoNegado'

export default function Checklist() {
  const { isDiretor } = useAuth()
  const [maquinas, setMaquinas] = useState([])
  const [maquinasDisponiveis, setMaquinasDisponiveis] = useState([])
  const [modelos, setModelos] = useState([])
  const [execucoes, setExecucoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [maquinaId, setMaquinaId] = useState('')
  const [apenasPendencia, setApenasPendencia] = useState(false)

  const [modalModelo, setModalModelo] = useState(false)
  const [executando, setExecutando] = useState(null) // { maquina, modelo }

  useEffect(() => {
    // lista completa: usada no filtro (permite ver histórico de máquinas inativas/baixadas)
    listarMaquinas().then(setMaquinas).catch(() => {})
    // só ativas/em manutenção: são as únicas que podem executar um novo checklist
    listarMaquinas({ apenas_disponiveis: true }).then(setMaquinasDisponiveis).catch(() => {})
    listarModelos().then(setModelos).catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await listarExecucoes({ maquina_id: maquinaId || undefined, apenas_com_pendencia: apenasPendencia })
      setExecucoes(dados)
    } finally {
      setCarregando(false)
    }
  }, [maquinaId, apenasPendencia])

  useEffect(() => { carregar() }, [carregar])

  async function salvarModelo(payload) {
    await criarModelo(payload)
    setModalModelo(false)
    listarModelos().then(setModelos)
  }

  async function salvarExecucao(payload) {
    await registrarExecucao(payload)
    setExecutando(null)
    carregar()
  }

  function iniciarExecucao(maquina) {
    const modeloDaMaquina = modelos.find((m) => m.tipo_maquina === maquina.tipo)
    if (!modeloDaMaquina) {
      alert(`Não há modelo de checklist cadastrado para o tipo "${maquina.tipo}". Crie um modelo primeiro.`)
      return
    }
    setExecutando({ maquina, modelo: modeloDaMaquina })
  }

  if (isDiretor) return <AcessoNegado mensagem="Diretores têm acesso somente ao Dashboard, Financeiro e Relatórios." />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Checklist</h1>
        <button
          onClick={() => setModalModelo(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium hover:bg-primary-dark w-full sm:w-auto"
        >
          <Plus size={16} /> Novo Modelo
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <h3 className="font-medium text-gray-700 mb-3">Executar checklist agora</h3>
        <div className="flex flex-wrap gap-2">
          {maquinasDisponiveis.map((m) => (
            <button
              key={m.id}
              onClick={() => iniciarExecucao(m)}
              className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm hover:bg-gray-50"
            >
              <PlayCircle size={16} className="text-primary" />
              {m.codigo}
            </button>
          ))}
          {maquinasDisponiveis.length === 0 && <p className="text-sm text-gray-400">Nenhuma máquina disponível para checklist no momento.</p>}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 mb-4">
        <FiltroSelect label="Máquina" value={maquinaId} onChange={setMaquinaId}
          opcoes={maquinas.map((m) => ({ value: m.id, label: m.codigo }))} />
        <label className="flex items-center gap-2 text-sm text-gray-600 sm:pb-2.5">
          <input type="checkbox" checked={apenasPendencia} onChange={(e) => setApenasPendencia(e.target.checked)} />
          Apenas com pendência
        </label>
      </div>

      {/* Cartões -- só no mobile, um registro por bloco com o essencial */}
      <div className="md:hidden space-y-3">
        {carregando && <p className="text-center py-8 text-gray-400 text-sm">Carregando...</p>}
        {!carregando && execucoes.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Nenhum checklist registrado ainda.</p>
        )}
        {!carregando && execucoes.map((e) => (
          <div key={e.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{e.maquina_codigo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{e.operador || 'Operador não informado'}</p>
              </div>
              {e.tem_pendencia ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                  <AlertTriangle size={12} /> Pendência
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                  <CheckCircle2 size={12} /> OK
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
              <span>{formatarDataHora(e.data)}</span>
              <span>Leitura: {e.horimetro ?? e.km ?? '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela -- só no desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Data</Th><Th>Máquina</Th><Th>Operador</Th><Th>Leitura</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!carregando && execucoes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum checklist registrado ainda.</td></tr>
            )}
            {!carregando && execucoes.map((e) => (
              <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td>{formatarDataHora(e.data)}</Td>
                <Td className="font-medium text-gray-700">{e.maquina_codigo}</Td>
                <Td>{e.operador || '—'}</Td>
                <Td>{e.horimetro ?? e.km ?? '—'}</Td>
                <Td>
                  {e.tem_pendencia ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={12} /> Com pendência
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={12} /> OK
                    </span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalModelo && (
        <ModeloChecklistModal onClose={() => setModalModelo(false)} onSave={salvarModelo} />
      )}

      {executando && (
        <ExecutarChecklistModal
          maquina={executando.maquina}
          modelo={executando.modelo}
          onClose={() => setExecutando(null)}
          onSave={salvarExecucao}
        />
      )}
    </div>
  )
}

function FiltroSelect({ label, value, onChange, opcoes }) {
  return (
    <label className="flex flex-col gap-1 w-full sm:w-auto">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm bg-white w-full sm:w-auto sm:min-w-[150px]"
      >
        <option value="">Todas</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function Th({ children }) {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

function formatarDataHora(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
