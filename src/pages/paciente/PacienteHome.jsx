import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/Loading';
import logoImg from '../../assets/logo.webp';
import styles from './PacienteHome.module.css';

const PacienteHome = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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

  // Dados mockados
  const notifications = [
    { id: 1, title: 'Plano Alimentar Atualizado', description: 'Seu nutricionista atualizou seu plano alimentar.', date: '2026-05-14' },
    { id: 2, title: 'Nova Anamnese Disponível', description: 'Sua anamnese foi revisada pelo profissional.', date: '2026-05-13' },
    { id: 3, title: 'Lembrete', description: 'Não se esqueça de registrar seu progresso semanal.', date: '2026-05-12' },
  ];

  const specialties = [
    { id: 1, name: 'Nutrição', icon: '🥗', desc: 'Acompanhamento nutricional personalizado', status: 'active' },
    { id: 2, name: 'Psicologia', icon: '🧠', desc: 'Apoio psicológico e avaliações', status: 'inactive' },
  ];

  const menuItems = [
    { label: 'Minhas Especialidades', icon: '⭐', action: () => setMenuOpen(false) },
    { label: 'Plano Alimentar', icon: '📋', action: () => setMenuOpen(false) },
    { label: 'Meu Progresso', icon: '📈', action: () => setMenuOpen(false) },
    { label: 'Shopping Nutri', icon: '🛒', action: () => setMenuOpen(false) },
  ];

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Loading message="Carregando sua área..." />
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
            <span className={styles.pageTitle}>Área do Paciente</span>
          </div>
          <div className={styles.navRight}>
            <div className={styles.notificationWrapper}>
              <button className={styles.notificationBell} onClick={() => setNotificationsOpen(!notificationsOpen)}>🔔
                {notifications.length > 0 && <span className={styles.notificationBadge}>{notifications.length}</span>}
              </button>
              {notificationsOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationDropdownHeader}>
                    <strong>Notificações</strong>
                    <button className={styles.notificationCloseDropdown} onClick={() => setNotificationsOpen(false)}>✕</button>
                  </div>
                  {notifications.map(n => (
                    <div key={n.id} className={styles.notificationItem}>
                      <div className={styles.notificationItemTitle}>{n.title}</div>
                      <div className={styles.notificationItemDesc}>{n.description}</div>
                      <div className={styles.notificationItemDate}>{n.date}</div>
                    </div>
                  ))}
                  <div className={styles.notificationViewAll}>Ver todas →</div>
                </div>
              )}
            </div>
            <span className={styles.userInfo}>
              {user?.nome ? (() => {
                const partes = user.nome.trim().split(' ');
                return partes.length > 1 ? `${partes[0]} ${partes[partes.length - 1]}` : partes[0];
              })() : 'Paciente'}
            </span>
            <button onClick={handleLogout} className={styles.logoutBtn}>Sair</button>
          </div>
        </nav>

        {/* Conteúdo */}
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h2 className={styles.greeting}>Bem-vindo(a), {user?.nome?.split(' ')[0] || 'Paciente'}!</h2>
            <p className={styles.subtitle}>
              Aqui você terá acesso a suas especialidades vinculadas e muito mais.
            </p>
          </div>

          {/* Grid de especialidades */}
          <div className={styles.specialtiesGrid}>
            {specialties.map(spec => (
              <div key={spec.id} className={styles.specialtyCard}>
                <div className={styles.specialtyIcon}>{spec.icon}</div>
                <h3 className={styles.specialtyName}>{spec.name}</h3>
                <p className={styles.specialtyDesc}>{spec.desc}</p>
                <span className={`${styles.specialtyStatus} ${spec.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                  {spec.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
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

export default PacienteHome;