import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Fuel,
  Briefcase,
  FileText,
  CheckSquare,
  BarChart3,
  Users,
  LogOut,
  Wallet,
  ScrollText,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../services/auth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/maquinas', label: 'Máquinas', icon: Truck, ocultarPara: ['diretor'] },
  { to: '/manutencoes', label: 'Manutenções', icon: Wrench, ocultarPara: ['diretor'] },
  { to: '/abastecimentos', label: 'Abastecimentos', icon: Fuel, ocultarPara: ['diretor'] },
  { to: '/fornecedores', label: 'Fornecedores', icon: Briefcase, ocultarPara: ['diretor'] },
  { to: '/notas-fiscais', label: 'Notas Fiscais', icon: FileText, ocultarPara: ['diretor'] },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare, ocultarPara: ['diretor'] },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, ocultarPara: ['mecanico'] },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

const LABEL_PAPEL = {
  admin: 'Administrador',
  mecanico: 'Mecânico',
  diretor: 'Diretor',
  observador: 'Observador',
}

function itemClasse({ isActive }) {
  return `flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-indigo-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
  }`
}

export default function Layout() {
  const { auth, logout, isAdmin, isObservador } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  // Observador (modo demo) vê tudo; os demais papéis têm módulos ocultados conforme a permissão.
  const itensVisiveis = NAV_ITEMS.filter(
    (item) => isObservador || !item.ocultarPara?.includes(auth?.papel)
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Fundo escurecido atrás do menu, só no mobile quando aberto */}
      {menuAberto && (
        <div
          onClick={fecharMenu}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-60 bg-white border-r border-gray-200 flex flex-col shrink-0
          transform transition-transform duration-200 ease-in-out
          ${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Truck className="text-primary" size={24} />
            <span className="font-semibold text-gray-800">Controle de Frota</span>
          </div>
          <button onClick={fecharMenu} className="md:hidden text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {itensVisiveis.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={fecharMenu} className={itemClasse}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <NavLink to="/usuarios" onClick={fecharMenu} className={itemClasse}>
                <Users size={18} />
                Usuários
              </NavLink>
              <NavLink to="/logs" onClick={fecharMenu} className={itemClasse}>
                <ScrollText size={18} />
                Central de Logs
              </NavLink>
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-700 truncate">{auth?.nome}</p>
            <p className="text-xs text-gray-400">
              {LABEL_PAPEL[auth?.papel] || auth?.papel}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior, só aparece no mobile */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button onClick={() => setMenuAberto(true)} className="text-gray-500 hover:text-gray-700">
            <Menu size={22} />
          </button>
          <Truck className="text-primary" size={20} />
          <span className="font-semibold text-gray-800 text-sm">Controle de Frota</span>
        </div>

        <main className="flex-1 overflow-y-auto flex flex-col">
          {isObservador && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs sm:text-sm px-4 sm:px-8 py-2.5 flex items-center justify-between shrink-0">
              <span>👁️ Modo Observador — visualização com dados de demonstração, sem acesso ao banco real.</span>
            </div>
          )}
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
