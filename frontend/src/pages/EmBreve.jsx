export default function EmBreve({ titulo }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{titulo}</h1>
      <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
        Módulo {titulo} entra no próximo passo, seguindo o mesmo padrão do módulo Máquinas.
      </div>
    </div>
  )
}
