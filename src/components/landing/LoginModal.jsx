import { useEffect, useState, useRef } from 'react';
import { useLoginForm } from '../../hooks/useLoginForm';

export default function LoginModal({ isOpen, onClose }) {
  const [show, setShow] = useState(false);
  const overlayRef = useRef(null);

  const {
    tela,
    tempData,
    loginInput, setLoginInput,
    password, setPassword,
    remember, setRemember,
    showPassword, setShowPassword,
    loadingBtn,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    error,
    handleLogin,
    handleCreatePassword,
    setTela,
  } = useLoginForm();

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setShow(true));
      document.body.style.overflow = 'hidden';
    } else {
      setShow(false);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const renderFormularioLogin = () => (
    <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
      <div className="text-center mb-2">
        <h4>Bem-vindo de volta</h4>
        <p className="login-subtitle">Acesse sua conta para continuar</p>
      </div>

      <div>
        <label className="form-label">Login</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-person"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Seu login"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            autoComplete="username"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Senha / Código</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-lock"></i></span>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="input-group-text password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </button>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <label className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="form-check-label">Lembrar meus dados</span>
        </label>
        <a
          href="#"
          className="forgot-link"
          onClick={(e) => {
            e.preventDefault();
            setTela('reset');
          }}
        >
          Esqueci minha senha
        </a>
      </div>

      {error && (
        <div className="login-error d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary-login w-100" disabled={loadingBtn}>
        {loadingBtn ? (
          <><i className="bi bi-hourglass-split"></i> Entrando...</>
        ) : (
          <><i className="bi bi-box-arrow-in-right"></i> Entrar</>
        )}
      </button>
    </form>
  );

  const renderCriarSenha = () => (
    <form onSubmit={handleCreatePassword} className="d-flex flex-column gap-3">
      <div className="text-center mb-2">
        <h4>Primeiro Acesso</h4>
        <p className="login-subtitle">Olá, <strong>{tempData?.nome || tempData?.login}</strong>! Crie sua senha.</p>
      </div>

      <div className="alert alert-info d-flex align-items-center gap-2" style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}>
        <i className="bi bi-info-circle"></i>
        Escolha uma senha forte para manter sua conta segura.
      </div>

      <div>
        <label className="form-label">Nova Senha</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-shield-lock"></i></span>
          <input
            type={showNewPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="input-group-text password-toggle"
            onClick={() => setShowNewPassword(!showNewPassword)}
            tabIndex={-1}
          >
            <i className={`bi ${showNewPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </button>
        </div>
      </div>

      <div>
        <label className="form-label">Confirmar Senha</label>
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-shield-check"></i></span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="input-group-text password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            tabIndex={-1}
          >
            <i className={`bi ${showConfirmPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="login-error d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary-login w-100" disabled={loadingBtn}>
        {loadingBtn ? (
          <><i className="bi bi-hourglass-split"></i> Processando...</>
        ) : (
          <><i className="bi bi-check-circle"></i> Cadastrar Senha e Entrar</>
        )}
      </button>
    </form>
  );

  const renderRecuperarSenha = () => (
    <div className="text-center">
      <h4 className="mb-3">Recuperar Senha</h4>
      <p className="login-subtitle">Entre em contato com o profissional responsável.</p>
      <p className="text-muted">Ele poderá gerar uma nova senha temporária.</p>
      <button
        type="button"
        className="btn btn-outline-secondary mt-3"
        onClick={() => setTela('login')}
      >
        <i className="bi bi-arrow-left"></i> Voltar ao Login
      </button>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      className={`modal-login-overlay d-flex align-items-center justify-content-center ${show ? 'show' : ''}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-login-content p-4 p-md-5 position-relative"
        style={{ maxWidth: '420px', width: '100%', margin: '0 1rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-close-custom"
          aria-label="Fechar"
          onClick={onClose}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {tela === 'login' && renderFormularioLogin()}
        {tela === 'createPassword' && tempData && renderCriarSenha()}
        {tela === 'reset' && renderRecuperarSenha()}
      </div>
    </div>
  );
};