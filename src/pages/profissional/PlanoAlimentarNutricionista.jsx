import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import Loading from '../../components/Loading';
import { useToast } from '../../contexts/ToastContext';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';

export default function PlanoAlimentarNutricionista() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [plano, setPlano] = useState(null);
  const storageKey = `selectedPaciente_${user.login}`;
  const [isRestored, setIsRestored] = useState(false);
  const toast = useToast();
  const [form, setForm] = useState({
    breakfast: '',
    morningSnack: '',
    lunch: '',
    afternoonSnack: '',
    dinner: '',
    supper: '',
    guidelines: '',
    restrictions: '',
    goals: '',
  });

  // Carregar pacientes
  useEffect(() => {
    const loadPacientes = async () => {
      const profRef = doc(db, 'logins', user.login);
      const profDoc = await getDoc(profRef);
      if (!profDoc.exists()) return;
      const pacientesMap = profDoc.data().pacientes || {};
      const lista = [];
      for (const [login, nome] of Object.entries(pacientesMap)) {
        const pacRef = doc(db, 'logins', login);
        const pacDoc = await getDoc(pacRef);
        lista.push(pacDoc.exists() ? { login, ...pacDoc.data() } : { login, nome });
      }
      setPacientes(lista);
    };
    loadPacientes();
  }, []);

  useEffect(() => {
    if (pacientes.length === 0) return;          // aguarda a lista
    const savedLogin = localStorage.getItem(storageKey);
    if (savedLogin) {
      const pac = pacientes.find(p => p.login === savedLogin);
      if (pac) setSelectedPaciente(pac);
    }
    setIsRestored(true);
  }, [pacientes, storageKey]);

  useEffect(() => {
    if (!isRestored) return;
    if (selectedPaciente) {
      localStorage.setItem(storageKey, selectedPaciente.login);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [selectedPaciente, storageKey, isRestored]);
  // Carregar plano alimentar do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setPlano(null);
      setForm({
        breakfast: '', morningSnack: '', lunch: '', afternoonSnack: '',
        dinner: '', supper: '', guidelines: '', restrictions: '', goals: '',
      });
      return;
    }
    const loadPlano = async () => {
      const q = query(collection(db, 'planos_alimentares'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_criacao)?.localeCompare(a.data().data_atualizacao || a.data().data_criacao));
        const p = docs[0].data();
        setPlano({ id: docs[0].id, ...p });
        setForm({
          breakfast: p.breakfast || '',
          morningSnack: p.morningSnack || '',
          lunch: p.lunch || '',
          afternoonSnack: p.afternoonSnack || '',
          dinner: p.dinner || '',
          supper: p.supper || '',
          guidelines: p.guidelines || '',
          restrictions: p.restrictions || '',
          goals: p.goals || '',
        });
      } else {
        setPlano(null);
        setForm({
          breakfast: '', morningSnack: '', lunch: '', afternoonSnack: '',
          dinner: '', supper: '', guidelines: '', restrictions: '', goals: '',
        });
      }
    };
    loadPlano();
  }, [selectedPaciente]);

  const salvarPlano = async () => {
    if (!selectedPaciente) return toast.warning('Selecione um paciente!');
    const data = {
      paciente_login: selectedPaciente.login,
      paciente_nome: selectedPaciente.nome,
      profissional: user.nome,
      profissional_login: user.login,
      data_atualizacao: new Date().toISOString(),
      breakfast: form.breakfast,
      morningSnack: form.morningSnack,
      lunch: form.lunch,
      afternoonSnack: form.afternoonSnack,
      dinner: form.dinner,
      supper: form.supper,
      guidelines: form.guidelines,
      restrictions: form.restrictions,
      goals: form.goals,
    };

    try {
      if (plano?.id) {
        await updateDoc(doc(db, 'planos_alimentares', plano.id), data);
        toast.success('Plano atualizado!');
      } else {
        await addDoc(collection(db, 'planos_alimentares'), data);
        toast.success('Plano criado!');
      }
      // Recarrega
      const q = query(collection(db, 'planos_alimentares'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_criacao)?.localeCompare(a.data().data_atualizacao || a.data().data_criacao));
        setPlano({ id: docs[0].id, ...docs[0].data() });
      }
    } catch (err) {
      toast.error('Erro ao salvar plano: ' + err.message);
    }
  };

  const inputStyle = { width: '100%', minHeight: 120, padding: 12, border: 'none', resize: 'vertical' };
  if (pacientes.length === 0) {
    return <Loading message="Carregando..." />;
  }
  return (
    <>
      <div className="info-section" style={{ marginBottom: 24 }}>
        <select
          value={selectedPaciente?.login || ''}
          onChange={e => setSelectedPaciente(pacientes.find(p => p.login === e.target.value) || null)}
          style={{ width: '100%', maxWidth: 350, padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }}
        >
          <option value="">-- Selecione um paciente --</option>
          {pacientes.map(p => (
            <option key={p.login} value={p.login}>{p.nome} ({p.login})</option>
          ))}
        </select>

        {selectedPaciente && (
          <div className="info-grid" style={{ marginTop: 16 }}>
            <div className="info-card"><span className="info-label">Nome</span><span className="info-value">{selectedPaciente.nome}</span></div>
            <div className="info-card"><span className="info-label">Login</span><span className="info-value">{selectedPaciente.login}</span></div>
            <div className="info-card"><span className="info-label">Idade</span><span className="info-value">{(() => { const d = selectedPaciente.dataNascimento; return d ? Math.floor((new Date() - new Date(d)) / (365.25 * 24 * 60 * 60 * 1000)) : '--'; })()} anos</span></div>
            <div className="info-card"><span className="info-label">Sexo</span><span className="info-value">{selectedPaciente.sexo || '--'}</span></div>
          </div>
        )}
      </div>

      {selectedPaciente ? (
        <>
          <div className="meals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20, marginBottom: 24 }}>
            <div className="meal-card" style={{ background: '#f8fafc', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>🌅 Café da Manhã</div>
              <textarea value={form.breakfast} onChange={e => setForm({ ...form, breakfast: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
            <div className="meal-card">
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>🍎 Lanche Manhã</div>
              <textarea value={form.morningSnack} onChange={e => setForm({ ...form, morningSnack: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
            <div className="meal-card">
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>🍽️ Almoço</div>
              <textarea value={form.lunch} onChange={e => setForm({ ...form, lunch: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
            <div className="meal-card">
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>🍌 Lanche Tarde</div>
              <textarea value={form.afternoonSnack} onChange={e => setForm({ ...form, afternoonSnack: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
            <div className="meal-card">
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>🌙 Jantar</div>
              <textarea value={form.dinner} onChange={e => setForm({ ...form, dinner: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
            <div className="meal-card">
              <div className="meal-header" style={{ background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600 }}>⭐ Ceia</div>
              <textarea value={form.supper} onChange={e => setForm({ ...form, supper: e.target.value })} placeholder="Alimentos e quantidades..." style={inputStyle} />
            </div>
          </div>

          <div className="additional-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 20 }}>
            <div className="info-group" style={{ background: '#f8fafc', borderRadius: '1rem', overflow: 'hidden' }}>
              <label style={{ display: 'block', background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600, margin: 0 }}>📌 Orientações Gerais</label>
              <textarea value={form.guidelines} onChange={e => setForm({ ...form, guidelines: e.target.value })} placeholder="Hidratação, horários, etc..." style={inputStyle} />
            </div>
            <div className="info-group" style={{ background: '#f8fafc', borderRadius: '1rem', overflow: 'hidden' }}>
              <label style={{ display: 'block', background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600, margin: 0 }}>⚠️ Restrições Alimentares</label>
              <textarea value={form.restrictions} onChange={e => setForm({ ...form, restrictions: e.target.value })} placeholder="Alergias, intolerâncias..." style={inputStyle} />
            </div>
            <div className="info-group" style={{ background: '#f8fafc', borderRadius: '1rem', overflow: 'hidden' }}>
              <label style={{ display: 'block', background: '#1a237e', color: 'white', padding: '12px 16px', fontWeight: 600, margin: 0 }}>🎯 Objetivos</label>
              <textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder="Metas..." style={inputStyle} />
            </div>
          </div>

          <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}>
            <button className="btn-primary btn-expand" onClick={salvarPlano}>
              <span>💾</span>
              <span className="btn-text">Salvar Plano Alimentar</span>
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem' }}>
          <span style={{ fontSize: 48, opacity: 0.5 }}>👆</span>
          <h3>Selecione um paciente</h3>
          <p style={{ color: '#64748b' }}>Escolha um paciente para criar ou editar o plano alimentar</p>
        </div>
      )}
    </>
  );
}