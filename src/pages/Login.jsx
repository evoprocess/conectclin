import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/logo.webp';

const Login = ({ inModal = false }) => {
  const { user, error, setError, login, createPasswordAndLogin } = useAuth();
  const navigate = useNavigate();

  const [tela, setTela] = useState('login');
  const [tempData, setTempData] = useState(null);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Carregar credenciais salvas
  useEffect(() => {
    const savedLogin = localStorage.getItem('savedLogin');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRemember = localStorage.getItem('rememberLogin') === 'true';
    if (savedRemember && savedLogin && savedPassword) {
      setLoginInput(savedLogin);
      setPassword(savedPassword);
      setRemember(true);
    }
  }, []);

  // Redirecionamento se já logado
  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingBtn(true);
    const result = await login(loginInput, password, remember);
    setLoadingBtn(false);
    if (result && !result.email) {
      setTempData(result);
      setTela('createPassword');
    }
  };

  const handleCreatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres!');
      return;
    }
    setLoadingBtn(true);
    await createPasswordAndLogin(tempData, newPassword);
    setLoadingBtn(false);
  };

  // Limpa erro ao trocar de tela
  useEffect(() => {
    setError(null);
  }, [tela, setError]);

  // ==================== RENDERIZADORES ====================

  const renderLogo = () => (
    <div className="login-header">
      <div className="logo-container">
        <img src={logoImage} alt="TratamentoWeb" className="login-logo-img" />
      </div>
    </div>
  );

  const renderLoginForm = () => (
    <div className={`login-card ${inModal ? 'login-card-modal' : ''}`}>
      {!inModal && renderLogo()}

      <form className="login-form" onSubmit={handleLogin}>
        {/* Campo Login */}
        <div className="input-group-custom">
          <div className="input-icon">
            <i className="bi bi-person"></i>
          </div>
          <div className="input-field focused">
            <input
              type="text"
              placeholder=" "
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              autoComplete="username"
            />
            <label>Login</label>
          </div>
        </div>

        {/* Campo Senha */}
        <div className="input-group-custom">
          <div className="input-icon">
            <i className="bi bi-lock"></i>
          </div>
          <div className="input-field focused">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <label>Senha / Código</label>
          </div>
          <div
            className="input-icon password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </div>
        </div>

        {/* Opções: lembrar e esqueci senha */}
        <div className="login-options">
          <label className="checkbox-custom">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="checkbox-text">Lembrar meus dados</span>
          </label>
          <a
            href="#"
            className="forgot-password"
            onClick={(e) => {
              e.preventDefault();
              setTela('reset');
            }}
          >
            Esqueci minha senha
          </a>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="error-message-custom">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Botão de entrar */}
        <button type="submit" className="login-button" disabled={loadingBtn}>
          {loadingBtn ? (
            <>
              <i className="bi bi-hourglass-split"></i> Entrando...
            </>
          ) : (
            <>
              <i className="bi bi-box-arrow-in-right"></i> Entrar
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderCreatePassword = () => (
    <div className="login-card">
      {!inModal && renderLogo()}
      <h2>Primeiro Acesso</h2>
      <p>Olá, <strong>{tempData.nome || tempData.login}</strong>!</p>
      <p>Cadastre sua senha pessoal para continuar.</p>

      <form id="createPasswordForm" className="login-form" onSubmit={handleCreatePassword}>
        <div
          className="info-box"
          style={{
            background: '#e8eaf6',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <i className="bi bi-info-circle" style={{ color: '#1a237e' }}></i>
          <span style={{ fontSize: '13px', color: '#1a237e' }}>
            Crie uma senha forte e segura para suas próximas visitas.
          </span>
        </div>

        <div className="input-group-custom">
          <div className="input-icon">
            <i className="bi bi-shield-lock"></i>
          </div>
          <div className="input-field focused">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              placeholder=" "
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <label>Nova Senha</label>
          </div>
          <div
            className="input-icon password-toggle"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            <i className={`bi ${showNewPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </div>
        </div>

        <div className="input-group-custom">
          <div className="input-icon">
            <i className="bi bi-shield-check"></i>
          </div>
          <div className="input-field focused">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder=" "
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Confirmar Senha</label>
          </div>
          <div
            className="input-icon password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <i className={`bi ${showConfirmPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </div>
        </div>

        {error && (
          <div className="error-message-custom">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="login-button" disabled={loadingBtn}>
          {loadingBtn ? (
            <>
              <i className="bi bi-hourglass-split"></i> Processando...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle"></i> Cadastrar Senha e Entrar
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderReset = () => (
    <div className="login-card">
      {!inModal && renderLogo()}
      <h2>Recuperar Senha</h2>
      <p>Para recuperar sua senha, entre em contato com o profissional responsável.</p>
      <p>Ele poderá gerar uma nova senha temporária para você.</p>

      <form id="resetForm" className="login-form">
        <button
          type="button"
          className="login-button"
          onClick={() => setTela('login')}
        >
          <i className="bi bi-arrow-left"></i>
          Voltar ao Login
        </button>
      </form>
    </div>
  );

  // ==================== RENDER PRINCIPAL ====================

  if (inModal) {
    return (
      <>
        {tela === 'login' && renderLoginForm()}
        {tela === 'createPassword' && tempData && renderCreatePassword()}
        {tela === 'reset' && renderReset()}
      </>
    );
  }

  return (
    <div className="login-wrapper">
      {tela === 'login' && renderLoginForm()}
      {tela === 'createPassword' && tempData && renderCreatePassword()}
      {tela === 'reset' && renderReset()}
    </div>
  );
};

export default Login;