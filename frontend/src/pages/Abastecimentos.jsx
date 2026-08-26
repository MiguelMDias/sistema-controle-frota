import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, Gauge } from 'lucide-react'
import { listarMaquinas } from '../services/maquinas'
import { api } from '../services/api'
import {
  listarAbastecimentos,
  criarAbastecimento,
  atualizarAbastecimento,
  excluirAbastecimento,
  calcularConsumo,
  TIPOS_COMBUSTIVEL,
  labelTipoCombustivel,
  unidadeQuantidade,
} from '../services/abastecimentos'
import AbastecimentoModal from '../components/AbastecimentoModal'
import { useAuth } from '../services/auth'
import AcessoNegado from '../components/AcessoNegado'

export default function Abastecimentos() {
  const { isAdmin, isDiretor } = useAuth()
  const location = useLocation()
  const [abastecimentos, setAbastecimentos] = useState([])
  const [maquinas, setMaquinas] = useState([])
  const [maquinasDisponiveis, setMaquinasDisponiveis] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [maquinaId, setMaquinaId] = useState('')
  const [tipoCombustivel, setTipoCombustivel] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [consumo, setConsumo] = useState(null)

  // Atalho rápido do Dashboard ("Novo Abastecimento") já abre o formulário direto
  useEffect(() => {
    if (location.state?.abrirNovo) {
      setModalAberto(true)
      window.history.replaceState({}, document.title) // limpa o state pra não reabrir num F5
    }
  }, [location.state])

  useEffect(() => {
    // lista completa: usada nos filtros (permite ver histórico de máquinas inativas/baixadas)
    listarMaquinas().then(setMaquinas).catch(() => {})
    // só máquinas ativas/em manutenção: usada no formulário de novo lançamento
    listarMaquinas({ apenas_disponiveis: true }).then(setMaquinasDisponiveis).catch(() => {})
    api.get('/fornecedores').then((r) => setFornecedores(r.data)).catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await listarAbastecimentos({
        maquina_id: maquinaId || undefined,
        tipo_combustivel: tipoCombustivel || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      })
      setAbastecimentos(dados)
    } finally {
      setCarregando(false)
    }
  }, [maquinaId, tipoCombustivel, dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    if (maquinaId) {
      calcularConsumo(maquinaId).then(setConsumo).catch(() => setConsumo(null))
    } else {
      setConsumo(null)
    }
  }, [maquinaId])

  async function salvar(payload) {
    if (editando) await atualizarAbastecimento(editando.id, payload)
    else await criarAbastecimento(payload)
    setModalAberto(false)
    setEditando(null)
    carregar()
    if (maquinaId) calcularConsumo(maquinaId).then(setConsumo).catch(() => {})
  }

  async function excluir(a) {
    if (!confirm('Excluir este abastecimento?')) return
    await excluirAbastecimento(a.id)
    carregar()
  }

  const totalPeriodo = abastecimentos.reduce((soma, a) => soma + (a.valor_total || 0), 0)

  if (isDiretor) return <AcessoNegado mensagem="Diretores têm acesso somente ao Dashboard, Financeiro e Relatórios." />

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Abastecimentos</h1>
        <button
          onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium hover:bg-primary-dark w-full sm:w-auto"
        >
          <Plus size={16} /> Novo Abastecimento
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-4">
        <FiltroSelect label="Máquina" value={maquinaId} onChange={setMaquinaId}
          opcoes={maquinas.map((m) => ({ value: m.id, label: m.codigo }))} />
        <FiltroSelect label="Tipo de Combustível" value={tipoCombustivel} onChange={setTipoCombustivel}
          opcoes={TIPOS_COMBUSTIVEL} />
        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-xs text-gray-500">Período de</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm w-full sm:w-auto" />
        </label>
        <label className="flex flex-col gap-1 w-full sm:w-auto">
          <span className="text-xs text-gray-500">até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm w-full sm:w-auto" />
        </label>
      </div>

      {consumo && (
        <div className="flex items-center gap-3 bg-indigo-50 text-primary text-sm px-4 py-3 rounded-lg mb-4">
          <Gauge size={18} />
          {consumo.consumo_medio != null ? (
            <span>
              Consumo médio de <strong>{consumo.maquina_codigo}</strong>: {consumo.consumo_medio} {consumo.unidade}
            </span>
          ) : (
            <span>{consumo.mensagem}</span>
          )}
        </div>
      )}

      {!carregando && abastecimentos.length > 0 && (
        <p className="text-sm text-gray-500 mb-3">
          {abastecimentos.length} abastecimento(s) — total {formatarMoeda(totalPeriodo)}
        </p>
      )}

      {/* Cartões -- só no mobile, um registro por bloco com o essencial */}
      <div className="md:hidden space-y-3">
        {carregando && <p className="text-center py-8 text-gray-400 text-sm">Carregando...</p>}
        {!carregando && abastecimentos.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">Nenhum abastecimento encontrado.</p>
        )}
        {!carregando && abastecimentos.map((a) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-800">{a.maquina_codigo}</p>
                <span className="inline-block text-xs font-medium text-primary bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
                  {labelTipoCombustivel(a.tipo_combustivel)}
                </span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{formatarData(a.data)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">{a.quantidade} {unidadeQuantidade(a.tipo_combustivel)}</span>
              <span className="font-semibold text-gray-800">{formatarMoeda(a.valor_total)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{a.fornecedor_nome || 'Sem fornecedor'}</span>
              <div className="flex gap-4">
                <button onClick={() => { setEditando(a); setModalAberto(true) }} className="text-gray-400 hover:text-primary p-1">
                  <Pencil size={17} />
                </button>
                {isAdmin && (
                  <button onClick={() => excluir(a)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela -- só no desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Data</Th><Th>Máquina</Th><Th>Combustível</Th><Th>Quantidade</Th>
              <Th>Valor</Th><Th>Fornecedor</Th><Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!carregando && abastecimentos.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum abastecimento encontrado.</td></tr>
            )}
            {!carregando && abastecimentos.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td>{formatarData(a.data)}</Td>
                <Td className="font-medium text-gray-700">{a.maquina_codigo}</Td>
                <Td>{labelTipoCombustivel(a.tipo_combustivel)}</Td>
                <Td>{a.quantidade} {unidadeQuantidade(a.tipo_combustivel)}</Td>
                <Td>{formatarMoeda(a.valor_total)}</Td>
                <Td>{a.fornecedor_nome || '—'}</Td>
                <Td className="text-right">
                  <button onClick={() => { setEditando(a); setModalAberto(true) }} className="text-gray-400 hover:text-primary mr-3">
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => excluir(a)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <AbastecimentoModal
          abastecimento={editando}
          maquinas={editando ? maquinas : maquinasDisponiveis}
          fornecedores={fornecedores}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
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
        className="border border-gray-200 rounded-lg px-3 py-2.5 sm:py-2 text-sm bg-white w-full sm:w-auto sm:min-w-[160px]"
      >
        <option value="">Todos</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
