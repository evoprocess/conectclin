import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, uploadParaImgbb } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { carregarModeloIA, analisarImagemComIA, isModeloCarregado } from '../../services/iaService';

export default function ShoppingNutriCliente() {
  const { user } = useAuth();

  // Estados de pontuação
  const [userPontos, setUserPontos] = useState(0);
  const [userNivel, setUserNivel] = useState(1);
  const [userExperiencia, setUserExperiencia] = useState(0);
  const [xpProxNivel, setXpProxNivel] = useState(100);

  // Loja e histórico
  const [itensLoja, setItensLoja] = useState([]);
  const [historico, setHistorico] = useState([]);

  // Desafios
  const [desafiosSimples, setDesafiosSimples] = useState([]);
  const [desafiosFoto, setDesafiosFoto] = useState([]);
  const [participacoesDesafios, setParticipacoesDesafios] = useState({});

  // Roleta
  const [roletaDisponivel, setRoletaDisponivel] = useState(true);
  const [roletaPremios, setRoletaPremios] = useState([5, 10, 15, 20, 25, 50, 100]);
  const [girando, setGirando] = useState(false);
  const canvasRoletaRef = useRef(null);
  const anguloRef = useRef(0);
  const animFrameRef = useRef(null);

  // Câmera e IA
  const [showCamera, setShowCamera] = useState(false);
  const [desafioSelecionado, setDesafioSelecionado] = useState(null);
  const [fotoTemp, setFotoTemp] = useState(null);
  const [analiseIA, setAnaliseIA] = useState(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Modals
  const [showResultadoRoleta, setShowResultadoRoleta] = useState(false);
  const [resultadoPremio, setResultadoPremio] = useState(0);
  const [showTrocaModal, setShowTrocaModal] = useState(false);
  const [itemTroca, setItemTroca] = useState(null);

  // ==================== CARREGAMENTO DE DADOS ====================
  const carregarDadosUsuario = async () => {
    try {
      const userRef = doc(db, 'pontuacao_usuarios', user.login);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const d = snap.data();
        setUserPontos(d.pontos || 0);
        setUserNivel(d.nivel || 1);
        setUserExperiencia(d.experiencia || 0);
        setXpProxNivel((d.nivel || 1) * 100);
      } else {
        await setDoc(userRef, {
          login: user.login,
          nome: user.nome,
          pontos: 0,
          nivel: 1,
          experiencia: 0,
          data_criacao: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    }
  };

  const carregarItensLoja = async () => {
    try {
      const snap = await getDocs(collection(db, 'itens_recompensa'));
      const itens = [];
      snap.forEach(doc => itens.push({ id: doc.id, ...doc.data() }));
      setItensLoja(itens.filter(i => i.ativo !== false));
    } catch (err) {
      console.error(err);
    }
  };

  const carregarHistorico = async () => {
    try {
      const q = query(collection(db, 'transacoes_pontos'), where('usuario_login', '==', user.login));
      const snap = await getDocs(q);
      const trans = [];
      snap.forEach(doc => trans.push({ id: doc.id, ...doc.data() }));
      trans.sort((a, b) => new Date(b.data) - new Date(a.data));
      setHistorico(trans);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarDesafios = async () => {
    try {
      const snap = await getDocs(collection(db, 'desafios_diarios'));
      const simples = [];
      const foto = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.ativo) {
          if (d.tipo === 'foto') foto.push({ id: doc.id, ...d });
          else simples.push({ id: doc.id, ...d });
        }
      });
      setDesafiosSimples(simples);
      setDesafiosFoto(foto);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarParticipacoes = async () => {
    try {
      const q = query(collection(db, 'participacoes_desafios'), where('usuario_login', '==', user.login));
      const snap = await getDocs(q);
      const parts = {};
      snap.forEach(doc => {
        const d = doc.data();
        parts[d.desafio_id] = d.quantidade || 1;
      });
      setParticipacoesDesafios(parts);
    } catch (err) {
      console.error(err);
    }
  };

  const carregarConfigRoleta = async () => {
    try {
      const snap = await getDoc(doc(db, 'config_gamificacao', 'principal'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.roleta_premios) setRoletaPremios(data.roleta_premios);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const verificarRoletaDiaria = async () => {
    try {
      const snap = await getDoc(doc(db, 'pontuacao_usuarios', user.login));
      if (snap.exists()) {
        const ultima = snap.data().ultima_roleta;
        if (ultima) {
          const hoje = new Date().toISOString().split('T')[0];
          setRoletaDisponivel(ultima.split('T')[0] !== hoje);
        } else {
          setRoletaDisponivel(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    carregarDadosUsuario();
    carregarItensLoja();
    carregarHistorico();
    carregarDesafios();
    carregarParticipacoes();
    carregarConfigRoleta();
    verificarRoletaDiaria();
  }, []);

  // ==================== ROLETA ====================
  const desenharRoleta = useCallback(() => {
    const canvas = canvasRoletaRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const raio = w / 2 - 5;
    const numSeg = roletaPremios.length;
    const angSeg = (Math.PI * 2) / numSeg;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < numSeg; i++) {
      const start = anguloRef.current + i * angSeg;
      const end = start + angSeg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, raio, start, end);
      ctx.closePath();
      ctx.fillStyle = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8C471', '#A9DFBF'][i % 12];
      ctx.fill();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + angSeg / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Segoe UI';
      ctx.fillText(roletaPremios[i], raio * 0.7, 0);
      ctx.restore();
    }
    // Centro
    ctx.beginPath();
    ctx.arc(cx, cy, raio * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#f97316';
    ctx.fill();
  }, [roletaPremios]);

  useEffect(() => {
    desenharRoleta();
  }, [desenharRoleta]);

  const girarRoleta = async () => {
    if (!roletaDisponivel || girando) return;
    setGirando(true);

    const premioIndex = Math.floor(Math.random() * roletaPremios.length);
    const premio = roletaPremios[premioIndex];
    const angSeg = (Math.PI * 2) / roletaPremios.length;
    const angAlvo = -Math.PI / 2 - premioIndex * angSeg - angSeg / 2;
    const voltas = 5 + Math.random() * 5;
    const angDestino = anguloRef.current + Math.PI * 2 * voltas + angAlvo - (anguloRef.current % (Math.PI * 2));

    const duracao = 3000;
    const inicio = performance.now();
    const angInicial = anguloRef.current;

    const animar = (agora) => {
      const progresso = Math.min(1, (agora - inicio) / duracao);
      const ease = 1 - Math.pow(1 - progresso, 3);
      anguloRef.current = angInicial + (angDestino - angInicial) * ease;
      desenharRoleta();
      if (progresso < 1) {
        animFrameRef.current = requestAnimationFrame(animar);
      } else {
        setGirando(false);
        finalizarGiro(premio);
      }
    };
    animFrameRef.current = requestAnimationFrame(animar);
  };

  const finalizarGiro = async (premio) => {
    try {
      await updateDoc(doc(db, 'pontuacao_usuarios', user.login), {
        ultima_roleta: new Date().toISOString(),
        pontos: userPontos + premio,
        experiencia: userExperiencia + premio,
      });
      await adicionarTransacao(premio, `🎡 Roleta - Ganhou ${premio} pontos`, 'ganho');
      setUserPontos(prev => prev + premio);
      setUserExperiencia(prev => prev + premio);
      setRoletaDisponivel(false);
      setResultadoPremio(premio);
      setShowResultadoRoleta(true);
      verificarNivel();
    } catch (error) {
      console.error('Erro ao finalizar giro:', error);
    }
  };

  // ==================== DESAFIOS SIMPLES ====================
  const completarDesafioSimples = async (desafio) => {
    try {
      // Verificar se já completou hoje
      const hoje = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'desafios_completados'),
        where('usuario_login', '==', user.login),
        where('desafio_id', '==', desafio.id),
        where('data_completado', '>=', hoje)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert('Você já completou este desafio hoje!');
        return;
      }
      await addDoc(collection(db, 'desafios_completados'), {
        usuario_login: user.login,
        usuario_nome: user.nome,
        desafio_id: desafio.id,
        desafio_titulo: desafio.titulo,
        pontos_ganhos: desafio.pontos,
        data_completado: new Date().toISOString(),
      });
      await adicionarPontos(desafio.pontos, `⭐ Desafio: ${desafio.titulo}`, 'ganho');
      alert(`🎉 Desafio completado! +${desafio.pontos} pontos`);
      atualizarListaDesafios();
    } catch (err) {
      console.error(err);
    }
  };

  const atualizarListaDesafios = () => {
    setDesafiosSimples(prev => prev.map(d => d.id === desafio?.id ? { ...d, completado: true } : d));
  };

  // ==================== CÂMERA E IA ====================
  const abrirCamera = async (desafio) => {
    setDesafioSelecionado(desafio);
    setShowCamera(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setAnaliseIA(null);
      setFotoTemp(null);
    } catch (err) {
      alert('Erro ao acessar câmera: ' + err.message);
      setShowCamera(false);
    }
  };

  const fecharCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setDesafioSelecionado(null);
  };

  const tirarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setFotoTemp(dataUrl);
    setShowCamera(false);
    analisarFoto(dataUrl);
  };

  const analisarFoto = async (dataUrl) => {
    setLoadingIA(true);
    try {
      if (!isModeloCarregado()) {
        await carregarModeloIA((progress, msg) => console.log(progress, msg));
      }
      const resultado = await analisarImagemComIA(dataUrl, desafioSelecionado.categoria);
      setAnaliseIA(resultado);
    } catch (err) {
      setAnaliseIA({ aprovado: false, mensagem: 'Erro na análise. Foto será enviada para avaliação manual.' });
    } finally {
      setLoadingIA(false);
    }
  };

  const enviarFoto = async () => {
    if (!fotoTemp || !desafioSelecionado) return;
    const status = analiseIA?.aprovado ? 'aprovado_ia' : 'pendente_manual';
    let imagemUrl = '';
    try {
      const uploadResult = await uploadParaImgbb(fotoTemp);
      if (uploadResult.success) imagemUrl = uploadResult.url;
    } catch (e) {
      console.warn('Upload ImgBB falhou, armazenando base64');
      imagemUrl = fotoTemp; // fallback
    }

    await addDoc(collection(db, 'fotos_desafio'), {
      usuario_login: user.login,
      usuario_nome: user.nome,
      desafio_id: desafioSelecionado.id,
      desafio_titulo: desafioSelecionado.titulo,
      foto_base64: imagemUrl,
      status,
      analise_ia: analiseIA,
      data_envio: new Date().toISOString(),
    });

    // Registrar participação
    const q = query(collection(db, 'participacoes_desafios'), where('usuario_login', '==', user.login), where('desafio_id', '==', desafioSelecionado.id));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const ref = doc(db, 'participacoes_desafios', snap.docs[0].id);
      const newQty = (participacoesDesafios[desafioSelecionado.id] || 0) + 1;
      await updateDoc(ref, { quantidade: newQty });
      setParticipacoesDesafios(prev => ({ ...prev, [desafioSelecionado.id]: newQty }));
    } else {
      await addDoc(collection(db, 'participacoes_desafios'), {
        usuario_login: user.login,
        usuario_nome: user.nome,
        desafio_id: desafioSelecionado.id,
        quantidade: 1,
        ultima_participacao: new Date().toISOString(),
      });
      setParticipacoesDesafios(prev => ({ ...prev, [desafioSelecionado.id]: 1 }));
    }

    if (status === 'aprovado_ia') {
      await adicionarPontos(desafioSelecionado.pontos, `📸 Desafio: ${desafioSelecionado.titulo} (IA)`, 'ganho');
      alert(`✅ Parabéns! +${desafioSelecionado.pontos} pontos!`);
    } else {
      alert('📸 Foto enviada para análise do nutricionista.');
    }
    setFotoTemp(null);
    setAnaliseIA(null);
    fecharCamera();
  };

  // ==================== PONTOS E TROCA ====================
  const adicionarPontos = async (pontos, descricao, tipo) => {
    const novoPontos = userPontos + pontos;
    const novaExp = userExperiencia + pontos;
    await updateDoc(doc(db, 'pontuacao_usuarios', user.login), {
      pontos: novoPontos,
      experiencia: novaExp,
      ultima_atualizacao: new Date().toISOString(),
    });
    await adicionarTransacao(pontos, descricao, tipo);
    setUserPontos(novoPontos);
    setUserExperiencia(novaExp);
    verificarNivel();
  };

  const adicionarTransacao = async (pontos, descricao, tipo) => {
    await addDoc(collection(db, 'transacoes_pontos'), {
      usuario_login: user.login,
      usuario_nome: user.nome,
      pontos,
      descricao,
      tipo,
      data: new Date().toISOString(),
      saldo_apos: userPontos + pontos,
    });
    carregarHistorico();
  };

  const verificarNivel = () => {
    const xpNecessario = (userNivel + 1) * 100;
    if (userExperiencia >= xpNecessario) {
      const novoNivel = userNivel + 1;
      setUserNivel(novoNivel);
      setUserExperiencia(0);
      updateDoc(doc(db, 'pontuacao_usuarios', user.login), { nivel: novoNivel, experiencia: 0 });
    }
  };

  const abrirTroca = (item) => {
    setItemTroca(item);
    setShowTrocaModal(true);
  };

  const confirmarTroca = async () => {
    if (!itemTroca || userPontos < itemTroca.pontos) return;
    try {
      await updateDoc(doc(db, 'pontuacao_usuarios', user.login), {
        pontos: userPontos - itemTroca.pontos,
      });
      await addDoc(collection(db, 'resgates_realizados'), {
        usuario_login: user.login,
        usuario_nome: user.nome,
        item_id: itemTroca.id,
        item_nome: itemTroca.nome,
        pontos_gastos: itemTroca.pontos,
        status: 'pendente',
        data_resgate: new Date().toISOString(),
      });
      await adicionarTransacao(-itemTroca.pontos, `🛍️ Troca: ${itemTroca.nome}`, 'gasto');
      setUserPontos(prev => prev - itemTroca.pontos);
      alert(`✅ Resgate realizado!`);
      setShowTrocaModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const xpProgresso = userNivel > 0 ? (userExperiencia / xpProxNivel) * 100 : 0;

  return (
    <>
      {/* Card Pontos */}
      <div className="client-info" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', marginBottom: 20 }}>
        <h3>⭐ MEUS PONTOS</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 'bold' }}>{userPontos}</div>
          <div style={{ textAlign: 'center' }}>
            <div>🏆 NÍVEL</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{userNivel}</div>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 12 }}>📈 Próximo nível: {userNivel + 1}</div>
            <div style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 10, height: 6, marginTop: 5 }}>
              <div style={{ background: 'white', width: `${xpProgresso}%`, height: '100%', borderRadius: 10 }}></div>
            </div>
            <div style={{ fontSize: 11, marginTop: 5 }}>{userExperiencia}/{xpProxNivel} XP</div>
          </div>
        </div>
      </div>

      {/* Roleta */}
      <div className="client-info" style={{ marginBottom: 20, textAlign: 'center' }}>
        <h3>🎡 Roleta da Sorte</h3>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <canvas ref={canvasRoletaRef} width="280" height="280" style={{ maxWidth: '100%', borderRadius: '50%', background: 'white' }}></canvas>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '25px solid #f97316' }}></div>
          <button
            onClick={girarRoleta}
            disabled={!roletaDisponivel || girando}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 55, height: 55, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: 'white', border: 'none', fontSize: 12, fontWeight: 'bold', cursor: 'pointer',
              opacity: roletaDisponivel ? 1 : 0.5
            }}
          >
            {girando ? '...' : roletaDisponivel ? 'GIRAR' : '✓'}
          </button>
        </div>
        {!roletaDisponivel && <p style={{ marginTop: 12, fontSize: 11, color: '#10b981' }}>✅ Você já girou hoje!</p>}
      </div>

      {/* Desafios com foto */}
      <div className="client-info" style={{ marginBottom: 20 }}>
        <h3>📸 Desafios com Foto</h3>
        {desafiosFoto.map(d => (
          <div key={d.id} className="evaluation-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 40 }}>📸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{d.titulo}</div>
                <div style={{ fontSize: 12 }}>{d.descricao}</div>
                <div>⭐ +{d.pontos} pontos</div>
              </div>
              <button
                onClick={() => abrirCamera(d)}
                style={{ background: 'white', color: '#7c3aed', border: 'none', padding: '8px 16px', borderRadius: 30, fontWeight: 'bold', cursor: 'pointer' }}
              >
                📷 Participar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desafios Simples */}
      <div className="client-info" style={{ marginBottom: 20 }}>
        <h3>⭐ Desafios Diários</h3>
        {desafiosSimples.map(d => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <span>{d.icone || '🎯'}</span> <strong>{d.titulo}</strong>
              <div style={{ fontSize: 11 }}>{d.descricao}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f97316', fontWeight: 'bold' }}>+{d.pontos}</div>
              <button
                onClick={() => completarDesafioSimples(d)}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 20, fontSize: 11, marginTop: 5, cursor: 'pointer' }}
              >
                Completar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Loja */}
      <div className="client-info" style={{ marginBottom: 20 }}>
        <h3>🛍️ Trocar Pontos</h3>
        {itensLoja.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 28 }}>{item.icone || '🎁'}</div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
                <div style={{ fontSize: 11 }}>{item.descricao}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#f97316', fontWeight: 'bold' }}>{item.pontos} pts</div>
              <button
                onClick={() => abrirTroca(item)}
                disabled={userPontos < item.pontos}
                style={{ background: userPontos >= item.pontos ? '#f97316' : '#6b7280', color: 'white', border: 'none', padding: '4px 12px', borderRadius: 20, fontSize: 11, marginTop: 4, cursor: userPontos >= item.pontos ? 'pointer' : 'not-allowed' }}
              >
                {userPontos >= item.pontos ? 'Trocar' : '🔒'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="client-info">
        <h3>📜 Histórico</h3>
        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
          {historico.slice(0, 8).map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 12 }}>
              <div>
                <span>{t.tipo === 'ganho' ? '➕' : '➖'}</span>
                <span style={{ marginLeft: 5 }}>{t.descricao?.substring(0, 35)}</span>
                <div style={{ fontSize: 10 }}>{new Date(t.data).toLocaleString('pt-BR')}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: t.tipo === 'ganho' ? '#10b981' : '#f97316' }}>
                {t.tipo === 'ganho' ? '+' : '-'} {t.pontos}
              </div>
            </div>
          ))}
          {historico.length === 0 && <p style={{ textAlign: 'center', padding: 20 }}>Nenhuma transação.</p>}
        </div>
      </div>

      {/* Modal Câmera */}
      {showCamera && (
        <div className="modal" style={{ display: 'flex' }} onClick={fecharCamera}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <span className="close" onClick={fecharCamera}>&times;</span>
            <h3>📸 Tirar Foto</h3>
            <p>{desafioSelecionado?.descricao}</p>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 15 }}>
              <button onClick={tirarFoto} style={{ background: '#f97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer' }}>📷 Tirar Foto</button>
              <button onClick={fecharCamera} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Pré-visualização com IA */}
      {fotoTemp && analiseIA && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => { setFotoTemp(null); setAnaliseIA(null); }}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => { setFotoTemp(null); setAnaliseIA(null); }}>&times;</span>
            <h3>Pré-visualização</h3>
            <img src={fotoTemp} style={{ width: '100%', borderRadius: 12 }} alt="foto" />
            <div style={{ background: analiseIA.aprovado ? '#d1fae5' : '#fed7aa', padding: 10, borderRadius: 10, marginTop: 10 }}>
              <strong>{analiseIA.aprovado ? '🟢 Aprovado pela IA' : '🟡 Pendente'}</strong>
              <p>{analiseIA.mensagem}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 15 }}>
              <button onClick={() => { setFotoTemp(null); setAnaliseIA(null); abrirCamera(desafioSelecionado); }} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 30, cursor: 'pointer' }}>📷 Refazer</button>
              <button onClick={enviarFoto} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 30, cursor: 'pointer' }}>✅ Enviar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultado Roleta */}
      {showResultadoRoleta && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowResultadoRoleta(false)}>
          <div className="modal-content" style={{ maxWidth: 300, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setShowResultadoRoleta(false)}>&times;</span>
            <div style={{ fontSize: 64 }}>🎉</div>
            <h3>Parabéns!</h3>
            <p>Você ganhou <strong>{resultadoPremio} pontos</strong>!</p>
            <button onClick={() => setShowResultadoRoleta(false)} style={{ background: '#f97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 30, cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}

      {/* Modal Troca */}
      {showTrocaModal && itemTroca && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowTrocaModal(false)}>
          <div className="modal-content" style={{ maxWidth: 350 }} onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setShowTrocaModal(false)}>&times;</span>
            <h3>Confirmar Troca</h3>
            <p>Deseja trocar <strong>{itemTroca.pontos} pontos</strong> por <strong>{itemTroca.nome}</strong>?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTrocaModal(false)} style={{ background: '#6b7280', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 30, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarTroca} style={{ background: '#f97316', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 30, cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}