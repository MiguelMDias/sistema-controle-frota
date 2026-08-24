import { api } from './api'

export const TIPOS_MAQUINA = [
  { value: 'carro', label: 'Carro' },
  { value: 'trator', label: 'Trator' },
  { value: 'empilhadeira_gas', label: 'Empilhadeira a Gás' },
  { value: 'empilhadeira_eletrica', label: 'Empilhadeira Elétrica' },
]

export const SITUACOES_MAQUINA = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'manutencao', label: 'Em Manutenção' },
  { value: 'baixada', label: 'Baixada' },
]

export async function listarMaquinas(filtros = {}) {
  const params = {}
  if (filtros.tipo) params.tipo = filtros.tipo
  if (filtros.situacao) params.situacao = filtros.situacao
  if (filtros.centro_custo) params.centro_custo = filtros.centro_custo
  if (filtros.busca) params.busca = filtros.busca

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

export async function excluirMaquina(id) {
  await api.delete(`/maquinas/${id}`)
}
