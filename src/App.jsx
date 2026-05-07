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
const ProfissionalHome = lazy(() => import('./pages/profissional/ProfissionalHome'));
const CadastroCliente = lazy(() => import('./pages/profissional/CadastroCliente'));
const AnamneseNutricionista = lazy(() => import('./pages/profissional/AnamneseNutricionista'));
const PlanoAlimentarNutricionista = lazy(() => import('./pages/profissional/PlanoAlimentarNutricionista'));
const CalculoEnergeticoNutricionista = lazy(() => import('./pages/profissional/CalculoEnergeticoNutricionista'));
const AvaliacaoPsicologica = lazy(() => import('./pages/profissional/AvaliacaoPsicologica'));
const ProntuarioPsicologico = lazy(() => import('./pages/profissional/ProntuarioPsicologico'));
const AtendimentoGrupo = lazy(() => import('./pages/profissional/AtendimentoGrupo'));
const Agendamentos = lazy(() => import('./pages/profissional/Agendamentos'));
const Jornadas = lazy(() => import('./pages/profissional/Jornadas'));
const Palestras = lazy(() => import('./pages/profissional/Palestras'));
const ShoppingNutriNutricionista = lazy(() => import('./pages/profissional/ShoppingNutriNutricionista'));
const Chat = lazy(() => import('./pages/profissional/Chat'));

// ==================== COMPONENTES DE ROTA ====================
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" />;
  switch (user.cargo) {
    case 'paciente':
      return <Navigate to="/paciente/home" replace />;
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

                {/* Profissionais */}
                <Route
                  path="/profissional"
                  element={
                    <RoleRoute allowedRoles={['nutricionista', 'psicologo']}>
                      <ProfissionalLayout />
                    </RoleRoute>
                  }
                >
                  <Route path="home" element={<ProfissionalHome />} />
                  <Route path="clientes" element={<CadastroCliente />} />
                  <Route path="anamnese" element={<AnamneseNutricionista />} />
                  <Route path="plano-alimentar" element={<PlanoAlimentarNutricionista />} />
                  <Route path="calculo-energetico" element={<CalculoEnergeticoNutricionista />} />
                  <Route path="avaliacao-psicologica" element={<AvaliacaoPsicologica />} />
                  <Route path="prontuario" element={<ProntuarioPsicologico />} />
                  <Route path="atendimento-grupo" element={<AtendimentoGrupo />} />
                  <Route path="shopping" element={<ShoppingNutriNutricionista />} />
                  <Route path="agendamentos" element={<Agendamentos />} />
                  <Route path="jornadas" element={<Jornadas />} />
                  <Route path="palestras" element={<Palestras />} />
                  <Route path="chat" element={<Chat />} />
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