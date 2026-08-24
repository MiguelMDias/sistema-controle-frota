import { useEffect, useState } from 'react'
import { Truck, CheckCircle2, Wrench, CalendarX, CalendarClock, DollarSign } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { api } from '../services/api'

const NOMES_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Dashboard() {
  const [resumo, setResumo] = useState(null)
  const [custosPorMes, setCustosPorMes] = useState([])
  const [custosPorCategoria, setCustosPorCategoria] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumo'),
      api.get('/dashboard/custos-por-mes'),
      api.get('/dashboard/custos-por-categoria'),
    ])
      .then(([r1, r2, r3]) => {
        setResumo(r1.data)
        setCustosPorMes(r2.data.map((c) => ({ label: `${NOMES_MES[c.mes - 1]}/${String(c.ano).slice(2)}`, total: c.total })))
        setCustosPorCategoria(r3.data)
      })
      .catch(() => setErro('Não foi possível carregar o dashboard. Verifique se a API está rodando.'))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">
        Visão geral da frota, atualizada em tempo real a partir dos módulos cadastrados.
      </p>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      {carregando && <p className="text-gray-400">Carregando...</p>}

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

function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
