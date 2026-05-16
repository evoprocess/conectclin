// src/services/authService.js
import { 
  signInWithEmailAndPassword, 
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const DOMAIN = '@conectclin.com.br';

export const loginService = async (emailInput, senha) => {
  try {
    // PASSO 1-2: Adiciona domínio e autentica no AUTH
    const email = `${emailInput}${DOMAIN}`;
    console.log('🔐 PASSO 1-2: Autenticando:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // PASSO 3: App Check e Recaptcha (automático)
    console.log('🔐 PASSO 3: App Check verificado');

    // Extrai o login (sem @conectclin.com.br)
    const login = user.email.split('@')[0];

    // PASSO 4: Busca organização vinculada na coleção "logins"
    console.log('🔐 PASSO 4: Buscando dados do login:', login);
    
    const loginDocRef = doc(db, 'logins', login);
    const loginDocSnap = await getDoc(loginDocRef);

    if (!loginDocSnap.exists()) {
      await signOut(auth);
      throw new Error('Dados de login não encontrados');
    }

    const loginData = loginDocSnap.data();

    // Verifica se o login está ativo
    if (!loginData.status_ativo) {
      await signOut(auth);
      throw new Error('Usuário inativo. Entre em contato com o suporte.');
    }

    const orgId = loginData.org;
    console.log('✅ Organização vinculada:', orgId);

    // PASSO 5: Verifica status_org_ativa
    console.log('🔐 PASSO 5: Verificando status da organização:', orgId);
    
    const orgConfigRef = doc(db, orgId, 'config');
    const orgConfigSnap = await getDoc(orgConfigRef);

    if (!orgConfigSnap.exists()) {
      await signOut(auth);
      throw new Error('Configuração da organização não encontrada');
    }

    const orgConfig = orgConfigSnap.data();
    
    if (!orgConfig.dados_plano?.status_org_ativa) {
      await signOut(auth);
      throw new Error('Organização inativa. Entre em contato com o administrador.');
    }

    console.log('✅ Organização ativa');

    // PASSO 6: Busca info_pub e atendimentos vinculados
    console.log('🔐 PASSO 6: Carregando permissões...');
    
    // Busca info_pub (documento completo)
    const orgInfoRef = doc(db, orgId, 'info_pub');
    const orgInfoSnap = await getDoc(orgInfoRef);
    
    const orgInfo = orgInfoSnap.exists() 
      ? orgInfoSnap.data()
      : { nome_da_organizacao: 'Organização' };

    console.log('✅ Info pública carregada');

    // Processa profissionais vinculados
    const profissionaisVinculados = loginData.profissionais_vinculados || {};
    const profissionaisIds = Object.keys(profissionaisVinculados);
    
    console.log('✅ Profissionais vinculados:', profissionaisIds);

    // Busca atendimentos apenas dos profissionais vinculados
    const atendimentosData = {};
    
    for (const profissionalId of profissionaisIds) {
      const atendimentosRef = doc(db, orgId, 'atendimentos', profissionalId);
      const atendimentosSnap = await getDoc(atendimentosRef);
      
      if (atendimentosSnap.exists()) {
        const profissionalData = atendimentosSnap.data();
        
        // Pega apenas especialidades permitidas
        const especialidadesPermitidas = profissionaisVinculados[profissionalId]?.especialidades_permitidas || {};
        const dadosFiltrados = {};
        
        Object.keys(especialidadesPermitidas).forEach(especialidade => {
          if (especialidadesPermitidas[especialidade] && profissionalData[especialidade]) {
            const pacientesVinculados = profissionalData[especialidade]?.pacientes_vinculados || {};
            
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

    console.log('✅ Atendimentos carregados');
    console.log('✅ LOGIN COMPLETO!');

    return {
      user,
      loginData,
      orgInfo,
      orgId,
      profissionaisVinculados,
      atendimentosData
    };

  } catch (error) {
    console.error('❌ Erro no login:', error);
    
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          throw new Error('E-mail inválido');
        case 'auth/user-disabled':
          throw new Error('Usuário desativado');
        case 'auth/user-not-found':
          throw new Error('Usuário não encontrado');
        case 'auth/wrong-password':
          throw new Error('Senha incorreta');
        case 'auth/invalid-credential':
          throw new Error('Credenciais inválidas');
        case 'auth/too-many-requests':
          throw new Error('Muitas tentativas. Aguarde um momento.');
        default:
          throw new Error(`Erro de autenticação: ${error.message}`);
      }
    }
    
    throw error;
  }
};

export const logoutService = async () => {
  try {
    await signOut(auth);
    console.log('👋 Logout realizado');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};