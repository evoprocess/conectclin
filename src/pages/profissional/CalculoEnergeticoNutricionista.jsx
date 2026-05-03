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

export default function CalculoEnergeticoNutricionista() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [calculo, setCalculo] = useState(null);
  const storageKey = `selectedPaciente_${user.login}`;
  const [isRestored, setIsRestored] = useState(false);
  const toast = useToast();
  const [form, setForm] = useState({
    peso: '',
    altura: '',
    idade: '',
    sexo: 'masculino',
    fatorAtividade: '1.2',
    formula: 'harris_benedict',
    massaMagra: '',
    objetivo: 'manutencao',
    adicional: '0',
    deficit: '0',
    ptnMetodo: 'g_kg',
    ptnGkg: '1.6',
    choMetodo: 'g_kg',
    choGkg: '5',
    lipMetodo: 'g_kg',
    lipGkg: '0.8',
  });

  const [resultados, setResultados] = useState({
    geb: 0,
    get: 0,
    vetAjustado: 0,
    ptn: { gramas: 0, kcal: 0, percentual: 0 },
    cho: { gramas: 0, kcal: 0, percentual: 0 },
    lip: { gramas: 0, kcal: 0, percentual: 0 },
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

  // Carregar cálculo do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setCalculo(null);
      return;
    }
    const loadCalculo = async () => {
      const q = query(collection(db, 'calculos_energeticos'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_calculo)?.localeCompare(a.data().data_atualizacao || a.data().data_calculo));
        const c = docs[0].data();
        setCalculo({ id: docs[0].id, ...c });
        setForm({
          peso: c.peso || '',
          altura: c.altura || '',
          idade: c.idade || '',
          sexo: c.sexo || 'masculino',
          fatorAtividade: c.fator_atividade?.toString() || '1.2',
          formula: c.formula || 'harris_benedict',
          massaMagra: c.massa_magra || '',
          objetivo: c.objetivo || 'manutencao',
          adicional: c.adicional_energetico?.toString() || '0',
          deficit: c.deficit_energetico?.toString() || '0',
          ptnMetodo: c.proteinas?.metodo || 'g_kg',
          ptnGkg: c.proteinas?.g_kg?.toString() || '1.6',
          choMetodo: c.carboidratos?.metodo || 'g_kg',
          choGkg: c.carboidratos?.g_kg?.toString() || '5',
          lipMetodo: c.lipidios?.metodo || 'g_kg',
          lipGkg: c.lipidios?.g_kg?.toString() || '0.8',
        });
      } else {
        setCalculo(null);
        // Definir idade e sexo do paciente
        const idade = selectedPaciente.dataNascimento
          ? Math.floor((new Date() - new Date(selectedPaciente.dataNascimento)) / (365.25 * 24 * 60 * 60 * 1000))
          : '';
        setForm(prev => ({
          ...prev,
          idade: idade.toString(),
          sexo: selectedPaciente.sexo || 'masculino',
          peso: '',
          altura: '',
          massaMagra: '',
          objetivo: 'manutencao',
          adicional: '0',
          deficit: '0',
        }));
      }
    };
    loadCalculo();
  }, [selectedPaciente]);

  // Recalcular sempre que os inputs mudarem
  useEffect(() => {
    calcularTudo();
  }, [form]);

  const calcularGEB = () => {
    const peso = parseFloat(form.peso) || 0;
    const altura = parseFloat(form.altura) || 0;
    const idade = parseFloat(form.idade) || 30;
    const sexo = form.sexo;
    const formula = form.formula;
    const massaMagra = parseFloat(form.massaMagra) || 0;

    switch (formula) {
      case 'harris_benedict':
        return sexo === 'masculino'
          ? 66.47 + 13.75 * peso + 5.003 * altura * 100 - 6.755 * idade
          : 655.1 + 9.563 * peso + 1.85 * altura * 100 - 4.676 * idade;
      case 'mifflin':
        return sexo === 'masculino'
          ? 10 * peso + 6.25 * altura * 100 - 5 * idade + 5
          : 10 * peso + 6.25 * altura * 100 - 5 * idade - 161;
      case 'cunningham':
        return massaMagra > 0 ? 500 + 22 * massaMagra : 500 + 22 * (peso * (sexo === 'masculino' ? 0.8 : 0.7));
      case 'fao_who':
        if (sexo === 'masculino') {
          if (idade <= 18) return 17.5 * peso + 651;
          if (idade <= 30) return 15.3 * peso + 679;
          if (idade <= 60) return 11.6 * peso + 879;
          return 13.5 * peso + 487;
        } else {
          if (idade <= 18) return 12.2 * peso + 746;
          if (idade <= 30) return 14.7 * peso + 496;
          if (idade <= 60) return 8.7 * peso + 829;
          return 10.5 * peso + 596;
        }
      case 'katch_mcardle':
        return massaMagra > 0 ? 370 + 21.6 * massaMagra : 370 + 21.6 * (peso * (sexo === 'masculino' ? 0.8 : 0.7));
      default:
        return 0;
    }
  };

  const calcularGET = () => {
    return (calcularGEB() * parseFloat(form.fatorAtividade || 1.2));
  };

  const calcularVETAjustado = () => {
    const get = calcularGET();
    const adicional = parseFloat(form.adicional) || 0;
    const deficit = parseFloat(form.deficit) || 0;
    switch (form.objetivo) {
      case 'hipertrofia': return get + (adicional > 0 ? adicional : 300);
      case 'emagrecimento': return get - (deficit > 0 ? deficit : 500);
      case 'ganho_peso': return get + (adicional > 0 ? adicional : 500);
      default: return get;
    }
  };

  const calcularMacros = () => {
    const vet = calcularVETAjustado();
    const peso = parseFloat(form.peso) || 0;

    let ptnGramas = form.ptnMetodo === 'g_kg' ? parseFloat(form.ptnGkg) * peso : (vet * 0.25) / 4;
    let ptnKcal = ptnGramas * 4;
    let choGramas = form.choMetodo === 'g_kg' ? parseFloat(form.choGkg) * peso : (vet * 0.55) / 4;
    let choKcal = choGramas * 4;
    let lipGramas = form.lipMetodo === 'g_kg' ? parseFloat(form.lipGkg) * peso : (vet * 0.20) / 9;
    let lipKcal = lipGramas * 9;

    const totalKcal = ptnKcal + choKcal + lipKcal;
    let ptnPerc = vet > 0 ? Math.round((ptnKcal / vet) * 100) : 0;
    let choPerc = vet > 0 ? Math.round((choKcal / vet) * 100) : 0;
    let lipPerc = vet > 0 ? Math.round((lipKcal / vet) * 100) : 0;

    const soma = ptnPerc + choPerc + lipPerc;
    if (soma !== 100 && soma > 0) choPerc += (100 - soma);

    setResultados({
      geb: Math.round(calcularGEB()),
      get: Math.round(calcularGET()),
      vetAjustado: Math.round(vet),
      ptn: { gramas: Math.round(ptnGramas), kcal: Math.round(ptnKcal), percentual: ptnPerc },
      cho: { gramas: Math.round(choGramas), kcal: Math.round(choKcal), percentual: choPerc },
      lip: { gramas: Math.round(lipGramas), kcal: Math.round(lipKcal), percentual: lipPerc },
    });
  };

  const calcularTudo = () => {
    const peso = parseFloat(form.peso);
    const altura = parseFloat(form.altura);
    if (!peso || !altura) return;
    calcularMacros();
  };

  const salvarCalculo = async () => {
    if (!selectedPaciente) return toast.warning('Selecione um paciente!');

    try {
      const data = {
        paciente_login: selectedPaciente.login,
        paciente_nome: selectedPaciente.nome,
        profissional: user.nome,
        profissional_login: user.login,
        data_calculo: new Date().toISOString().split('T')[0],
        data_atualizacao: new Date().toISOString(),
        peso: parseFloat(form.peso) || null,
        altura: parseFloat(form.altura) || null,
        idade: parseInt(form.idade) || null,
        sexo: form.sexo,
        fator_atividade: parseFloat(form.fatorAtividade),
        formula: form.formula,
        massa_magra: parseFloat(form.massaMagra) || null,
        geb: resultados.geb,
        get: resultados.get,
        objetivo: form.objetivo,
        adicional_energetico: parseFloat(form.adicional) || 0,
        deficit_energetico: parseFloat(form.deficit) || 0,
        vet_ajustado: resultados.vetAjustado,
        proteinas: {
          metodo: form.ptnMetodo,
          g_kg: parseFloat(form.ptnGkg),
          gramas: resultados.ptn.gramas,
          kcal: resultados.ptn.kcal,
          percentual: resultados.ptn.percentual,
        },
        carboidratos: {
          metodo: form.choMetodo,
          g_kg: parseFloat(form.choGkg),
          gramas: resultados.cho.gramas,
          kcal: resultados.cho.kcal,
          percentual: resultados.cho.percentual,
        },
        lipidios: {
          metodo: form.lipMetodo,
          g_kg: parseFloat(form.lipGkg),
          gramas: resultados.lip.gramas,
          kcal: resultados.lip.kcal,
          percentual: resultados.lip.percentual,
        },
      };

      if (calculo?.id) {
        await updateDoc(doc(db, 'calculos_energeticos', calculo.id), data);
        toast.success('Cálculo atualizado!');
      } else {
        await addDoc(collection(db, 'calculos_energeticos'), data);
        toast.success('Cálculo salvo!');
      }

      const q = query(collection(db, 'calculos_energeticos'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docs = snap.docs;
        docs.sort((a, b) => (b.data().data_atualizacao || b.data().data_calculo)?.localeCompare(a.data().data_atualizacao || a.data().data_calculo));
        setCalculo({ id: docs[0].id, ...docs[0].data() });
      }
    } catch (err) {
      toast.error('Erro ao salvar cálculo: ' + err.message);
    }
  };

  const inputStyle = { padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0' };
  const readOnlyStyle = { ...inputStyle, background: '#f1f5f9' };
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
            <div className="info-card"><span className="info-label">Idade</span><span className="info-value">{form.idade} anos</span></div>
            <div className="info-card"><span className="info-label">Sexo</span><span className="info-value">{form.sexo}</span></div>
            <div className="info-card"><span className="info-label">Peso (kg)</span><span className="info-value">{form.peso || '--'}</span></div>
            <div className="info-card"><span className="info-label">Altura (m)</span><span className="info-value">{form.altura || '--'}</span></div>
          </div>
        )}
      </div>

      {selectedPaciente ? (
        <>
          {/* Dados Antropométricos */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>📏 Dados Antropométricos</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>📏 Peso Atual (kg)</label>
                <input type="number" step="0.1" value={form.peso} onChange={e => setForm({ ...form, peso: e.target.value })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>📐 Altura (m)</label>
                <input type="number" step="0.01" value={form.altura} onChange={e => setForm({ ...form, altura: e.target.value })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>🎂 Idade (anos)</label>
                <input type="number" value={form.idade} readOnly style={readOnlyStyle} />
              </div>
              <div className="form-field">
                <label>⚥ Sexo</label>
                <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} style={inputStyle}>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
              <div className="form-field">
                <label>📊 Fator de Atividade</label>
                <select value={form.fatorAtividade} onChange={e => setForm({ ...form, fatorAtividade: e.target.value })} style={inputStyle}>
                  <option value="1.2">Sedentário (1.2)</option>
                  <option value="1.375">Leve (1.375)</option>
                  <option value="1.55">Moderado (1.55)</option>
                  <option value="1.725">Intenso (1.725)</option>
                  <option value="1.9">Muito Intenso (1.9)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fórmula */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>🧮 Fórmula de Cálculo</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>📐 Fórmula</label>
                <select value={form.formula} onChange={e => setForm({ ...form, formula: e.target.value })} style={inputStyle}>
                  <option value="harris_benedict">Harris-Benedict (1919)</option>
                  <option value="mifflin">Mifflin-St Jeor (1990)</option>
                  <option value="cunningham">Cunningham (1980) - Massa Magra</option>
                  <option value="fao_who">FAO/WHO/UNU (1985)</option>
                  <option value="katch_mcardle">Katch-McArdle</option>
                </select>
              </div>
              <div className="form-field">
                <label>💪 Massa Magra (kg)</label>
                <input type="number" step="0.1" value={form.massaMagra} onChange={e => setForm({ ...form, massaMagra: e.target.value })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>📊 GEB/TMB Calculado</label>
                <input type="text" value={`${resultados.geb} kcal`} readOnly style={readOnlyStyle} />
              </div>
              <div className="form-field">
                <label>⚡ GET/VET Calculado</label>
                <input type="text" value={`${resultados.get} kcal`} readOnly style={readOnlyStyle} />
              </div>
            </div>
          </div>

          {/* Objetivo */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>🎯 Objetivo e Adicional Energético</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div className="form-field">
                <label>🎯 Objetivo</label>
                <select value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })} style={inputStyle}>
                  <option value="hipertrofia">Hipertrofia Muscular</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="ganho_peso">Ganho de Peso</option>
                </select>
              </div>
              <div className="form-field">
                <label>Adicional (kcal/dia)</label>
                <input type="number" step="50" value={form.adicional} onChange={e => setForm({ ...form, adicional: e.target.value })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>➖ Déficit (kcal/dia)</label>
                <input type="number" step="50" value={form.deficit} onChange={e => setForm({ ...form, deficit: e.target.value })} style={inputStyle} />
              </div>
              <div className="form-field">
                <label>⚡ VET Final Ajustado</label>
                <input type="text" value={`${resultados.vetAjustado} kcal`} readOnly style={{ ...readOnlyStyle, fontWeight: 'bold', color: '#f97316' }} />
              </div>
            </div>
          </div>

          {/* Macronutrientes */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header"><h3>🥩 Distribuição de Macronutrientes</h3></div>

            {/* Proteínas */}
            <div style={{ background: '#f0fdf4', borderRadius: '1rem', padding: 20, marginBottom: 20 }}>
              <h4 style={{ color: '#166534', marginBottom: 16 }}>🥩 PROTEÍNAS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div className="form-field">
                  <label>📊 Método</label>
                  <select value={form.ptnMetodo} onChange={e => setForm({ ...form, ptnMetodo: e.target.value })} style={inputStyle}>
                    <option value="g_kg">g/kg de peso</option>
                    <option value="percentual">% do VET</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>🥩 g/kg/dia</label>
                  <input type="number" step="0.1" value={form.ptnGkg} onChange={e => setForm({ ...form, ptnGkg: e.target.value })} style={inputStyle} />
                </div>
                <div className="form-field">
                  <label>🥩 g/dia</label>
                  <input type="text" value={`${resultados.ptn.gramas} g`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🥩 kcal</label>
                  <input type="text" value={`${resultados.ptn.kcal} kcal`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🥩 % do VET</label>
                  <input type="text" value={`${resultados.ptn.percentual}%`} readOnly style={readOnlyStyle} />
                </div>
              </div>
            </div>

            {/* Carboidratos */}
            <div style={{ background: '#fef3c7', borderRadius: '1rem', padding: 20, marginBottom: 20 }}>
              <h4 style={{ color: '#92400e', marginBottom: 16 }}>🍚 CARBOIDRATOS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div className="form-field">
                  <label>📊 Método</label>
                  <select value={form.choMetodo} onChange={e => setForm({ ...form, choMetodo: e.target.value })} style={inputStyle}>
                    <option value="g_kg">g/kg de peso</option>
                    <option value="percentual">% do VET</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>🍚 g/kg/dia</label>
                  <input type="number" step="0.5" value={form.choGkg} onChange={e => setForm({ ...form, choGkg: e.target.value })} style={inputStyle} />
                </div>
                <div className="form-field">
                  <label>🍚 g/dia</label>
                  <input type="text" value={`${resultados.cho.gramas} g`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🍚 kcal</label>
                  <input type="text" value={`${resultados.cho.kcal} kcal`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🍚 % do VET</label>
                  <input type="text" value={`${resultados.cho.percentual}%`} readOnly style={readOnlyStyle} />
                </div>
              </div>
            </div>

            {/* Lipídios */}
            <div style={{ background: '#fee2e2', borderRadius: '1rem', padding: 20, marginBottom: 20 }}>
              <h4 style={{ color: '#991b1b', marginBottom: 16 }}>🧈 LIPÍDIOS (GORDURAS)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div className="form-field">
                  <label>📊 Método</label>
                  <select value={form.lipMetodo} onChange={e => setForm({ ...form, lipMetodo: e.target.value })} style={inputStyle}>
                    <option value="g_kg">g/kg de peso</option>
                    <option value="percentual">% do VET</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>🧈 g/kg/dia</label>
                  <input type="number" step="0.1" value={form.lipGkg} onChange={e => setForm({ ...form, lipGkg: e.target.value })} style={inputStyle} />
                </div>
                <div className="form-field">
                  <label>🧈 g/dia</label>
                  <input type="text" value={`${resultados.lip.gramas} g`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🧈 kcal</label>
                  <input type="text" value={`${resultados.lip.kcal} kcal`} readOnly style={readOnlyStyle} />
                </div>
                <div className="form-field">
                  <label>🧈 % do VET</label>
                  <input type="text" value={`${resultados.lip.percentual}%`} readOnly style={readOnlyStyle} />
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0f1a5c 100%)', borderRadius: '1rem', padding: 20, color: 'white' }}>
              <h4 style={{ marginBottom: 16 }}>📊 RESUMO DA DIETA</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div><strong>⚡ VET Total:</strong> {resultados.vetAjustado} kcal</div>
                <div><strong>🥩 Proteína:</strong> {resultados.ptn.gramas} g ({resultados.ptn.percentual}%)</div>
                <div><strong>🍚 Carboidrato:</strong> {resultados.cho.gramas} g ({resultados.cho.percentual}%)</div>
                <div><strong>🧈 Lipídio:</strong> {resultados.lip.gramas} g ({resultados.lip.percentual}%)</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}>
            <button className="btn-primary btn-expand" onClick={salvarCalculo}>
              <span>💾</span>
              <span className="btn-text">Salvar Cálculo</span>
            </button>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem' }}>
          <span style={{ fontSize: 48, opacity: 0.5 }}>🧮</span>
          <h3>Selecione um paciente</h3>
          <p style={{ color: '#64748b' }}>Escolha um paciente para realizar o cálculo energético</p>
        </div>
      )}
    </>
  );
}