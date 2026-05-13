import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import Loading from './components/Loading';
import ToastContainer from './components/Toast';
import RoleRoute from './components/RoleRoute';
import HomeGeral from './pages/HomeGeral'; // Landing page carregada sem lazy

// ==================== LAZY LOADING ====================
const Login = lazy(() => import('./pages/Login'));

// Layouts
const PacienteLayout = lazy(() => import('./pages/paciente/PacienteLayout'));
const ProfissionalLayout = lazy(() => import('./pages/profissional/ProfissionalLayout'));

// Paciente
const PacienteHome = lazy(() => import('./pages/paciente/PacienteHome'));
const PacienteAnamnese = lazy(() => import('./pages/paciente/PacienteAnamnese'));
const PacientePlanoAlimentar = lazy(() => import('./pages/paciente/PacientePlanoAlimentar'));
const ShoppingNutriCliente = lazy(() => import('./pages/paciente/ShoppingNutriCliente'));

// Profissional
const HomeNutricionista = lazy(() => import('./pages/profissional/HomeNutricionista'));
const CadastroCliente = lazy(() => import('./pages/profissional/CadastroCliente'));

// ==================== COMPONENTES DE ROTA ====================
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" />;
  
  switch (user.cargo) {
    case 'paciente':
      return <Navigate to="/paciente/home" replace />;
    case 'recepcionista':
      return <Navigate to="/profissional/clientes" replace />;
    case 'nutricionista':
    case 'psicologo':
      return <Navigate to="/profissional/home" replace />;
    default:
      return <Navigate to="/" />;
  }
}

// ==================== APP PRINCIPAL ====================
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <HashRouter>
            <ToastContainer />
            <Suspense fallback={<Loading message="Carregando..." />}>
              <Routes>
                {/* Landing Page (acesso público) */}
                <Route path="/" element={<HomeGeral />} />

                {/* Login */}
                <Route path="/login" element={<Login />} />

                {/* Redirecionamento para home do usuário logado */}
                <Route path="/home" element={<HomeRedirect />} />

                {/* Paciente */}
                <Route
                  path="/paciente"
                  element={
                    <RoleRoute allowedRoles={['paciente']}>
                      <PacienteLayout />
                    </RoleRoute>
                  }
                >
                  <Route index element={<Navigate to="/paciente/home" replace />} />
                  <Route path="home" element={<PacienteHome />} />
                  <Route path="anamnese" element={<PacienteAnamnese />} />
                  <Route path="plano-alimentar" element={<PacientePlanoAlimentar />} />
                  <Route path="shopping" element={<ShoppingNutriCliente />} />
                </Route>

                {/* Profissionais e Recepcionista */}
                <Route
                  path="/profissional"
                  element={
                    <RoleRoute allowedRoles={['nutricionista', 'psicologo', 'recepcionista']}>
                      <ProfissionalLayout />
                    </RoleRoute>
                  }
                >
                  <Route path="home" element={<HomeNutricionista />} />
                  <Route path="clientes" element={<CadastroCliente />} />
                  <Route index element={<Navigate to="/profissional/home" replace />} />
                </Route>

                {/* Fallback – qualquer rota não mapeada vai para landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;