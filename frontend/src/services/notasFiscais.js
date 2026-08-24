import { api } from './api'

export const TIPOS_NOTA = [
  { value: 'peca', label: 'Peça' },
  { value: 'servico', label: 'Serviço' },
  { value: 'outro', label: 'Outro' },
]

export async function listarNotasFiscais(filtros = {}) {
  const params = {}
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.maquina_id) params.maquina_id = filtros.maquina_id
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
  if (filtros.data_fim) params.data_fim = filtros.data_fim
  if (filtros.busca) params.busca = filtros.busca
  const { data } = await api.get('/notas-fiscais', { params })
  return data
}

export async function criarNotaFiscal(payload) {
  const { data } = await api.post('/notas-fiscais', payload)
  return data
}

export async function atualizarNotaFiscal(id, payload) {
  const { data } = await api.patch(`/notas-fiscais/${id}`, payload)
  return data
}

export async function excluirNotaFiscal(id) {
  await api.delete(`/notas-fiscais/${id}`)
}

export function labelTipoNota(valor) {
  return TIPOS_NOTA.find((t) => t.value === valor)?.label || valor
}
