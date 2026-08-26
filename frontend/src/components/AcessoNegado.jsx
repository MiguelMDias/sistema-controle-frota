import { ShieldAlert } from 'lucide-react'

export default function AcessoNegado({ mensagem = 'Você não tem permissão para acessar este módulo.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <ShieldAlert size={40} className="mb-3" />
      <p>{mensagem}</p>
    </div>
  )
}
