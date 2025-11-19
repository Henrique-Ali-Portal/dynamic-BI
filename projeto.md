# Projeto: Dashboard Dinâmico em React + Tailwind

## Visão geral

Aplicação web para criar visualizações dinâmicas a partir de múltiplas fontes de dados. O sistema terá dois modos principais:

- **Visualização** — mostrar painéis com componentes (gráficos, valor único, tabelas). Cada componente poderá ser impresso separadamente.
- **Edição** — modo WYSIWYG onde o usuário adiciona/remove componentes, eAlias scolhe tipo, configura fonte/colunas, redimensiona e reposiciona os componentes e gerencia abas de visualização.

**Estado Inicial:** Ao iniciar a aplicação, o usuário será apresentado a um dashboard vazio, já no modo de edição, pronto para adicionar novas abas e componentes.

**Fonte de Dados (Desenvolvimento):** Para o desenvolvimento inicial, a aplicação consumirá uma API de teste (mock). Essa API simulará o comportamento da API de produção (paga), lendo um arquivo `.xlsx` e retornando os dados em formato JSON — um array de objetos, onde cada objeto representa uma linha da planilha e as chaves são os nomes das colunas.

Existem telas/fluxos de configuração:

- **Configurar Fonte de Dados** — conectar arquivos Excel (importar, mapear colunas).
- **Configurar Relações de Colunas** — mapear colunas entre fontes, criar joins virtuais, normalizar nomes.
- **Configuração Geral** — gerenciar filtros universais (definir filtros globais reutilizáveis e conectar colunas das fontes a esses filtros).

## Tecnologias sugeridas

- Framework: **React** 18+ (com **Vite**).
- Styling: **Tailwind CSS**.
- Layout dinâmico (drag/resize): **react-grid-layout**.
- Gráficos: **recharts** ou **chart.js**.
- Tabelas: **@tanstack/react-table**.
- Estado global: **Zustand** ou **Redux Toolkit**.
- Forms: **react-hook-form**.
- Impressão/export: `window.print()` ou `html2canvas` + `jsPDF`.
- Testes: **Vitest** para unit + **Playwright** para E2E.

## Funcionalidades principais (Resumo)

1. CRUD de fontes de dados
2. Mapear/relacionar colunas entre fontes
3. Criar filtros universais e conectar colunas a filtros
4. Editor de dashboard com adicionar/editar/remover/mover/redimensionar componentes
5. Dashboard principal com suporte a múltiplas abas (cada aba: layout diferente)
6. Impressão de componentes individualmente
7. Persistência automática do projeto (salvamento automático) — via arquivos na pasta "Saves"
8. Controle de permissões (fora do escopo inicial - sem necessidade de login nesta fase)

## Detalhes de Funcionalidades

- **Dashboard Único com Múltiplas Abas:** A aplicação gerenciará um único dashboard principal. Dentro deste dashboard, o usuário poderá criar e gerenciar múltiplas abas, cada uma com seu próprio layout e conjunto de componentes. A funcionalidade de 'Carregar Dashboard' para alternar entre diferentes dashboards foi removida, focando na gestão de conteúdo através das abas do dashboard principal.
- **Fontes de Dados para Gráficos:** Será possível criar gráficos que combinam informações de múltiplas fontes de dados (arquivos Excel). Para que isso funcione, o usuário primeiro precisará definir uma relação (join) entre as fontes de dados relevantes.
- **Exemplo de Combinação de Dados:** O usuário poderá, por exemplo, ter um arquivo `vendas.xlsx` e um `clientes.xlsx`. Ao estabelecer uma relação entre eles (ex: pela coluna "ID do Cliente"), ele poderá criar um único gráfico que mostre o "Valor da Venda" (do arquivo de vendas) pela "Região do Cliente" (do arquivo de clientes).
- **Relações entre Fontes de Dados:** O sistema permitirá que o usuário defina relações entre colunas de diferentes fontes de dados. Isso é a base para combinar informações e também para criar filtros universais que afetam múltiplos componentes no dashboard.

## Fluxos UI / UX (alto nível)

1. **Gerenciar Fontes de Dados**

   - **Adicionar Novas Fontes:** O usuário terá uma interface para adicionar novas fontes de dados, como o upload de arquivos Excel (`.xlsx`) para a pasta `data/` do backend, ou a configuração de outras conexões (se aplicável no futuro).
   - **Conexão com API:** A aplicação se conectará a um endpoint de API para buscar os dados. Durante o desenvolvimento, será utilizada uma API de teste que lê um arquivo Excel e retorna os dados em formato JSON — um array de objetos, onde cada objeto representa uma linha da planilha e as chaves são os nomes das colunas.
   - **Tratamento de Erros de Conexão:** Se a fonte de dados (API) estiver indisponível ou se uma operação de join falhar, a aplicação deverá exibir um erro claro e informativo na interface através de **notificações "toast" em vermelho com uma descrição do erro**, além de registrar um **log no console** para auxiliar na depuração.
   - **Listagem e Preview:** O usuário verá uma lista das fontes de dados disponíveis (endpoints da API). Ao selecionar uma, poderá ver um preview dos dados.
   - **Configuração de Colunas (Metadados):** Para cada coluna de uma fonte de dados, o usuário poderá definir metadados que influenciarão a formatação e o processamento dos dados nos componentes:
     - **Tipo de Dado:** Texto, Data, Moeda, Valor Inteiro, Valor Decimal, Porcentagem.
     - **Formatação:** Definição de um **prefixo** (ex: "R$ ") e/ou **sufixo** (ex: "%") para exibição dos valores.
     - **Associação a Filtros:** Conectar a coluna a um filtro universal.
     - Essas configurações são salvas no arquivo de metadados.

2. **Configurar Relações de Colunas**

   - O usuário seleciona duas fontes de dados (representando dois endpoints ou duas coleções de dados da API).
   - Para cada fonte, o usuário escolhe uma coluna chave para a relação.
   - **Tipo de Relação:** Para a versão inicial, apenas o tipo "INNER JOIN" será suportado e é o único tipo planejado, combinando apenas as linhas que possuem correspondência em ambas as fontes de dados.
   - A relação é salva, permitindo a combinação de dados dessas fontes em gráficos e filtros.

3. **Criar/Editar Dashboard (Abas)**

   - O dashboard é composto por um conjunto de abas, similar às abas de um navegador como o Chrome. Cada aba representa um layout diferente e contém sua própria coleção de componentes (widgets).
   - **Gerenciamento de Abas (Modo Edição):**
     - **Criar:** Um botão de "+" no final da lista de abas permite criar uma nova aba.
     - **Remover:** Um ícone "x" aparece ao lado do nome de cada aba para permitir sua remoção.
     - **Renomear:** No modo edição, um duplo clique no nome da aba permitirá ao usuário renomeá-la.
     - **Navegar:** O usuário clica no nome da aba para visualizá-la.
   - **Adicionar Componentes:**
     - No modo edição, um botão "Adicionar Componente" abre um modal com os tipos disponíveis.
     - **Tipos de Componentes Iniciais:** Gráfico de Barras, Valor Único, Tabela.
     - **Configuração de Componentes:**
       - Ao criar um componente, o usuário seleciona a fonte de dados (ou uma combinação de fontes relacionadas) **diretamente no formulário de configuração do componente**.
       - **Gráfico de Barras:** O usuário define um título, a coluna para o eixo X (categorias), a coluna para o eixo Y (valores) e a função de agregação (Soma, Média, Contagem, Mínimo, Máximo). Os valores exibidos no gráfico (eixos, tooltips) utilizarão o prefixo/sufixo definido nos metadados da coluna.
       - **Valor Único:** O usuário define um título, a coluna a ser exibida e a função de agregação (Soma, Média, Contagem, Mínimo, Máximo). O valor exibido utilizará o prefixo/sufixo definido nos metadados da coluna.
       - **Tabela:** O usuário define um título e seleciona as colunas da fonte de dados que devem ser exibidas. A tabela terá as seguintes funcionalidades:
         - **Ordenação:** Clicar no cabeçalho de uma coluna ordena os dados.
         - **Reordenação de Colunas:** O usuário poderá arrastar e soltar os cabeçalhos para alterar a ordem das colunas.
         - **Formatação:** Os valores nas colunas utilizarão o prefixo/sufixo definido em seus metadados.
       - As cores dos gráficos serão padronizadas e não configuráveis pelo usuário na versão inicial.
     - O componente (widget) não é inserido diretamente no grid. Em vez disso, ele entra em um **"modo de posicionamento"**, ficando "preso" ao cursor do mouse para que o usuário possa clicar na posição desejada no grid para inseri-lo.
     - Cada widget possui ícones para configurações, **duplicar**, remover e imprimir. Ao **duplicar**, uma cópia idêntica do componente também entra no "modo de posicionamento".

4. **Filtros Universais**

   - **Gerenciamento:** Os filtros universais serão criados e gerenciados dentro da tela de "Configuração Geral". Nesta tela, o usuário poderá listar, adicionar, editar e remover filtros.
   - **Configuração:** Ao criar ou editar um filtro, as opções de configuração serão:
     - **Nome:** Nome do filtro.
     - **Tipo:**
       - **Numérico:** Permitirá a entrada de um **valor único** para filtragem.
       - **Data:** Permitirá a seleção de um **intervalo de datas**.
       - **Seleção:** As opções serão **preenchidas automaticamente com os valores únicos da coluna conectada**, e permitirá **múltipla seleção**.
   - **Interação no Dashboard:** Os filtros universais serão apresentados em uma **barra lateral recolhível** à direita, independente da aba do dashboard. A aplicação dos filtros será manual, através de um botão "Atualizar".
   - **Mecanismo de Filtragem (Frontend):** Quando o usuário clica em "Atualizar", os componentes do dashboard **aplicam os filtros diretamente nos dados já carregados no navegador** (filtragem no lado do cliente), proporcionando uma experiência mais ágil e responsiva. O backend não é envolvido para cada aplicação de filtro.

5. **Impressão de Widget**
   - O botão 'Imprimir' no widget agora está disponível tanto no modo de visualização quanto no modo de edição.
   - Ao clicar em "Imprimir" no widget: abrir modal com apenas o conteúdo do widget e chamar `window.print()` para esse modal (ou renderizar em iframe para isolar CSS).

## Persistência e Arquitetura

- **Abordagem de Persistência:** O estado do projeto (configuração do dashboard, metadados das fontes) será salvo em arquivos JSON dentro de uma pasta "Saves" gerenciada pelo **backend**. O salvamento é automático e instantâneo após qualquer alteração no dashboard, com um **debounce de 1 segundo** para reduzir operações de I/O, e o backend sendo responsável pela leitura e escrita desses arquivos.
- **Estrutura dos Saves:**
  - **Configuração do Dashboard:** Um arquivo principal para as abas e layout dos componentes.
  - **Metadados das Fontes de Dados:** Um arquivo para armazenar as configurações de cada fonte de dados (endpoint de API). Essas configurações incluirão os tipos de coluna, os nomes "amigáveis" e as conexões com filtros universais. A chave para essas configurações será o identificador do endpoint (ex: "api/vendas").
- **Comportamento Compartilhado:** As alterações no dashboard ou nas configurações das fontes de dados atualizarão os arquivos na pasta "Saves", refletindo as mudanças para todos os usuários.
- **Arquitetura de Desenvolvimento:**
  - **Frontend:** Aplicação React (Vite). A arquitetura de filtragem foi alterada para ser **client-side**: os dados são carregados uma vez pelo backend e toda a lógica de aplicação de filtros ocorre no navegador para maior responsividade.
  - **Backend (Mock API):** Um servidor **Python com FastAPI** será criado para a fase de desenvolvimento. Sua função é prover uma API de teste com **múltiplos endpoints**, onde cada endpoint lê um arquivo `.xlsx` fixo no diretório do backend e entrega seu conteúdo como JSON, simulando diferentes fontes de dados da API de produção.
- **Edição de Usuário Único:** Assume-se que apenas um usuário editará o dashboard por vez.

## Segurança & Considerações

- Nunca armazenar credenciais sensíveis no cliente.
- Limitar upload de arquivos e validar os arquivos.

## Design/Estilo

- **Tema Geral:** A aplicação terá um tema predominantemente branco, com detalhes em verde para elementos de destaque ou interativos. As cores dos gráficos permanecerão padronizadas e não configuráveis pelo usuário na versão inicial.

## Roadmap de entrega (sprints sugeridos)

1. Projeto base + persistência local
2. CRUD de fontes de dados + preview
3. Dashboard view estático (renderizar widgets fixos)
4. Editor com react-grid-layout (adicionar/mover/redim)
5. Global filters e conexão com fontes
6. Impressão por widget + export (PNG/PDF)
7. Polimento, testes e deploy
