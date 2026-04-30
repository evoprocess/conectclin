## 📘 Documentação do TratamentoWeb – Versão React

### 1. Visão Geral
O **TratamentoWeb** é uma plataforma integrada para nutricionistas, psicólogos e pacientes. Permite o gerenciamento de avaliações, planos alimentares, anamneses, cálculo energético, gamificação (shopping nutri) e acompanhamento psicológico. A versão atual foi migrada de JavaScript vanilla para **React com Vite**, mantendo a mesma identidade visual e funcionalidades.

---

### 2. Stack Tecnológica
- **React 18** com Hooks e Context API
- **Vite** (bundler)
- **Firebase** (Auth, Firestore, App Check)
- **Bootstrap 5.3 + Bootstrap Icons**
- **Chart.js** (gráficos)
- **TensorFlow.js + COCO‑SSD** (IA para desafios de foto)
- **react‑datepicker + date‑fns** (campos de data)
- **ImgBB** (upload de imagens)
- **GitHub Pages** (deploy opcional)

---

### 3. Estrutura de Pastas
```
tratamento-web/
├── public/
├── src/
│   ├── assets/                 # imagens (logo, ícone...)
│   ├── components/             # DatePicker, ErrorMessage, Loading
│   ├── contexts/               # AuthContext.jsx
│   ├── firebase/               # config.js (inicialização, ImgBB)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── paciente/           # Layout + Home, Anamnese, Plano, Shopping
│   │   └── profissional/       # Layout + Home (Nutri/Psic), Cadastro, Anamnese, Plano, Cálculo, Av. Psicológica, Shopping, etc.
│   ├── services/               # iaService.js (TensorFlow)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css               # CSS global (original do projeto)
├── .env                        # (não versionado) credenciais Firebase
├── .gitignore
├── CNAME                       # domínio customizado (se usado)
├── index.html
├── package.json
└── vite.config.js
```

---

### 4. Configuração do Ambiente
Crie um arquivo `.env` na raiz com as variáveis do Firebase:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_CHECK_SITE_KEY=...   # (recaptcha v3)
```

O arquivo `src/firebase/config.js` carrega essas variáveis e inicializa os serviços.  
O **App Check** é habilitado automaticamente.

---

### 5. Autenticação e Contexto Global
`AuthContext` provê:
- `user` (dados do usuário logado)
- `login(login, senha, lembrar)`
- `createPasswordAndLogin(tempData, novaSenha)`
- `logout()`
- `loading`, `error`

O fluxo de primeiro acesso (paciente com código temporário) é totalmente suportado.

---

### 6. Rotas e Layouts
Definidas em `App.jsx`:

- `/` → `Login`
- `/home` → redireciona conforme cargo
- `/paciente/*` → usa `PacienteLayout` (header + menu lateral)
  - `home`, `anamnese`, `plano-alimentar`, `shopping`
- `/profissional/*` → usa `ProfissionalLayout` (top‑bar + menu lateral)
  - `home` (condicional para nutricionista/psicólogo)
  - `clientes`, `anamnese`, `plano-alimentar`, `calculo-energetico`
  - `avaliacao-psicologica`, `prontuario`
  - `shopping`, `atendimento-grupo`, `agendamentos`, `jornadas`, `palestras`, `chat`

Os layouts aplicam automaticamente as classes CSS `profile-paciente` ou `profile-profissional` ao `<body>`.

---

### 7. Estilização
- **CSS global** (`index.css`) contém todas as regras do projeto original (variáveis, login, cards, tabelas, menu lateral, modais, responsivo).
- Classes condicionais no `<body>` definem temas diferentes.
- Bootstrap foi mantido para estrutura básica (grid, formulários), mas a identidade visual é preservada.
- Os estilos do calendário (`react-datepicker`) e do cadastro de clientes foram adicionados no mesmo arquivo.

---

### 8. Funcionalidades Principais
#### Área do Paciente
- **Home**: dados pessoais, profissionais vinculados, histórico de avaliações, gráficos (membros).
- **Minha Anamnese**: visualização completa/resumo dos dados nutricionais.
- **Meu Plano Alimentar**: refeições do dia, orientações e restrições.
- **Shopping Nutri**: gamificação com pontos, níveis, roleta da sorte, desafios simples e com foto (câmera + IA + upload ImgBB), loja de troca e histórico de transações.

#### Área do Profissional (Nutricionista/Psicólogo)
- **Home**: seletor de paciente, dados pessoais, gráficos de evolução, filtro por período, nota de avaliação (nutricional ou psicológica).
- **Cadastro de Clientes**: tabela com busca, filtros, ações (detalhes, editar, desvincular, código de acesso, reset de senha, suspender/ativar). Somente gerentes podem cadastrar.
- **Anamnese**: formulário completo (histórico clínico, alimentar, antropometria, composição corporal, exames, estilo de vida) com salvamento no Firestore.
- **Plano Alimentar**: seis refeições e campos extras (orientações, restrições, objetivos).
- **Cálculo Energético**: múltiplas fórmulas (Harris-Benedict, Mifflin, etc.), ajuste por objetivo, distribuição de macros (proteínas, carboidratos, lipídios) e resumo colorido.
- **Avaliação Psicológica**: escalas de 0‑10 (ansiedade, depressão, estresse, sono) e gráfico de evolução.
- **Shopping Nutri (Profissional)**: revisão de fotos enviadas pelos pacientes (aprovar/reprovar) e gerenciamento da loja de itens.

---

### 9. Serviços de IA
`src/services/iaService.js` carrega o modelo **COCO‑SSD** (TensorFlow.js) para classificar imagens dos desafios.  
Funções:
- `carregarModeloIA(onProgress)`
- `analisarImagemComIA(base64, categoria)`
- `isModeloCarregado()`

O upload das fotos é feito via **ImgBB** (chave armazenada no Firestore em `config/api`).

---

### 10. Componentes Reutilizáveis
- **DatePicker** (`src/components/DatePicker.jsx`): campo de data com máscara `dd/mm/aaaa`, calendário centralizado, seleção rápida de ano/mês, restrição opcional de data máxima.
- **ErrorMessage** (`src/components/ErrorMessage.jsx`): exibe erros com ícone.
- **Loading** (`src/components/Loading.jsx`): spinner CSS.

---

### 11. Como Rodar o Projeto
```bash
npm install
npm run dev
```
Acesse `http://localhost:5173` no navegador.

---

### 12. Build e Deploy
Para gerar a versão de produção:
```bash
npm run build
```
Os arquivos estáticos serão gerados na pasta `dist/`.  
Se estiver usando GitHub Pages com domínio customizado, o arquivo `CNAME` será copiado automaticamente.

---

### 13. Pontos de Atenção
- O cadastro de pacientes restringe **datas futuras** com a prop `maxDate={new Date()}`.
- Apenas perfis **gerente** podem cadastrar novos clientes (botão "Novo Cliente" fica desabilitado para outros).
- O **Shopping Nutri** depende da chave do ImgBB no Firestore (`config/api`) e do modelo TensorFlow.js (carregamento assíncrono). Caso a IA não esteja disponível, a foto é enviada para análise manual.
- Todos os módulos que ainda não foram implementados exibem um placeholder de "Em desenvolvimento".