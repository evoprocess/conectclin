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

// ===== CARGOS VÁLIDOS (inclui gestor) =====
const CARGOS_VALIDOS = ['paciente', 'nutricionista', 'psicologo', 'recepcionista', 'gestor'];

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

      const isPaciente = userData.cargo === 'paciente';
      const isGestor = userData.cargo === 'gestor';
      const hasPrimeiroAcesso = userData.hasOwnProperty('ultimo_login');

      if (isPaciente && !hasPrimeiroAcesso) {
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      } else {
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      }

      const sessionUser = {
        ...userData,
        login: loginInput,
        email: emailMontado,
        // Gestor sempre tem perfil 'gerente'
        perfil: userData.perfil || (isPaciente ? 'operador' : isGestor ? 'gerente' : 'supervisor'),
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

          // ✅ NOVO: Primeiro acesso para gestor (cria conta automaticamente)
          if (userData.cargo === 'gestor') {
            await createUserWithEmailAndPassword(auth, emailMontado, password);

            await updateDoc(userRef, {
              ultimo_login: serverTimestamp(),
              email: emailMontado,
            });

            const sessionUser = {
              ...userData,
              login: loginInput,
              email: emailMontado,
              perfil: userData.perfil || 'gerente',
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
          }

          // ❌ Para outros cargos que não paciente nem gestor
          if (userData.cargo !== 'paciente') {
            setError('Usuário não encontrado no sistema. Contate o administrador.');
            return;
          }

          // Fluxo normal de paciente com código temporário
          if (password !== userData.codigo_temporario) {
            setError('Código temporário inválido!');
            return;
          }

          const dataExpiracao = new Date(userData.codigo_expiracao);
          if (dataExpiracao < new Date()) {
            setError('Código expirado! Solicite um novo código ao profissional.');
            return;
          }

          await createUserWithEmailAndPassword(auth, emailMontado, password);

          await updateDoc(userRef, {
            ultimo_login: serverTimestamp(),
            codigo_temporario: deleteField(),
            codigo_expiracao: deleteField(),
            email: emailMontado,
          });

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