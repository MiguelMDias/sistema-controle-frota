import { api } from './api'

export const TIPOS_COMBUSTIVEL = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'etanol', label: 'Etanol' },
  { value: 'diesel_s10', label: 'Diesel S10' },
  { value: 'diesel_s500', label: 'Diesel S500' },
  { value: 'glp', label: 'GLP' },
  { value: 'eletrico', label: 'Elétrico' },
]

export async function listarAbastecimentos(filtros = {}) {
  const params = {}
  if (filtros.maquina_id) params.maquina_id = filtros.maquina_id
  if (filtros.tipo_combustivel) params.tipo_combustivel = filtros.tipo_combustivel
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
  if (filtros.data_fim) params.data_fim = filtros.data_fim
  const { data } = await api.get('/abastecimentos', { params })
  return data
}

export async function criarAbastecimento(payload) {
  const { data } = await api.post('/abastecimentos', payload)
  return data
}

export async function atualizarAbastecimento(id, payload) {
  const { data } = await api.patch(`/abastecimentos/${id}`, payload)
  return data
}

export async function excluirAbastecimento(id) {
  await api.delete(`/abastecimentos/${id}`)
}

export async function calcularConsumo(maquinaId) {
  const { data } = await api.get(`/abastecimentos/consumo/${maquinaId}`)
  return data
}

export function labelTipoCombustivel(valor) {
  return TIPOS_COMBUSTIVEL.find((t) => t.value === valor)?.label || valor
}

export function unidadeQuantidade(tipoCombustivel) {
  if (tipoCombustivel === 'eletrico') return 'kWh'
  if (tipoCombustivel === 'glp') return 'kg'
  return 'litros'
}
