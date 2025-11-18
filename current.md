# Status do Projeto: Dashboard Dinâmico

Este documento resume o progresso atual do desenvolvimento e os próximos passos planejados.

---

## ✅ Funcionalidades Concluídas

### 1. Backend (API Mock em Python/FastAPI)
- **Servidor Funcional:** API criada com FastAPI para simular o backend de produção.
- **Endpoints de Dados:**
  - `GET /api/data/{file_name}`: Lê um arquivo `.xlsx` da pasta `data/` e o serve como JSON.
  - Tratamento de erros para arquivos não encontrados ou com formato inválido.
  - Correção para valores `NaN` (células vazias) do Excel, convertendo-os para `null` para compatibilidade com JSON.
- **Endpoints de Persistência:**
  - `POST /api/saves/{save_name}`: Salva o estado completo do dashboard em um arquivo JSON.
  - `GET /api/saves/{save_name}`: Carrega o estado do dashboard a partir de um arquivo JSON.
- **Logging:** Implementado um sistema de log que registra erros em `LogFalha.txt` para facilitar a depuração.

### 2. Frontend (Aplicação React)
- **Estrutura do Projeto:**
  - Projeto inicializado com Vite e React.
  - Tailwind CSS configurado para estilização.
  - Estrutura de pastas organizada (`components`, `pages`, `services`, `layouts`, `widgets`, `forms`).
- **Conexão com Backend:**
  - Módulo `dataService.js` criado para centralizar a comunicação com a API.
  - Conexão entre frontend e backend validada e funcionando.

### 3. Editor de Dashboard
- **Layout Dinâmico:**
  - Biblioteca `react-grid-layout` integrada para permitir que os widgets sejam movidos e redimensionados.
- **Gerenciamento de Widgets:**
  - **Adicionar:** Fluxo completo para adicionar novos componentes através de um modal de duas etapas (seleção de tipo e configuração).
  - **Editar:** Funcionalidade para editar a configuração de um widget existente, reutilizando o modal de configuração.
  - **Remover:** Funcionalidade para remover um widget do dashboard.
- **Componentes (Widgets):**
  - **Gráfico de Barras:** Renderiza um gráfico com base na coluna do eixo X, coluna do eixo Y e função de agregação (Soma, Média, etc.) selecionadas pelo usuário.
  - **Valor Único:** Renderiza um valor agregado (Soma, Média, etc.) de uma coluna selecionada.
  - **Tabela:** Renderiza uma tabela com colunas selecionáveis e funcionalidade de ordenação.

### 4. Gerenciamento de Estado e UI
- **Múltiplas Abas:**
  - O dashboard agora suporta múltiplas abas, cada uma com seu próprio layout e conjunto de widgets.
  - UI para adicionar novas abas e navegar entre elas.
- **Persistência Automática:**
  - O estado completo do dashboard (abas, widgets, layouts) é salvo automaticamente no backend 1 segundo após qualquer alteração.
  - O estado é recarregado automaticamente ao abrir a aplicação, permitindo que o trabalho seja continuado.
- **Ações de Aba:** Implementada a funcionalidade de **remover** e **renomear** abas.
- **Ações de Widget:**
  - **Duplicar:** Implementada.
  - **Imprimir:** Implementada. O conteúdo do widget é exibido em um modal e pode ser impresso com largura e paginação corretas.

---

## ⏳ Próximos Passos

A ordem abaixo representa o plano de desenvolvimento para as próximas funcionalidades.

### 1. Gerenciamento de Fontes de Dados
- UI de Fontes de Dados: Criada uma interface para listar e selecionar fontes de dados.
- Seleção de Fonte no Widget: Modificados os formulários de configuração dos widgets para permitir que o usuário escolha de qual fonte de dados o componente deve ler as informações.

### 2. Relações entre Fontes de Dados
- UI de Relações: Criada uma tela de configuração para que o usuário possa definir relações (joins) entre diferentes fontes de dados, selecionando as colunas chave de cada uma.
- Combinação de Dados: Permitido que um único widget (ex: um gráfico) utilize dados combinados de duas fontes relacionadas.

### 3. Filtros Universais
- UI de Gerenciamento de Filtros: Criar uma tela para o usuário criar e configurar filtros globais (Nome, Tipo, Coluna associada).
- Barra Lateral de Filtros: Implementar a barra lateral recolhível no dashboard principal para exibir e aplicar os filtros criados.
- Lógica de Filtragem: Fazer com que os componentes do dashboard reajam aos filtros universais aplicados.

### 5. Polimento e Finalização
- Melhorar a UI/UX geral da aplicação.
- Adicionar tratamento de erros mais robusto no frontend (ex: toasts para erros de API).
- Realizar testes unitários e de ponta a ponta (E2E).
