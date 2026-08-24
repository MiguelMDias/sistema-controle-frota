import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2, ImageOff } from 'lucide-react'
import {
  listarMaquinas,
  criarMaquina,
  atualizarMaquina,
  excluirMaquina,
  TIPOS_MAQUINA,
  SITUACOES_MAQUINA,
} from '../services/maquinas'
import MaquinaModal from '../components/MaquinaModal'
import { useAuth } from '../services/auth'

const BADGE_SITUACAO = {
  ativa: 'bg-green-100 text-green-700',
  manutencao: 'bg-orange-100 text-orange-700',
  baixada: 'bg-gray-100 text-gray-600',
}

export default function Maquinas() {
  const { isAdmin } = useAuth()
  const [maquinas, setMaquinas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('')
  const [situacao, setSituacao] = useState('')

  const [modalAberto, setModalAberto] = useState(false)
  const [maquinaEditando, setMaquinaEditando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await listarMaquinas({ busca, tipo, situacao })
      setMaquinas(dados)
    } catch (err) {
      setErro('Não foi possível carregar as máquinas. Verifique se a API está rodando.')
    } finally {
      setCarregando(false)
    }
  }, [busca, tipo, situacao])

  useEffect(() => {
    const timer = setTimeout(carregar, 300) // debounce da busca
    return () => clearTimeout(timer)
  }, [carregar])

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
    if (!confirm(`Excluir a máquina ${maquina.codigo}? Essa ação não pode ser desfeita.`)) return
    await excluirMaquina(maquina.id)
    carregar()
  }

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

      <div className="flex gap-4 mb-6">
        <FiltroSelect label="Tipo" value={tipo} onChange={setTipo} opcoes={TIPOS_MAQUINA} />
        <FiltroSelect label="Situação" value={situacao} onChange={setSituacao} opcoes={SITUACOES_MAQUINA} />
      </div>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <Th>Foto</Th>
              <Th>Código</Th>
              <Th>Nº Patrimonial</Th>
              <Th>Tipo</Th>
              <Th>Marca / Modelo</Th>
              <Th>Situação</Th>
              <Th>Centro de Custo</Th>
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
                <Td>{m.centro_custo || '—'}</Td>
                <Td className="text-right">
                  <button onClick={() => abrirEdicao(m)} className="text-gray-400 hover:text-primary mr-3">
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
