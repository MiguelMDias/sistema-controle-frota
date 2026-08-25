import { api } from './api'

export const TIPOS_MAQUINA = [
  { value: 'carro', label: 'Carro' },
  { value: 'trator', label: 'Trator' },
  { value: 'empilhadeira_gas', label: 'Empilhadeira a Gás' },
  { value: 'empilhadeira_eletrica', label: 'Empilhadeira Elétrica' },
]

export const SITUACOES_MAQUINA = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
  { value: 'manutencao', label: 'Em Manutenção' },
  { value: 'baixada', label: 'Baixada' },
]

// Ano válido: de 1980 até o ano seguinte ao atual (ex: em 2026 aceita até modelo 2027)
export const ANO_MINIMO = 1980
export const ANO_MAXIMO = new Date().getFullYear() + 1

export async function listarMaquinas(filtros = {}) {
  const params = {}
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.situacao) params.situacao = filtros.situacao
  if (filtros.centro_despesa_id) params.centro_despesa_id = filtros.centro_despesa_id
  if (filtros.busca) params.busca = filtros.busca
  if (filtros.apenas_disponiveis) params.apenas_disponiveis = true

  const { data } = await api.get('/maquinas', { params })
  return data
}

export async function criarMaquina(maquina) {
  const { data } = await api.post('/maquinas', maquina)
  return data
}

export async function atualizarMaquina(id, maquina) {
  const { data } = await api.patch(`/maquinas/${id}`, maquina)
  return data
}

// Exclusão padrão (soft delete) -- marca a máquina como inativa, preserva histórico
export async function excluirMaquina(id) {
  await api.delete(`/maquinas/${id}`)
}

// Exclusão definitiva -- remove o registro de vez. Falha se houver histórico vinculado.
export async function excluirMaquinaPermanente(id) {
  await api.delete(`/maquinas/${id}/permanente`)
}

export async function listarCentrosDespesa() {
  const { data } = await api.get('/maquinas/centros-despesa/listar')
  return data
}

export async function criarCentroDespesa(nome) {
  const { data } = await api.post('/maquinas/centros-despesa/listar', { nome })
  return data
}
