import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Power, ArrowUp, ArrowDown } from 'lucide-react'
import {
  buscarVisaoGeral,
  buscarCustoPorMaquina,
  buscarCustoPorMes,
  buscarComparacaoPeriodos,
  buscarComparacaoCentros,
  atualizarCentroDespesa,
  alternarSituacaoCentroDespesa,
  NOMES_MESES,
  formatarMoeda,
} from '../services/financeiro'
import { listarCentrosDespesa, criarCentroDespesa } from '../services/maquinas'
import { useAuth } from '../services/auth'
import { useDialogo } from '../components/DialogoProvider'

const HOJE = new Date()
const INICIO_MES = new Date(HOJE.getFullYear(), HOJE.getMonth(), 1).toISOString().slice(0, 10)
const FIM_MES = new Date(HOJE.getFullYear(), HOJE.getMonth() + 1, 0).toISOString().slice(0, 10)

const ABAS = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'centros', label: 'Centros de Despesa' },
  { id: 'por-maquina', label: 'Custo por Máquina' },
  { id: 'por-mes', label: 'Custo por Mês' },
  { id: 'comparacoes', label: 'Comparações' },
]

export default function Financeiro() {
  const [aba, setAba] = useState('visao-geral')

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Financeiro</h1>
      <p className="text-gray-500 text-sm mb-6">
        Gestão de custos da frota: centros de despesa, custo por máquina, por período e comparações.
      </p>

      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
        {ABAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              aba === a.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'visao-geral' && <AbaVisaoGeral />}
      {aba === 'centros' && <AbaCentrosDespesa />}
      {aba === 'por-maquina' && <AbaCustoPorMaquina />}
      {aba === 'por-mes' && <AbaCustoPorMes />}
      {aba === 'comparacoes' && <AbaComparacoes />}
    </div>
  )
}

// ==================== Visão Geral ====================

function AbaVisaoGeral() {
  const [dataInicio, setDataInicio] = useState(INICIO_MES)
  const [dataFim, setDataFim] = useState(FIM_MES)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(() => {
    setCarregando(true)
    buscarVisaoGeral(dataInicio, dataFim).then(setDados).finally(() => setCarregando(false))
  }, [dataInicio, dataFim])

  useEffect(() => { carregar() }, [carregar])

  return (
    <div>
      <SeletorPeriodo dataInicio={dataInicio} dataFim={dataFim} onChangeInicio={setDataInicio} onChangeFim={setDataFim} />

      {carregando ? (
        <p className="text-gray-400 text-sm mt-6">Carregando...</p>
      ) : dados && (
        <div className="mt-6 border border-gray-200 rounded-xl divide-y divide-gray-100">
          <LinhaResumo label="Manutenção" valor={formatarMoeda(dados.manutencao)} />
          <LinhaResumo label="Abastecimento" valor={formatarMoeda(dados.abastecimento)} />
          <LinhaResumo label="Notas Fiscais" valor={formatarMoeda(dados.nota_fiscal)} />
          <LinhaResumo label="Total do período" valor={formatarMoeda(dados.total)} destaque />
          <LinhaResumo label="Máquinas ativas/em manutenção" valor={dados.num_maquinas_ativas} />
          <LinhaResumo label="Custo médio por máquina" valor={formatarMoeda(dados.custo_medio_por_maquina)} />
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">
        Para o detalhamento por máquina, por mês ou comparações, use as abas acima.
      </p>
    </div>
  )
}

function LinhaResumo({ label, valor, destaque }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className={`text-sm ${destaque ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{label}</span>
      <span className={destaque ? 'text-lg font-semibold text-gray-900' : 'text-sm text-gray-700'}>{valor}</span>
    </div>
  )
}

// ==================== Centros de Despesa ====================

function AbaCentrosDespesa() {
  const { isAdmin } = useAuth()
  const { confirmar } = useDialogo()
  const [centros, setCentros] = useState([])
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [editandoNome, setEditandoNome] = useState('')

  const carregar = useCallback(() => {
    setCarregando(true)
    listarCentrosDespesa(mostrarInativos).then(setCentros).finally(() => setCarregando(false))
  }, [mostrarInativos])

  useEffect(() => { carregar() }, [carregar])

  async function criar(e) {
    e.preventDefault()
    setErro(null)
    if (!novoNome.trim()) return
    try {
      await criarCentroDespesa(novoNome.trim())
      setNovoNome('')
      carregar()
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar centro de despesa')
    }
  }

  async function salvarEdicao(id) {
    setErro(null)
    try {
      await atualizarCentroDespesa(id, editandoNome.trim())
      setEditandoId(null)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao editar centro de despesa')
    }
  }

  async function alternarSituacao(centro) {
    const acao = centro.ativo ? 'desativar' : 'ativar'
    const ok = await confirmar({
      titulo: centro.ativo ? 'Desativar centro de despesa' : 'Ativar centro de despesa',
      mensagem: `Quer mesmo ${acao} "${centro.nome}"?`,
      textoConfirmar: centro.ativo ? 'Desativar' : 'Ativar',
      perigo: centro.ativo,
    })
    if (!ok) return
    try {
      await alternarSituacaoCentroDespesa(centro.id, !centro.ativo)
      carregar()
    } catch (err) {
      setErro(err.response?.data?.detail || `Erro ao ${acao} centro de despesa`)
    }
  }

  return (
    <div>
      {isAdmin && (
        <form onSubmit={criar} className="flex gap-2 mb-4 max-w-md">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            maxLength={50}
            placeholder="Nome do novo centro de despesa"
            className="input"
          />
          <button type="submit" className="flex items-center gap-1.5 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark shrink-0">
            <Plus size={16} /> Criar
          </button>
        </form>
      )}

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4 max-w-md">{erro}</div>}

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} className="rounded" />
        Mostrar inativos
      </label>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              {isAdmin && <th className="px-4 py-3 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={3} className="text-center py-6 text-gray-400">Carregando...</td></tr>}
            {!carregando && centros.length === 0 && (
              <tr><td colSpan={3} className="text-center py-6 text-gray-400">Nenhum centro de despesa cadastrado.</td></tr>
            )}
            {!carregando && centros.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2.5">
                  {editandoId === c.id ? (
                    <input
                      value={editandoNome}
                      onChange={(e) => setEditandoNome(e.target.value)}
                      maxLength={50}
                      autoFocus
                      className="input py-1"
                    />
                  ) : (
                    c.nome
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-2.5 text-right">
                    {editandoId === c.id ? (
                      <>
                        <button onClick={() => salvarEdicao(c.id)} className="text-primary text-xs font-medium mr-3">Salvar</button>
                        <button onClick={() => setEditandoId(null)} className="text-gray-400 text-xs">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditandoId(c.id); setEditandoNome(c.nome) }}
                          className="text-gray-400 hover:text-primary mr-3"
                          title="Editar nome"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => alternarSituacao(c)}
                          className={`hover:text-primary ${c.ativo ? 'text-gray-400' : 'text-green-600'}`}
                          title={c.ativo ? 'Desativar' : 'Ativar'}
                        >
                          <Power size={15} />
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Custo por Máquina ====================

function AbaCustoPorMaquina() {
  const [dataInicio, setDataInicio] = useState(INICIO_MES)
  const [dataFim, setDataFim] = useState(FIM_MES)
  const [centroDespesaId, setCentroDespesaId] = useState('')
  const [centrosDespesa, setCentrosDespesa] = useState([])
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => { listarCentrosDespesa().then(setCentrosDespesa).catch(() => {}) }, [])

  useEffect(() => {
    setCarregando(true)
    buscarCustoPorMaquina(dataInicio, dataFim, centroDespesaId || undefined)
      .then(setLinhas)
      .finally(() => setCarregando(false))
  }, [dataInicio, dataFim, centroDespesaId])

  const totalGeral = linhas.reduce((s, l) => s + l.total, 0)

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <SeletorPeriodo dataInicio={dataInicio} dataFim={dataFim} onChangeInicio={setDataInicio} onChangeFim={setDataFim} />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Centro de Despesa</span>
          <select value={centroDespesaId} onChange={(e) => setCentroDespesaId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Todos</option>
            {centrosDespesa.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Máquina</th>
              <th className="px-4 py-3 font-medium">Centro de Despesa</th>
              <th className="px-4 py-3 font-medium text-right">Manutenção</th>
              <th className="px-4 py-3 font-medium text-right">Abastecimento</th>
              <th className="px-4 py-3 font-medium text-right">Notas Fiscais</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={6} className="text-center py-6 text-gray-400">Carregando...</td></tr>}
            {!carregando && linhas.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">Nenhum custo no período selecionado.</td></tr>
            )}
            {!carregando && linhas.map((l) => (
              <tr key={l.maquina_id ?? 'sem-maquina'} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-700">{l.codigo}</td>
                <td className="px-4 py-2.5 text-gray-600">{l.centro_despesa_nome || '—'}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.manutencao)}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.abastecimento)}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.nota_fiscal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatarMoeda(l.total)}</td>
              </tr>
            ))}
          </tbody>
          {!carregando && linhas.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={5} className="px-4 py-2.5 font-medium text-gray-700 text-right">Total geral</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatarMoeda(totalGeral)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ==================== Custo por Mês ====================

function AbaCustoPorMes() {
  const [ano, setAno] = useState(HOJE.getFullYear())
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    buscarCustoPorMes(ano).then(setLinhas).finally(() => setCarregando(false))
  }, [ano])

  const totalAno = linhas.reduce((s, l) => s + l.total, 0)

  return (
    <div>
      <label className="flex flex-col gap-1 mb-4 w-32">
        <span className="text-xs text-gray-500">Ano</span>
        <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </label>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Mês</th>
              <th className="px-4 py-3 font-medium text-right">Manutenção</th>
              <th className="px-4 py-3 font-medium text-right">Abastecimento</th>
              <th className="px-4 py-3 font-medium text-right">Notas Fiscais</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={5} className="text-center py-6 text-gray-400">Carregando...</td></tr>}
            {!carregando && linhas.map((l) => (
              <tr key={l.mes} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-700">{NOMES_MESES[l.mes - 1]}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.manutencao)}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.abastecimento)}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.nota_fiscal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatarMoeda(l.total)}</td>
              </tr>
            ))}
          </tbody>
          {!carregando && linhas.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-2.5 font-medium text-gray-700 text-right">Total do ano</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatarMoeda(totalAno)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ==================== Comparações ====================

function AbaComparacoes() {
  const [modo, setModo] = useState('periodos')

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <BotaoModo label="Comparar Períodos" ativo={modo === 'periodos'} onClick={() => setModo('periodos')} />
        <BotaoModo label="Comparar Centros de Despesa" ativo={modo === 'centros'} onClick={() => setModo('centros')} />
      </div>
      {modo === 'periodos' ? <ComparacaoPeriodos /> : <ComparacaoCentros />}
    </div>
  )
}

function BotaoModo({ label, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${ativo ? 'bg-indigo-50 text-primary' : 'text-gray-500 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  )
}

function ComparacaoPeriodos() {
  const [inicioA, setInicioA] = useState(INICIO_MES)
  const [fimA, setFimA] = useState(FIM_MES)
  const mesAnterior = new Date(HOJE.getFullYear(), HOJE.getMonth() - 1, 1)
  const [inicioB, setInicioB] = useState(mesAnterior.toISOString().slice(0, 10))
  const [fimB, setFimB] = useState(new Date(HOJE.getFullYear(), HOJE.getMonth(), 0).toISOString().slice(0, 10))
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  async function comparar() {
    setErro(null)
    setCarregando(true)
    try {
      const resultado = await buscarComparacaoPeriodos(inicioA, fimA, inicioB, fimB)
      setDados(resultado)
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao comparar períodos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-6 mb-5">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Período A</p>
          <SeletorPeriodo dataInicio={inicioA} dataFim={fimA} onChangeInicio={setInicioA} onChangeFim={setFimA} />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Período B</p>
          <SeletorPeriodo dataInicio={inicioB} dataFim={fimB} onChangeInicio={setInicioB} onChangeFim={setFimB} />
        </div>
      </div>

      <button onClick={comparar} disabled={carregando} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:opacity-60 mb-5">
        {carregando ? 'Comparando...' : 'Comparar'}
      </button>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4 max-w-md">{erro}</div>}

      {dados && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto max-w-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Período A</th>
                <th className="px-4 py-3 font-medium text-right">Período B</th>
              </tr>
            </thead>
            <tbody>
              <LinhaComparacao label="Manutenção" a={dados.periodo_a.manutencao} b={dados.periodo_b.manutencao} />
              <LinhaComparacao label="Abastecimento" a={dados.periodo_a.abastecimento} b={dados.periodo_b.abastecimento} />
              <LinhaComparacao label="Notas Fiscais" a={dados.periodo_a.nota_fiscal} b={dados.periodo_b.nota_fiscal} />
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-700">Total</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">{formatarMoeda(dados.periodo_a.total)}</td>
                <td className="px-4 py-2.5 text-right font-bold text-gray-900">
                  {formatarMoeda(dados.periodo_b.total)}
                  {dados.variacao_percentual !== null && (
                    <span className={`ml-2 text-xs font-medium inline-flex items-center gap-0.5 ${dados.variacao_percentual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {dados.variacao_percentual > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {Math.abs(dados.variacao_percentual).toFixed(1)}%
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

function LinhaComparacao({ label, a, b }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-2.5 text-gray-600">{label}</td>
      <td className="px-4 py-2.5 text-right">{formatarMoeda(a)}</td>
      <td className="px-4 py-2.5 text-right">{formatarMoeda(b)}</td>
    </tr>
  )
}

function ComparacaoCentros() {
  const [dataInicio, setDataInicio] = useState(INICIO_MES)
  const [dataFim, setDataFim] = useState(FIM_MES)
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    buscarComparacaoCentros(dataInicio, dataFim).then(setLinhas).finally(() => setCarregando(false))
  }, [dataInicio, dataFim])

  const totalGeral = linhas.reduce((s, l) => s + l.total, 0)

  return (
    <div>
      <div className="mb-4">
        <SeletorPeriodo dataInicio={dataInicio} dataFim={dataFim} onChangeInicio={setDataInicio} onChangeFim={setDataFim} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Centro de Despesa</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">% do total geral</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={3} className="text-center py-6 text-gray-400">Carregando...</td></tr>}
            {!carregando && linhas.map((l) => (
              <tr key={l.centro_despesa_id ?? 'sem-centro'} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-700">{l.nome}</td>
                <td className="px-4 py-2.5 text-right">{formatarMoeda(l.total)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">
                  {totalGeral > 0 ? `${((l.total / totalGeral) * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==================== Compartilhado ====================

function SeletorPeriodo({ dataInicio, dataFim, onChangeInicio, onChangeFim }) {
  return (
    <div className="flex gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Período de</span>
        <input type="date" value={dataInicio} onChange={(e) => onChangeInicio(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">até</span>
        <input type="date" value={dataFim} onChange={(e) => onChangeFim(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </label>
    </div>
  )
}
