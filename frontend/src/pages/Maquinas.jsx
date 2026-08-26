import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ImageOff, XCircle } from 'lucide-react'
import {
  listarMaquinas,
  criarMaquina,
  atualizarMaquina,
  excluirMaquina,
  excluirMaquinaPermanente,
  listarCentrosDespesa,
  TIPOS_MAQUINA,
  SITUACOES_MAQUINA,
} from '../services/maquinas'
import MaquinaModal from '../components/MaquinaModal'
import { useAuth } from '../services/auth'
import AcessoNegado from '../components/AcessoNegado'

const BADGE_SITUACAO = {
  ativa: 'bg-green-100 text-green-700',
  inativa: 'bg-gray-100 text-gray-500',
  manutencao: 'bg-orange-100 text-orange-700',
  baixada: 'bg-gray-100 text-gray-600',
}

export default function Maquinas() {
  const { isAdmin, isDiretor, isMecanico } = useAuth()
  const [maquinas, setMaquinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [situacao, setSituacao] = useState('')
  const [centroDespesaId, setCentroDespesaId] = useState('')
  const [centrosDespesa, setCentrosDespesa] = useState([])

  const [modalAberto, setModalAberto] = useState(false)
  const [maquinaEditando, setMaquinaEditando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await listarMaquinas({ busca, tipo, situacao, centro_despesa_id: centroDespesaId })
      setMaquinas(dados)
    } catch (err) {
      setErro('Não foi possível carregar as máquinas. Verifique se a API está rodando.')
    } finally {
      setCarregando(false)
    }
  }, [busca, tipo, situacao, centroDespesaId])

  useEffect(() => {
    const timer = setTimeout(carregar, 300) // debounce da busca
    return () => clearTimeout(timer)
  }, [carregar])

  useEffect(() => {
    listarCentrosDespesa().then(setCentrosDespesa).catch(() => setCentrosDespesa([]))
  }, [])

  function abrirNovaMaquina() {
    setMaquinaEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(maquina) {
    setMaquinaEditando(maquina)
    setModalAberto(true)
  }

  async function salvar(dados) {
    if (maquinaEditando) {
      await atualizarMaquina(maquinaEditando.id, dados)
    } else {
      await criarMaquina(dados)
    }
    setModalAberto(false)
    carregar()
  }

  async function excluir(maquina) {
    if (!confirm(`Marcar a máquina ${maquina.codigo} como inativa? O histórico vinculado será preservado.`)) return
    await excluirMaquina(maquina.id)
    carregar()
  }

  async function excluirPermanente(maquina) {
    if (
      !confirm(
        `Excluir PERMANENTEMENTE a máquina ${maquina.codigo}? Essa ação remove o registro do banco de dados e não pode ser desfeita. Use apenas para dados de teste.`
      )
    )
      return
    try {
      await excluirMaquinaPermanente(maquina.id)
      carregar()
    } catch (err) {
      alert(err.response?.data?.detail || 'Não foi possível excluir permanentemente esta máquina.')
    }
  }

  if (isDiretor || isMecanico) return <AcessoNegado mensagem="Você não tem permissão para acessar este módulo." />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Máquinas</h1>
        <button
          onClick={abrirNovaMaquina}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
        >
          <Plus size={16} /> Nova Máquina
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <FiltroSelect label="Tipo" value={tipo} onChange={setTipo} opcoes={TIPOS_MAQUINA} />
        <FiltroSelect label="Situação" value={situacao} onChange={setSituacao} opcoes={SITUACOES_MAQUINA} />
        <FiltroSelect
          label="Centro de Despesa"
          value={centroDespesaId}
          onChange={setCentroDespesaId}
          opcoes={centrosDespesa.map((c) => ({ value: c.id, label: c.nome }))}
        />
      </div>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Foto</Th>
              <Th>Código</Th>
              <Th>Nº Patrimonial</Th>
              <Th>Tipo</Th>
              <Th>Marca / Modelo</Th>
              <Th>Situação</Th>
              <Th>Centro de Despesa</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {!carregando && maquinas.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhuma máquina encontrada.</td></tr>
            )}
            {!carregando && maquinas.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <Td>
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                    <ImageOff size={14} />
                  </div>
                </Td>
                <Td className="font-medium text-gray-700">{m.codigo}</Td>
                <Td>{m.numero_patrimonial || '—'}</Td>
                <Td className="capitalize">{labelTipo(m.tipo)}</Td>
                <Td>{[m.marca, m.modelo].filter(Boolean).join(' / ') || '—'}</Td>
                <Td>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_SITUACAO[m.situacao]}`}>
                    {labelSituacao(m.situacao)}
                  </span>
                </Td>
                <Td>{centrosDespesa.find((c) => c.id === m.centro_despesa_id)?.nome || '—'}</Td>
                <Td className="text-right">
                  {isAdmin ? (
                    <>
                      <button onClick={() => abrirEdicao(m)} className="text-gray-400 hover:text-primary mr-3" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => excluir(m)} className="text-gray-400 hover:text-red-600 mr-3" title="Marcar como inativa">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => excluirPermanente(m)} className="text-gray-300 hover:text-red-700" title="Excluir permanentemente (uso restrito a dados de teste)">
                        <XCircle size={16} />
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-300 text-xs">Somente admin</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <MaquinaModal
          maquina={maquinaEditando}
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
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px]"
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

function labelTipo(tipo) {
  return TIPOS_MAQUINA.find((t) => t.value === tipo)?.label || tipo
}

function labelSituacao(situacao) {
  return SITUACOES_MAQUINA.find((s) => s.value === situacao)?.label || situacao
}
