import { api } from './api'

export async function buscarVisaoGeral(dataInicio, dataFim) {
  const { data } = await api.get('/financeiro/visao-geral', {
    params: { data_inicio: dataInicio, data_fim: dataFim },
  })
  return data
}

export async function buscarCustoPorMaquina(dataInicio, dataFim, centroDespesaId) {
  const params = { data_inicio: dataInicio, data_fim: dataFim }
  if (centroDespesaId) params.centro_despesa_id = centroDespesaId
  const { data } = await api.get('/financeiro/custo-por-maquina', { params })
  return data
}

export async function buscarCustoPorMes(ano) {
  const { data } = await api.get('/financeiro/custo-por-mes', { params: { ano } })
  return data
}

export async function buscarComparacaoPeriodos(inicioA, fimA, inicioB, fimB) {
  const { data } = await api.get('/financeiro/comparacao-periodos', {
    params: { inicio_a: inicioA, fim_a: fimA, inicio_b: inicioB, fim_b: fimB },
  })
  return data
}

export async function buscarComparacaoCentros(dataInicio, dataFim) {
  const { data } = await api.get('/financeiro/comparacao-centros', {
    params: { data_inicio: dataInicio, data_fim: dataFim },
  })
  return data
}

export async function atualizarCentroDespesa(id, nome) {
  const { data } = await api.patch(`/maquinas/centros-despesa/${id}`, { nome })
  return data
}

export async function alternarSituacaoCentroDespesa(id, ativo) {
  const { data } = await api.patch(`/maquinas/centros-despesa/${id}/situacao`, null, { params: { ativo } })
  return data
}

export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function formatarMoeda(valor) {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
