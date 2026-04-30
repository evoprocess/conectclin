import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser // não vamos usar deleteUser, só logout
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  deleteField,
  serverTimestamp
} from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const CARGOS_VALIDOS = ['paciente', 'nutricionista', 'psicologo'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // para ver auto login
  const [error, setError] = useState(null);

  // Auto login: verificar localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (CARGOS_VALIDOS.includes(parsed.cargo)) {
          setUser(parsed);
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginInput, password, remember) => {
    setError(null);
    if (!loginInput || !password) {
      setError('Preencha todos os campos!');
      return;
    }

    const emailMontado = `${loginInput.toLowerCase()}@tratamentoweb.com`;

    try {
      // Autenticar no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailMontado, password);

      // Buscar dados no Firestore
      const userRef = doc(db, 'logins', loginInput);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        setError('Dados do usuário não encontrados! Contate o administrador.');
        return;
      }

      const userData = userDoc.data();
      if (userData.status_ativo === false) {
        await signOut(auth);
        setError('Conta desativada! Contate o administrador.');
        return;
      }

      if (!CARGOS_VALIDOS.includes(userData.cargo)) {
        await signOut(auth);
        setError(`Cargo inválido: ${userData.cargo}`);
        return;
      }

      // Verificar primeiro acesso (paciente sem ultimo_login)
      const isPaciente = userData.cargo === 'paciente';
      const hasPrimeiroAcesso = userData.hasOwnProperty('ultimo_login');

      if (isPaciente && !hasPrimeiroAcesso) {
        if (password !== userData.codigo_temporario) {
          await signOut(auth);
          setError('Código temporário inválido!');
          return null; // retorna null indicando que precisa criar senha
        }
        const dataExpiracao = new Date(userData.codigo_expiracao);
        if (dataExpiracao < new Date()) {
          await signOut(auth);
          setError('Código expirado! Solicite um novo código.');
          return null;
        }
        // Retorna dados para criação de senha
        return {
          login: loginInput,
          email: emailMontado,
          nome: userData.nome,
          cargo: userData.cargo,
          perfil: userData.perfil,
          userRef
        };
      }

      // Atualiza último login
      await updateDoc(userRef, { ultimo_login: serverTimestamp() });

      // Prepara sessão
      const sessionUser = {
        ...userData,
        login: loginInput,
        email: emailMontado,
        perfil: userData.perfil || (isPaciente ? 'operador' : 'supervisor')
      };

      // Salvar credenciais se necessário
      if (remember) {
        localStorage.setItem('savedLogin', loginInput);
        localStorage.setItem('savedPassword', password);
        localStorage.setItem('rememberLogin', 'true');
      } else {
        localStorage.removeItem('savedLogin');
        localStorage.removeItem('savedPassword');
        localStorage.setItem('rememberLogin', 'false');
      }

      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser; // sucesso
    } catch (authError) {
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        setError('Login ou senha incorretos!');
      } else if (authError.code === 'auth/user-not-found') {
        // Tentar primeiro acesso
        try {
          const userRef = doc(db, 'logins', loginInput);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            setError('Login não encontrado!');
            return;
          }
          const userData = userDoc.data();
          if (userData.cargo !== 'paciente') {
            setError('Usuário não encontrado no sistema. Contate o administrador.');
            return;
          }
          if (password !== userData.codigo_temporario) {
            setError('Código temporário inválido!');
            return;
          }
          const dataExpiracao = new Date(userData.codigo_expiracao);
          if (dataExpiracao < new Date()) {
            setError('Código expirado! Solicite um novo código ao profissional.');
            return;
          }
          const emailMontado = `${loginInput.toLowerCase()}@tratamentoweb.com`;
          return {
            login: loginInput,
            email: emailMontado,
            nome: userData.nome,
            cargo: userData.cargo,
            perfil: userData.perfil,
            userRef
          };
        } catch (e) {
          setError('Erro ao verificar dados. Tente novamente.');
          return;
        }
      } else if (authError.message.includes('permissions')) {
        setError('Erro de permissão no banco de dados. Contate o administrador.');
      } else {
        setError('Erro: ' + authError.message);
      }
    }
    return null;
  };

  const createPasswordAndLogin = async (tempData, newPassword) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, tempData.email, newPassword);
      await updateDoc(tempData.userRef, {
        ultimo_login: serverTimestamp(),
        codigo_temporario: deleteField(),
        codigo_expiracao: deleteField(),
        email: tempData.email
      });
      const updatedDoc = await getDoc(tempData.userRef);
      const userData = updatedDoc.data();
      const sessionUser = {
        ...userData,
        login: tempData.login,
        email: tempData.email,
        perfil: userData.perfil || 'operador'
      };
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este login já possui cadastro. Contate o administrador.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use pelo menos 6 caracteres.');
      } else {
        setError('Erro ao criar conta: ' + err.message);
      }
    }
    return null;
  };

  const logout = () => {
  signOut(auth).then(() => {
    localStorage.removeItem('currentUser');
    document.body.classList.remove('profile-paciente', 'profile-profissional');
    setUser(null);
  }).catch(err => console.error('Erro ao deslogar:', err));
};

  const value = { user, loading, error, setError, login, createPasswordAndLogin, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}