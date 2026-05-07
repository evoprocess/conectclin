import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/logo.webp';

export default function PacienteLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Adiciona/remove a classe profile-paciente no body
  useEffect(() => {
    document.body.classList.add('profile-paciente');
    return () => {
      document.body.classList.remove('profile-paciente');
    };
  }, []);

  const primeiroNome = user.nome ? user.nome.trim().split(' ')[0] : 'Usuário';
  const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();

  const navItems = [
    { path: '/paciente/home',           icon: '🏠', label: 'Home' },
    { path: '/paciente/plano-alimentar', icon: '🍽️', label: 'Meu Plano Alimentar' },
    { path: '/paciente/anamnese',       icon: '📋', label: 'Minha Anamnese' },
    { path: '/paciente/shopping',       icon: '🛍️', label: 'Shopping Nutri' },
  ];

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <div className="home-container">
      {/* HEADER */}
      <div className="header d-flex justify-content-between align-items-center flex-wrap">
        <div className="d-flex align-items-center gap-2">
          <img src={logoImage} alt="TratamentoWeb" className="header-logo-img" style={{ height: 36, filter: 'brightness(0) invert(1)' }} />
        </div>
        <div className="user-info d-flex align-items-center gap-2">
          <span className="text-white">👋 Olá, {nomeFormatado}</span>
          <button className="menu-toggle-btn d-flex align-items-center justify-content-center" onClick={() => setMenuOpen(true)}>☰</button>
        </div>
      </div>

      {/* MENU LATERAL */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h3 className="m-0">Menu</h3>
          <button className="close-menu" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <nav className="menu-nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { setMenuOpen(false); navigate(item.path); }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <div className="menu-divider"></div>
          <button className="menu-item logout" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </nav>
      </div>
      <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* CONTEÚDO DA SUB-ROTA */}
      <div className="content p-3">
        <Outlet />
      </div>
    </div>
  );
}