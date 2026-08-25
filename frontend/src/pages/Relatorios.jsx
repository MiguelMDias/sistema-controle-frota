import { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { listarMaquinas, listarCentrosDespesa } from '../services/maquinas'
import { api } from '../services/api'

export default function Relatorios() {
  const [maquinas, setMaquinas] = useState([])
  const [centrosDespesa, setCentrosDespesa] = useState([])

  useEffect(() => {
    listarMaquinas().then(setMaquinas).catch(() => {})
    listarCentrosDespesa().then(setCentrosDespesa).catch(() => {})
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Central de Relatórios</h1>
      <p className="text-gray-500 text-sm mb-6">
        Exporte os relatórios do sistema em PDF ou Excel.
      </p>

      <div className="space-y-6 max-w-2xl">
        <RelatorioHistoricoMaquina maquinas={maquinas} />
        <RelatorioCustosGerais centrosDespesa={centrosDespesa} />
        <RelatorioPreventivas />
      </div>
    </div>
  )
}

function CardRelatorio({ titulo, descricao, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-800 mb-1">{titulo}</h3>
      <p className="text-sm text-gray-500 mb-4">{descricao}</p>
      {children}
    </div>
  )
}

function BotoesExportar({ onPdf, onExcel, disabled }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onPdf}
        disabled={disabled}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileDown size={16} /> Exportar PDF
      </button>
      <button
        onClick={onExcel}
        disabled={disabled}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileSpreadsheet size={16} /> Exportar Excel
      </button>
    </div>
  )
}

async function baixarArquivo(url, params, nomeArquivo) {
  const resposta = await api.get(url, { params, responseType: 'blob' })
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(resposta.data)
  link.download = nomeArquivo
  link.click()
  window.URL.revokeObjectURL(link.href)
}

function RelatorioHistoricoMaquina({ maquinas }) {
  const [maquinaId, setMaquinaId] = useState('')

  return (
    <CardRelatorio
      titulo="Histórico Completo de Máquina"
      descricao="Manutenções, abastecimentos, planos de preventiva e checklists de uma máquina, tudo em um só relatório."
    >
      <select
        value={maquinaId}
        onChange={(e) => setMaquinaId(e.target.value)}
        className="input mb-4"
      >
        <option value="">Selecione uma máquina...</option>
        {maquinas.map((m) => (
          <option key={m.id} value={m.id}>{m.codigo}</option>
        ))}
      </select>
      <BotoesExportar
        disabled={!maquinaId}
        onPdf={() => baixarArquivo(`/relatorios/historico-maquina/${maquinaId}/pdf`, {}, `historico-maquina.pdf`)}
        onExcel={() => baixarArquivo(`/relatorios/historico-maquina/${maquinaId}/excel`, {}, `historico-maquina.xlsx`)}
      />
    </CardRelatorio>
  )
}

function RelatorioCustosGerais({ centrosDespesa }) {
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [centroDespesaId, setCentroDespesaId] = useState('')

  const params = {
    data_inicio: dataInicio || undefined,
    data_fim: dataFim || undefined,
    centro_despesa_id: centroDespesaId || undefined,
  }

  return (
    <CardRelatorio
      titulo="Custos Gerais"
      descricao="Custos de manutenção e combustível agrupados por centro de despesa, no período informado."
    >
      <div className="flex flex-wrap gap-3 mb-4">
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
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Centro de Despesa</span>
          <select value={centroDespesaId} onChange={(e) => setCentroDespesaId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white min-w-[150px]">
            <option value="">Todos</option>
            {centrosDespesa.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
      </div>
      <BotoesExportar
        onPdf={() => baixarArquivo('/relatorios/custos-gerais/pdf', params, 'custos-gerais.pdf')}
        onExcel={() => baixarArquivo('/relatorios/custos-gerais/excel', params, 'custos-gerais.xlsx')}
      />
    </CardRelatorio>
  )
}

function RelatorioPreventivas() {
  return (
    <CardRelatorio
      titulo="Preventivas Vencidas e a Vencer"
      descricao="Todos os planos de preventiva com status Vencido ou Próximo, de todas as máquinas."
    >
      <BotoesExportar
        onPdf={() => baixarArquivo('/relatorios/preventivas-vencimento/pdf', {}, 'preventivas-vencimento.pdf')}
        onExcel={() => baixarArquivo('/relatorios/preventivas-vencimento/excel', {}, 'preventivas-vencimento.xlsx')}
      />
    </CardRelatorio>
  )
}
