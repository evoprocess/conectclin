import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

import PacienteLayout from './pages/paciente/PacienteLayout';
import PacienteHome from './pages/paciente/PacienteHome';
import PacienteAnamnese from './pages/paciente/PacienteAnamnese';
import PacientePlanoAlimentar from './pages/paciente/PacientePlanoAlimentar';
import ShoppingNutriCliente from './pages/paciente/ShoppingNutriCliente';

import ProfissionalLayout from './pages/profissional/ProfissionalLayout';
import HomeNutricionista from './pages/profissional/HomeNutricionista';
import HomePsicologo from './pages/profissional/HomePsicologo';
import CadastroCliente from './pages/profissional/CadastroCliente';
import AnamneseNutricionista from './pages/profissional/AnamneseNutricionista';
import ProfissionalHome from './pages/profissional/ProfissionalHome';
import PlanoAlimentarNutricionista from './pages/profissional/PlanoAlimentarNutricionista';
import CalculoEnergeticoNutricionista from './pages/profissional/CalculoEnergeticoNutricionista';
import AvaliacaoPsicologica from './pages/profissional/AvaliacaoPsicologica';
import ProntuarioPsicologico from './pages/profissional/ProntuarioPsicologico';
import AtendimentoGrupo from './pages/profissional/AtendimentoGrupo';
import Agendamentos from './pages/profissional/Agendamentos';
import Jornadas from './pages/profissional/Jornadas';
import Palestras from './pages/profissional/Palestras';
import ShoppingNutriNutricionista from './pages/profissional/ShoppingNutriNutricionista';
import Chat from './pages/profissional/Chat';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" />;
  if (!user) return <Navigate to="/" />;
  switch (user.cargo) {
    case 'paciente':
      return <Navigate to="/paciente/home" replace />;
    case 'nutricionista':
      return <Navigate to="/profissional/home" replace />;
    case 'psicologo':
      return <Navigate to="/profissional/home" replace />;
    default:
      return <Navigate to="/" />;
  }
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<HomeRedirect />} />

          {/* Paciente */}
          <Route path="/paciente" element={<PacienteLayout />}>
            <Route index element={<Navigate to="/paciente/home" replace />} />
            <Route path="home" element={<PacienteHome />} />
            <Route path="anamnese" element={<PacienteAnamnese />} />
            <Route path="plano-alimentar" element={<PacientePlanoAlimentar />} />
            <Route path="shopping" element={<ShoppingNutriCliente />} />
          </Route>

          {/* Profissionais */}
          <Route path="/profissional" element={<ProfissionalLayout />}>
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
            <Route path="home" element={<ProfissionalHome />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;