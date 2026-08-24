import { api } from './api'

export const TIPOS_MANUTENCAO = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
]

export const STATUS_MANUTENCAO = [
  { value: 'concluida', label: 'Concluída' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
]

export const STATUS_PREVENTIVA = [
  { value: 'vencida', label: 'Vencida' },
  { value: 'proxima', label: 'Próxima' },
  { value: 'em_dia', label: 'Em Dia' },
]

// ---------- Manutenções ----------

export async function listarManutencoes(filtros = {}) {
  const params = {}
  if (filtros.maquina_id) params.maquina_id = filtros.maquina_id
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.status) params.status = filtros.status
  const { data } = await api.get('/manutencoes', { params })
  return data
}

export async function criarManutencao(payload) {
  const { data } = await api.post('/manutencoes', payload)
  return data
}

export async function atualizarManutencao(id, payload) {
  const { data } = await api.patch(`/manutencoes/${id}`, payload)
  return data
}

export async function excluirManutencao(id) {
  await api.delete(`/manutencoes/${id}`)
}

// ---------- Preventivas ----------

export async function listarPreventivas(filtros = {}) {
  const params = {}
  if (filtros.maquina_id) params.maquina_id = filtros.maquina_id
  if (filtros.status) params.status = filtros.status
  const { data } = await api.get('/preventivas', { params })
  return data
}

export async function criarPreventiva(payload) {
  const { data } = await api.post('/preventivas', payload)
  return data
}

export async function atualizarPreventiva(id, payload) {
  const { data } = await api.patch(`/preventivas/${id}`, payload)
  return data
}

export async function excluirPreventiva(id) {
  await api.delete(`/preventivas/${id}`)
}

export async function concluirPreventiva(id, payload) {
  const { data } = await api.post(`/preventivas/${id}/concluir`, payload)
  return data
}
