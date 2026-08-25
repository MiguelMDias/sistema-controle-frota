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
  Upload,
  Users,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../services/auth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/maquinas', label: 'Máquinas', icon: Truck },
  { to: '/manutencoes', label: 'Manutenções', icon: Wrench },
  { to: '/abastecimentos', label: 'Abastecimentos', icon: Fuel },
  { to: '/fornecedores', label: 'Fornecedores', icon: Briefcase },
  { to: '/notas-fiscais', label: 'Notas Fiscais', icon: FileText },
  { to: '/checklist', label: 'Checklist', icon: CheckSquare },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/importacao', label: 'Importação', icon: Upload },
]

export default function Layout() {
  const { auth, logout, isAdmin, isObservador } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <Truck className="text-primary" size={24} />
          <span className="font-semibold text-gray-800">Controle de Frota</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/usuarios"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Users size={18} />
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-700 truncate">{auth?.nome}</p>
            <p className="text-xs text-gray-400">
              {auth?.papel === 'admin' ? 'Administrador' : auth?.papel === 'observador' ? 'Observador' : 'Operador'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        {isObservador && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-8 py-2.5 flex items-center justify-between shrink-0">
            <span>👁️ Modo Observador — visualização com dados de demonstração, sem acesso ao banco real.</span>
          </div>
        )}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
