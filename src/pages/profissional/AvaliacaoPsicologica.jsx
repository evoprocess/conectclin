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

export default function AvaliacaoPsicologica() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    ansiedade: 5,
    depressao: 5,
    estresse: 5,
    sono: 5,
    observacoes: '',
  });

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Carregar pacientes vinculados
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

  // Carregar avaliações psicológicas do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setEvaluations([]);
      return;
    }
    const loadEvals = async () => {
      const q = query(
        collection(db, 'avaliacao_nutricional'),
        where('paciente_login', '==', selectedPaciente.login),
        where('tipo', '==', 'psicologica')
      );
      const snap = await getDocs(q);
      const evals = [];
      snap.forEach(doc => evals.push({ id: doc.id, ...doc.data() }));
      evals.sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
      setEvaluations(evals);
    };
    loadEvals();
  }, [selectedPaciente]);

  // Renderizar gráfico
  useEffect(() => {
    if (!evaluations.length || !chartRef.current) return;
    const labels = evaluations.map(e => e.data_avaliacao);
    const ans = evaluations.map(e => e.escalas?.ansiedade || 0);
    const dep = evaluations.map(e => e.escalas?.depressao || 0);
    const est = evaluations.map(e => e.escalas?.estresse || 0);
    const son = evaluations.map(e => e.escalas?.qualidade_sono || 0);

    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Ansiedade', data: ans, borderColor: '#ef4444', tension: 0.4 },
          { label: 'Depressão', data: dep, borderColor: '#3b82f6', tension: 0.4 },
          { label: 'Estresse', data: est, borderColor: '#f59e0b', tension: 0.4 },
          { label: 'Sono', data: son, borderColor: '#10b981', tension: 0.4 },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 10, title: { display: true, text: 'Nível (0-10)' } },
        },
      },
    });
  }, [evaluations]);

  const salvarAvaliacao = async (e) => {
    e.preventDefault();
    if (!selectedPaciente) return alert('Selecione um paciente!');
    try {
      await addDoc(collection(db, 'avaliacao_nutricional'), {
        paciente_login: selectedPaciente.login,
        paciente_nome: selectedPaciente.nome,
        profissional: user.nome,
        profissional_login: user.login,
        cargo: 'psicologo',
        tipo: 'psicologica',
        data_avaliacao: form.data,
        escalas: {
          ansiedade: parseInt(form.ansiedade),
          depressao: parseInt(form.depressao),
          estresse: parseInt(form.estresse),
          qualidade_sono: parseInt(form.sono),
        },
        observacoes: form.observacoes,
      });
      alert('✅ Avaliação salva!');

      // Recarregar avaliações
      const q = query(collection(db, 'avaliacao_nutricional'), where('paciente_login', '==', selectedPaciente.login), where('tipo', '==', 'psicologica'));
      const snap = await getDocs(q);
      const evals = [];
      snap.forEach(doc => evals.push({ id: doc.id, ...doc.data() }));
      evals.sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
      setEvaluations(evals);

      setForm(prev => ({ ...prev, observacoes: '' }));
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

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
            <div className="info-card">
              <span className="info-label">Nome</span>
              <span className="info-value">{selectedPaciente.nome}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Login</span>
              <span className="info-value">{selectedPaciente.login}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Idade</span>
              <span className="info-value">
                {selectedPaciente.dataNascimento
                  ? Math.floor((new Date() - new Date(selectedPaciente.dataNascimento)) / (365.25 * 24 * 60 * 60 * 1000))
                  : '--'}
                anos
              </span>
            </div>
          </div>
        )}
      </div>

      {selectedPaciente && (
        <>
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>📝 Nova Avaliação Psicológica</h3>
            </div>
            <form onSubmit={salvarAvaliacao}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div className="form-field">
                  <label>📅 Data</label>
                  <DatePicker value={form.data} onChange={(dateStr) => setForm({ ...form, data: dateStr })} />
                </div>
                {[
                  { id: 'ansiedade', label: '😰 Ansiedade' },
                  { id: 'depressao', label: '😔 Depressão' },
                  { id: 'estresse', label: '😫 Estresse' },
                  { id: 'sono', label: '💤 Qualidade do Sono' },
                ].map(t => (
                  <div className="form-field" key={t.id}>
                    <label>{t.label} (0-10)</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={form[t.id]}
                      onChange={e => setForm({ ...form, [t.id]: e.target.value })}
                      style={{ width: '100%' }}
                    />
                    <span>{form[t.id]}</span>
                  </div>
                ))}
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label>📝 Observações</label>
                  <textarea
                    rows="3"
                    value={form.observacoes}
                    onChange={e => setForm({ ...form, observacoes: e.target.value })}
                    className="form-control"
                    style={{ padding: '12px 14px', borderRadius: 10 }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: 20 }}>
                💾 Salvar Avaliação
              </button>
            </form>
          </div>

          {evaluations.length > 0 && (
            <>
              <div className="charts-section" style={{ marginBottom: 24 }}>
                <div className="chart-card">
                  <h4>📈 Evolução Psicológica</h4>
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>

              <div className="evaluation-section">
                <div className="section-header">
                  <h3>📊 Histórico de Avaliações</h3>
                </div>
                {evaluations.map(ev => (
                  <div key={ev.id} className="evaluation-card" style={{ marginBottom: 12 }}>
                    <div className="evaluation-date">📅 {ev.data_avaliacao}</div>
                    <div>
                      😰 Ansiedade: {ev.escalas?.ansiedade}/10 | 😔 Depressão: {ev.escalas?.depressao}/10 | 😫 Estresse: {ev.escalas?.estresse}/10 | 💤 Sono: {ev.escalas?.qualidade_sono}/10
                    </div>
                    {ev.observacoes && <div style={{ marginTop: 8 }}>📝 {ev.observacoes}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!selectedPaciente && (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem' }}>
          <span style={{ fontSize: 48, opacity: 0.5 }}>🧠</span>
          <h3>Selecione um paciente</h3>
          <p style={{ color: '#64748b' }}>Escolha um paciente para realizar a avaliação psicológica</p>
        </div>
      )}
    </>
  );
}