import { useEffect, useState, useCallback } from 'react'
import { Search, ShieldAlert, RotateCcw } from 'lucide-react'
import {
  listarLogs,
  listarUsuariosComLog,
  labelEntidade,
  labelAcao,
  ENTIDADES_LOG,
  ACOES_LOG,
} from '../services/logs'
import { useAuth } from '../services/auth'
import LogDetalheModal from '../components/LogDetalheModal'

const BADGE_ACAO = {
  criar: 'bg-green-100 text-green-700',
  atualizar: 'bg-blue-100 text-blue-700',
  excluir: 'bg-orange-100 text-orange-700',
  excluir_permanente: 'bg-red-100 text-red-700',
  ativar: 'bg-green-100 text-green-700',
  desativar: 'bg-gray-100 text-gray-600',
}

export default function CentralDeLogs() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [entidade, setEntidade] = useState('')
  const [acao, setAcao] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [busca, setBusca] = useState('')
  const [visualizando, setVisualizando] = useState(null)

  const carregar = useCallback(() => {
    if (!isAdmin) return
    setCarregando(true)
    setErro(null)
    listarLogs({ entidade, acao, usuario_id: usuarioId, data_inicio: dataInicio, data_fim: dataFim, busca })
      .then(setLogs)
      .catch((err) => setErro(err.response?.data?.detail || 'Não foi possível carregar o log de auditoria.'))
      .finally(() => setCarregando(false))
  }, [isAdmin, entidade, acao, usuarioId, dataInicio, dataFim, busca])

  useEffect(() => {
    if (!isAdmin) return
    const timer = setTimeout(carregar, 300) // debounce da busca
    return () => clearTimeout(timer)
  }, [carregar])

  useEffect(() => {
    if (isAdmin) listarUsuariosComLog().then(setUsuarios).catch(() => {})
  }, [isAdmin])

  function limparFiltros() {
    setEntidade('')
    setAcao('')
    setUsuarioId('')
    setDataInicio('')
    setDataFim('')
    setBusca('')
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ShieldAlert size={40} className="mb-3" />
        <p>Apenas administradores podem acessar a Central de Logs.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Central de Logs</h1>
      <p className="text-gray-500 text-sm mb-6">
        Histórico de todas as ações realizadas no sistema, para rastreabilidade das alterações.
      </p>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar na descrição..."
            className="pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
          />
        </div>

        <FiltroSelect label="Entidade" value={entidade} onChange={setEntidade} opcoes={ENTIDADES_LOG} />
        <FiltroSelect label="Ação" value={acao} onChange={setAcao} opcoes={ACOES_LOG} />
        <FiltroSelect
          label="Usuário"
          value={usuarioId}
          onChange={setUsuarioId}
          opcoes={usuarios.map((u) => ({ value: u.id, label: u.nome }))}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Período de</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>

        {(entidade || acao || usuarioId || dataInicio || dataFim || busca) && (
          <button onClick={limparFiltros} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary px-2 py-2">
            <RotateCcw size={14} /> Limpar filtros
          </button>
        )}
      </div>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Data/Hora</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Entidade</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {!carregando && logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum registro encontrado para os filtros selecionados.</td></tr>
            )}
            {!carregando && logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setVisualizando(log)}
                className="border-t border-gray-100 last:border-0 hover:bg-gray-50/50 cursor-pointer"
              >
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatarDataHora(log.created_at)}</td>
                <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">{log.usuario_nome}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${BADGE_ACAO[log.acao] || 'bg-gray-100 text-gray-600'}`}>
                    {labelAcao(log.acao)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{labelEntidade(log.entidade)}</td>
                <td className="px-4 py-2.5 text-gray-700">{log.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!carregando && logs.length >= 200 && (
        <p className="text-xs text-gray-400 mt-2">Mostrando os 200 registros mais recentes. Use os filtros para refinar a busca.</p>
      )}

      {visualizando && (
        <LogDetalheModal log={visualizando} onClose={() => setVisualizando(null)} />
      )}
    </div>
  )
}

function FiltroSelect({ label, value, onChange, opcoes }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[140px]">
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function formatarDataHora(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
