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

  const { user, logout, orgInfo, profissionaisVinculados, atendimentosData } = useAuth();
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

  // Processa especialidades reais do Firestore
  const especialidadesReais = [];
  
  Object.entries(atendimentosData || {}).forEach(([profissionalId, especialidades]) => {
    Object.entries(especialidades).forEach(([especialidade, dados]) => {
      const profissionalInfo = profissionaisVinculados?.[profissionalId] || {};
      const ultimoProntuario = dados.prontuario 
        ? Object.keys(dados.prontuario).sort().reverse()[0] 
        : null;

      especialidadesReais.push({
        id: `${profissionalId}-${especialidade}`,
        nome: especialidade.replace('_', ' '),
        profissional: profissionalInfo.nome || profissionalId,
        status: dados.status || 'ativo',
        ultimoAtendimento: ultimoProntuario,
        icone: mapearIcone(especialidade)
      });
    });
  });

  // Fallback para dados mockados se não houver dados reais
  const specialties = especialidadesReais.length > 0 ? especialidadesReais : [
    { id: 1, nome: 'Nutrição', icone: '🥗', desc: 'Acompanhamento nutricional personalizado', status: 'active', profissional: 'Nenhum' },
    { id: 2, nome: 'Psicologia', icone: '🧠', desc: 'Apoio psicológico e avaliações', status: 'inactive', profissional: 'Nenhum' },
  ];

  // Notificações baseadas em dados reais
  const notifications = gerarNotificacoes(especialidadesReais, atendimentosData);

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
            {/* NOME DA ORGANIZAÇÃO */}
            {orgInfo?.nome_da_organizacao && (
              <span className={styles.orgName}>
                {orgInfo.nome_da_organizacao}
              </span>
            )}
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
            <h2 className={styles.greeting}>
              Bem-vindo(a), {user?.nome?.split(' ')[0] || 'Paciente'}!
            </h2>
            <p className={styles.subtitle}>
              {orgInfo?.nome_da_organizacao 
                ? `Você está conectado à ${orgInfo.nome_da_organizacao}`
                : 'Aqui você terá acesso a suas especialidades vinculadas e muito mais.'
              }
            </p>
          </div>

          {/* Cards de resumo */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>👨‍⚕️</span>
              <div>
                <strong>{Object.keys(profissionaisVinculados || {}).length}</strong>
                <p>Profissionais</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>🏥</span>
              <div>
                <strong>{especialidadesReais.length || specialties.length}</strong>
                <p>Especialidades</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>📅</span>
              <div>
                <strong>{especialidadesReais.filter(e => e.ultimoAtendimento).length}</strong>
                <p>Com prontuário</p>
              </div>
            </div>
          </div>

          {/* Grid de especialidades */}
          <h3 className={styles.sectionTitle}>Minhas Especialidades</h3>
          <div className={styles.specialtiesGrid}>
            {specialties.map(spec => (
              <div key={spec.id} className={styles.specialtyCard}>
                <div className={styles.specialtyIcon}>{spec.icone}</div>
                <h3 className={styles.specialtyName}>{spec.nome}</h3>
                <p className={styles.specialtyDesc}>
                  {especialidadesReais.length > 0 
                    ? `Dr(a). ${spec.profissional}`
                    : spec.desc
                  }
                </p>
                <span className={`${styles.specialtyStatus} ${spec.status === 'active' || spec.status === 'ativo' ? styles.statusActive : styles.statusInactive}`}>
                  {spec.status === 'active' || spec.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                {spec.ultimoAtendimento && (
                  <span className={styles.lastAttendance}>
                    Último: {spec.ultimoAtendimento}
                  </span>
                )}
              </div>
            ))}
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

// Função auxiliar para mapear ícones por especialidade
function mapearIcone(especialidade) {
  const icones = {
    'nutricionista': '🥗',
    'psicologo': '🧠',
    'cardiologista': '❤️',
    'educador_fisico': '💪',
    'fisioterapeuta': '🦴',
    'nutrição': '🥗',
    'psicologia': '🧠',
    'cardiologia': '❤️',
    'educação_física': '💪',
    'fisioterapia': '🦴',
  };
  return icones[especialidade.toLowerCase()] || '🏥';
}

// Função para gerar notificações baseadas nos dados reais
function gerarNotificacoes(especialidades, atendimentosData) {
  const notificacoes = [];
  
  especialidades.forEach(esp => {
    if (esp.ultimoAtendimento) {
      notificacoes.push({
        id: `pront-${esp.id}`,
        title: `Prontuário Atualizado - ${esp.nome}`,
        description: `Dr(a). ${esp.profissional} registrou novo prontuário.`,
        date: esp.ultimoAtendimento
      });
    }
  });

  if (notificacoes.length === 0) {
    return [
      { id: 1, title: 'Bem-vindo(a)!', description: 'Explore suas especialidades vinculadas.', date: new Date().toISOString().split('T')[0] },
      { id: 2, title: 'Dica', description: 'Mantenha seus dados atualizados para melhor atendimento.', date: new Date().toISOString().split('T')[0] },
    ];
  }

  return notificacoes.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
}

export default PacienteHome;