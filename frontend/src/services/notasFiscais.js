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
  if (filtros.centro_despesa_id) params.centro_despesa_id = filtros.centro_despesa_id
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

// Lê um XML de NF-e e retorna os campos já extraídos (número, data, valor,
// itens e fornecedor -- criando o fornecedor automaticamente se o CNPJ do
// emitente ainda não estiver cadastrado).
export async function importarXmlNotaFiscal(arquivo) {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const { data } = await api.post('/notas-fiscais/importar-xml', formData)
  return data
}

export function labelTipoNota(valor) {
  return TIPOS_NOTA.find((t) => t.value === valor)?.label || valor
}

// Extrai uma mensagem de erro legível da resposta da API, seja ela um texto
// simples (HTTPException) ou uma lista de erros de validação do Pydantic.
export function extrairMensagemErro(err, mensagemPadrao) {
  const detalhe = err.response?.data?.detail
  if (!detalhe) return mensagemPadrao
  if (typeof detalhe === 'string') return detalhe
  if (Array.isArray(detalhe)) {
    return detalhe
      .map((d) => {
        const campo = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null
        return campo ? `${campo}: ${d.msg}` : d.msg
      })
      .join(' | ')
  }
  return mensagemPadrao
}
