import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './services/auth'
import RotaProtegida from './components/RotaProtegida'
import Layout from './components/Layout'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Maquinas from './pages/Maquinas'
import Fornecedores from './pages/Fornecedores'
import Manutencoes from './pages/Manutencoes'
import Abastecimentos from './pages/Abastecimentos'
import NotasFiscais from './pages/NotasFiscais'
import Checklist from './pages/Checklist'
import Relatorios from './pages/Relatorios'
import Financeiro from './pages/Financeiro'
import CentralDeLogs from './pages/CentralDeLogs'
import Usuarios from './pages/Usuarios'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route element={<RotaProtegida />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="maquinas" element={<Maquinas />} />
              <Route path="fornecedores" element={<Fornecedores />} />
              <Route path="manutencoes" element={<Manutencoes />} />
              <Route path="abastecimentos" element={<Abastecimentos />} />
              <Route path="notas-fiscais" element={<NotasFiscais />} />
              <Route path="checklist" element={<Checklist />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="logs" element={<CentralDeLogs />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
