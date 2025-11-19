# Status do Projeto: Dashboard Dinâmico

Este documento resume o progresso atual do desenvolvimento e os próximos passos planejados.

---

## ✅ Funcionalidades Concluídas

### 1. Backend (API Mock em Python/FastAPI)
- **Servidor Funcional:** API criada com FastAPI para simular o backend de produção.
- **Endpoints de Dados:**
  - `GET /api/data/{file_name}`: Lê um arquivo `.xlsx` da pasta `data/` e o serve como JSON. Endpoint agora retorna os dados completos para suportar a filtragem no frontend.
- **Endpoints de Persistência:**
  - `POST /api/saves/{save_name}`: Salva o estado completo do dashboard.
  - `GET /api/saves/{save_name}`: Carrega o estado do dashboard.
  - Endpoints para CRUD (Criar, Ler, Atualizar, Deletar) de Relações e Filtros.
- **Logging:** Implementado um sistema de log que registra erros em `LogFalha.txt`.

### 2. Frontend (Aplicação React)
- **Estrutura do Projeto:**
  - Projeto inicializado com Vite e React (usando JSX).
  - Tailwind CSS configurado.
  - Estrutura de pastas organizada.
- **Conexão com Backend:**
  - Módulo `dataService.js` para centralizar a comunicação com a API.

### 3. Editor de Dashboard
- **Layout Dinâmico:**
  - Biblioteca `react-grid-layout` integrada para mover e redimensionar widgets.
- **Gerenciamento de Widgets:**
  - Fluxo completo de Adicionar, Editar, Remover, Duplicar e Imprimir.
- **Componentes (Widgets):**
  - Gráfico de Barras, Valor Único e Tabela.

### 4. Gerenciamento de Estado e UI
- **Múltiplas Abas:**
  - Suporte a múltiplas abas, cada uma com seu próprio layout e widgets.
  - UI para adicionar, remover e renomear abas.
- **Persistência Automática:**
  - O estado completo do dashboard é salvo automaticamente no backend.
  - O estado é recarregado ao abrir a aplicação.
- **Layout da Aplicação:**
  - A estrutura principal foi refatorada para separar controles globais (barra de filtros, botões de ação) do conteúdo das abas, corrigindo o layout.

### 5. Filtros e Gerenciamento de Dados
- **Gerenciamento de Fontes de Dados:**
  - Interface para listar e selecionar fontes de dados.
  - Formulários de widgets permitem escolher a fonte de dados (direta ou via relação).
- **Gerenciamento de Relações:**
  - Interface para o usuário definir relações (joins) entre diferentes fontes de dados.
- **Gerenciamento de Filtros Universais:**
  - Interface para criar, editar e deletar filtros globais (Nome, Tipo, Coluna).
- **Barra Lateral de Filtros:**
  - Implementada a barra lateral recolhível no dashboard principal para exibir e aplicar os filtros criados.
- **Lógica de Filtragem (Frontend):**
  - **Arquitetura alterada:** A filtragem agora ocorre 100% no frontend (client-side).
  - O frontend carrega os dados completos uma vez e aplica os filtros no navegador, resultando em uma aplicação de filtro instantânea e mais responsiva.

---

## ⏳ Próximos Passos

A única etapa restante antes da conclusão da versão inicial é o polimento geral.

### 1. Polimento e Finalização
- Melhorar a UI/UX geral da aplicação.
- Adicionar tratamento de erros mais robusto no frontend (ex: toasts para erros de API).
- Realizar testes unitários e de ponta a ponta (E2E).
