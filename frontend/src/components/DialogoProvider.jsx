import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AlertTriangle, Info } from 'lucide-react'

const DialogoContext = createContext(null)

/**
 * Provider global de diálogos de confirmação/aviso. Substitui window.confirm()
 * e window.alert() por um modal no padrão visual do sistema -- mais amigável
 * para quem não é técnico, que costuma estranhar as caixinhas cinzas do navegador.
 *
 * Uso:
 *   const { confirmar, alertar } = useDialogo()
 *   const ok = await confirmar({ titulo: 'Excluir máquina', mensagem: '...', perigo: true })
 *   if (!ok) return
 *   await alertar({ titulo: 'Não foi possível', mensagem: '...' })
 */
export function DialogoProvider({ children }) {
  const [estado, setEstado] = useState(null)
  const resolverRef = useRef(null)

  const confirmar = useCallback((opcoes) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setEstado({ tipo: 'confirmar', ...opcoes })
    })
  }, [])

  const alertar = useCallback((opcoes) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setEstado({ tipo: 'alertar', ...opcoes })
    })
  }, [])

  function fechar(resultado) {
    resolverRef.current?.(resultado)
    setEstado(null)
  }

  return (
    <DialogoContext.Provider value={{ confirmar, alertar }}>
      {children}
      {estado && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${estado.perigo ? 'bg-red-100' : 'bg-indigo-100'}`}>
                {estado.perigo ? <AlertTriangle size={20} className="text-red-600" /> : <Info size={20} className="text-primary" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{estado.titulo}</h3>
                {estado.mensagem && <p className="text-sm text-gray-600 mt-1">{estado.mensagem}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              {estado.tipo === 'confirmar' && (
                <button onClick={() => fechar(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancelar
                </button>
              )}
              <button
                onClick={() => fechar(true)}
                autoFocus
                className={`px-4 py-2 text-sm rounded-lg text-white font-medium ${
                  estado.perigo ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {estado.textoConfirmar || (estado.tipo === 'alertar' ? 'Entendi' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogoContext.Provider>
  )
}

export function useDialogo() {
  const ctx = useContext(DialogoContext)
  if (!ctx) throw new Error('useDialogo precisa ser usado dentro de <DialogoProvider>')
  return ctx
}
