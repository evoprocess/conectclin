import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/Loading';
import logoImg from '../../assets/logo.webp';
import styles from './CadastrarPaciente.module.css';

const CadastrarPaciente = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, logout, orgInfo } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logout realizado com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao sair', 'error');
    }
  };

  const menuItems = [
    { label: 'Cadastro de Pacientes', icon: '👤', action: () => setMenuOpen(false) },
    { label: 'Voltar ao Início', icon: '🏠', action: () => { setMenuOpen(false); navigate('/home'); } },
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Loading message="Carregando cadastro..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.pageWrapper}>
      {/* Overlay do menu */}
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

      {/* Menu lateral retrátil */}
      <div className={`${styles.sideMenu} ${menuOpen ? styles.sideMenuOpen : ''}`}>
        <button className={styles.closeMenuBtnAbsolute} onClick={() => setMenuOpen(false)}>✕</button>
        <nav className={styles.menuNav}>
          {menuItems.map((item, idx) => (
            <button key={idx} className={styles.menuItem} onClick={item.action}>
              <span className={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo principal */}
      <div className={`${styles.contentPush} ${menuOpen ? styles.contentPushOpen : ''}`}>
        {/* Navbar */}
        <nav className={styles.navbar}>
          <div className={styles.navLeft}>
            <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>☰</button>
            <img src={logoImg} alt="ConectClin" className={styles.logo} />
            {/* NOME DA ORGANIZAÇÃO */}
            {orgInfo?.nome_da_organizacao && (
              <span className={styles.orgName}>
                {orgInfo.nome_da_organizacao}
              </span>
            )}
          </div>
          <div className={styles.navCenter}>
            <span className={styles.pageTitle}>Cadastro de Pacientes</span>
          </div>
          <div className={styles.navRight}>
            <span className={styles.userInfo}>
              {user?.nome ? (() => {
                const partes = user.nome.trim().split(' ');
                return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
              })() : 'Usuário'} 
              <span className={styles.userCargo}> | {user?.cargo || 'Cargo'}</span>
            </span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
          </div>
        </nav>

        {/* Conteúdo */}
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h2 className={styles.greeting}>Cadastro de Pacientes</h2>
            <p className={styles.subtitle}>
              {orgInfo?.nome_da_organizacao 
                ? `${orgInfo.nome_da_organizacao} - Registre novos pacientes no sistema`
                : 'Registre novos pacientes no sistema'
              }
            </p>
          </div>

          {/* Card informativo */}
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🏥</div>
            <div className={styles.infoContent}>
              <h3>Ambiente de Cadastro</h3>
              <p>
                {user?.cargo === 'recepcionista' 
                  ? 'Como recepcionista, você pode cadastrar novos pacientes para a organização.'
                  : 'Você está acessando a área de cadastro de pacientes.'
                }
              </p>
            </div>
          </div>

          {/* Placeholder do formulário */}
          <div className={styles.placeholderCard}>
            <div className={styles.placeholderIcon}>👤</div>
            <h3 className={styles.placeholderTitle}>Em desenvolvimento</h3>
            <p className={styles.placeholderText}>
              O formulário de cadastro de pacientes estará disponível em breve. Aqui você poderá registrar novos pacientes com todos os dados necessários para o acompanhamento.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2026 {orgInfo?.nome_da_organizacao || 'ConectClin'}. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default CadastrarPaciente;
