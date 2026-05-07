## Resumo das Melhorias Implementadas

Desde o início da migração, evoluímos o sistema com as seguintes entregas:

1. **Migração de JavaScript vanilla para React + Vite**  
   - Todos os módulos (Login, Home, Anamnese, Plano Alimentar, Cálculo Energético, Shopping Nutri, Cadastro de Clientes, Avaliação Psicológica) foram convertidos para componentes React.
   - Layouts compartilhados (PacienteLayout, ProfissionalLayout) com menus laterais e top‑bar.

2. **Sistema de Notificações (Toasts)**  
   - Substituição de todos os `alert()` nativos por toasts visuais não‑bloqueantes.
   - Criação de `ToastContext` e componente `Toast` com suporte a success, error, warning e info.

3. **Diálogos de Confirmação (Confirm Modal)**  
   - Substituição dos `confirm()` nativos por um modal estilizado (`ConfirmContext`), com ícone laranja e botões "Cancelar"/"Confirmar".

4. **Persistência do Paciente Selecionado**  
   - Em todos os módulos profissionais, o paciente escolhido é salvo no `localStorage` e restaurado ao recarregar a página ou navegar entre módulos.

5. **Lazy Loading das Rotas**  
   - Implementação de `React.lazy()` e `<Suspense>` para carregar cada módulo sob demanda, reduzindo o tempo de carregamento inicial.

6. **Correções de Segurança e Deploy**  
   - Ajuste das regras do Firestore para permitir leitura no primeiro acesso e nas coleções de gamificação.
   - Desabilitação do App Check em produção (erro 400) e configuração de secrets no GitHub Actions.
   - Substituição de `BrowserRouter` por `HashRouter` para evitar erros 404 no GitHub Pages.
   - Criação do arquivo `404.html` para redirecionamento correto em SPAs.

7. **Ajustes de Estilo e Responsividade**  
   - Padronização dos cards de informação (`.info‑card`, `.info‑label`, `.info‑value`).
   - Componente `DatePicker` com máscara `dd/mm/aaaa`, seleção rápida de ano/mês e restrição de datas futuras.
   - Correção do alinhamento do menu lateral e do botão "X" de fechar modal.
   - Favicon e título da página corrigidos para produção.

8. **Landing Page (em andamento)**  
   - Criação da estrutura base da `HomeGeral` com `LandingNavbar`, que servirá como nova página inicial antes do login.

---

## 📘 Documentação do TratamentoWeb – Versão React (ATUALIZADA)

### 1. Visão Geral
O **TratamentoWeb** é uma plataforma integrada para nutricionistas, psicólogos e pacientes. Permite o gerenciamento de avaliações, planos alimentares, anamneses, cálculo energético, gamificação (shopping nutri) e acompanhamento psicológico. A versão atual foi migrada de JavaScript vanilla para **React com Vite**, mantendo a mesma identidade visual e funcionalidades.

### 2. Stack Tecnológica
- **React 18** com Hooks e Context API
- **Vite** (bundler)
- **Firebase** (Auth, Firestore, App Check)
- **Bootstrap 5.3 + Bootstrap Icons**
- **Chart.js** (gráficos)
- **TensorFlow.js + COCO‑SSD** (IA para desafios de foto)
- **react‑datepicker + date‑fns** (campos de data)
- **ImgBB** (upload de imagens)
- **GitHub Pages** (deploy)

### 3. Estrutura de Pastas
```
tratamento-web/
├── public/
│   ├── 404.html            # fallback para GitHub Pages
│   └── icone.ico
├── src/
│   ├── assets/             # imagens (logo, ícone...)
│   ├── components/         # DatePicker, Loading, Toast, ErrorMessage, Landing (Navbar, etc.)
│   ├── contexts/           # AuthContext, ToastContext, ConfirmContext
│   ├── firebase/           # config.js (inicialização, App Check, ImgBB)
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── HomeGeral.jsx   # Nova landing page (em construção)
│   │   ├── paciente/       # Layout + Home, Anamnese, Plano, Shopping
│   │   └── profissional/   # Layout + Home (Nutri/Psic), Cadastro, Anamnese, Plano, Cálculo, Av. Psicológica, Shopping, etc.
│   ├── services/           # iaService.js (TensorFlow)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css           # CSS global
├── .env.example            # exemplo de variáveis (sem valores reais)
├── .gitignore
├── CNAME                   # domínio customizado (tratamentoweb.com.br)
├── index.html
├── package.json
└── vite.config.js
```

### 4. Configuração do Ambiente
Copie o arquivo `.env.example` para `.env` e preencha com as credenciais do Firebase. As variáveis são:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_CHECK_SITE_KEY=...   # (recaptcha v3)
```
O arquivo `src/firebase/config.js` carrega essas variáveis e inicializa os serviços. O **App Check** é habilitado automaticamente em produção.

### 5. Autenticação e Contexto Global
`AuthContext` provê:
- `user` (dados do usuário logado)
- `login(login, senha, lembrar)` – suporta primeiro acesso automático (cria conta no Firebase Auth)
- `logout()`
- `loading`, `error`

### 6. Rotas e Layouts
Definidas em `App.jsx` com **HashRouter** (para compatibilidade com GitHub Pages) e **lazy loading**.
- `/` → `HomeGeral` (landing page)  
- `/login` → `Login`
- `/home` → redireciona conforme cargo
- `/paciente/*` → `PacienteLayout` (header + menu lateral)
- `/profissional/*` → `ProfissionalLayout` (top‑bar + menu lateral)

### 7. Estilização
- **CSS global** (`index.css`) contém todas as regras do projeto original (variáveis, login, cards, tabelas, menu lateral, modais, responsivo).
- Classes condicionais no `<body>` definem temas diferentes.
- Bootstrap foi mantido para estrutura básica, mas a identidade visual é preservada.

### 8. Funcionalidades Principais
*(mesmo conteúdo anterior, apenas acrescentar a nova landing page)*
- **Landing Page (Nova)**: apresentação institucional com carrossel de comunicados, parceiros e acesso ao login.

### 9. Serviços de IA
*(mantido)*

### 10. Componentes Reutilizáveis
- **DatePicker** com máscara e restrição de datas.
- **Toast** (notificações).
- **ConfirmDialog** (modais de confirmação).
- **Loading** (spinner centralizado).

### 11. Como Rodar o Projeto
```bash
npm install
npm run dev
```

### 12. Build e Deploy
O deploy é feito via **GitHub Actions** (`.github/workflows/deploy.yml`), que injeta as secrets e publica no GitHub Pages. Não é necessário commitar o arquivo `.env`.

### 13. Pontos de Atenção
- O cadastro de pacientes restringe **datas futuras** com a prop `maxDate={new Date()}`.
- Apenas perfis **gerente** podem cadastrar novos clientes.
- O **Shopping Nutri** depende da chave do ImgBB no Firestore (`config/api`) e do modelo TensorFlow.js.
- A nova landing page ainda está em desenvolvimento e substituirá a tela de login como página inicial.