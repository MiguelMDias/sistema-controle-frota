import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { listarMaquinas } from '../services/maquinas'
import { api } from '../services/api'
import {
  listarManutencoes,
  criarManutencao,
  atualizarManutencao,
  excluirManutencao,
  listarPreventivas,
  criarPreventiva,
  excluirPreventiva,
  concluirPreventiva,
  TIPOS_MANUTENCAO,
  STATUS_MANUTENCAO,
  STATUS_PREVENTIVA,
} from '../services/manutencoes'
import ManutencaoModal from '../components/ManutencaoModal'
import PreventivaModal from '../components/PreventivaModal'
import ConcluirPreventivaModal from '../components/ConcluirPreventivaModal'
import { useAuth } from '../services/auth'

const BADGE_STATUS_PREVENTIVA = {
  vencida: 'bg-red-100 text-red-700',
  proxima: 'bg-orange-100 text-orange-700',
  em_dia: 'bg-green-100 text-green-700',
}

export default function Manutencoes() {
  const [aba, setAba] = useState('manutencoes')
  const [maquinas, setMaquinas] = useState([])
  const [maquinasDisponiveis, setMaquinasDisponiveis] = useState([])
  const [fornecedores, setFornecedores] = useState([])

  useEffect(() => {
    // lista completa: usada nos filtros (permite ver histórico de máquinas inativas/baixadas)
    listarMaquinas().then(setMaquinas).catch(() => {})
    // só máquinas ativas/em manutenção: usada nos formulários de novo lançamento
    listarMaquinas({ apenas_disponiveis: true }).then(setMaquinasDisponiveis).catch(() => {})
    api.get('/fornecedores').then((r) => setFornecedores(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Manutenções</h1>

      <div className="flex gap-6 border-b border-gray-200 mb-6">
        <AbaBotao label="Manutenções" ativa={aba === 'manutencoes'} onClick={() => setAba('manutencoes')} />
        <AbaBotao label="Preventivas" ativa={aba === 'preventivas'} onClick={() => setAba('preventivas')} />
      </div>

      {aba === 'manutencoes' ? (
        <AbaManutencoes maquinas={maquinas} maquinasDisponiveis={maquinasDisponiveis} fornecedores={fornecedores} />
      ) : (
        <AbaPreventivas maquinas={maquinas} maquinasDisponiveis={maquinasDisponiveis} fornecedores={fornecedores} />
      )}
    </div>
  )
}

function AbaBotao({ label, ativa, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
        ativa ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

// ==================== ABA MANUTENÇÕES ====================

function AbaManutencoes({ maquinas, maquinasDisponiveis, fornecedores }) {
  const { isAdmin } = useAuth()
  const [manutencoes, setManutencoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [maquinaId, setMaquinaId] = useState('')
  const [tipo, setTipo] = useState('')
  const [status, setStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await listarManutencoes({ maquina_id: maquinaId || undefined, tipo, status })
      setManutencoes(dados)
    } finally {
      setCarregando(false)
    }
  }, [maquinaId, tipo, status])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(payload) {
    if (editando) await atualizarManutencao(editando.id, payload)
    else await criarManutencao(payload)
    setModalAberto(false)
    setEditando(null)
    carregar()
  }

  async function excluir(m) {
    if (!confirm('Excluir este registro de manutenção?')) return
    await excluirManutencao(m.id)
    carregar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <FiltroSelect label="Máquina" value={maquinaId} onChange={setMaquinaId}
            opcoes={maquinas.map((m) => ({ value: m.id, label: m.codigo }))} />
          <FiltroSelect label="Tipo" value={tipo} onChange={setTipo} opcoes={TIPOS_MANUTENCAO} />
          <FiltroSelect label="Status" value={status} onChange={setStatus} opcoes={STATUS_MANUTENCAO} />
        </div>
        <button
          onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark shrink-0"
        >
          <Plus size={16} /> Nova Manutenção
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Data</Th><Th>Máquina</Th><Th>Tipo</Th><Th>Descrição</Th>
              <Th>Horímetro/Km</Th><Th>Custo</Th><Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!carregando && manutencoes.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma manutenção encontrada.</td></tr>
            )}
            {!carregando && manutencoes.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td>{formatarData(m.data)}</Td>
                <Td className="font-medium text-gray-700">{m.maquina_codigo}</Td>
                <Td className="capitalize">{m.tipo}</Td>
                <Td className="max-w-xs truncate" title={m.descricao}>{m.descricao}</Td>
                <Td>{m.horimetro ?? m.km ?? '—'}</Td>
                <Td>{m.custo != null ? formatarMoeda(m.custo) : '—'}</Td>
                <Td className="text-right">
                  <button onClick={() => { setEditando(m); setModalAberto(true) }} className="text-gray-400 hover:text-primary mr-3">
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => excluir(m)} className="text-gray-400 hover:text-red-600">
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
        <ManutencaoModal
          manutencao={editando}
          maquinas={editando ? maquinas : maquinasDisponiveis}
          fornecedores={fornecedores}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
        />
      )}
    </div>
  )
}

// ==================== ABA PREVENTIVAS ====================

function AbaPreventivas({ maquinas, maquinasDisponiveis, fornecedores }) {
  const { isAdmin } = useAuth()
  const [preventivas, setPreventivas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [maquinaId, setMaquinaId] = useState('')
  const [status, setStatus] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [concluindo, setConcluindo] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const dados = await listarPreventivas({ maquina_id: maquinaId || undefined, status })
      setPreventivas(dados)
    } finally {
      setCarregando(false)
    }
  }, [maquinaId, status])

  useEffect(() => { carregar() }, [carregar])

  async function salvar(payload) {
    await criarPreventiva(payload)
    setModalAberto(false)
    carregar()
  }

  async function excluir(p) {
    if (!confirm('Excluir este plano de preventiva?')) return
    await excluirPreventiva(p.id)
    carregar()
  }

  async function handleConcluir(id, payload) {
    await concluirPreventiva(id, payload)
    setConcluindo(null)
    carregar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <FiltroSelect label="Máquina" value={maquinaId} onChange={setMaquinaId}
            opcoes={maquinas.map((m) => ({ value: m.id, label: m.codigo }))} />
          <FiltroSelect label="Status" value={status} onChange={setStatus} opcoes={STATUS_PREVENTIVA} />
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark shrink-0"
        >
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Máquina</Th><Th>Descrição</Th><Th>Próxima Data</Th>
              <Th>Próximo Horímetro</Th><Th>Próximo Km</Th><Th>Status</Th><Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>}
            {!carregando && preventivas.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum plano de preventiva cadastrado.</td></tr>
            )}
            {!carregando && preventivas.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700">{p.maquina_codigo}</Td>
                <Td>{p.descricao}</Td>
                <Td>{p.proxima_data ? formatarData(p.proxima_data) : '—'}</Td>
                <Td>{p.proximo_horimetro ?? '—'}</Td>
                <Td>{p.proximo_km ?? '—'}</Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STATUS_PREVENTIVA[p.status_calculado]}`}>
                    {labelStatusPreventiva(p.status_calculado)}
                  </span>
                </Td>
                <Td className="text-right">
                  <button onClick={() => setConcluindo(p)} className="text-gray-400 hover:text-green-600 mr-3" title="Concluir">
                    <CheckCircle2 size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => excluir(p)} className="text-gray-400 hover:text-red-600">
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
        <PreventivaModal
          maquinas={maquinasDisponiveis}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
        />
      )}

      {concluindo && (
        <ConcluirPreventivaModal
          plano={concluindo}
          fornecedores={fornecedores}
          onClose={() => setConcluindo(null)}
          onConcluir={handleConcluir}
        />
      )}
    </div>
  )
}

// ==================== helpers compartilhados ====================

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

function labelStatusPreventiva(status) {
  return STATUS_PREVENTIVA.find((s) => s.value === status)?.label || status
}
