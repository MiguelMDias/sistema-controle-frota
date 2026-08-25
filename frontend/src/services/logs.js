import { api } from './api'

export const ENTIDADES_LOG = [
  { value: 'maquina', label: 'Máquina' },
  { value: 'centro_despesa', label: 'Centro de Despesa' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'abastecimento', label: 'Abastecimento' },
  { value: 'nota_fiscal', label: 'Nota Fiscal' },
  { value: 'checklist_execucao', label: 'Checklist' },
  { value: 'usuario', label: 'Usuário' },
]

export const ACOES_LOG = [
  { value: 'criar', label: 'Criação' },
  { value: 'atualizar', label: 'Atualização' },
  { value: 'excluir', label: 'Exclusão' },
  { value: 'excluir_permanente', label: 'Exclusão permanente' },
  { value: 'ativar', label: 'Ativação' },
  { value: 'desativar', label: 'Desativação' },
]

export async function listarLogs(filtros = {}) {
  const params = {}
  if (filtros.entidade) params.entidade = filtros.entidade
  if (filtros.acao) params.acao = filtros.acao
  if (filtros.usuario_id) params.usuario_id = filtros.usuario_id
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
  if (filtros.data_fim) params.data_fim = filtros.data_fim
  if (filtros.busca) params.busca = filtros.busca
  const { data } = await api.get('/logs', { params })
  return data
}

export async function listarUsuariosComLog() {
  const { data } = await api.get('/logs/usuarios-ativos')
  return data
}

export function labelEntidade(valor) {
  return ENTIDADES_LOG.find((e) => e.value === valor)?.label || valor
}

export function labelAcao(valor) {
  return ACOES_LOG.find((a) => a.value === valor)?.label || valor
}
