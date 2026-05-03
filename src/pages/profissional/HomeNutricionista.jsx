import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import Chart from 'chart.js/auto';
import DatePicker from '../../components/DatePicker';
import Loading from '../../components/Loading';
import { useToast } from '../../contexts/ToastContext';

export default function HomeNutricionista() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [isRestored, setIsRestored] = useState(false);

  // Modal de avaliação
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    weight: '', height: '', imc: '', classification: '',
    muscleMass: '', bodyFat: '', glucose: '', cholesterol: ''
  });

  const storageKey = `selectedPaciente_${user.login}`;
  const toast = useToast();
  
  // Gráficos
  const weightChartRef = useRef(null);
  const imcChartRef = useRef(null);
  const muscleChartRef = useRef(null);
  const chartInstances = useRef({});

  // Carregar lista de pacientes
  useEffect(() => {
    const loadPacientes = async () => {
      try {
        const profRef = doc(db, 'logins', user.login);
        const profDoc = await getDoc(profRef);
        if (!profDoc.exists()) return;
        const data = profDoc.data();
        const pacientesMap = data.pacientes || {};
        const lista = [];
        for (const [login, nome] of Object.entries(pacientesMap)) {
          const pacRef = doc(db, 'logins', login);
          const pacDoc = await getDoc(pacRef);
          if (pacDoc.exists()) {
            lista.push({ login, ...pacDoc.data() });
          } else {
            lista.push({ login, nome, cargo: 'paciente' });
          }
        }
        setPacientes(lista);
      } catch (err) {
        console.error(err);
      }
    };
    loadPacientes();
  }, [user.login]);

  // Restaura paciente salvo ao carregar a página
  useEffect(() => {
    const savedLogin = localStorage.getItem(storageKey);
    if (savedLogin && pacientes.length > 0) {
      const pac = pacientes.find(p => p.login === savedLogin);
      if (pac) setSelectedPaciente(pac);
    }
    setIsRestored(true);
  }, [pacientes, storageKey]);

  // Salva paciente selecionado no localStorage
  useEffect(() => {
    if (!isRestored) return; // só age depois da restauração
    if (selectedPaciente) {
      localStorage.setItem(storageKey, selectedPaciente.login);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [selectedPaciente, storageKey]);

  // Carregar avaliações do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setEvaluations([]);
      return;
    }
    const loadEvals = async () => {
      const q = query(collection(db, 'avaliacao_nutricional'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      const evals = [];
      snap.forEach(doc => evals.push({ id: doc.id, ...doc.data() }));
      evals.sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
      setEvaluations(evals);
    };
    loadEvals();
  }, [selectedPaciente]);

  // Gráficos
  useEffect(() => {
    if (!evaluations.length) return;
    let filtered = evaluations;
    if (dataInicial) filtered = filtered.filter(e => e.data_avaliacao >= dataInicial);
    if (dataFinal) filtered = filtered.filter(e => e.data_avaliacao <= dataFinal);

    const labels = filtered.map(e => e.data_avaliacao);
    const weights = filtered.map(e => e.dados_antropometricos?.peso || 0);
    const imcs = filtered.map(e => e.dados_antropometricos?.imc || 0);
    const muscles = filtered.map(e => e.bioimpedancia?.massa_muscular || 0);

    Object.values(chartInstances.current).forEach(chart => chart.destroy());
    chartInstances.current = {};

    if (weightChartRef.current) {
      chartInstances.current.weight = new Chart(weightChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Peso (kg)', data: weights,
            borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)',
            borderWidth: 3, tension: 0.3, fill: true,
            pointBackgroundColor: '#f97316', pointBorderColor: '#fff',
            pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
          }]
        },
        options: { responsive: true, maintainAspectRatio: true }
      });
    }
    if (imcChartRef.current) {
      chartInstances.current.imc = new Chart(imcChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'IMC', data: imcs,
            borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 3, tension: 0.3, fill: true,
            pointBackgroundColor: '#3b82f6', pointBorderColor: '#fff',
            pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
          }]
        },
        options: { responsive: true, maintainAspectRatio: true, scales: { y: { beginAtZero: false } } }
      });
    }
    if (muscleChartRef.current) {
      const hasMuscle = muscles.some(m => m > 0);
      const ctx = muscleChartRef.current.getContext('2d');
      if (hasMuscle) {
        chartInstances.current.muscle = new Chart(muscleChartRef.current, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Massa Muscular (kg)', data: muscles,
              borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
              borderWidth: 3, tension: 0.3, fill: true,
              pointBackgroundColor: '#10b981', pointBorderColor: '#fff',
              pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
            }]
          },
          options: { responsive: true, maintainAspectRatio: true }
        });
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '14px Arial'; ctx.fillStyle = '#999'; ctx.textAlign = 'center';
        ctx.fillText('Dados de massa muscular não disponíveis', ctx.canvas.width/2, ctx.canvas.height/2);
      }
    }
  }, [evaluations, dataInicial, dataFinal]);

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura || altura <= 0) return;
    const imc = peso / (altura * altura);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do peso';
    else if (imc < 25) classif = 'Peso normal';
    else if (imc < 30) classif = 'Sobrepeso';
    else if (imc < 35) classif = 'Obesidade grau I';
    else if (imc < 40) classif = 'Obesidade grau II';
    else classif = 'Obesidade grau III';
    setFormData(prev => ({ ...prev, imc: imc.toFixed(2), classification: classif }));
  };

  const salvarAvaliacao = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return toast.warning('Selecione um paciente!');
    try {
      await addDoc(collection(db, 'avaliacao_nutricional'), {
        paciente_login: selectedPaciente.login,
        paciente_nome: selectedPaciente.nome,
        profissional: user.nome,
        profissional_login: user.login,
        cargo: 'nutricionista',
        data_avaliacao: new Date().toISOString().split('T')[0],
        dados_antropometricos: {
          peso: parseFloat(formData.weight),
          altura: parseFloat(formData.height),
          imc: parseFloat(formData.imc),
          classificacao_imc: formData.classification
        },
        bioimpedancia: {
          massa_muscular: parseFloat(formData.muscleMass) || null,
          gordura_corporal: parseFloat(formData.bodyFat) || null
        },
        exames_laboratoriais: {
          glicemia: parseFloat(formData.glucose) || null,
          colesterol_total: parseFloat(formData.cholesterol) || null
        }
      });
      toast.success('Avaliação salva!');
      setShowModal(false);
      // Recarregar avaliações
      const q = query(collection(db, 'avaliacao_nutricional'), where('paciente_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      const evals = [];
      snap.forEach(doc => evals.push({ id: doc.id, ...doc.data() }));
      evals.sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
      setEvaluations(evals);
    } catch (err) {
      toast.show('Erro ao salvar avaliação!', 'error');
    }
  };

  const pacienteInfo = selectedPaciente ? {
    nome: selectedPaciente.nome || '--',
    login: selectedPaciente.login,
    nasc: selectedPaciente.dataNascimento ? selectedPaciente.dataNascimento.split('-').reverse().join('/') : '--',
    idade: selectedPaciente.dataNascimento ? Math.floor((new Date() - new Date(selectedPaciente.dataNascimento)) / (365.25 * 24 * 60 * 60 * 1000)) : '--',
    sexo: selectedPaciente.sexo || '--'
  } : null;
  if (pacientes.length === 0) {
    return <Loading message="Carregando..." />;
  }
  return (
    <>
      {/* Seletor de paciente */}
      <div className="info-section" style={{ marginBottom: 24 }}>
        <select
          value={selectedPaciente?.login || ''}
          onChange={(e) => {
            const pac = pacientes.find(p => p.login === e.target.value);
            setSelectedPaciente(pac || null);
            setDataInicial(''); setDataFinal('');
          }}
          style={{ width: '100%', maxWidth: 350, padding: '10px 14px', borderRadius: 10, border: '2px solid #e2e8f0' }}
        >
          <option value="">-- Selecione um paciente --</option>
          {pacientes.map(p => (
            <option key={p.login} value={p.login}>{p.nome} ({p.login})</option>
          ))}
        </select>

        {selectedPaciente && (
          <div style={{ marginTop: 16 }}>   {/* ← espaçamento que uniformiza com as outras telas */}
            <div className="info-grid">
              <div className="info-card">
                <span className="info-label">Nome</span>
                <span className="info-value">{pacienteInfo.nome}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Login</span>
                <span className="info-value">{pacienteInfo.login}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Nasc.</span>
                <span className="info-value">{pacienteInfo.nasc}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Idade</span>
                <span className="info-value">{pacienteInfo.idade}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Sexo</span>
                <span className="info-value">{pacienteInfo.sexo}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Período */}
      {selectedPaciente && (
        <div className="evaluation-section" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ whiteSpace: 'nowrap', margin: 0 }}>📅 Data Inicial</label>
              <DatePicker value={dataInicial} onChange={(dateStr) => setDataInicial(dateStr)} style={{ padding: '10px 14px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ whiteSpace: 'nowrap', margin: 0 }}>📅 Data Final</label>
              <DatePicker value={dataFinal} onChange={(dateStr) => setDataFinal(dateStr)} style={{ padding: '10px 14px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {selectedPaciente && evaluations.length > 0 && (
        <div className="charts-section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div className="chart-card"><h4>📈 Evolução do Peso</h4><canvas ref={weightChartRef} style={{ maxHeight: 300 }}></canvas></div>
          <div className="chart-card"><h4>📊 Evolução do IMC</h4><canvas ref={imcChartRef} style={{ maxHeight: 300 }}></canvas></div>
          <div className="chart-card"><h4>💪 Evolução da Massa Muscular</h4><canvas ref={muscleChartRef} style={{ maxHeight: 300 }}></canvas></div>
        </div>
      )}

      {/* Botão nova avaliação */}
      <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}>
        <button className="btn-primary btn-expand" onClick={() => { if (!selectedPaciente) { toast.warning('Selecione um paciente!'); } else { setFormData({ weight: '', height: '', imc: '', classification: '', muscleMass: '', bodyFat: '', glucose: '', cholesterol: '' }); setShowModal(true); } }}>
          <span className="btn-text">Nova Avaliação Nutricional</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>📝 Nova Avaliação</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={salvarAvaliacao}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div><label>Paciente</label><input value={selectedPaciente?.nome || ''} readOnly style={{ background: '#f1f5f9' }} /></div>
                <div><label>Peso (kg)</label><input type="number" step="0.1" value={formData.weight} onChange={e => { setFormData(prev => ({ ...prev, weight: e.target.value })); calcularIMC(e.target.value, formData.height); }} required /></div>
                <div><label>Altura (m)</label><input type="number" step="0.01" value={formData.height} onChange={e => { setFormData(prev => ({ ...prev, height: e.target.value })); calcularIMC(formData.weight, e.target.value); }} required /></div>
                <div><label>IMC</label><input value={formData.imc} readOnly /></div>
                <div><label>Classificação</label><input value={formData.classification} readOnly /></div>
                <div><label>Massa Muscular (kg)</label><input type="number" step="0.1" value={formData.muscleMass} onChange={e => setFormData(prev => ({ ...prev, muscleMass: e.target.value }))} /></div>
                <div><label>Gordura (%)</label><input type="number" step="0.1" value={formData.bodyFat} onChange={e => setFormData(prev => ({ ...prev, bodyFat: e.target.value }))} /></div>
                <div><label>Glicemia</label><input type="number" value={formData.glucose} onChange={e => setFormData(prev => ({ ...prev, glucose: e.target.value }))} /></div>
                <div><label>Colesterol</label><input type="number" value={formData.cholesterol} onChange={e => setFormData(prev => ({ ...prev, cholesterol: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">💾 Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}