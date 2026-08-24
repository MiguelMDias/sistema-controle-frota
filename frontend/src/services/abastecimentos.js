import { api } from './api'

export const TIPOS_COMBUSTIVEL = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'gas_glp', label: 'Gás GLP' },
  { value: 'energia_eletrica', label: 'Energia Elétrica' },
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
  if (tipoCombustivel === 'energia_eletrica') return 'kWh'
  if (tipoCombustivel === 'gas_glp') return 'kg'
  return 'litros'
}
