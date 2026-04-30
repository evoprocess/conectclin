import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, addDoc, setDoc } from 'firebase/firestore';

export default function ShoppingNutriNutricionista() {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [fotosPendentes, setFotosPendentes] = useState([]);
  const [historicoDesafios, setHistoricoDesafios] = useState([]);
  const [itensLoja, setItensLoja] = useState([]);
  const [showNovoItem, setShowNovoItem] = useState(false);
  const [novoItem, setNovoItem] = useState({ nome: '', descricao: '', pontos: 0, icone: '🎁' });
  const [editandoItem, setEditandoItem] = useState(null);

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

  // Carregar fotos pendentes do paciente selecionado
  useEffect(() => {
    if (!selectedPaciente) {
      setFotosPendentes([]);
      setHistoricoDesafios([]);
      return;
    }
    const loadFotos = async () => {
      const q = query(collection(db, 'fotos_desafio'), where('usuario_login', '==', selectedPaciente.login), where('status', 'in', ['pendente_manual', 'pendente']));
      const snap = await getDocs(q);
      const fotos = [];
      snap.forEach(doc => fotos.push({ id: doc.id, ...doc.data() }));
      setFotosPendentes(fotos);
    };
    const loadHistorico = async () => {
      const q = query(collection(db, 'fotos_desafio'), where('usuario_login', '==', selectedPaciente.login));
      const snap = await getDocs(q);
      const hist = [];
      snap.forEach(doc => hist.push({ id: doc.id, ...doc.data() }));
      hist.sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio));
      setHistoricoDesafios(hist);
    };
    loadFotos();
    loadHistorico();
  }, [selectedPaciente]);

  // Carregar itens da loja
  const carregarItensLoja = async () => {
    const snap = await getDocs(collection(db, 'itens_recompensa'));
    const itens = [];
    snap.forEach(doc => itens.push({ id: doc.id, ...doc.data() }));
    setItensLoja(itens);
  };

  useEffect(() => {
    carregarItensLoja();
  }, []);

  const aprovarFoto = async (fotoId, pontos) => {
    if (!confirm('Aprovar foto e creditar pontos?')) return;
    try {
      await updateDoc(doc(db, 'fotos_desafio', fotoId), { status: 'aprovado_manual' });
      // Adicionar pontos ao paciente
      const userRef = doc(db, 'pontuacao_usuarios', selectedPaciente.login);
      const snap = await getDoc(userRef);
      const dados = snap.exists() ? snap.data() : { pontos: 0, experiencia: 0, nivel: 1 };
      const novosPontos = (dados.pontos || 0) + pontos;
      const novaExp = (dados.experiencia || 0) + pontos;
      await setDoc(userRef, {
        login: selectedPaciente.login,
        nome: selectedPaciente.nome,
        pontos: novosPontos,
        experiencia: novaExp,
        nivel: dados.nivel || 1,
        ultima_atualizacao: new Date().toISOString()
      }, { merge: true });
      // Registrar transação
      await addDoc(collection(db, 'transacoes_pontos'), {
        usuario_login: selectedPaciente.login,
        usuario_nome: selectedPaciente.nome,
        pontos,
        descricao: `📸 Desafio aprovado por nutricionista`,
        tipo: 'ganho',
        data: new Date().toISOString(),
        saldo_apos: novosPontos
      });
      alert(`✅ Foto aprovada! +${pontos} pontos para o paciente.`);
      setFotosPendentes(prev => prev.filter(f => f.id !== fotoId));
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const reprovarFoto = async (fotoId) => {
    if (!confirm('Reprovar foto?')) return;
    await updateDoc(doc(db, 'fotos_desafio', fotoId), { status: 'reprovado' });
    setFotosPendentes(prev => prev.filter(f => f.id !== fotoId));
    alert('Foto reprovada.');
  };

  const salvarItem = async (e) => {
    e.preventDefault();
    if (!novoItem.nome || !novoItem.pontos) return alert('Preencha nome e pontos!');
    try {
      if (editandoItem) {
        await updateDoc(doc(db, 'itens_recompensa', editandoItem), novoItem);
      } else {
        await addDoc(collection(db, 'itens_recompensa'), { ...novoItem, ativo: true });
      }
      setShowNovoItem(false);
      setNovoItem({ nome: '', descricao: '', pontos: 0, icone: '🎁' });
      setEditandoItem(null);
      carregarItensLoja();
      alert('Item salvo!');
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  };

  const editarItem = (item) => {
    setEditandoItem(item.id);
    setNovoItem({ nome: item.nome, descricao: item.descricao, pontos: item.pontos, icone: item.icone || '🎁' });
    setShowNovoItem(true);
  };

  const toggleAtivoItem = async (item) => {
    await updateDoc(doc(db, 'itens_recompensa', item.id), { ativo: !item.ativo });
    carregarItensLoja();
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
      </div>

      {selectedPaciente && (
        <>
          {/* Fotos Pendentes */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>📸 Fotos Pendentes de Análise</h3>
            </div>
            {fotosPendentes.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Nenhuma foto pendente.</p>
            ) : (
              fotosPendentes.map(foto => (
                <div key={foto.id} className="evaluation-card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <img src={foto.foto_base64} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12 }} alt="foto" />
                    <div style={{ flex: 1 }}>
                      <p><strong>Desafio:</strong> {foto.desafio_titulo}</p>
                      <p><strong>Data:</strong> {new Date(foto.data_envio).toLocaleString('pt-BR')}</p>
                      <p><strong>IA:</strong> {foto.analise_ia?.mensagem || 'Não analisada'}</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button className="btn-primary" onClick={() => aprovarFoto(foto.id, 50)}>✅ Aprovar (+50 pts)</button>
                        <button className="btn-secondary" onClick={() => reprovarFoto(foto.id)}>❌ Reprovar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Histórico de Desafios */}
          <div className="evaluation-section" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <h3>📜 Histórico de Participações</h3>
            </div>
            {historicoDesafios.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Nenhuma participação.</p>
            ) : (
              historicoDesafios.map(foto => (
                <div key={foto.id} className="evaluation-card" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <img src={foto.foto_base64} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} alt="foto" />
                    <div>
                      <p><strong>{foto.desafio_titulo}</strong></p>
                      <p style={{ fontSize: 12 }}>{new Date(foto.data_envio).toLocaleString('pt-BR')} • Status: {foto.status}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Gerenciamento da Loja */}
      <div className="evaluation-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>🛍️ Itens da Loja</h3>
          <button className="btn-primary" onClick={() => { setEditandoItem(null); setNovoItem({ nome: '', descricao: '', pontos: 0, icone: '🎁' }); setShowNovoItem(true); }}>
            Novo Item
          </button>
        </div>
        {itensLoja.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>Nenhum item cadastrado.</p>
        ) : (
          itensLoja.map(item => (
            <div key={item.id} className="evaluation-card" style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 24, marginRight: 12 }}>{item.icone || '🎁'}</span>
                <strong>{item.nome}</strong> - {item.pontos} pts
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.descricao}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-icon" onClick={() => editarItem(item)}>✏️</button>
                <button className="btn-icon" onClick={() => toggleAtivoItem(item)}>
                  {item.ativo ? '👁️' : '❌'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Novo/Editar Item */}
      {showNovoItem && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowNovoItem(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setShowNovoItem(false)}>&times;</span>
            <h3>{editandoItem ? 'Editar Item' : 'Novo Item'}</h3>
            <form onSubmit={salvarItem}>
              <div className="form-field">
                <label>Ícone</label>
                <input type="text" value={novoItem.icone} onChange={e => setNovoItem({ ...novoItem, icone: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Nome</label>
                <input type="text" required value={novoItem.nome} onChange={e => setNovoItem({ ...novoItem, nome: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Descrição</label>
                <input type="text" value={novoItem.descricao} onChange={e => setNovoItem({ ...novoItem, descricao: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Pontos</label>
                <input type="number" required value={novoItem.pontos} onChange={e => setNovoItem({ ...novoItem, pontos: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNovoItem(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">💾 Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}