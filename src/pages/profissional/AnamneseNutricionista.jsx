import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import {
  doc, getDoc, collection, addDoc, getDocs, query, where, updateDoc,
} from 'firebase/firestore';
import DatePicker from '../../components/DatePicker';
import Loading from '../../components/Loading';
import { useToast } from '../../contexts/ToastContext';

export default function AnamneseNutricionista() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [anamnese, setAnamnese] = useState(null);
  const storageKey = `selectedPaciente_${user.login}`;
  const [isRestored, setIsRestored] = useState(false);
  const toast = useToast();
  const [form, setForm] = useState({
    dataAnamnese: new Date().toISOString().split('T')[0],
    profissional: user.nome || '',
    doencas: '',
    medicamentos: '',
    cirurgias: '',
    historicoFamiliar: '',
    habitosAlimentares: '',
    consumoAgua: '',
    restricoes: '',
    preferencias: '',
    suplementos: '',
    pesoAtual: '',
    altura: '',
    pesoHabitual: '',
    pesoDesejado: '',
    imc: '',
    classificacaoIMC: '',
    massaMuscular: '',
    gorduraCorporal: '',
    aguaCorporal: '',
    massaOssea: '',
    metabolismoBasal: '',
    circunferenciaAbdominal: '',
    glicemia: '',
    colesterolTotal: '',
    hdl: '',
    ldl: '',
    triglicerideos: '',
    hemoglobinaGlicada: '',
    vitaminaD: '',
    ferritina: '',
    atividadeFisica: '',
    sono: '',
    habitosVida: '',
    nivelEstresse: '',
    observacoes: '',
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
    if (pacientes.length === 0) return; // aguarda pacientes carregarem
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

  // Carregar anamnese do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setAnamnese(null);
      setForm(prev => ({ ...prev, dataAnamnese: new Date().toISOString().split('T')[0] }));
      return;
    }
    const loadAnamnese = async () => {
      const q = query(collection(db, 'anamneses_nutricionais'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_anamnese)?.localeCompare(a.data().data_atualizacao || a.data().data_anamnese));
        const a = docs[0].data();
        setAnamnese({ id: docs[0].id, ...a });
        setForm({
          dataAnamnese: a.data_anamnese || new Date().toISOString().split('T')[0],
          profissional: a.profissional || user.nome,
          doencas: a.historico_clinico?.doencas_preexistentes || '',
          medicamentos: a.historico_clinico?.medicamentos || '',
          cirurgias: a.historico_clinico?.cirurgias || '',
          historicoFamiliar: a.historico_clinico?.historico_familiar || '',
          habitosAlimentares: a.historico_alimentar?.habitos_alimentares || '',
          consumoAgua: a.historico_alimentar?.consumo_agua || '',
          restricoes: a.historico_alimentar?.restricoes || '',
          preferencias: a.historico_alimentar?.preferencias || '',
          suplementos: a.historico_alimentar?.suplementos || '',
          pesoAtual: a.antropometria?.peso_atual || '',
          altura: a.antropometria?.altura || '',
          pesoHabitual: a.antropometria?.peso_habitual || '',
          pesoDesejado: a.antropometria?.peso_desejado || '',
          imc: a.antropometria?.imc || '',
          classificacaoIMC: a.antropometria?.classificacao_imc || '',
          massaMuscular: a.composicao_corporal?.massa_muscular || '',
          gorduraCorporal: a.composicao_corporal?.gordura_corporal || '',
          aguaCorporal: a.composicao_corporal?.agua_corporal || '',
          massaOssea: a.composicao_corporal?.massa_ossea || '',
          metabolismoBasal: a.composicao_corporal?.metabolismo_basal || '',
          circunferenciaAbdominal: a.composicao_corporal?.circunferencia_abdominal || '',
          glicemia: a.exames_laboratoriais?.glicemia || '',
          colesterolTotal: a.exames_laboratoriais?.colesterol_total || '',
          hdl: a.exames_laboratoriais?.hdl || '',
          ldl: a.exames_laboratoriais?.ldl || '',
          triglicerideos: a.exames_laboratoriais?.triglicerideos || '',
          hemoglobinaGlicada: a.exames_laboratoriais?.hemoglobina_glicada || '',
          vitaminaD: a.exames_laboratoriais?.vitamina_d || '',
          ferritina: a.exames_laboratoriais?.ferritina || '',
          atividadeFisica: a.estilo_vida?.atividade_fisica || '',
          sono: a.estilo_vida?.sono || '',
          habitosVida: a.estilo_vida?.habitos || '',
          nivelEstresse: a.estilo_vida?.nivel_estresse || '',
          observacoes: a.observacoes || '',
        });
      } else {
        setAnamnese(null);
        setForm(prev => ({
          ...prev,
          dataAnamnese: new Date().toISOString().split('T')[0],
          profissional: user.nome,
        }));
      }
    };
    loadAnamnese();
  }, [selectedPaciente]);

  const calcularIMC = (peso, altura) => {
    if (peso && altura && altura > 0) {
      const imc = (peso / (altura * altura)).toFixed(2);
      let classificacao = '';
      const valor = parseFloat(imc);
      if (valor < 18.5) classificacao = 'Abaixo do peso';
      else if (valor < 25) classificacao = 'Peso normal';
      else if (valor < 30) classificacao = 'Sobrepeso';
      else if (valor < 35) classificacao = 'Obesidade grau I';
      else if (valor < 40) classificacao = 'Obesidade grau II';
      else classificacao = 'Obesidade grau III';
      setForm(prev => ({ ...prev, imc, classificacaoIMC: classificacao }));
    } else {
      setForm(prev => ({ ...prev, imc: '', classificacaoIMC: '' }));
    }
  };

  const salvarAnamnese = async () => {
    if (!selectedPaciente) return toast.warning('Selecione um paciente!');
    const data = {
      paciente_login: selectedPaciente.login,
      paciente_nome: selectedPaciente.nome,
      profissional: user.nome,
      profissional_login: user.login,
      data_anamnese: form.dataAnamnese,
      data_atualizacao: new Date().toISOString(),
      historico_clinico: {
        doencas_preexistentes: form.doencas,
        medicamentos: form.medicamentos,
        cirurgias: form.cirurgias,
        historico_familiar: form.historicoFamiliar,
      },
      historico_alimentar: {
        habitos_alimentares: form.habitosAlimentares,
        consumo_agua: parseFloat(form.consumoAgua) || null,
        restricoes: form.restricoes,
        preferencias: form.preferencias,
        suplementos: form.suplementos,
      },
      antropometria: {
        peso_atual: parseFloat(form.pesoAtual) || null,
        altura: parseFloat(form.altura) || null,
        peso_habitual: parseFloat(form.pesoHabitual) || null,
        peso_desejado: parseFloat(form.pesoDesejado) || null,
        imc: parseFloat(form.imc) || null,
        classificacao_imc: form.classificacaoIMC,
      },
      composicao_corporal: {
        massa_muscular: parseFloat(form.massaMuscular) || null,
        gordura_corporal: parseFloat(form.gorduraCorporal) || null,
        agua_corporal: parseFloat(form.aguaCorporal) || null,
        massa_ossea: parseFloat(form.massaOssea) || null,
        metabolismo_basal: parseFloat(form.metabolismoBasal) || null,
        circunferencia_abdominal: parseFloat(form.circunferenciaAbdominal) || null,
      },
      exames_laboratoriais: {
        glicemia: parseFloat(form.glicemia) || null,
        colesterol_total: parseFloat(form.colesterolTotal) || null,
        hdl: parseFloat(form.hdl) || null,
        ldl: parseFloat(form.ldl) || null,
        triglicerideos: parseFloat(form.triglicerideos) || null,
        hemoglobina_glicada: parseFloat(form.hemoglobinaGlicada) || null,
        vitamina_d: parseFloat(form.vitaminaD) || null,
        ferritina: parseFloat(form.ferritina) || null,
      },
      estilo_vida: {
        atividade_fisica: form.atividadeFisica,
        sono: form.sono,
        habitos: form.habitosVida,
        nivel_estresse: form.nivelEstresse,
      },
      observacoes: form.observacoes,
    };

    try {
      if (anamnese?.id) {
        await updateDoc(doc(db, 'anamneses_nutricionais', anamnese.id), data);
        toast.success('Anamnese atualizada!');
      } else {
        await addDoc(collection(db, 'anamneses_nutricionais'), data);
        toast.success('Anamnese criada!');
      }
      // Recarregar a anamnese para atualizar ID
      const q = query(collection(db, 'anamneses_nutricionais'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_anamnese)?.localeCompare(a.data().data_atualizacao || a.data().data_anamnese));
        setAnamnese({ id: docs[0].id, ...docs[0].data() });
      }
    } catch (err) {
      toast.error('Erro ao salvar anamnese!');
    }
  };

  const inputStyle = { padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' };
  if (pacientes.length === 0) {
    return <Loading message="Carregando anamnese..." />;
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
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>📅 Dados da Consulta</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: 20 }}>
              <div className="form-field">
                <label>📅 Data da Anamnese</label>
                <DatePicker value={form.dataAnamnese} onChange={(dateStr) => setForm({ ...form, dataAnamnese: dateStr })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>👨‍⚕️ Profissional</label>
                <input type="text" value={form.profissional} readOnly style={{ ...inputStyle, background: '#f1f5f9' }} />
              </div>
            </div>
          </div>

          {/* 1. HISTÓRICO CLÍNICO */}

          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>🏥 1. Histórico Clínico</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 20 }}>
              <div className="form-field"><label>🩸 Doenças Preexistentes</label><textarea value={form.doencas} onChange={e => setForm({...form, doencas: e.target.value})} rows="3" style={inputStyle} /></div>
              <div className="form-field"><label>💊 Medicamentos</label><textarea value={form.medicamentos} onChange={e => setForm({...form, medicamentos: e.target.value})} rows="3" style={inputStyle} /></div>
              <div className="form-field"><label>🏥 Cirurgias</label><textarea value={form.cirurgias} onChange={e => setForm({...form, cirurgias: e.target.value})} rows="3" style={inputStyle} /></div>
              <div className="form-field"><label>🩺 Histórico Familiar</label><textarea value={form.historicoFamiliar} onChange={e => setForm({...form, historicoFamiliar: e.target.value})} rows="3" style={inputStyle} /></div>
            </div>
          </div>

          {/* 2. HISTÓRICO ALIMENTAR */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>🍽️ 2. Histórico Alimentar</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>🍳 Hábitos Alimentares</label>
                <textarea id="habitos_alimentares" className="form-control" rows="3" placeholder="Número de refeições por dia, horários, local das refeições..."
                  value={form.habitosAlimentares} onChange={e => setForm({ ...form, habitosAlimentares: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>💧 Consumo de Água (ml/dia)</label>
                <input type="number" id="consumo_agua" className="form-control" placeholder="Ex: 2000"
                  value={form.consumoAgua} onChange={e => setForm({ ...form, consumoAgua: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🚫 Restrições Alimentares</label>
                <textarea id="restricoes" className="form-control" rows="3" placeholder="Alergias, intolerâncias, alimentos que não consome..."
                  value={form.restricoes} onChange={e => setForm({ ...form, restricoes: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>❤️ Preferências Alimentares</label>
                <textarea id="preferencias" className="form-control" rows="3" placeholder="Alimentos que gosta, preparações favoritas..."
                  value={form.preferencias} onChange={e => setForm({ ...form, preferencias: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>🥗 Uso de Suplementos</label>
                <textarea id="suplementos" className="form-control" rows="3" placeholder="Quais suplementos, dosagem, frequência..."
                  value={form.suplementos} onChange={e => setForm({ ...form, suplementos: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
            </div>
          </div>

          {/* 3. AVALIAÇÃO ANTROPOMÉTRICA */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>📏 3. Avaliação Antropométrica</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>📏 Peso Atual (kg)</label>
                <input type="number" id="peso_atual" step="0.1" className="form-control" placeholder="Ex: 70.5"
                  value={form.pesoAtual} onChange={e => { setForm({ ...form, pesoAtual: e.target.value }); calcularIMC(e.target.value, form.altura); }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>📐 Altura (m)</label>
                <input type="number" id="altura" step="0.01" className="form-control" placeholder="Ex: 1.65"
                  value={form.altura} onChange={e => { setForm({ ...form, altura: e.target.value }); calcularIMC(form.pesoAtual, e.target.value); }}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>⚖️ Peso Habitual (kg)</label>
                <input type="number" id="peso_habitual" step="0.1" className="form-control" placeholder="Ex: 68.0"
                  value={form.pesoHabitual} onChange={e => setForm({ ...form, pesoHabitual: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🎯 Peso Desejado (kg)</label>
                <input type="number" id="peso_desejado" step="0.1" className="form-control" placeholder="Ex: 65.0"
                  value={form.pesoDesejado} onChange={e => setForm({ ...form, pesoDesejado: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>📊 IMC Calculado</label>
                <input type="text" id="imc_calculado" className="form-control" readOnly
                  value={form.imc}
                  style={{ background: '#f1f5f9', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>📋 Classificação IMC</label>
                <input type="text" id="classificacao_imc" className="form-control" readOnly
                  value={form.classificacaoIMC}
                  style={{ background: '#f1f5f9', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
            </div>
          </div>

          {/* 4. COMPOSIÇÃO CORPORAL */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>💪 4. Composição Corporal</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>💪 Massa Muscular (kg)</label>
                <input type="number" id="massa_muscular" step="0.1" className="form-control" placeholder="Ex: 25.5"
                  value={form.massaMuscular} onChange={e => setForm({ ...form, massaMuscular: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🧈 Gordura Corporal (%)</label>
                <input type="number" id="gordura_corporal" step="0.1" className="form-control" placeholder="Ex: 28.5"
                  value={form.gorduraCorporal} onChange={e => setForm({ ...form, gorduraCorporal: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>💧 Água Corporal (%)</label>
                <input type="number" id="agua_corporal" step="0.1" className="form-control" placeholder="Ex: 55.0"
                  value={form.aguaCorporal} onChange={e => setForm({ ...form, aguaCorporal: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🦴 Massa Óssea (kg)</label>
                <input type="number" id="massa_ossea" step="0.1" className="form-control" placeholder="Ex: 2.5"
                  value={form.massaOssea} onChange={e => setForm({ ...form, massaOssea: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🔥 Metabolismo Basal (kcal)</label>
                <input type="number" id="metabolismo_basal" step="1" className="form-control" placeholder="Ex: 1400"
                  value={form.metabolismoBasal} onChange={e => setForm({ ...form, metabolismoBasal: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>📏 Circunferência Abdominal (cm)</label>
                <input type="number" id="circunferencia_abdominal" step="0.1" className="form-control" placeholder="Ex: 85.0"
                  value={form.circunferenciaAbdominal} onChange={e => setForm({ ...form, circunferenciaAbdominal: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
            </div>
          </div>

          {/* 5. EXAMES LABORATORIAIS */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>🩸 5. Exames Laboratoriais</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>🩸 Glicemia (mg/dL)</label>
                <input type="number" id="glicemia" step="1" className="form-control" placeholder="Ex: 90"
                  value={form.glicemia} onChange={e => setForm({ ...form, glicemia: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 Colesterol Total (mg/dL)</label>
                <input type="number" id="colesterol_total" step="1" className="form-control" placeholder="Ex: 180"
                  value={form.colesterolTotal} onChange={e => setForm({ ...form, colesterolTotal: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 HDL (mg/dL)</label>
                <input type="number" id="hdl" step="1" className="form-control" placeholder="Ex: 45"
                  value={form.hdl} onChange={e => setForm({ ...form, hdl: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 LDL (mg/dL)</label>
                <input type="number" id="ldl" step="1" className="form-control" placeholder="Ex: 100"
                  value={form.ldl} onChange={e => setForm({ ...form, ldl: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 Triglicerídeos (mg/dL)</label>
                <input type="number" id="triglicerideos" step="1" className="form-control" placeholder="Ex: 150"
                  value={form.triglicerideos} onChange={e => setForm({ ...form, triglicerideos: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 Hemoglobina Glicada (%)</label>
                <input type="number" id="hemoglobina_glicada" step="0.1" className="form-control" placeholder="Ex: 5.5"
                  value={form.hemoglobinaGlicada} onChange={e => setForm({ ...form, hemoglobinaGlicada: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 Vitamina D (ng/mL)</label>
                <input type="number" id="vitamina_d" step="1" className="form-control" placeholder="Ex: 30"
                  value={form.vitaminaD} onChange={e => setForm({ ...form, vitaminaD: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
              <div className="form-field">
                <label>🩸 Ferritina (ng/mL)</label>
                <input type="number" id="ferritina" step="1" className="form-control" placeholder="Ex: 50"
                  value={form.ferritina} onChange={e => setForm({ ...form, ferritina: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }} />
              </div>
            </div>
          </div>

          {/* 6. ESTILO DE VIDA */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>🏃 6. Estilo de Vida</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>🏋️ Atividade Física</label>
                <textarea id="atividade_fisica" className="form-control" rows="3" placeholder="Tipo, frequência, duração, intensidade..."
                  value={form.atividadeFisica} onChange={e => setForm({ ...form, atividadeFisica: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>😴 Qualidade do Sono</label>
                <textarea id="sono" className="form-control" rows="3" placeholder="Horas de sono por noite, qualidade, dificuldades..."
                  value={form.sono} onChange={e => setForm({ ...form, sono: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>🚭 Hábitos</label>
                <textarea id="habitos" className="form-control" rows="3" placeholder="Tabagismo, consumo de álcool, café, outras substâncias..."
                  value={form.habitosVida} onChange={e => setForm({ ...form, habitosVida: e.target.value })}
                  style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
              </div>
              <div className="form-field">
                <label>😊 Nível de Estresse</label>
                <select id="nivel_estresse" className="form-control"
                  value={form.nivelEstresse} onChange={e => setForm({ ...form, nivelEstresse: e.target.value })}
                  style={{ padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }}>
                  <option value="">Selecione</option>
                  <option value="baixo">Baixo</option>
                  <option value="moderado">Moderado</option>
                  <option value="alto">Alto</option>
                  <option value="muito_alto">Muito Alto</option>
                </select>
              </div>
            </div>
          </div>

          {/* 7. OBSERVAÇÕES GERAIS */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>📝 7. Observações e Condutas</h3>
            </div>
            <div className="form-field">
              <label>Observações Adicionais</label>
              <textarea id="observacoes" className="form-control" rows="4" placeholder="Informações relevantes, condutas adotadas, encaminhamentos, etc..."
                value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                style={{ resize: 'vertical', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', width: '100%' }} />
            </div>
          </div>
          
          <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}>
            <button className="btn-primary btn-expand" onClick={salvarAnamnese}>
              <span>💾</span>
              <span className="btn-text">Salvar Anamnese</span>
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem' }}>
          <span style={{ fontSize: 48, opacity: 0.5 }}>👆</span>
          <h3>Selecione um paciente</h3>
          <p style={{ color: '#64748b' }}>Escolha um paciente para realizar a anamnese nutricional</p>
        </div>
      )}
    </>
  );
}