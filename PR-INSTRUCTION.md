Claro — aqui está o conteúdo pronto em Markdown para você só copiar e colar no `PR-INSTRUCTION.md`:

````md
# EVO Process — Pull Request Instructions

Este documento define o fluxo padrão de Pull Requests (PR) utilizado no projeto.

Ele não faz parte do fluxo automático do GitHub e serve apenas como referência interna.

---

# 🧠 Fluxo de Desenvolvimento

## 1. Criação da branch

Todo desenvolvimento deve ser feito a partir da branch `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/nome-da-tarefa
````

---

## 2. Desenvolvimento

Realizar as alterações necessárias no código seguindo boas práticas.

---

## 3. Commit das alterações

```bash
git add .
git commit -m "feat: descrição clara da mudança"
```

Padrões de commit:

* feat: nova funcionalidade
* fix: correção de bug
* chore: ajustes de configuração
* refactor: melhoria de código sem mudança funcional

---

## 4. Envio da branch

```bash
git push origin feature/nome-da-tarefa
```

---

## 5. Abertura de Pull Request

No GitHub:

* Base: `main`
* Compare: `feature/nome-da-tarefa`

---

# 🧑‍💼 Processo de Revisão (EVO)

## Responsabilidades do EVO

* Revisar todo código enviado via PR
* Garantir qualidade e segurança
* Validar estrutura e padrões do projeto

---

## Critérios de revisão

* Código limpo e legível
* Ausência de secrets (ex: `.env`)
* Estrutura coerente
* Implementação correta da funcionalidade

---

## Decisão

* ✔️ Approve → merge permitido
* ❌ Request changes → ajustes obrigatórios

---

## Merge

Preferencialmente utilizar:

* **Squash and merge**

---

# 🚫 Regras gerais

* Nenhuma alteração pode ser feita diretamente na `main`
* Todo código deve passar por Pull Request
* Toda PR deve ser revisada pelo EVO
* Branches devem ser removidas após merge

---

# 🔁 Fluxo completo

DEV:

* cria branch
* desenvolve
* commit
* push
* abre PR

EVO:

* revisa PR
* aprova ou solicita ajustes
* realiza merge na `main`

---

# 🏁 Objetivo

Garantir:

* controle de qualidade
* histórico limpo
* segurança da branch `main`
* organização do desenvolvimento em equipe

```

Se quiser depois, posso te ajudar a deixar isso mais “enterprise level” (com emojis reduzidos, padrão mais formal, ou versão para onboarding de novos devs).
```