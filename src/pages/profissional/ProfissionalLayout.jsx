import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo.webp';

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
      : user.cargo === 'recepcionista'
      ? 'Sistema de Recepção'
      : 'TratamentoWeb';

  // ✅ MENU DINÂMICO baseado no cargo
  const menuItems = () => {
    const items = [];

    if (user.cargo === 'recepcionista') {
      // Recepcionista vê apenas Cadastro de Pacientes
      items.push({ path: '/profissional/clientes', icon: '👥', label: 'Cadastro de Pacientes' });
    } else {
      // Nutricionista e Psicólogo vêem os dois itens
      items.push({ path: '/profissional/home', icon: '📋', label: 'Prontuário' });
      items.push({ path: '/profissional/clientes', icon: '👥', label: 'Cadastro de Pacientes' });
    }

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