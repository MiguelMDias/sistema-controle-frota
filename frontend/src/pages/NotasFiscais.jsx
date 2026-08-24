import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { listarMaquinas } from '../services/maquinas'
import { api } from '../services/api'
import {
  listarNotasFiscais,
  criarNotaFiscal,
  atualizarNotaFiscal,
  excluirNotaFiscal,
  labelTipoNota,
  TIPOS_NOTA,
} from '../services/notasFiscais'
import NotaFiscalModal from '../components/NotaFiscalModal'
import { useAuth } from '../services/auth'

export default function NotasFiscais() {
  const { isAdmin } = useAuth()
  const [notas, setNotas] = useState([])
  const [maquinas, setMaquinas] = useState([])
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [maquinaId, setMaquinaId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    listarMaquinas().then(setMaquinas).catch(() => {})
    api.get('/fornecedores').then((r) => setFornecedores(r.data)).catch(() => {})
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await listarNotasFiscais({
        busca: busca || undefined,
        tipo: tipo || undefined,
        maquina_id: maquinaId || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
      })
      setNotas(dados)
    } finally {
      setCarregando(false)
    }
  }, [busca, tipo, maquinaId, dataInicio, dataFim])

  useEffect(() => {
    const timer = setTimeout(carregar, 300)
    return () => clearTimeout(timer)
  }, [carregar])

  async function salvar(payload) {
    if (editando) await atualizarNotaFiscal(editando.id, payload)
    else await criarNotaFiscal(payload)
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  async function excluir(n) {
    if (!confirm(`Excluir a nota fiscal ${n.numero}?`)) return
    await excluirNotaFiscal(n.id)
    carregar()
  }

  const total = notas.reduce((soma, n) => soma + (n.valor_total || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Notas Fiscais</h1>
        <button
          onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
        >
          <Plus size={16} /> Nova Nota Fiscal
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar por número"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <FiltroSelect label="Tipo" value={tipo} onChange={setTipo} opcoes={TIPOS_NOTA} />
        <FiltroSelect label="Máquina" value={maquinaId} onChange={setMaquinaId}
          opcoes={maquinas.map((m) => ({ value: m.id, label: m.codigo }))} />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Período de</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">até</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>

      {!carregando && (
        <p className="text-sm text-gray-500 mb-3">
          Total no filtro atual: {notas.length} nota(s) — {formatarMoeda(total)}
        </p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Número / Série</Th><Th>Data Emissão</Th><Th>Fornecedor</Th>
              <Th>Tipo</Th><Th>Valor Total</Th><Th>Máquinas</Th><Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!carregando && notas.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma nota fiscal encontrada.</td></tr>
            )}
            {!carregando && notas.map((n) => (
              <tr key={n.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700">{n.numero} / {n.serie}</Td>
                <Td>{formatarData(n.data_emissao)}</Td>
                <Td>{n.fornecedor_nome || '—'}</Td>
                <Td>{labelTipoNota(n.tipo)}</Td>
                <Td>{formatarMoeda(n.valor_total)}</Td>
                <Td>{n.maquinas.length > 0 ? n.maquinas.join(', ') : '—'}</Td>
                <Td className="text-right">
                  <button onClick={() => { setEditando(n); setModalAberto(true) }} className="text-gray-400 hover:text-primary mr-3">
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => excluir(n)} className="text-gray-400 hover:text-red-600">
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
        <NotaFiscalModal
          nota={editando}
          maquinas={maquinas}
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
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]"
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
