import { useAuth } from '../../contexts/AuthContext';
import HomeNutricionista from './HomeNutricionista';
import HomePsicologo from './HomePsicologo';

export default function ProfissionalHome() {
  const { user } = useAuth();
  if (user.cargo === 'nutricionista') return <HomeNutricionista />;
  if (user.cargo === 'psicologo') return <HomePsicologo />;
  return <div>Cargo não reconhecido</div>;
}