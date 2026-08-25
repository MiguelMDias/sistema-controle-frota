import { X, Pencil } from 'lucide-react'
import { labelTipoNota } from '../services/notasFiscais'

export default function NotaFiscalDetalheModal({ nota, centrosDespesa, onClose, onEditar }) {
  if (!nota) return null

  const centroDespesa = centrosDespesa.find((c) => c.id === nota.centro_despesa_id)?.nome

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Nota Fiscal {nota.numero} / {nota.serie}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEditar}
              className="flex items-center gap-1.5 text-sm text-primary hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
            >
              <Pencil size={14} /> Editar
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Data de Emissão" valor={formatarData(nota.data_emissao)} />
            <Campo label="Tipo" valor={labelTipoNota(nota.tipo)} />
            <Campo label="Fornecedor" valor={nota.fornecedor_nome || '—'} />
            <Campo label="Centro de Despesa" valor={centroDespesa || '—'} />
            <Campo label="Valor Total" valor={formatarMoeda(nota.valor_total)} destaque />
            <Campo label="Cadastrada em" valor={formatarDataHora(nota.created_at)} />
          </div>

          <div>
            <span className="block text-sm text-gray-500 mb-2">Máquinas vinculadas</span>
            {nota.maquinas?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nota.maquinas.map((codigo) => (
                  <span key={codigo} className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {codigo}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhuma máquina vinculada.</p>
            )}
          </div>

          <div>
            <span className="block text-sm text-gray-500 mb-2">Itens da nota</span>
            {nota.itens?.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">Nome</th>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Vlr. Unit.</th>
                      <th className="px-3 py-2 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nota.itens.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">{item.nome}</td>
                        <td className="px-3 py-2">{item.quantidade}</td>
                        <td className="px-3 py-2">{formatarMoeda(item.valor_unitario)}</td>
                        <td className="px-3 py-2 font-medium">{formatarMoeda(item.quantidade * item.valor_unitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhum item detalhado nesta nota.</p>
            )}
          </div>

          {nota.observacoes && (
            <div>
              <span className="block text-sm text-gray-500 mb-1">Observações</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{nota.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, valor, destaque = false }) {
  return (
    <div>
      <span className="block text-xs text-gray-500 mb-0.5">{label}</span>
      <span className={destaque ? 'text-base font-semibold text-gray-800' : 'text-sm text-gray-700'}>{valor}</span>
    </div>
  )
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarDataHora(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
