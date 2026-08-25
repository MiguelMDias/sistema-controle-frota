import { X } from 'lucide-react'
import { labelEntidade, labelAcao } from '../services/logs'

// Campos que nunca fazem sentido mostrar na comparação (ruído técnico/interno)
const CAMPOS_OCULTOS = new Set([
  'id', 'created_at', 'updated_at', 'senha_hash',
  'horimetro_atual', 'km_atual', // atualizados automaticamente por trigger, não são "a mudança" em si
])

// Rótulos amigáveis para os campos mais comuns entre as entidades
const ROTULOS_CAMPO = {
  nome: 'Nome',
  codigo: 'Código',
  numero_patrimonial: 'Nº Patrimonial',
  numero_serie: 'Nº de Série',
  tipo: 'Tipo',
  marca: 'Marca',
  modelo: 'Modelo',
  ano: 'Ano',
  situacao: 'Situação',
  responsavel: 'Responsável',
  centro_despesa_id: 'Centro de Despesa',
  cnpj: 'CNPJ',
  telefone: 'Telefone',
  email: 'E-mail',
  contato: 'Contato',
  ativo: 'Ativo',
  maquina_id: 'Máquina',
  fornecedor_id: 'Fornecedor',
  data: 'Data',
  data_emissao: 'Data de Emissão',
  descricao: 'Descrição',
  horimetro: 'Horímetro',
  km: 'Km',
  custo: 'Custo (R$)',
  status: 'Status',
  tipo_combustivel: 'Combustível',
  quantidade: 'Quantidade',
  valor_total: 'Valor Total (R$)',
  numero: 'Número',
  serie: 'Série',
  observacoes: 'Observações',
  papel: 'Papel',
  usuario: 'Usuário (login)',
  intervalo_horimetro: 'Intervalo (horímetro)',
  intervalo_km: 'Intervalo (km)',
  intervalo_dias: 'Intervalo (dias)',
  proxima_data: 'Próxima Data',
  proximo_horimetro: 'Próximo Horímetro',
  proximo_km: 'Próximo Km',
}

const CAMPOS_MONETARIOS = new Set(['custo', 'valor_total', 'valor_unitario'])
const CAMPOS_DATA = new Set(['data', 'data_emissao', 'proxima_data', 'created_at'])
const CAMPOS_BOOLEANOS = new Set(['ativo', 'tem_pendencia'])

function rotuloCampo(campo) {
  return ROTULOS_CAMPO[campo] || campo.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function formatarValor(campo, valor) {
  if (valor === null || valor === undefined || valor === '') return '(vazio)'
  if (CAMPOS_BOOLEANOS.has(campo)) return valor ? 'Sim' : 'Não'
  if (CAMPOS_MONETARIOS.has(campo) && typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  if (CAMPOS_DATA.has(campo) && typeof valor === 'string') {
    const data = new Date(valor)
    if (!isNaN(data.getTime())) {
      return valor.length <= 10
        ? data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        : data.toLocaleString('pt-BR')
    }
  }
  return String(valor)
}

function calcularDiferencas(antes, depois) {
  const chaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})])
  const diffs = []
  for (const chave of chaves) {
    if (CAMPOS_OCULTOS.has(chave)) continue
    const valorAntes = antes ? antes[chave] : undefined
    const valorDepois = depois ? depois[chave] : undefined
    if (JSON.stringify(valorAntes) !== JSON.stringify(valorDepois)) {
      diffs.push({ campo: chave, antes: valorAntes, depois: valorDepois })
    }
  }
  return diffs
}

export default function LogDetalheModal({ log, onClose }) {
  if (!log) return null

  const temAntes = log.dados_antes && Object.keys(log.dados_antes).length > 0
  const temDepois = log.dados_depois && Object.keys(log.dados_depois).length > 0

  let conteudo
  if (log.acao === 'atualizar' && temAntes && temDepois) {
    const diffs = calcularDiferencas(log.dados_antes, log.dados_depois)
    conteudo = diffs.length > 0 ? (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-2.5 font-medium">Campo</th>
              <th className="px-4 py-2.5 font-medium">Valor anterior</th>
              <th className="px-4 py-2.5 font-medium">Valor atualizado</th>
            </tr>
          </thead>
          <tbody>
            {diffs.map((d) => (
              <tr key={d.campo} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-700">{rotuloCampo(d.campo)}</td>
                <td className="px-4 py-2.5 text-red-600 bg-red-50/50">{formatarValor(d.campo, d.antes)}</td>
                <td className="px-4 py-2.5 text-green-700 bg-green-50/50">{formatarValor(d.campo, d.depois)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-gray-400">Nenhum campo visível foi alterado neste registro.</p>
    )
  } else if ((log.acao === 'criar' || log.acao === 'ativar') && temDepois) {
    conteudo = <ListaCampos titulo="Dados cadastrados" dados={log.dados_depois} />
  } else if ((log.acao === 'excluir' || log.acao === 'excluir_permanente' || log.acao === 'desativar') && temAntes) {
    conteudo = <ListaCampos titulo="Dados no momento da exclusão" dados={log.dados_antes} />
  } else {
    conteudo = <p className="text-sm text-gray-400">Não há detalhamento adicional para este registro.</p>
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{labelAcao(log.acao)} · {labelEntidade(log.entidade)}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{log.descricao}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-4">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-6 text-sm text-gray-500 mb-2">
            <span><strong className="text-gray-700">Usuário:</strong> {log.usuario_nome}</span>
            <span><strong className="text-gray-700">Data/Hora:</strong> {new Date(log.created_at).toLocaleString('pt-BR')}</span>
          </div>
          {conteudo}
        </div>
      </div>
    </div>
  )
}

function ListaCampos({ titulo, dados }) {
  const entradas = Object.entries(dados).filter(([campo]) => !CAMPOS_OCULTOS.has(campo))
  return (
    <div>
      <span className="block text-sm text-gray-500 mb-2">{titulo}</span>
      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
        {entradas.map(([campo, valor]) => (
          <div key={campo} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="text-gray-500">{rotuloCampo(campo)}</span>
            <span className="text-gray-800 font-medium">{formatarValor(campo, valor)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
