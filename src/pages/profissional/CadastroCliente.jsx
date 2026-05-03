import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import DatePicker from '../../components/DatePicker';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CadastroCliente() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingLogin, setEditingLogin] = useState(null);
  const [form, setForm] = useState({
    nome: '', login: '', dataNascimento: '', sexo: '',
    telefone: '', whatsapp: '', email: '', endereco: ''
  });
  const [detalhes, setDetalhes] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const toast = useToast();
  const gerarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();
  const gerarEmail = (login) => `${login.toLowerCase()}@tratamentoweb.com`;
  const podeCadastrar = user.perfil === 'gerente';
  const confirm = useConfirm();

  const carregarClientes = async () => {
    try {
      const profRef = doc(db, 'logins', user.login);
      const profDoc = await getDoc(profRef);
      if (!profDoc.exists()) return;
      const pacientesMap = profDoc.data().pacientes || {};
      const lista = [];
      for (const [login, nome] of Object.entries(pacientesMap)) {
        const pacRef = doc(db, 'logins', login);
        const pacDoc = await getDoc(pacRef);
        if (pacDoc.exists()) {
          lista.push({ login, ...pacDoc.data() });
        } else {
          lista.push({ login, nome, cargo: 'paciente', status_ativo: true });
        }
      }
      setClientes(lista);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const abrirModalNovo = () => {
    setForm({ nome: '', login: '', dataNascimento: '', sexo: '', telefone: '', whatsapp: '', email: '', endereco: '' });
    setEditing(false);
    setEditingLogin(null);
    setShowModal(true);
  };

  const abrirModalEdicao = (cliente) => {
    setForm({
      nome: cliente.nome || '',
      login: cliente.login || '',
      dataNascimento: cliente.dataNascimento || '',
      sexo: cliente.sexo || '',
      telefone: cliente.telefone || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
    });
    setEditing(true);
    setEditingLogin(cliente.login);
    setShowModal(true);
  };

  const salvarCliente = async (e) => {
    e.preventDefault();
    const { nome, login, dataNascimento, sexo } = form;
    if (!nome || !login || !dataNascimento || !sexo) return toast.warning('Preencha todos os campos obrigatórios!');
    if (login.includes(' ')) return toast.error('O login não pode conter espaços.');

    const idade = Math.floor((new Date() - new Date(dataNascimento)) / (365.25 * 24 * 60 * 60 * 1000));
    if (idade < 18) return toast.error('Paciente deve ter 18 anos ou mais.');

    try {
      if (editing) {
        await updateDoc(doc(db, 'logins', editingLogin), {
          nome: nome.toUpperCase(),
          dataNascimento,
          sexo,
          telefone: form.telefone,
          whatsapp: form.whatsapp,
          email: form.email,
          endereco: form.endereco,
        });
        toast.success('Cliente atualizado!');
      } else {
        const jaExiste = clientes.some(c => c.login === login);
        if (jaExiste) return toast.error('Login já existe!');
        const codigoTemp = gerarCodigo();
        const expiracao = new Date();
        expiracao.setDate(expiracao.getDate() + 7);

        await setDoc(doc(db, 'logins', login), {
          nome: nome.toUpperCase(),
          email: gerarEmail(login),
          dataNascimento,
          sexo,
          cargo: 'paciente',
          perfil: 'operador',
          status_ativo: true,
          dataHoraCadastro: new Date().toLocaleString('pt-BR'),
          codigo_temporario: codigoTemp,
          codigo_expiracao: expiracao.toISOString(),
          telefone: form.telefone,
          whatsapp: form.whatsapp,
          endereco: form.endereco,
        });

        // Vincular ao profissional
        const profRef = doc(db, 'logins', user.login);
        const profDoc = await getDoc(profRef);
        const pacientes = profDoc.exists() ? (profDoc.data().pacientes || {}) : {};
        pacientes[login] = nome.toUpperCase();
        await setDoc(profRef, { pacientes }, { merge: true });

        toast.success(`✅ Cliente "${nome}" cadastrado! Código: ${codigoTemp}`);
      }
      setShowModal(false);
      carregarClientes();
    } catch (err) {
      toast.error('Erro: ' + err.message);
    }
  };

  const verDetalhes = (cliente) => setDetalhes(cliente);
  const verCodigo = async (login) => {
    const pacDoc = await getDoc(doc(db, 'logins', login));
    if (!pacDoc.exists()) return toast.error('Paciente não encontrado.');
    const data = pacDoc.data();
    if (data.ultimo_login) return toast.warning('Paciente já fez primeiro acesso.');
    const exp = new Date(data.codigo_expiracao);
    if (exp < new Date()) return toast.error('Código expirado!');
    setCodigo({ nome: data.nome, login, codigo: data.codigo_temporario, expiracao: exp.toLocaleString('pt-BR') });
  };

  const resetarSenha = async (login) => {
  const result = await confirm('Gerar token de reset de senha para este paciente?');
    if (!result) return;
    const token = gerarCodigo();
    const exp = new Date();
    exp.setHours(exp.getHours() + 1);
    await updateDoc(doc(db, 'logins', login), {
      reset_token: token,
      reset_token_expiracao: exp.toISOString(),
    });
    toast.success(`Token: ${token}\nVálido por 1 hora`);
  };

  const suspender = async (login) => {
    const result = await confirm('Suspender cliente?');
    if (!result) return;
    await updateDoc(doc(db, 'logins', login), { status_ativo: false });
    carregarClientes();
  };

  const ativar = async (login) => {
    const result = await confirm('Reativar cliente?');
    if (!result) return;
    await updateDoc(doc(db, 'logins', login), { status_ativo: true });
    carregarClientes();
  };

  const desvincular = async (login) => {
  const result = await confirm('Tem certeza que deseja DESVINCULAR este paciente?');
  if (!result) return;
    const profRef = doc(db, 'logins', user.login);
    const profDoc = await getDoc(profRef);
    const pacientes = profDoc.data()?.pacientes || {};
    delete pacientes[login];
    await setDoc(profRef, { pacientes }, { merge: true });
    carregarClientes();
  };

  // Filtrar
  let listaFiltrada = [...clientes];
  if (search) {
    const term = search.toLowerCase();
    listaFiltrada = clientes.filter(c =>
      c.nome?.toLowerCase().includes(term) ||
      c.login?.toLowerCase().includes(term) ||
      c.telefone?.includes(term) ||
      c.whatsapp?.includes(term)
    );
  }
  if (filtro === 'ativos') listaFiltrada = listaFiltrada.filter(c => c.status_ativo !== false);
  if (filtro === 'inativos') listaFiltrada = listaFiltrada.filter(c => c.status_ativo === false);

  const formatarData = (d) => d ? d.split('-').reverse().join('/') : '--';
  const calcularIdade = (d) => d ? Math.floor((new Date() - new Date(d)) / (365.25 * 24 * 60 * 60 * 1000)) : '--';

  return (
    <>
      <div className="content-header">
        <div className="header-title">
          <h3>👥 Cadastro de Clientes / Pacientes</h3>
          <p>Gerencie todos os clientes cadastrados no sistema</p>
        </div>
        {podeCadastrar ? (
          <button className="btn-primary" onClick={abrirModalNovo}>
            Novo cliente
          </button>
        ) : (
          <button className="btn-secondary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <span>🔒</span> Apenas Gerentes podem cadastrar
          </button>
        )}
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome, login ou telefone..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          {['todos', 'ativos', 'inativos'].map(f => (
            <button key={f} className={`filter-btn ${filtro === f ? 'active' : ''}`} onClick={() => setFiltro(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="clientes-container">
        <div className="clientes-table-container">
          <table className="clientes-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Login</th>
                <th>Contato</th>
                <th>Data Nasc.</th>
                <th>Idade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center empty-state">
                    <span className="empty-icon">👥</span>
                    <p>Nenhum cliente encontrado</p>
                  </td>
                </tr>
              ) : (
                listaFiltrada.map(c => (
                  <tr key={c.login}>
                    <td>{c.nome}</td>
                    <td>{c.login}</td>
                    <td>{c.telefone || c.whatsapp || '--'}</td>
                    <td>{formatarData(c.dataNascimento)}</td>
                    <td>{calcularIdade(c.dataNascimento)}</td>
                    <td>
                      <span className={`status-badge ${c.status_ativo !== false ? 'active' : 'inactive'}`}>
                        {c.status_ativo !== false ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="actions">
                      <button className="btn-icon" title="Ver Detalhes" onClick={() => verDetalhes(c)}>👁️</button>
                      <button className="btn-icon" title="Editar" onClick={() => abrirModalEdicao(c)}>✏️</button>
                      <button className="btn-icon" title="Desvincular" style={{ color: '#dc2626' }} onClick={() => desvincular(c.login)}>🔗❌</button>
                      {c.ultimo_login ? (
                        <button className="btn-icon" title="Resetar Senha" onClick={() => resetarSenha(c.login)}>🔑</button>
                      ) : (
                        <button className="btn-icon" title="Código de Acesso" onClick={() => verCodigo(c.login)}>📱</button>
                      )}
                      {c.status_ativo !== false ? (
                        <button className="btn-icon" title="Suspender" onClick={() => suspender(c.login)}>⏸️</button>
                      ) : (
                        <button className="btn-icon" title="Ativar" onClick={() => ativar(c.login)}>▶️</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setShowModal(false)}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? '✏️ Editar Cliente' : '📝 Cadastrar Cliente'}</h3>
              <button className="close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={salvarCliente}>
              <div className="form-section">
                <h4>📋 Dados Pessoais</h4>
                <div className="form-row">
                  <div className="form-field">
                    <label>👤 Nome Completo *</label>
                    <input type="text" required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>🔑 Login *</label>
                    <input type="text" required disabled={editing} value={form.login} onChange={e => setForm({...form, login: e.target.value})} />
                    {!editing && <small>Único e não pode ser alterado</small>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>📅 Data de Nascimento *</label>
                    <DatePicker required value={form.dataNascimento} onChange={(dateStr) => setForm({ ...form, dataNascimento: dateStr })} maxDate={new Date()} />
                  </div>
                  <div className="form-field">
                    <label>⚥ Sexo</label>
                    <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})}>
                      <option value="">Selecione</option>
                      <option value="feminino">Feminino</option>
                      <option value="masculino">Masculino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h4>📱 Contato</h4>
                <div className="form-row">
                  <div className="form-field">
                    <label>📱 Telefone</label>
                    <input type="text" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>💬 WhatsApp</label>
                    <input type="text" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>📧 E-mail</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>📍 Endereço</label>
                    <input type="text" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">💾 Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes */}
      {detalhes && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setDetalhes(null)}>
          <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Detalhes do Cliente</h3>
              <button className="close-modal" onClick={() => setDetalhes(null)}>&times;</button>
            </div>
            <div className="detalhes-cliente">
              <div className="detalhes-header">
                <div className="detalhes-avatar">👤</div>
                <div className="detalhes-nome">
                  <h2>{detalhes.nome}</h2>
                  <p>{detalhes.login}</p>
                </div>
              </div>
              <div className="detalhes-info">
                <div className="info-row"><span className="info-label">📅 Data Nasc.:</span><span>{formatarData(detalhes.dataNascimento)}</span></div>
                <div className="info-row"><span className="info-label">🎂 Idade:</span><span>{calcularIdade(detalhes.dataNascimento)} anos</span></div>
                <div className="info-row"><span className="info-label">⚥ Sexo:</span><span>{detalhes.sexo || 'N/I'}</span></div>
                <div className="info-row"><span className="info-label">📱 Telefone:</span><span>{detalhes.telefone || 'N/I'}</span></div>
                <div className="info-row"><span className="info-label">💬 WhatsApp:</span><span>{detalhes.whatsapp || 'N/I'}</span></div>
                <div className="info-row"><span className="info-label">📧 E-mail:</span><span>{detalhes.email || 'N/I'}</span></div>
                <div className="info-row"><span className="info-label">📍 Endereço:</span><span>{detalhes.endereco || 'N/I'}</span></div>
                <div className="info-row"><span className="info-label">📊 Status:</span><span className={`status-badge ${detalhes.status_ativo !== false ? 'active' : 'inactive'}`}>{detalhes.status_ativo !== false ? 'Ativo' : 'Inativo'}</span></div>
                <div className="info-row"><span className="info-label">📅 Cadastro:</span><span>{detalhes.dataHoraCadastro || 'N/I'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Código de Acesso */}
      {codigo && (
        <div className="modal" style={{ display: 'flex' }} onClick={() => setCodigo(null)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Código de Acesso</h3>
              <button className="close-modal" onClick={() => setCodigo(null)}>&times;</button>
            </div>
            <div className="codigo-content">
              <p><strong>👤 Cliente:</strong> {codigo.nome}</p>
              <p><strong>🔑 Login:</strong> {codigo.login}</p>
              <div className="codigo-display">
                <span className="codigo-label">📱 CÓDIGO DE ACESSO</span>
                <div className="codigo-value">{codigo.codigo}</div>
              </div>
              <p>⏰ Expira em: {codigo.expiracao}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}