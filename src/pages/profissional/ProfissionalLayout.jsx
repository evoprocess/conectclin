import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

export default function ProfissionalLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logout realizado com sucesso!', 'success');
      navigate('/login');
    } catch (error) {
      showToast('Erro ao fazer logout', 'error');
    }
  };

  const menuItems = [
    { 
      name: 'Prontuário', 
      path: '/profissional/home', 
      icon: 'bi-journal-bookmark-fill'
    },
    { 
      name: 'Cadastro de Pacientes', 
      path: '/profissional/cadastro-clientes', 
      icon: 'bi-person-plus-fill'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="profile-profissional">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="logo-area">
            <img src="/src/assets/logo.webp" alt="Logo" className="logo" />
            <h2>ConectClin</h2>
          </div>
          <div className="top-bar-actions">
            <div className="user-greeting">
              <i className="bi bi-person-circle"></i>
              <span>{user?.nome || user?.email?.split('@')[0]}</span>
              <span className="role-badge perfil-supervisor">Profissional</span>
            </div>
            <button 
              className="menu-toggle" 
              onClick={() => setMenuOpen(true)}
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <Outlet />
        </div>

        {/* Side Menu */}
        <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
          <div className="menu-header">
            <h3>Menu</h3>
            <button className="close-menu" onClick={() => setMenuOpen(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="menu-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.name}</span>
              </button>
            ))}
            <button className="menu-item logout" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right"></i>
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Overlay */}
        <div 
          className={`menu-overlay ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
        ></div>
      </div>
    </>
  );
}