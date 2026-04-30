import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function PacientePlanoAlimentar() {
  const { user } = useAuth();
  const [pacienteData, setPacienteData] = useState(null);
  const [planoAlimentar, setPlanoAlimentar] = useState(null);
  const [profissionalNome, setProfissionalNome] = useState('Profissional não vinculado');

  useEffect(() => {
    const carregar = async () => {
      try {
        const userRef = doc(db, 'logins', user.login);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPacienteData(data);
          if (data.profissionais_vinculados) {
            for (const [login, info] of Object.entries(data.profissionais_vinculados)) {
              if (info.cargo === 'nutricionista') {
                setProfissionalNome(info.nome || login);
                break;
              }
            }
          }
        }

        const planosRef = collection(db, 'planos_alimentares');
        const q = query(planosRef, where('paciente_login', '==', user.login));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docs = snap.docs;
          docs.sort((a, b) => {
            const da = a.data().data_atualizacao || a.data().data_criacao;
            const db2 = b.data().data_atualizacao || b.data().data_criacao;
            return new Date(db2) - new Date(da);
          });
          setPlanoAlimentar({ id: docs[0].id, ...docs[0].data() });
        }
      } catch (err) {
        console.error(err);
      }
    };
    carregar();
  }, [user.login]);

  return (
    <>
      <div className="client-info mb-3">
        <h3>📋 Meus Dados</h3>
        <div className="info-card">
          <p><strong>👤 Nome:</strong> {user.nome || 'Não informado'}</p>
          <p><strong>📋 Plano:</strong> {pacienteData?.plano || 'Não informado'}</p>
          <p><strong>👨‍⚕️ Nutricionista:</strong> {profissionalNome}</p>
          {planoAlimentar && <p><strong>📅 Última atualização:</strong> {new Date(planoAlimentar.data_atualizacao).toLocaleDateString('pt-BR')}</p>}
        </div>
      </div>

      {planoAlimentar ? (
        <div className="meal-plan-container">
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🌅 Café da Manhã</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.breakfast || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🍎 Lanche da Manhã</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.morningSnack || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🍽️ Almoço</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.lunch || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🍌 Lanche da Tarde</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.afternoonSnack || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🌙 Jantar</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.dinner || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          <div className="evaluation-card" style={{ marginBottom: 16 }}>
            <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>⭐ Ceia</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{planoAlimentar.supper || <span style={{ color: '#999' }}>Nenhuma informação cadastrada</span>}</div>
          </div>
          {(planoAlimentar.guidelines || planoAlimentar.restrictions || planoAlimentar.goals) && (
            <div className="client-info" style={{ marginTop: 20 }}>
              <h3>📌 Informações Complementares</h3>
              <div className="info-card">
                {planoAlimentar.guidelines && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#f97316' }}>📝 Orientações Gerais</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{planoAlimentar.guidelines}</div>
                  </div>
                )}
                {planoAlimentar.restrictions && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#f97316' }}>⚠️ Restrições Alimentares</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{planoAlimentar.restrictions}</div>
                  </div>
                )}
                {planoAlimentar.goals && (
                  <div>
                    <strong style={{ color: '#f97316' }}>🎯 Objetivos</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{planoAlimentar.goals}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem', marginTop: 20 }}>
          <span className="empty-icon" style={{ fontSize: 48, opacity: 0.5 }}>🍽️</span>
          <h3 style={{ marginTop: 16 }}>Nenhum plano alimentar disponível</h3>
          <p style={{ color: '#64748b' }}>Seu nutricionista ainda não cadastrou um plano alimentar para você.</p>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Entre em contato com seu profissional para receber seu plano personalizado.</p>
        </div>
      )}
    </>
  );
}