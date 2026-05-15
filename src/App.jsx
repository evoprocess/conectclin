import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import Loading from './components/Loading';
import ToastContainer from './components/Toast';
import HomeGeral from './pages/HomeGeral'; // Landing page carregada sem lazy

// ==================== LAZY LOADING ====================
const ProfessionalHome = lazy(() => import('./pages/profissional/ProfessionalHome'));
const CadastrarPaciente = lazy(() => import('./pages/CadastrarPaciente'));
const PacienteHome = lazy(() => import('./pages/paciente/PacienteHome'));
const CadastrarFuncionario = lazy(() => import('./pages/gerenciamento/CadastrarFuncionario'));

// ==================== COMPONENTES DE ROTA ====================

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/" replace />;

  // Gestor (perfil gerente) vai para cadastro de funcionários
  if (user.cargo === 'gestor') {
    return <Navigate to="/gerenciamento/cadastrar-funcionario" replace />;
  }

  // Recepcionista vai para cadastro de pacientes
  if (user.cargo === 'recepcionista') {
    return <Navigate to="/cadastrar-paciente" replace />;
  }

  // Paciente vai para home do paciente
  if (user.cargo === 'paciente') {
    return <Navigate to="/paciente/home" replace />;
  }

  // Nutricionista e Psicólogo vão para home profissional
  return <Navigate to="/profissional/home" replace />;
}

// Componente que protege a rota profissional
function ProtectedProfessionalRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/" replace />;
  if (user.cargo !== 'nutricionista' && user.cargo !== 'psicologo' && user.cargo !== 'gerente') {
    return <Navigate to="/" replace />;
  }
  return <ProfessionalHome />;
}

// Componente que protege a rota de cadastro de pacientes
function ProtectedCadastroRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/" replace />;

  // Recepcionista, Supervisor e Gerente podem acessar
  if (user.cargo === 'recepcionista' || user.cargo === 'gerente' || user.perfil === 'supervisor') {
    return <CadastrarPaciente />;
  }

  return <Navigate to="/" replace />;
}

// Componente que protege a rota da home do paciente
function ProtectedPacienteRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/" replace />;
  // Apenas pacientes logados acessam sua home
  if (user.cargo !== 'paciente') {
    return <Navigate to="/" replace />;
  }
  return <PacienteHome />;
}

// Componente que protege rotas exclusivas do Gerente
function ProtectedGerenteRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando permissão..." />;
  if (!user) return <Navigate to="/" replace />;
  if (user.cargo !== 'gestor') {
    return <Navigate to="/" replace />;
  }
  return children;
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

                {/* Redirecionamento para home do usuário logado */}
                <Route path="/home" element={<HomeRedirect />} />

                {/* Cadastro de Pacientes (Supervisor/Gerente/Recepcionista) */}
                <Route path="/cadastrar-paciente" element={<ProtectedCadastroRoute />} />

                {/* Cadastro de Funcionários (exclusivo Gerente) */}
                <Route
                  path="/gerenciamento/cadastrar-funcionario"
                  element={
                    <ProtectedGerenteRoute>
                      <CadastrarFuncionario />
                    </ProtectedGerenteRoute>
                  }
                />

                {/* Home do Paciente (logado) */}
                <Route path="/paciente/home" element={<ProtectedPacienteRoute />} />

                {/* Home do Profissional (Nutri, Psico, Gerente) */}
                <Route path="/profissional/home" element={<ProtectedProfessionalRoute />} />

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