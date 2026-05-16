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
  
  // NOVOS ESTADOS para estrutura de organização
  const [orgId, setOrgId] = useState(null);
  const [orgInfo, setOrgInfo] = useState(null);
  const [profissionaisVinculados, setProfissionaisVinculados] = useState({});
  const [atendimentosData, setAtendimentosData] = useState({});

  // Auto login via localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (CARGOS_VALIDOS.includes(parsed.cargo)) {
          setUser(parsed);
          // Recupera dados da organização salvos
          setOrgId(parsed.orgId || null);
          setOrgInfo(parsed.orgInfo || null);
          setProfissionaisVinculados(parsed.profissionaisVinculados || {});
          setAtendimentosData(parsed.atendimentosData || {});
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  // ========== NOVA FUNÇÃO: Busca dados da organização ==========
  const carregarDadosOrganizacao = async (orgId, login, profissionaisVinculados) => {
    try {
      console.log('🔐 PASSO 5: Verificando status da organização:', orgId);
      
      // PASSO 5: Verifica se a organização está ativa
      const orgConfigRef = doc(db, orgId, 'config');
      const orgConfigSnap = await getDoc(orgConfigRef);

      if (!orgConfigSnap.exists()) {
        throw new Error('Configuração da organização não encontrada');
      }

      const orgConfig = orgConfigSnap.data();
      
      if (!orgConfig.dados_plano?.status_org_ativa) {
        throw new Error('Organização inativa. Entre em contato com o administrador.');
      }

      console.log('✅ Organização ativa');

      // PASSO 6: Busca info_pub e atendimentos vinculados
      console.log('🔐 PASSO 6: Carregando permissões...');
      
      // Busca info_pub (documento completo)
      const orgInfoRef = doc(db, orgId, 'info_pub');
      const orgInfoSnap = await getDoc(orgInfoRef);
      
      const orgInfoData = orgInfoSnap.exists() 
        ? orgInfoSnap.data()
        : { nome_da_organizacao: 'Organização' };

      console.log('✅ Info pública carregada');

      // Busca atendimentos apenas dos profissionais vinculados
      const profissionaisIds = Object.keys(profissionaisVinculados || {});
      const atendimentosData = {};
      
      if (profissionaisIds.length > 0) {
        for (const profissionalId of profissionaisIds) {
          const atendimentosRef = doc(db, orgId, 'atendimentos', profissionalId);
          const atendimentosSnap = await getDoc(atendimentosRef);
          
          if (atendimentosSnap.exists()) {
            const profissionalData = atendimentosSnap.data();
            
            // Filtra apenas especialidades permitidas
            const especialidadesPermitidas = profissionaisVinculados[profissionalId]?.especialidades_permitidas || {};
            const dadosFiltrados = {};
            
            Object.keys(especialidadesPermitidas).forEach(especialidade => {
              if (especialidadesPermitidas[especialidade] && profissionalData[especialidade]) {
                const pacientesVinculados = profissionalData[especialidade]?.pacientes_vinculados || {};
                
                // Para paciente, filtra apenas os dados dele
                if (pacientesVinculados[login]) {
                  dadosFiltrados[especialidade] = {
                    pacientes_vinculados: {
                      [login]: pacientesVinculados[login]
                    }
                  };
                }
              }
            });
            
            if (Object.keys(dadosFiltrados).length > 0) {
              atendimentosData[profissionalId] = dadosFiltrados;
            }
          }
        }
      }

      console.log('✅ Atendimentos carregados');

      return {
        orgInfo: orgInfoData,
        atendimentosData,
        profissionaisVinculados
      };
    } catch (error) {
      console.error('❌ Erro ao carregar organização:', error);
      throw error;
    }
  };

  const login = async (loginInput, password, remember) => {
    setError(null);
    if (!loginInput || !password) {
      setError('Preencha todos os campos!');
      return;
    }

    const emailMontado = `${loginInput.toLowerCase()}@conectclin.com.br`;

    try {
      // PASSO 1-2: Autentica no Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailMontado, password);
      
      // PASSO 3: App Check e Recaptcha (automático)
      
      // PASSO 4: Busca dados do login e organização vinculada
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

      // Obtém o ID da organização
      const organizationId = userData.org;
      
      // Carrega dados da organização (PASSOS 5 e 6)
      let orgData = {
        orgInfo: null,
        atendimentosData: {},
        profissionaisVinculados: userData.profissionais_vinculados || {}
      };

      try {
        orgData = await carregarDadosOrganizacao(
          organizationId, 
          loginInput, 
          userData.profissionais_vinculados
        );
      } catch (orgError) {
        await signOut(auth);
        setError(orgError.message);
        return;
      }

      // Atualiza último login
      const isPaciente = userData.cargo === 'paciente';
      const isGestor = userData.cargo === 'gestor';
      const hasPrimeiroAcesso = userData.hasOwnProperty('ultimo_login');

      if (isPaciente && !hasPrimeiroAcesso) {
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      } else {
        await updateDoc(userRef, { ultimo_login: serverTimestamp() });
      }

      // Monta objeto do usuário da sessão
      const sessionUser = {
        ...userData,
        login: loginInput,
        email: emailMontado,
        orgId: organizationId,
        orgInfo: orgData.orgInfo,
        profissionaisVinculados: orgData.profissionaisVinculados,
        atendimentosData: orgData.atendimentosData,
        perfil: userData.perfil || (isPaciente ? 'operador' : isGestor ? 'gerente' : 'supervisor'),
      };

      // Gerencia "lembrar login"
      if (remember) {
        localStorage.setItem('savedLogin', loginInput);
        localStorage.setItem('savedPassword', password);
        localStorage.setItem('rememberLogin', 'true');
      } else {
        localStorage.removeItem('savedLogin');
        localStorage.removeItem('savedPassword');
        localStorage.setItem('rememberLogin', 'false');
      }

      // Atualiza estados
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setOrgId(organizationId);
      setOrgInfo(orgData.orgInfo);
      setProfissionaisVinculados(orgData.profissionaisVinculados);
      setAtendimentosData(orgData.atendimentosData);
      
      console.log('✅ LOGIN COMPLETO COM SUCESSO!');
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
          const organizationId = userData.org;

          // ✅ Primeiro acesso para gestor (cria conta automaticamente)
          if (userData.cargo === 'gestor') {
            await createUserWithEmailAndPassword(auth, emailMontado, password);

            // Carrega dados da organização
            let orgData = {
              orgInfo: null,
              atendimentosData: {},
              profissionaisVinculados: userData.profissionais_vinculados || {}
            };

            try {
              orgData = await carregarDadosOrganizacao(
                organizationId, 
                loginInput, 
                userData.profissionais_vinculados
              );
            } catch (orgError) {
              await signOut(auth);
              setError(orgError.message);
              return;
            }

            await updateDoc(userRef, {
              ultimo_login: serverTimestamp(),
              email: emailMontado,
            });

            const sessionUser = {
              ...userData,
              login: loginInput,
              email: emailMontado,
              orgId: organizationId,
              orgInfo: orgData.orgInfo,
              profissionaisVinculados: orgData.profissionaisVinculados,
              atendimentosData: orgData.atendimentosData,
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
            setOrgId(organizationId);
            setOrgInfo(orgData.orgInfo);
            setProfissionaisVinculados(orgData.profissionaisVinculados);
            setAtendimentosData(orgData.atendimentosData);
            
            console.log('✅ PRIMEIRO ACESSO GESTOR COMPLETO!');
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

          // Carrega dados da organização para primeiro acesso do paciente
          let orgData = {
            orgInfo: null,
            atendimentosData: {},
            profissionaisVinculados: userData.profissionais_vinculados || {}
          };

          try {
            orgData = await carregarDadosOrganizacao(
              organizationId, 
              loginInput, 
              userData.profissionais_vinculados
            );
          } catch (orgError) {
            await signOut(auth);
            setError(orgError.message);
            return;
          }

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
            orgId: organizationId,
            orgInfo: orgData.orgInfo,
            profissionaisVinculados: orgData.profissionaisVinculados,
            atendimentosData: orgData.atendimentosData,
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
          setOrgId(organizationId);
          setOrgInfo(orgData.orgInfo);
          setProfissionaisVinculados(orgData.profissionaisVinculados);
          setAtendimentosData(orgData.atendimentosData);
          
          console.log('✅ PRIMEIRO ACESSO PACIENTE COMPLETO!');
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
        setOrgId(null);
        setOrgInfo(null);
        setProfissionaisVinculados({});
        setAtendimentosData({});
      })
      .catch((err) => console.error('Erro ao deslogar:', err));
  };

  const value = { 
    user, 
    loading, 
    error, 
    setError, 
    login, 
    logout,
    // Novos dados expostos
    orgId,
    orgInfo,
    profissionaisVinculados,
    atendimentosData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}