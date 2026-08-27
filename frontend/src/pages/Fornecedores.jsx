import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import FornecedorModal from '../components/FornecedorModal'
import { useAuth } from '../services/auth'
import AcessoNegado from '../components/AcessoNegado'
import { useDialogo } from '../components/DialogoProvider'

export default function Fornecedores() {
  const { isAdmin, isDiretor, isMecanico } = useAuth()
  const { confirmar } = useDialogo()
  const [fornecedores, setFornecedores] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data } = await api.get('/fornecedores', { params: { busca: busca || undefined } })
      setFornecedores(data)
    } catch {
      setErro('Não foi possível carregar os fornecedores.')
    } finally {
      setCarregando(false)
    }
  }, [busca])

  useEffect(() => {
    const timer = setTimeout(carregar, 300)
    return () => clearTimeout(timer)
  }, [carregar])

  function abrirNovo() {
    setEditando(null)
    setModalAberto(true)
  }

  function abrirEdicao(fornecedor) {
    setEditando(fornecedor)
    setModalAberto(true)
  }

  async function salvar(payload) {
    if (editando) {
      await api.patch(`/fornecedores/${editando.id}`, payload)
    } else {
      await api.post('/fornecedores', payload)
    }
    setModalAberto(false)
    carregar()
  }

  async function excluir(fornecedor) {
    const ok = await confirmar({
      titulo: 'Excluir fornecedor',
      mensagem: `Quer mesmo excluir ${fornecedor.nome}? Essa ação não pode ser desfeita.`,
      textoConfirmar: 'Excluir',
      perigo: true,
    })
    if (!ok) return
    await api.delete(`/fornecedores/${fornecedor.id}`)
    carregar()
  }

  if (isDiretor || isMecanico) return <AcessoNegado mensagem="Você não tem permissão para acessar este módulo." />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Fornecedores</h1>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
        >
          <Plus size={16} /> Novo Fornecedor
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {erro && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{erro}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {!carregando && fornecedores.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum fornecedor encontrado.</td></tr>
            )}
            {!carregando && fornecedores.map((f) => (
              <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-700">{f.nome}</td>
                <td className="px-4 py-3">{formatarCnpj(f.cnpj)}</td>
                <td className="px-4 py-3">{formatarTelefone(f.telefone)}</td>
                <td className="px-4 py-3">{f.email || '—'}</td>
                <td className="px-4 py-3">{f.contato || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirEdicao(f)} className="text-gray-400 hover:text-primary mr-3">
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => excluir(f)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <FornecedorModal
          fornecedor={editando}
          onClose={() => setModalAberto(false)}
          onSave={salvar}
        />
      )}
    </div>
  )
}

function formatarCnpj(cnpj) {
  if (!cnpj) return '—'
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function formatarTelefone(telefone) {
  if (!telefone) return '—'
  // 13 dígitos = 55 + DDD + 9 dígitos (celular c/ código do país); 10-11 = DDD + número local
  if (telefone.length === 13) return telefone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4')
  if (telefone.length === 11) return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (telefone.length === 10) return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return telefone
}
