import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default function PacienteHome() {
  const { user } = useAuth();
  const [plano, setPlano] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [modalJornada, setModalJornada] = useState(false);

  const weightChartRef = useRef(null);
  const imcChartRef = useRef(null);
  const muscleChartRef = useRef(null);
  const chartInstances = useRef({});

  // Dados do paciente
  useEffect(() => {
    const loadDados = async () => {
      try {
        const userRef = doc(db, 'logins', user.login);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPlano(data.plano || 'Não informado');
          const profs = [];
          if (data.profissionais_vinculados) {
            for (const [login, info] of Object.entries(data.profissionais_vinculados)) {
              profs.push({ login, nome: info.nome || login, cargo: info.cargo || 'Profissional' });
            }
            profs.sort((a, b) => (a.cargo === 'nutricionista' ? -1 : 1));
          }
          setProfissionais(profs);
        }
      } catch (err) {
        console.error(err);
        setPlano('Erro ao carregar');
      }
    };
    loadDados();
  }, [user.login]);

  // Avaliações
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const q = query(collection(db, 'avaliacao_nutricional'), where('paciente_login', '==', user.login));
        const snapshot = await getDocs(q);
        const evals = [];
        snapshot.forEach(doc => evals.push({ id: doc.id, ...doc.data() }));
        evals.sort((a, b) => new Date(a.data_avaliacao) - new Date(b.data_avaliacao));
        setEvaluations(evals);
      } catch (err) {
        console.error(err);
      }
    };
    loadEvaluations();
  }, [user.login]);

  // Gráficos
  useEffect(() => {
    if (!evaluations.length || user.perfil !== 'operador_membro') return;
    const labels = evaluations.map(e => e.data_avaliacao);
    const weights = evaluations.map(e => e.dados_antropometricos?.peso || 0);
    const imcs = evaluations.map(e => e.dados_antropometricos?.imc || 0);
    const muscles = evaluations.map(e => e.bioimpedancia?.massa_muscular || 0);

    Object.values(chartInstances.current).forEach(chart => chart.destroy());
    chartInstances.current = {};

    if (weightChartRef.current) {
      chartInstances.current.weight = new Chart(weightChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Peso (kg)',
            data: weights,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
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
            label: 'IMC',
            data: imcs,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
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
              label: 'Massa Muscular (kg)',
              data: muscles,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.1)',
              borderWidth: 3,
              tension: 0.3,
              fill: true,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }]
          },
          options: { responsive: true, maintainAspectRatio: true }
        });
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Dados de massa muscular não disponíveis', ctx.canvas.width/2, ctx.canvas.height/2);
      }
    }
  }, [evaluations, user.perfil]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const partes = dateStr.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dateStr;
  };

  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return '?';
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  };

  const temNutricionista = profissionais.some(p => p.cargo === 'nutricionista');
  const isMembro = user.perfil === 'operador_membro';

  const primeiroNome = user.nome ? user.nome.trim().split(' ')[0] : 'Usuário';
  const nomeFormatado = primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase();

  return (
    <>
      {/* DADOS DO CLIENTE */}
      <div className="client-info mb-3">
        <h3>📋 Meus Dados</h3>
        <div className="info-card">
          <p><strong>👤 Nome:</strong> {user.nome || 'Não informado'}</p>
          <p><strong>📅 Nascimento:</strong> {formatDate(user.dataNascimento) || 'Não informado'}</p>
          <p><strong>🎂 Idade:</strong> {calcularIdade(user.dataNascimento)} anos</p>
          <p><strong>📋 Plano:</strong> {plano}</p>
          <div className="profissionais-container">
            <p className="mb-2"><strong>👨‍⚕️ Profissionais Vinculados:</strong></p>
            {profissionais.length > 0 ? (
              profissionais.map((prof, idx) => (
                <div key={idx} className="profissional-item">
                  <strong>{prof.cargo}:</strong> {prof.nome}
                </div>
              ))
            ) : (
              <p className="text-white-50 mb-0">Nenhum profissional vinculado</p>
            )}
          </div>
        </div>
      </div>

      {/* AVALIAÇÕES */}
      <h3 className="mb-2" style={{ fontSize: 16, color: 'var(--secondary)' }}>📊 Histórico de Avaliações Nutricionais</h3>
      {evaluations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 16 }}>
          <p style={{ color: '#666' }}>📭 Nenhuma avaliação encontrada.</p>
          <p style={{ color: '#999', fontSize: 14, marginTop: 10 }}>Suas avaliações aparecerão aqui assim que forem registradas pelos profissionais.</p>
        </div>
      ) : (
        evaluations.map(ev => (
          <div key={ev.id} className="evaluation-card">
            <div className="evaluation-date">
              📅 {formatDate(ev.data_avaliacao)}
              <span style={{ float: 'right', fontSize: 12, color: '#f97316' }}>por: {ev.profissional || 'Profissional'}</span>
            </div>
            <div><strong>👨‍⚕️ Profissional:</strong> {ev.profissional || 'Não informado'} ({ev.cargo})</div>
            <div className="evaluation-data">
              <div><strong>📏 Peso:</strong> {ev.dados_antropometricos?.peso || '-'} kg</div>
              <div><strong>📐 Altura:</strong> {ev.dados_antropometricos?.altura || '-'} m</div>
              <div><strong>📊 IMC:</strong> {ev.dados_antropometricos?.imc || '-'} - {ev.dados_antropometricos?.classificacao_imc || '-'}</div>
              {ev.bioimpedancia?.massa_muscular && <div><strong>💪 Massa Muscular:</strong> {ev.bioimpedancia.massa_muscular} kg</div>}
              {ev.bioimpedancia?.gordura_corporal && <div><strong>🧈 Gordura Corporal:</strong> {ev.bioimpedancia.gordura_corporal}%</div>}
              {ev.exames_laboratoriais?.glicemia && <div><strong>🩸 Glicemia:</strong> {ev.exames_laboratoriais.glicemia} mg/dL</div>}
              {ev.exames_laboratoriais?.colesterol_total && <div><strong>🩸 Colesterol:</strong> {ev.exames_laboratoriais.colesterol_total} mg/dL</div>}
            </div>
          </div>
        ))
      )}

      {/* GRÁFICOS (SOMENTE MEMBROS) */}
      {isMembro && evaluations.length > 0 && (
        <div className="charts-section mt-3">
          <div className="chart-container mb-3">
            <h4>📈 Evolução do Peso</h4>
            <canvas ref={weightChartRef}></canvas>
          </div>
          <div className="chart-container mb-3">
            <h4>📊 Evolução do IMC</h4>
            <canvas ref={imcChartRef}></canvas>
          </div>
          <div className="chart-container">
            <h4>💪 Evolução da Massa Muscular</h4>
            <canvas ref={muscleChartRef}></canvas>
          </div>
        </div>
      )}

      {/* Modal Minha Jornada */}
      {modalJornada && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <span className="close" onClick={() => setModalJornada(false)}>&times;</span>
            <h3 style={{ color: '#8b5cf6' }}>🌟 Minha Jornada de Saúde</h3>
            <div style={{ marginTop: 20 }}>
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 20, borderRadius: 16, color: 'white', marginBottom: 20 }}>
                <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 10 }}>📊</div>
                <p style={{ textAlign: 'center', margin: 0 }}><strong>{evaluations.length}</strong> avaliações realizadas</p>
              </div>
              <p>Continue acompanhando sua saúde!</p>
            </div>
            <button className="submit-btn" onClick={() => setModalJornada(false)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}