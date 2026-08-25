import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Truck, CheckCircle2, Wrench, CalendarX, CalendarClock, DollarSign,
  AlertTriangle, Plus, Fuel, FileText, ClipboardCheck, ArrowRight,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { api } from '../services/api'

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CORES_SITUACAO = { ativa: '#22c55e', manutencao: '#f97316', inativa: '#9ca3af', baixada: '#6b7280' }
const CORES_TIPO = ['#4f46e5', '#0ea5e9', '#f59e0b', '#10b981']

const BADGE_SEVERIDADE = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-orange-100 text-orange-700 border-orange-200',
  baixa: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [resumo, setResumo] = useState(null)
  const [custosPorMes, setCustosPorMes] = useState([])
  const [custosPorCategoria, setCustosPorCategoria] = useState([])
  const [frotaPorSituacao, setFrotaPorSituacao] = useState([])
  const [frotaPorTipo, setFrotaPorTipo] = useState([])
  const [alertas, setAlertas] = useState([])
  const [topCustos, setTopCustos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumo'),
      api.get('/dashboard/custos-por-mes'),
      api.get('/dashboard/custos-por-categoria'),
      api.get('/dashboard/frota-por-situacao'),
      api.get('/dashboard/frota-por-tipo'),
      api.get('/dashboard/alertas'),
      api.get('/dashboard/top-custos-maquinas'),
    ])
      .then(([r1, r2, r3, r4, r5, r6, r7]) => {
        setResumo(r1.data)
        setCustosPorMes(r2.data.map((c) => ({ label: `${NOMES_MES[c.mes - 1]}/${String(c.ano).slice(2)}`, total: c.total })))
        setCustosPorCategoria(r3.data)
        setFrotaPorSituacao(r4.data)
        setFrotaPorTipo(r5.data)
        setAlertas(r6.data)
        setTopCustos(r7.data)
      })
      .catch(() => setErro('Não foi possível carregar o dashboard. Verifique se a API está rodando.'))
      .finally(() => setCarregando(false))
  }, [])

  function irComAtalho(rota) {
    navigate(rota, { state: { abrirNovo: true } })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">
        Visão geral da frota, atualizada em tempo real a partir dos módulos cadastrados.
      </p>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}
      {carregando && <p className="text-gray-400">Carregando...</p>}

      {/* ---------- Atalhos rápidos ---------- */}
      <div className="flex flex-wrap gap-3 mb-6">
        <AtalhoRapido icone={Wrench} label="Nova Manutenção" onClick={() => irComAtalho('/manutencoes')} />
        <AtalhoRapido icone={Fuel} label="Novo Abastecimento" onClick={() => irComAtalho('/abastecimentos')} />
        <AtalhoRapido icone={FileText} label="Nova Nota Fiscal" onClick={() => irComAtalho('/notas-fiscais')} />
        <AtalhoRapido icone={ClipboardCheck} label="Executar Checklist" onClick={() => navigate('/checklist')} />
      </div>

      {/* ---------- Cards de resumo ---------- */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card icone={Truck} cor="bg-indigo-100 text-primary" valor={resumo.total_maquinas} label="Total de Máquinas" />
          <Card icone={CheckCircle2} cor="bg-green-100 text-green-600" valor={resumo.maquinas_ativas} label="Máquinas Ativas" />
          <Card icone={Wrench} cor="bg-orange-100 text-orange-600" valor={resumo.em_manutencao} label="Em Manutenção" />
          <Card icone={CalendarX} cor="bg-red-100 text-red-600" valor={resumo.preventivas_vencidas} label="Preventivas Vencidas" />
          <Card icone={CalendarClock} cor="bg-yellow-100 text-yellow-700" valor={resumo.preventivas_proximas} label="Preventivas Próximas" />
          <Card icone={DollarSign} cor="bg-blue-100 text-blue-600" valor={formatarMoeda(resumo.custos_mes)} label="Custos do Mês" />
        </div>
      )}

      {/* ---------- Alertas operacionais + Top custos ---------- */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" /> Alertas Operacionais
          </h3>
          {alertas.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Nenhum alerta no momento. Tudo em dia! 🎉</p>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${BADGE_SEVERIDADE[a.severidade] || 'bg-gray-50 border-gray-200'}`}>
                  <span><strong>{a.maquina_codigo}</strong> — {a.descricao}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">Top 5 · Custo do Mês</h3>
            <Link to="/financeiro" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              Ver mais <ArrowRight size={12} />
            </Link>
          </div>
          {topCustos.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Sem custos este mês.</p>
          ) : (
            <div className="space-y-2">
              {topCustos.map((m, i) => (
                <div key={m.maquina_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{i + 1}. {m.codigo}</span>
                  <span className="font-medium text-gray-800">{formatarMoeda(m.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Composição da frota ---------- */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-700 mb-4">Frota por Situação</h3>
          {frotaPorSituacao.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Nenhuma máquina cadastrada.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={frotaPorSituacao} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                  {frotaPorSituacao.map((entry, i) => (
                    <Cell key={i} fill={CORES_SITUACAO[entry.situacao] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-700 mb-4">Frota por Tipo</h3>
          {frotaPorTipo.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Nenhuma máquina cadastrada.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={frotaPorTipo} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                  {frotaPorTipo.map((entry, i) => (
                    <Cell key={i} fill={CORES_TIPO[i % CORES_TIPO.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ---------- Custos ao longo do tempo ---------- */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-700 mb-4">Custos ao Longo do Tempo (últimos 6 meses)</h3>
          {custosPorMes.every((c) => c.total === 0) ? (
            <p className="text-center text-gray-400 py-16">Nenhum custo registrado no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={custosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatarMoeda(v)} />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-medium text-gray-700 mb-4">Custos por Categoria (últimos 6 meses)</h3>
          {custosPorCategoria.every((c) => c.total === 0) ? (
            <p className="text-center text-gray-400 py-16">Nenhum custo registrado no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={custosPorCategoria}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatarMoeda(v)} />
                <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ icone: Icone, cor, valor, label }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cor}`}>
        <Icone size={18} />
      </div>
      <div className="text-xl font-semibold text-gray-800">{valor}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function AtalhoRapido({ icone: Icone, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors"
    >
      <Plus size={14} className="text-primary" />
      <Icone size={15} />
      {label}
    </button>
  )
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
