import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo.png';

export default function ProfissionalLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Aplica classe CSS do profissional
  useEffect(() => {
    document.body.classList.add('profile-profissional');
    return () => document.body.classList.remove('profile-profissional');
  }, []);

  const cargoFormatado = user.cargo.charAt(0).toUpperCase() + user.cargo.slice(1);
  const perfil = user.perfil || '';

  const titulo =
    user.cargo === 'nutricionista'
      ? 'Sistema Nutricional'
      : user.cargo === 'psicologo'
      ? 'Sistema Psicológico'
      : 'TratamentoWeb';

  // Itens de menu baseados no cargo
  const menuItems = () => {
    const items = [];

    items.push({ path: '/profissional/home', icon: '🏠', label: 'Home' });

    if (user.cargo === 'nutricionista') {
      items.push({ path: '/profissional/anamnese', icon: '📋', label: 'Anamnese' });
      items.push({ path: '/profissional/plano-alimentar', icon: '🍽️', label: 'Plano Alimentar' });
      items.push({ path: '/profissional/calculo-energetico', icon: '🧮', label: 'Cálculo Energético' });
    }

    if (user.cargo === 'psicologo') {
      items.push({ path: '/profissional/avaliacao-psicologica', icon: '🧠', label: 'Avaliação Psicológica' });
      items.push({ path: '/profissional/prontuario', icon: '📝', label: 'Prontuário' });
    }

    items.push({ path: '/profissional/shopping', icon: '🛍️', label: 'Shopping Nutri' });
    items.push({ path: '/profissional/clientes', icon: '👥', label: 'Clientes' });
    items.push({ path: '/profissional/atendimento-grupo', icon: '👥', label: 'Atendimento em Grupo' });
    items.push({ path: '/profissional/agendamentos', icon: '📅', label: 'Agendamentos' });
    items.push({ path: '/profissional/jornadas', icon: '🌟', label: 'Acompanhar Jornadas' });
    items.push({ path: '/profissional/palestras', icon: '🎥', label: 'Palestras' });
    items.push({ path: '/profissional/chat', icon: '💬', label: 'Chat' });

    return items;
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <div className="dashboard-container">
      {/* TOP BAR */}
      <div className="top-bar">
        <div className="logo-area">
          <img src={logoImage} alt="TratamentoWeb" className="logo" />
          <h2>{titulo}</h2>
        </div>
        <div className="top-bar-actions">
          <div className="user-greeting">
            <span>👋 {user.nome}</span>
            <span className="role-badge perfil-supervisor">{cargoFormatado}</span>
            <span className="role-badge" style={{ background: '#475569', color: 'white' }}>{perfil}</span>
          </div>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>

      {/* MENU LATERAL */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`} id="sideMenu">
        <div className="menu-header">
          <h3>Menu</h3>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <nav className="menu-nav">
          {menuItems().map((item) => (
            <button
              key={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                setMenuOpen(false);
                navigate(item.path);
              }}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="menu-divider">Sistema</div>
          <button className="menu-item logout" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            <span>Sair</span>
          </button>
        </nav>
      </div>
      <div className="menu-overlay" id="menuOverlay" onClick={() => setMenuOpen(false)} />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}