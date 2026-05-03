import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const CARGOS_VALIDOS = ['paciente', 'nutricionista', 'psicologo'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto login via localStorage
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
      // Tenta autenticar normalmente
      const userCredential = await signInWithEmailAndPassword(auth, emailMontado, password);
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

      // Se for paciente e NÃO tiver ultimo_login, significa que é o primeiro acesso
      // (mas se chegou aqui é porque a senha já foi criada, então não deveria acontecer)
      const isPaciente = userData.cargo === 'paciente';
      const hasPrimeiroAcesso = userData.hasOwnProperty('ultimo_login');

      if (isPaciente && !hasPrimeiroAcesso) {
        // Força a atualização do ultimo_login mesmo que tenha caído aqui
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      } else {
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      }

      const sessionUser = {
        ...userData,
        login: loginInput,
        email: emailMontado,
        perfil: userData.perfil || (isPaciente ? 'operador' : 'supervisor'),
      };

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
      return sessionUser;
    } catch (authError) {
      // Tratamento de erros
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        setError('Login ou senha incorretos!');
      } else if (authError.code === 'auth/user-not-found') {
        // ========== PRIMEIRO ACESSO ==========
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

          // Valida o código temporário
          if (password !== userData.codigo_temporario) {
            setError('Código temporário inválido!');
            return;
          }

          const dataExpiracao = new Date(userData.codigo_expiracao);
          if (dataExpiracao < new Date()) {
            setError('Código expirado! Solicite um novo código ao profissional.');
            return;
          }

          // Cria a conta no Firebase Auth AUTOMATICAMENTE
          const emailMontado = `${loginInput.toLowerCase()}@tratamentoweb.com`;
          await createUserWithEmailAndPassword(auth, emailMontado, password);

          // Atualiza o Firestore: remove código temporário e adiciona ultimo_login
          await updateDoc(userRef, {
            ultimo_login: serverTimestamp(),
            codigo_temporario: deleteField(),
            codigo_expiracao: deleteField(),
            email: emailMontado,
          });

          // Sessão do usuário
          const sessionUser = {
            ...userData,
            login: loginInput,
            email: emailMontado,
            perfil: userData.perfil || 'operador',
            ultimo_login: new Date().toISOString(),
          };

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
          return sessionUser;
        } catch (e) {
          console.error('Erro no primeiro acesso:', e);
          setError('Erro ao criar acesso. Tente novamente.');
        }
      } else if (authError.message.includes('permissions')) {
        setError('Erro de permissão no banco de dados. Contate o administrador.');
      } else {
        setError('Erro: ' + authError.message);
      }
    }
    return null;
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        localStorage.removeItem('currentUser');
        document.body.classList.remove('profile-paciente', 'profile-profissional');
        setUser(null);
      })
      .catch((err) => console.error('Erro ao deslogar:', err));
  };

  const value = { user, loading, error, setError, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}