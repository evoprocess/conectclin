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

// ==================== COMPONENTES DE ROTA ====================
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading message="Verificando sessão..." />;
  if (!user) return <Navigate to="/" replace />; // Modal de login na landing
  // Apenas profissionais têm acesso à nova home
  return <Navigate to="/profissional/home" replace />;
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

                {/* Home do Profissional */}
                <Route path="/profissional/home" element={<ProfessionalHome />} />

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