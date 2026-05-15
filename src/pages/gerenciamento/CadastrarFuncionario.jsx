import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/Loading';
import logoImg from '../../assets/logo.webp';
import styles from './CadastrarFuncionario.module.css';

const CadastrarFuncionario = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user, logout } = useAuth();
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
    { label: 'Cadastro de Pacientes', icon: '👤', action: () => { setMenuOpen(false); navigate('/cadastrar-paciente'); } },
    { label: 'Cadastro de Funcionários', icon: '👥', action: () => setMenuOpen(false) },
    { label: 'Voltar ao Início', icon: '🏠', action: () => { setMenuOpen(false); navigate('/home'); } },
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Loading message="Carregando cadastro de funcionários..." />
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
          </div>
          <div className={styles.navCenter}>
            <span className={styles.pageTitle}>Cadastro de Funcionários</span>
          </div>
          <div className={styles.navRight}>
            <span className={styles.userInfo}>
              {user?.nome ? (() => {
                const partes = user.nome.trim().split(' ');
                return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
              })() : 'Gerente'} | Gerente
            </span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
          </div>
        </nav>

        {/* Conteúdo placeholder */}
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h2 className={styles.greeting}>Cadastro de Funcionários</h2>
            <p className={styles.subtitle}>
              Área exclusiva para gestores (Perfil Gerente). Cadastre novos profissionais e recepcionistas na plataforma.
            </p>
          </div>

          <div className={styles.placeholderCard}>
            <div className={styles.placeholderIcon}>👥</div>
            <h3 className={styles.placeholderTitle}>Em desenvolvimento</h3>
            <p className={styles.placeholderText}>
              O formulário de cadastro de funcionários estará disponível em breve. Aqui você poderá cadastrar nutricionistas, psicólogos e recepcionistas com todos os dados necessários.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2026 ConectClin. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default CadastrarFuncionario;