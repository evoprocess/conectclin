import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function useLoginForm() {
  const { user, error, setError, login, createPasswordAndLogin } = useAuth();
  const navigate = useNavigate();

  const [tela, setTela] = useState('login'); // 'login' | 'createPassword' | 'reset'
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
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoadingBtn(true);
    const result = await login(loginInput, password, remember);
    setLoadingBtn(false);
    if (result && !result.email) {
      setTempData(result);
      setTela('createPassword');
    }
  }, [login, loginInput, password, remember]);

  const handleCreatePassword = useCallback(async (e) => {
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
  }, [newPassword, confirmPassword, tempData, createPasswordAndLogin, setError]);

  // Limpa erro ao trocar de tela
  useEffect(() => {
    setError(null);
  }, [tela, setError]);

  return {
    // Estado
    tela,
    tempData,
    loginInput,
    setLoginInput,
    password,
    setPassword,
    remember,
    setRemember,
    showPassword,
    setShowPassword,
    loadingBtn,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    error,
    // Ações
    handleLogin,
    handleCreatePassword,
    setTela,
  };
}