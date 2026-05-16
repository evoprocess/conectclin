import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/Loading';
import logoImg from '../../assets/logo.webp';
import styles from './ProfessionalHome.module.css';

/* ==================== MINI CALENDÁRIO ==================== */
const MiniCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className={styles.calendarDay} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday =
      d === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    days.push(
      <div
        key={d}
        className={`${styles.calendarDay} ${isToday ? styles.calendarToday : ''}`}
      >
        {d}
      </div>
    );
  }

  return (
    <div className={styles.miniCalendar}>
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} className={styles.calendarNavBtn}>&lt;</button>
        <span className={styles.calendarMonth}>{months[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} className={styles.calendarNavBtn}>&gt;</button>
      </div>
      <div className={styles.calendarWeekDays}>
        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
      </div>
      <div className={styles.calendarGrid}>
        {days}
      </div>
    </div>
  );
};

/* ==================== COMPONENTE PRINCIPAL ==================== */
const ProfessionalHome = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // controla qual modal está aberto
  const [loading, setLoading] = useState(true);

  const { user, logout, orgInfo, atendimentosData } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Monitora o usuário: ao deslogar, redireciona
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Simula carregamento dos dados do Firestore
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logout realizado com sucesso', 'success');
      setActiveModal(null);
    } catch (error) {
      showToast('Erro ao sair', 'error');
    }
  };

  // Processa pacientes reais dos atendimentos
  const pacientesReais = [];
  
  if (atendimentosData && Object.keys(atendimentosData).length > 0) {
    Object.entries(atendimentosData).forEach(([especialidade, dados]) => {
      if (dados.pacientes_vinculados) {
        Object.entries(dados.pacientes_vinculados).forEach(([pacienteId, pacienteData]) => {
          // Evita duplicar paciente se já estiver em múltiplas especialidades
          if (!pacientesReais.find(p => p.id === pacienteId)) {
            const ultimoProntuario = pacienteData.prontuario 
              ? Object.keys(pacienteData.prontuario).sort().reverse()[0] 
              : null;

            pacientesReais.push({
              id: pacienteId,
              nome: pacienteId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              especialidade: especialidade.replace('_', ' '),
              ultimoAtendimento: ultimoProntuario || 'Sem registro',
              prontuario: pacienteData.prontuario || {}
            });
          }
        });
      }
    });
  }

  // Contagem de pacientes reais
  const totalPacientesReais = pacientesReais.length;
  const totalEspecialidadesReais = Object.keys(atendimentosData || {}).length;

  // Dados mockados (mantidos como estavam)
  const notifications = [
    { id: 1, title: 'Novo funcionário cadastrado', description: 'Dr. João Silva – Nutricionista Esportivo', date: '2026-05-10' },
    { id: 2, title: 'Atualização de especialização', description: 'Dra. Maria Souza concluiu Pós em Psicologia Clínica', date: '2026-05-12' },
    { id: 3, title: 'Sistema', description: 'Nova funcionalidade de agendamentos disponível', date: '2026-05-13' },
  ];

  const acompanhamentos = [
    { id: 1, patient: 'Ana Clara', status: 'Em andamento', lastUpdate: '2026-05-13', details: 'Plano alimentar revisado, aguardando feedback' },
    { id: 2, patient: 'Carlos Eduardo', status: 'Pendente', lastUpdate: '2026-05-12', details: 'Falta enviar avaliação psicológica' },
    { id: 3, patient: 'Mariana Lima', status: 'Finalizado', lastUpdate: '2026-05-01', details: 'Ciclo encerrado, retorno em 3 meses' },
  ];

  const agendamentos = [
    { id: 1, patient: 'Beatriz Oliveira', date: '2026-05-15 09:00', type: 'Consulta Nutricional', status: 'Confirmado' },
    { id: 2, patient: 'Lucas Mendes', date: '2026-05-15 14:30', type: 'Avaliação Psicológica', status: 'Agendado' },
    { id: 3, patient: 'Paula Fernandes', date: '2026-05-16 11:00', type: 'Retorno', status: 'Pendente de confirmação' },
  ];

  const consultasHoje = agendamentos.filter(a => a.date.startsWith('2026-05-15'));

  const pendentesCount =
    acompanhamentos.filter(a => a.status === 'Pendente').length +
    agendamentos.filter(a => a.status === 'Pendente de confirmação').length;

  const menuItems = [
    { label: 'Agenda', icon: '📅', action: () => { setMenuOpen(false); } },
    { label: 'Prontuário', icon: '📋', action: () => { setMenuOpen(false); }, badge: pendentesCount },
    { label: 'Cadastro de Pacientes', icon: '👤', action: () => { setMenuOpen(false); } },
  ];

  const closeModal = () => setActiveModal(null);

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <Loading message="Carregando painel..." />
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
              {item.badge > 0 && <span className={styles.menuBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo empurrado pelo menu */}
      <div className={`${styles.contentPush} ${menuOpen ? styles.contentPushOpen : ''}`}>
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
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input type="text" className={styles.searchInput} placeholder="Buscar paciente por nome ou CPF..." />
            </div>
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
              })() : 'Profissional'} 
              <span className={styles.userCargo}> | {user?.cargo || 'Cargo'}</span>
            </span>
            <button onClick={() => setActiveModal('logout')} className={styles.logoutBtn}>Sair</button>
          </div>
        </nav>

        <div className={styles.mainContent}>
          <div className={styles.header}>
            <h2 className={styles.greeting}>Bem-vindo(a), {user?.nome?.split(' ')[0] || 'Profissional'}!</h2>
            <p className={styles.subtitle}>
              {orgInfo?.nome_da_organizacao 
                ? `Painel do profissional - ${orgInfo.nome_da_organizacao}`
                : 'Painel do profissional de saúde'
              }
            </p>
          </div>

          {/* Cards de resumo com dados reais + mockados */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>👥</span>
              <div>
                <strong>{totalPacientesReais > 0 ? totalPacientesReais : acompanhamentos.length}</strong>
                <p>Pacientes Vinculados</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>🏥</span>
              <div>
                <strong>{totalEspecialidadesReais > 0 ? totalEspecialidadesReais : '2'}</strong>
                <p>Especialidades</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>📅</span>
              <div>
                <strong>{consultasHoje.length}</strong>
                <p>Consultas Hoje</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryIcon}>⏳</span>
              <div>
                <strong>{pendentesCount}</strong>
                <p>Pendências</p>
              </div>
            </div>
          </div>

          {/* Lista de pacientes reais (se existirem) */}
          {pacientesReais.length > 0 && (
            <div className={styles.dashboardCard}>
              <h3 className={styles.dashboardCardTitle}>👥 Meus Pacientes Vinculados</h3>
              <div className={styles.patientsList}>
                {pacientesReais.map(paciente => (
                  <div key={paciente.id} className={styles.patientCard}>
                    <div className={styles.patientAvatar}>{paciente.nome.charAt(0)}</div>
                    <div className={styles.patientInfo}>
                      <div className={styles.patientName}>{paciente.nome}</div>
                      <div className={styles.patientLastUpdate}>
                        {paciente.especialidade} • Último: {paciente.ultimoAtendimento}
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles.emandamento}`}>
                      {paciente.ultimoAtendimento !== 'Sem registro' ? 'Em andamento' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.quickActions}>
            <button className={styles.actionBtn} onClick={() => setActiveModal('consulta')}><span className={styles.actionIcon}>➕</span> Nova Consulta</button>
            <button className={styles.actionBtn} onClick={() => setActiveModal('paciente')}><span className={styles.actionIcon}>👤</span> Cadastrar Paciente</button>
            <button className={styles.actionBtn} onClick={() => setActiveModal('prontuario')}><span className={styles.actionIcon}>📋</span> Abrir Prontuário</button>
          </div>

          <div className={styles.dashboardGrid}>
            <div className={styles.dashboardCard}>
              <h3 className={styles.dashboardCardTitle}>📅 Consultas de Hoje</h3>
              {consultasHoje.length > 0 ? (
                consultasHoje.map(c => (
                  <div key={c.id} className={styles.consultaItem}>
                    <div className={styles.consultaPatient}>{c.patient}</div>
                    <div className={styles.consultaTime}>{c.date.split(' ')[1]}</div>
                    <div className={styles.consultaType}>{c.type}</div>
                    <span className={`${styles.statusBadge} ${styles[c.status.toLowerCase().replace(/\s/g, '')]}`}>{c.status}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>Nenhuma consulta para hoje.</p>
              )}
            </div>

            <div className={styles.dashboardCard}>
              <h3 className={styles.dashboardCardTitle}>🔄 Pacientes em Acompanhamento</h3>
              {acompanhamentos.map(p => (
                <div key={p.id} className={styles.patientCard}>
                  <div className={styles.patientAvatar}>{p.patient.charAt(0)}</div>
                  <div className={styles.patientInfo}>
                    <div className={styles.patientName}>{p.patient}</div>
                    <div className={styles.patientLastUpdate}>Última: {p.lastUpdate}</div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[p.status.toLowerCase().replace(/\s/g, '')]}`}>{p.status}</span>
                </div>
              ))}
            </div>

            <div className={styles.dashboardCard}>
              <h3 className={styles.dashboardCardTitle}>🗓️ Agenda</h3>
              <MiniCalendar />
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>© 2026 {orgInfo?.nome_da_organizacao || 'ConectClin'}. Todos os direitos reservados.</p>
        </footer>
      </div>

      {/* ========== MODAIS ========== */}
      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeModal}>✕</button>

            {activeModal === 'consulta' && (
              <>
                <h3 className={styles.modalTitle}>➕ Nova Consulta</h3>
                <p className={styles.modalText}>Funcionalidade em desenvolvimento. Aqui você poderá agendar uma nova consulta com um paciente.</p>
                <button className={styles.modalActionBtn} onClick={closeModal}>Entendi</button>
              </>
            )}

            {activeModal === 'paciente' && (
              <>
                <h3 className={styles.modalTitle}>👤 Cadastrar Paciente</h3>
                <p className={styles.modalText}>Funcionalidade em desenvolvimento. Em breve será possível cadastrar novos pacientes no sistema.</p>
                <button className={styles.modalActionBtn} onClick={closeModal}>Entendi</button>
              </>
            )}

            {activeModal === 'prontuario' && (
              <>
                <h3 className={styles.modalTitle}>📋 Abrir Prontuário</h3>
                <p className={styles.modalText}>Funcionalidade em desenvolvimento. Aqui você acessará o prontuário completo dos pacientes.</p>
                <button className={styles.modalActionBtn} onClick={closeModal}>Entendi</button>
              </>
            )}

            {activeModal === 'logout' && (
              <>
                <h3 className={styles.modalTitle}>Sair do sistema</h3>
                <p className={styles.modalText}>Tem certeza que deseja sair? Você será redirecionado para a tela inicial.</p>
                <div className={styles.modalActions}>
                  <button className={styles.modalCancelBtn} onClick={closeModal}>Cancelar</button>
                  <button className={styles.modalConfirmBtn} onClick={handleLogout}>Sair</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalHome;