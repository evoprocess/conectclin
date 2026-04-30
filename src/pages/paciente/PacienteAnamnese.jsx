import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function PacienteAnamnese() {
  const { user } = useAuth();
  const [pacienteData, setPacienteData] = useState(null);
  const [anamnese, setAnamnese] = useState(null);
  const [profissionalNome, setProfissionalNome] = useState('Profissional não vinculado');
  const [exibirCompleta, setExibirCompleta] = useState(false);

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

  const formatarValor = (val) => (val === null || val === undefined || val === '') ? '—' : val;

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

        const anamRef = collection(db, 'anamneses_nutricionais');
        const q = query(anamRef, where('paciente_login', '==', user.login));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docs = snap.docs;
          docs.sort((a, b) => {
            const da = a.data().data_atualizacao || a.data().data_anamnese;
            const db2 = b.data().data_atualizacao || b.data().data_anamnese;
            return new Date(db2) - new Date(da);
          });
          setAnamnese({ id: docs[0].id, ...docs[0].data() });
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
          <p><strong>📅 Idade:</strong> {calcularIdade(user.dataNascimento)} anos</p>
          <p><strong>📋 Plano:</strong> {pacienteData?.plano || 'Não informado'}</p>
          <p><strong>👨‍⚕️ Nutricionista:</strong> {profissionalNome}</p>
          {anamnese && <p><strong>📅 Data da Anamnese:</strong> {formatDate(anamnese.data_anamnese)}</p>}
        </div>
      </div>

      {anamnese ? (
        <div className="anamnese-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              className="btn-small"
              style={{ background: '#f97316', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
              onClick={() => setExibirCompleta(!exibirCompleta)}
            >
              {exibirCompleta ? '📋 Ver Resumo' : '🔍 Ver Completa'}
            </button>
          </div>

          {!exibirCompleta ? (
            // Resumo
            <>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🏥 Histórico Clínico</div>
                <div>
                  {anamnese?.historico_clinico?.doencas_preexistentes && <p><strong>🩸 Doenças:</strong> {anamnese.historico_clinico.doencas_preexistentes}</p>}
                  {anamnese?.historico_clinico?.medicamentos && <p><strong>💊 Medicamentos:</strong> {anamnese.historico_clinico.medicamentos}</p>}
                  {!anamnese?.historico_clinico?.doencas_preexistentes && !anamnese?.historico_clinico?.medicamentos && <p style={{ color: '#999' }}>Nenhuma informação cadastrada</p>}
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>📏 Avaliação Antropométrica</div>
                <div>
                  {anamnese?.antropometria?.peso_atual && <p><strong>📏 Peso:</strong> {anamnese.antropometria.peso_atual} kg</p>}
                  {anamnese?.antropometria?.altura && <p><strong>📐 Altura:</strong> {anamnese.antropometria.altura} m</p>}
                  {anamnese?.antropometria?.imc && <p><strong>📊 IMC:</strong> {anamnese.antropometria.imc} - {anamnese.antropometria.classificacao_imc || ''}</p>}
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>💪 Composição Corporal</div>
                <div>
                  {anamnese?.composicao_corporal?.massa_muscular && <p><strong>💪 Massa Muscular:</strong> {anamnese.composicao_corporal.massa_muscular} kg</p>}
                  {anamnese?.composicao_corporal?.gordura_corporal && <p><strong>🧈 Gordura:</strong> {anamnese.composicao_corporal.gordura_corporal}%</p>}
                  {anamnese?.composicao_corporal?.agua_corporal && <p><strong>💧 Água Corporal:</strong> {anamnese.composicao_corporal.agua_corporal}%</p>}
                </div>
              </div>
            </>
          ) : (
            // Completa
            <>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🏥 1. Histórico Clínico</div>
                <div>
                  <p><strong>🩸 Doenças Preexistentes:</strong><br/>{formatarValor(anamnese?.historico_clinico?.doencas_preexistentes)}</p>
                  <p><strong>💊 Medicamentos em Uso:</strong><br/>{formatarValor(anamnese?.historico_clinico?.medicamentos)}</p>
                  <p><strong>🏥 Cirurgias Prévias:</strong><br/>{formatarValor(anamnese?.historico_clinico?.cirurgias)}</p>
                  <p><strong>🩺 Histórico Familiar:</strong><br/>{formatarValor(anamnese?.historico_clinico?.historico_familiar)}</p>
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🍽️ 2. Histórico Alimentar</div>
                <div>
                  <p><strong>🍳 Hábitos Alimentares:</strong><br/>{formatarValor(anamnese?.historico_alimentar?.habitos_alimentares)}</p>
                  <p><strong>💧 Consumo de Água:</strong> {formatarValor(anamnese?.historico_alimentar?.consumo_agua)} ml/dia</p>
                  <p><strong>🚫 Restrições Alimentares:</strong><br/>{formatarValor(anamnese?.historico_alimentar?.restricoes)}</p>
                  <p><strong>❤️ Preferências Alimentares:</strong><br/>{formatarValor(anamnese?.historico_alimentar?.preferencias)}</p>
                  <p><strong>🥗 Uso de Suplementos:</strong><br/>{formatarValor(anamnese?.historico_alimentar?.suplementos)}</p>
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>📏 3. Avaliação Antropométrica</div>
                <div>
                  <p><strong>📏 Peso Atual:</strong> {formatarValor(anamnese?.antropometria?.peso_atual)} kg</p>
                  <p><strong>📐 Altura:</strong> {formatarValor(anamnese?.antropometria?.altura)} m</p>
                  <p><strong>⚖️ Peso Habitual:</strong> {formatarValor(anamnese?.antropometria?.peso_habitual)} kg</p>
                  <p><strong>🎯 Peso Desejado:</strong> {formatarValor(anamnese?.antropometria?.peso_desejado)} kg</p>
                  <p><strong>📊 IMC:</strong> {formatarValor(anamnese?.antropometria?.imc)} - {formatarValor(anamnese?.antropometria?.classificacao_imc)}</p>
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>💪 4. Composição Corporal</div>
                <div>
                  <p><strong>💪 Massa Muscular:</strong> {formatarValor(anamnese?.composicao_corporal?.massa_muscular)} kg</p>
                  <p><strong>🧈 Gordura Corporal:</strong> {formatarValor(anamnese?.composicao_corporal?.gordura_corporal)}%</p>
                  <p><strong>💧 Água Corporal:</strong> {formatarValor(anamnese?.composicao_corporal?.agua_corporal)}%</p>
                  <p><strong>🦴 Massa Óssea:</strong> {formatarValor(anamnese?.composicao_corporal?.massa_ossea)} kg</p>
                  <p><strong>🔥 Metabolismo Basal:</strong> {formatarValor(anamnese?.composicao_corporal?.metabolismo_basal)} kcal</p>
                  <p><strong>📏 Circunferência Abdominal:</strong> {formatarValor(anamnese?.composicao_corporal?.circunferencia_abdominal)} cm</p>
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🩸 5. Exames Laboratoriais</div>
                <div>
                  <p><strong>🩸 Glicemia:</strong> {formatarValor(anamnese?.exames_laboratoriais?.glicemia)} mg/dL</p>
                  <p><strong>🩸 Colesterol Total:</strong> {formatarValor(anamnese?.exames_laboratoriais?.colesterol_total)} mg/dL</p>
                  <p><strong>🩸 HDL:</strong> {formatarValor(anamnese?.exames_laboratoriais?.hdl)} mg/dL</p>
                  <p><strong>🩸 LDL:</strong> {formatarValor(anamnese?.exames_laboratoriais?.ldl)} mg/dL</p>
                  <p><strong>🩸 Triglicerídeos:</strong> {formatarValor(anamnese?.exames_laboratoriais?.triglicerideos)} mg/dL</p>
                  <p><strong>🩸 Hemoglobina Glicada:</strong> {formatarValor(anamnese?.exames_laboratoriais?.hemoglobina_glicada)}%</p>
                  <p><strong>🩸 Vitamina D:</strong> {formatarValor(anamnese?.exames_laboratoriais?.vitamina_d)} ng/mL</p>
                  <p><strong>🩸 Ferritina:</strong> {formatarValor(anamnese?.exames_laboratoriais?.ferritina)} ng/mL</p>
                </div>
              </div>
              <div className="evaluation-card" style={{ marginBottom: 16 }}>
                <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>🏃 6. Estilo de Vida</div>
                <div>
                  <p><strong>🏋️ Atividade Física:</strong><br/>{formatarValor(anamnese?.estilo_vida?.atividade_fisica)}</p>
                  <p><strong>😴 Qualidade do Sono:</strong><br/>{formatarValor(anamnese?.estilo_vida?.sono)}</p>
                  <p><strong>🚭 Hábitos:</strong><br/>{formatarValor(anamnese?.estilo_vida?.habitos)}</p>
                  <p><strong>😊 Nível de Estresse:</strong> {formatarValor(anamnese?.estilo_vida?.nivel_estresse)}</p>
                </div>
              </div>
              {anamnese?.observacoes && (
                <div className="evaluation-card" style={{ marginBottom: 16 }}>
                  <div className="evaluation-date" style={{ color: '#f97316', borderBottom: '2px solid #f97316', paddingBottom: 8, marginBottom: 12 }}>📝 7. Observações e Condutas</div>
                  <div><p>{anamnese.observacoes}</p></div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: '1rem', marginTop: 20 }}>
          <span className="empty-icon" style={{ fontSize: 48, opacity: 0.5 }}>📋</span>
          <h3 style={{ marginTop: 16 }}>Nenhuma anamnese disponível</h3>
          <p style={{ color: '#64748b' }}>Seu nutricionista ainda não cadastrou sua anamnese.</p>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Entre em contato com seu profissional para realizar sua avaliação nutricional.</p>
        </div>
      )}
    </>
  );
}