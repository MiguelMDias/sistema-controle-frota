import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Upload, FileCheck2 } from 'lucide-react'
import { TIPOS_NOTA, importarXmlNotaFiscal, extrairMensagemErro } from '../services/notasFiscais'
import { api } from '../services/api'
import FornecedorModal from './FornecedorModal'

const VAZIO = {
  numero: '',
  serie: '1',
  fornecedor_id: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  tipo: 'peca',
  valor_total: '',
  centro_despesa_id: '',
  observacoes: '',
  maquina_ids: [],
  itens: [],
}

const HOJE = new Date().toISOString().slice(0, 10)

function apenasDigitos(valor) {
  return valor.replace(/\D/g, '')
}

export default function NotaFiscalModal({ nota, maquinas, fornecedores, centrosDespesa, onClose, onSave, onFornecedorCriado }) {
  const [aba, setAba] = useState('manual')
  const [form, setForm] = useState(VAZIO)
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [listaFornecedores, setListaFornecedores] = useState(fornecedores)
  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false)
  const [importando, setImportando] = useState(false)
  const [xmlImportado, setXmlImportado] = useState(null)
  const inputXmlRef = useRef(null)

  useEffect(() => setListaFornecedores(fornecedores), [fornecedores])

  useEffect(() => {
    if (nota) {
      const idsAtuais = maquinas.filter((m) => nota.maquinas?.includes(m.codigo)).map((m) => m.id)
      setForm({
        ...VAZIO,
        ...nota,
        fornecedor_id: nota.fornecedor_id ?? '',
        centro_despesa_id: nota.centro_despesa_id ?? '',
        maquina_ids: idsAtuais,
        itens: (nota.itens || []).map((i) => ({ nome: i.nome, quantidade: i.quantidade, valor_unitario: i.valor_unitario })),
      })
    } else {
      setForm(VAZIO)
    }
  }, [nota, maquinas])

  function atualizarCampo(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function alternarMaquina(id) {
    setForm((f) => ({
      ...f,
      maquina_ids: f.maquina_ids.includes(id)
        ? f.maquina_ids.filter((m) => m !== id)
        : [...f.maquina_ids, id],
    }))
  }

  // ---------- Itens da nota ----------

  function adicionarItem() {
    setForm((f) => ({ ...f, itens: [...f.itens, { nome: '', quantidade: 1, valor_unitario: 0 }] }))
  }

  function atualizarItem(index, campo, valor) {
    setForm((f) => {
      const itens = [...f.itens]
      itens[index] = { ...itens[index], [campo]: valor }
      return { ...f, itens }
    })
  }

  function removerItem(index) {
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }))
  }

  const totalItens = form.itens.reduce(
    (soma, i) => soma + (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0),
    0
  )
  const usaItensParaTotal = form.itens.length > 0

  // ---------- Fornecedor inline ----------

  async function salvarNovoFornecedor(payload) {
    const { data } = await api.post('/fornecedores', payload)
    setListaFornecedores((atual) => [...atual, data])
    atualizarCampo('fornecedor_id', data.id)
    setModalFornecedorAberto(false)
    onFornecedorCriado?.(data)
  }

  // ---------- Importação de XML ----------

  async function handleArquivoXml(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro(null)
    setImportando(true)
    try {
      const dados = await importarXmlNotaFiscal(arquivo)
      setForm((f) => ({
        ...f,
        numero: dados.numero,
        serie: dados.serie,
        data_emissao: dados.data_emissao,
        valor_total: dados.valor_total,
        fornecedor_id: dados.fornecedor_id,
        itens: dados.itens || [],
      }))
      if (!listaFornecedores.some((f) => f.id === dados.fornecedor_id)) {
        const novoFornecedor = { id: dados.fornecedor_id, nome: dados.fornecedor_nome }
        setListaFornecedores((atual) => [...atual, novoFornecedor])
        onFornecedorCriado?.(novoFornecedor)
      }
      setXmlImportado({ numero: dados.numero, fornecedor_nome: dados.fornecedor_nome, itens: dados.itens?.length || 0 })
      setAba('manual')
    } catch (err) {
      setErro(extrairMensagemErro(err, 'Não foi possível ler o XML. Verifique se é uma NF-e válida.'))
    } finally {
      setImportando(false)
      if (inputXmlRef.current) inputXmlRef.current.value = ''
    }
  }

  // ---------- Envio ----------

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)

    if (!form.fornecedor_id) {
      setErro('Selecione um fornecedor')
      return
    }
    if (!/^\d+$/.test(form.numero)) {
      setErro('Número da nota deve conter apenas números')
      return
    }
    if (form.data_emissao > HOJE) {
      setErro('Data de emissão não pode ser uma data futura')
      return
    }
    for (const item of form.itens) {
      if (!item.nome?.trim()) {
        setErro('Todos os itens precisam de um nome')
        return
      }
    }

    setSalvando(true)
    try {
      const payload = {
        ...form,
        fornecedor_id: Number(form.fornecedor_id),
        centro_despesa_id: form.centro_despesa_id ? Number(form.centro_despesa_id) : null,
        valor_total: usaItensParaTotal ? totalItens : Number(form.valor_total),
        itens: form.itens.map((i) => ({
          nome: i.nome,
          quantidade: Number(i.quantidade),
          valor_unitario: Number(i.valor_unitario),
        })),
      }
      await onSave(payload)
    } catch (err) {
      setErro(extrairMensagemErro(err, 'Erro ao salvar nota fiscal'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {nota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {!nota && (
          <div className="flex gap-6 px-6 pt-4 border-b border-gray-100">
            <AbaBotao label="Preencher manualmente" ativa={aba === 'manual'} onClick={() => setAba('manual')} />
            <AbaBotao label="Importar XML" ativa={aba === 'xml'} onClick={() => setAba('xml')} />
          </div>
        )}

        {aba === 'xml' && !nota ? (
          <div className="p-6 space-y-4">
            {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Upload className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-sm text-gray-600 mb-3">
                Selecione o arquivo XML da NF-e. Os campos serão preenchidos automaticamente,
                incluindo os itens e o fornecedor (criado automaticamente se ainda não existir).
              </p>
              <input
                ref={inputXmlRef}
                type="file"
                accept=".xml,text/xml"
                onChange={handleArquivoXml}
                disabled={importando}
                className="block mx-auto text-sm"
              />
              {importando && <p className="text-sm text-primary mt-3">Lendo XML...</p>}
            </div>
            {xmlImportado && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg">
                <FileCheck2 size={16} />
                Nota {xmlImportado.numero} importada de {xmlImportado.fornecedor_nome} com {xmlImportado.itens} item(ns).
                Revise os dados na aba "Preencher manualmente" antes de salvar.
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {erro && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{erro}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Campo label="Número *" className="col-span-2">
                <input
                  required
                  value={form.numero}
                  onChange={(e) => atualizarCampo('numero', apenasDigitos(e.target.value))}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="Só números"
                  className="input"
                />
              </Campo>
              <Campo label="Série">
                <input
                  value={form.serie}
                  onChange={(e) => atualizarCampo('serie', e.target.value)}
                  className="input"
                />
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Data de Emissão *">
                <input
                  required
                  type="date"
                  value={form.data_emissao}
                  max={HOJE}
                  onChange={(e) => atualizarCampo('data_emissao', e.target.value)}
                  className="input"
                />
              </Campo>
              <Campo label="Tipo *">
                <select
                  required
                  value={form.tipo}
                  onChange={(e) => atualizarCampo('tipo', e.target.value)}
                  className="input"
                >
                  {TIPOS_NOTA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Fornecedor *">
                <div className="flex gap-2">
                  <select
                    required
                    value={form.fornecedor_id}
                    onChange={(e) => atualizarCampo('fornecedor_id', e.target.value)}
                    className="input"
                  >
                    <option value="">Selecione...</option>
                    {listaFornecedores.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setModalFornecedorAberto(true)}
                    className="shrink-0 px-3 border border-gray-200 rounded-lg text-sm text-primary hover:bg-gray-50"
                    title="Cadastrar novo fornecedor"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </Campo>
              <Campo label="Centro de Despesa">
                <select
                  value={form.centro_despesa_id}
                  onChange={(e) => atualizarCampo('centro_despesa_id', e.target.value)}
                  className="input"
                >
                  <option value="">Não informado</option>
                  {centrosDespesa.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </Campo>
            </div>

            {/* ---------- Itens da nota ---------- */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Itens da nota</span>
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus size={14} /> Adicionar item
                </button>
              </div>

              {form.itens.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto mb-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-3 py-2 font-medium">Nome</th>
                        <th className="px-3 py-2 font-medium w-24">Qtd.</th>
                        <th className="px-3 py-2 font-medium w-32">Vlr. Unit. (R$)</th>
                        <th className="px-3 py-2 font-medium w-32">Subtotal</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.itens.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5">
                            <input
                              value={item.nome}
                              onChange={(e) => atualizarItem(i, 'nome', e.target.value)}
                              className="input py-1"
                              placeholder="Descrição do item"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(i, 'quantidade', e.target.value)}
                              className="input py-1"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.valor_unitario}
                              onChange={(e) => atualizarItem(i, 'valor_unitario', e.target.value)}
                              className="input py-1"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-gray-600">
                            {formatarMoeda((Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0))}
                          </td>
                          <td className="px-3 py-1.5">
                            <button type="button" onClick={() => removerItem(i)} className="text-gray-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <Campo label={usaItensParaTotal ? 'Valor Total (calculado pelos itens)' : 'Valor Total (R$) *'}>
              <input
                required={!usaItensParaTotal}
                disabled={usaItensParaTotal}
                type="number"
                step="0.01"
                value={usaItensParaTotal ? totalItens.toFixed(2) : form.valor_total}
                onChange={(e) => atualizarCampo('valor_total', e.target.value)}
                className="input disabled:bg-gray-50 disabled:text-gray-500"
              />
            </Campo>

            <div>
              <span className="block text-sm text-gray-600 mb-2">Máquinas vinculadas</span>
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                {maquinas.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.maquina_ids.includes(m.id)}
                      onChange={() => alternarMaquina(m.id)}
                      className="rounded"
                    />
                    {m.codigo}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Deixe em branco se a nota não for de peça/serviço vinculado a máquina específica.</p>
            </div>

            <Campo label="Observações">
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={(e) => atualizarCampo('observacoes', e.target.value)}
                placeholder="Detalhes adicionais sobre esta nota..."
                className="input"
              />
            </Campo>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {modalFornecedorAberto && (
        <FornecedorModal
          fornecedor={null}
          onClose={() => setModalFornecedorAberto(false)}
          onSave={salvarNovoFornecedor}
        />
      )}
    </div>
  )
}

function AbaBotao({ label, ativa, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
        ativa ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

function Campo({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
