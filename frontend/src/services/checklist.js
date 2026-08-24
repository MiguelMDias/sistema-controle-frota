import { api } from './api'

export async function listarModelos(tipoMaquina) {
  const params = tipoMaquina ? { tipo_maquina: tipoMaquina } : {}
  const { data } = await api.get('/checklist/modelos', { params })
  return data
}

export async function criarModelo(payload) {
  const { data } = await api.post('/checklist/modelos', payload)
  return data
}

export async function excluirModelo(id) {
  await api.delete(`/checklist/modelos/${id}`)
}

export async function listarExecucoes(filtros = {}) {
  const params = {}
  if (filtros.maquina_id) params.maquina_id = filtros.maquina_id
  if (filtros.apenas_com_pendencia) params.apenas_com_pendencia = true
  const { data } = await api.get('/checklist/execucoes', { params })
  return data
}

export async function registrarExecucao(payload) {
  const { data } = await api.post('/checklist/execucoes', payload)
  return data
}
