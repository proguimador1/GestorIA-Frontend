# GestorIA (React)

Aplicação web para controle de gastos de cozinha a partir de notas fiscais, convertida para React com Vite. A interface, as regras de negócio, os dados de demonstração e todas as funções da versão em HTML, CSS e JavaScript puros foram mantidos: Início, Cadastro, Finanças (Visão geral e Detalhamento), Notas fiscais, Chatbot, Configurações e o menu do perfil.

Não há backend. Os dados ficam no navegador (localStorage) e partem de uma base de demonstração gerada por regra.

---

## 1. Como rodar

### Requisitos

- **Node.js 18 ou superior** (inclui o npm). Verifique com `node -v`. Download em https://nodejs.org
- Navegador moderno. A leitura automática de QR Code pela webcam depende da API `BarcodeDetector` (navegadores baseados em Chromium).
- Internet para as fontes do Google Fonts. Sem internet, o site usa fontes do sistema.

### Passo a passo

Dentro da pasta do projeto (a que contém o `package.json`):

```bash
npm install        # instala as dependências (somente na primeira vez)
npm run dev        # inicia o servidor de desenvolvimento
```

O terminal exibirá um endereço, normalmente `http://localhost:5173`. Abra-o no navegador. A página recarrega sozinha a cada alteração nos arquivos.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática. |
| `npm run build` | Gera a versão de produção na pasta `dist`. |
| `npm run preview` | Serve a pasta `dist` localmente para conferir a versão de produção (`http://localhost:4173`). |

### Publicação

Depois de `npm run build`, envie o conteúdo da pasta `dist` para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages ou servidor próprio). O projeto usa `HashRouter` e `base: './'`, então funciona em qualquer subpasta sem configurar redirecionamentos. A webcam exige `https` ou `localhost`.

---

## 2. Tecnologias

| Pacote | Uso |
|---|---|
| `react` e `react-dom` 18 | Interface em componentes. |
| `react-router-dom` 6 | Rotas por hash (`#/inicio`, `#/financas`, etc.). |
| `xlsx` (SheetJS 0.18.5) | Geração do `.xlsx`, carregado sob demanda no momento do download. |
| `vite` e `@vitejs/plugin-react` | Servidor de desenvolvimento e build. |

---

## 3. Estrutura de pastas

```
gestoria/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   ├── base.css
    │   └── components.css
    ├── data/
    │   └── seed.js
    ├── lib/
    │   ├── utils.js
    │   ├── finance.js
    │   ├── chat.js
    │   └── export.js
    ├── store/
    │   └── AppContext.jsx
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── Topbar.jsx
    │   ├── Overlays.jsx
    │   ├── PageHead.jsx
    │   ├── FilterBar.jsx
    │   ├── TabRow.jsx
    │   ├── SheetPreview.jsx
    │   ├── LineChart.jsx
    │   ├── Donut.jsx
    │   └── Icon.jsx
    └── pages/
        ├── Inicio.jsx
        ├── Cadastro.jsx
        ├── Financas.jsx
        ├── FinVisao.jsx
        ├── FinDetalhamento.jsx
        ├── Notas.jsx
        ├── Chatbot.jsx
        └── Configuracoes.jsx
```

---

## 4. Descrição de cada arquivo

### Raiz

- **`index.html`**: documento base, com a `<div id="root">`, as fontes e o ponto de entrada `src/main.jsx`.
- **`package.json`**: dependências e scripts (`dev`, `build`, `preview`).
- **`vite.config.js`**: ativa o plugin do React e define `base: './'`.

### `src/`

- **`main.jsx`**: inicia o React, envolvendo o app em `HashRouter` e `AppProvider`, e importa os estilos.
- **`App.jsx`**: layout geral (menu lateral, cabeçalho, área de conteúdo), tabela de rotas, modal e aviso.

### `src/styles/`

- **`base.css`**: paleta (variáveis CSS), tipografia, estrutura geral, título e linha de destaque.
- **`components.css`**: abas, botões, filtros, cartões, indicadores, tabelas com colunas fixas, formulários, modal, chatbot e menu do perfil.

### `src/data/`

- **`seed.js`**: dados de demonstração e configuração: `APP_TODAY` (data tratada como hoje, `'2026-08-29'`; `null` usa a data real), `EST` (estabelecimentos), `CATS` (cores das categorias), `SEED_NOTES` (12 notas de agosto e 11 de julho de 2026) e `SAMPLES` (3 notas devolvidas pelo leitor de demonstração).

### `src/lib/` (lógica sem interface)

- **`utils.js`**: formatação de moeda e porcentagem, datas (`add`, `dm`, `dmy`, `today`), nomes de meses, `estName` e `norm`.
- **`finance.js`**: `createFinance(S, F)` devolve as funções de consulta ligadas aos dados e filtros atuais: `range`, `prevRange`, `lab`, `prevLab`, `phrase`, `notesIn`, `items`, `nTot`, `byDay`, `allCats` e `sheetRows`. Também exporta `shiftAnchor` (setas do período) e `classify` (categoria e armazenamento por palavras-chave).
- **`chat.js`**: `chatAnswer` responde às perguntas do chatbot por consultas aos dados. `SUG` guarda as sugestões. Trechos entre `**` viram negrito na tela.
- **`export.js`**: `exportSheet` gera `GestorIA_AAAA-MM.xlsx` (ou com intervalo de datas para semana e 30 dias), com a aba "Itens" e o total por fórmula. Se a biblioteca falhar, baixa um `.csv`.

### `src/store/`

- **`AppContext.jsx`**: estado global, acessado por `useApp()`.
  - `S`: dados persistentes (notas, contador de catálogo, notas de exemplo usadas, usuário), gravados em `localStorage` na chave `gestoria.v1`.
  - `F`: filtros e estado da interface (período, categoria, estabelecimento, aba, alternadores, busca, nota aberta).
  - `fin`: funções de consulta recalculadas quando `S` ou `F` mudam.
  - `draft`, `cadTab`, `chat`, `toast`, `modal` e `syncing`.
  - Ações: `confirmNote` e `resetAll`.

### `src/components/`

- **`Sidebar.jsx`**: menu lateral com seis entradas.
- **`Topbar.jsx`**: logotipo, status de sincronização, contador de itens e menu do perfil (nome, e-mail, números, editar perfil, falar com o chatbot, exportar dados em JSON e restaurar demonstração).
- **`Overlays.jsx`**: `Modal` e `Toast`.
- **`PageHead.jsx`**: linha de destaque e título.
- **`FilterBar.jsx`**: período (Semana, Mês, Personalizado), setas, atalho "Últimos 30 dias" e filtros de categoria e estabelecimento.
- **`TabRow.jsx`**: abas, legenda e botão "Gerar planilha" (abre a prévia em modal; em Notas fiscais rola até a prévia da página).
- **`SheetPreview.jsx`**: prévia da planilha simplificada e botão de download.
- **`LineChart.jsx`**: gráfico de linha em SVG com curva monotônica e tooltip.
- **`Donut.jsx`**: rosca de categorias com segmentos clicáveis.
- **`Icon.jsx`**: ícones SVG.

### `src/pages/`

- **`Inicio.jsx`**: saudação e três atalhos.
- **`Cadastro.jsx`**: abas Webcam, Código de barras e Manual; uma nota por vez, com botão Confirmar itens.
- **`Financas.jsx`**: cabeçalho, abas, filtros e escolha entre Visão geral e Detalhamento.
- **`FinVisao.jsx`**: indicadores, gráfico de linha, total por estabelecimento, rosca por categoria e destaques em frase.
- **`FinDetalhamento.jsx`**: tabela "Mesmo item, preços diferentes", frase de análise e resumo da seleção.
- **`Notas.jsx`**: histórico de notas (sem coluna de categoria), busca, exclusão e prévia da planilha.
- **`Chatbot.jsx`**: conversa com sugestões e campo de texto.
- **`Configuracoes.jsx`**: edição de nome e e-mail e restauração dos dados.

---

## 5. Rotas

| Rota | Tela |
|---|---|
| `#/inicio` | Início |
| `#/cadastro` | Cadastro |
| `#/financas` | Finanças (Visão geral e Detalhamento) |
| `#/notas` | Notas fiscais |
| `#/chatbot` | Chatbot |
| `#/configuracoes` | Configurações |

Qualquer outra rota redireciona para `#/inicio`.

---

## 6. Modelo de dados

```js
// Nota
{ id, nf, est, date: 'AAAA-MM-DD', items: [ /* itens */ ], total }

// Item
{ name, cat, qty, unit, unitPrice, total, storage }   // storage: geladeira, despensa ou freezer

// Estabelecimento
{ id, name, cnpj, f }                                  // f: fator usado só na geração dos dados

// Objeto persistido (S)
{ notes: [...], catalog: 128, used: [...], user: { name, email } }
```

Categorias com cor própria: Hortifruti, Laticínios, Mercearia e Carnes. As demais usam a cor de "Outros".

---

## 7. Regras de negócio

### Período
- **Semana:** segunda a domingo. **Mês:** primeiro ao último dia. **Personalizado:** 30 dias até a data de referência.
- O período anterior (para comparações) é o mês, a semana ou os 30 dias anteriores.

### Filtros cruzados
| Elemento | Categoria | Estabelecimento |
|---|---|---|
| Indicadores e gráfico de linha | aplica | aplica |
| Barras por estabelecimento | aplica | ignora (destaca o selecionado) |
| Rosca por categoria | ignora (destaca a selecionada) | aplica |

Clicar numa barra, numa fatia ou numa linha da legenda ativa o filtro. Clicar de novo remove.

### Detalhamento
Lista os itens comprados em mais de um estabelecimento, com o último preço unitário de cada. O menor recebe destaque verde, e a coluna "Melhor preço" informa o estabelecimento mais barato e quanto fica abaixo da média, em reais. Tem rolagem vertical (a partir de 6 linhas) e horizontal (mais de 3 estabelecimentos), com a primeira e a última colunas fixas.

### Planilha
Modelo único (simplificado), aba "Itens", com as colunas Data, Estabelecimento, Item, Categoria, Quantidade, Unidade, Preço unitário e Total do item, e linha final de total. Reflete o período e os filtros ativos.

### Classificação de itens digitados
| Palavras no nome | Categoria | Armazenamento |
|---|---|---|
| frango, carne, peixe, linguiça, bife | Carnes | freezer |
| leite, queijo, iogurte, manteiga, ovo, requeij | Laticínios | geladeira |
| tomate, alface, cebola, banana, maçã, batata, cenoura, fruta, verdura, limão | Hortifruti | geladeira |
| qualquer outro | Mercearia | despensa |

### Chatbot
Responde por regras e consultas aos dados, sem modelo de linguagem. Entende: gasto total (mês ou semana), gasto por categoria, onde gastou mais, última compra, dia mais caro, quantidade de compras e onde comprar um item mais barato. O histórico da conversa fica em memória e se perde ao recarregar.

---

## 8. Dados de demonstração

- **Agosto de 2026:** 12 notas, total de R$ 1.519,00. Pão de Açúcar R$ 703,00, São Luiz R$ 468,00, Feira R$ 278,00 e Mercado Bom Preço R$ 70,00. Hortifruti R$ 638,00, Mercearia R$ 456,00 e Laticínios R$ 425,00.
- **Julho de 2026:** 11 notas, total de R$ 1.355,00, usadas nas comparações.
- **Notas de exemplo do Cadastro:** três, cada uma lida uma vez. "Restaurar dados de demonstração" libera todas novamente.

---

## 9. Pontos de integração com um backend

- **`readNote()` em `src/pages/Cadastro.jsx`:** devolve uma nota de `SAMPLES`. Substituir pela consulta da NFC-e a partir do QR Code ou da chave de acesso.
- **`src/store/AppContext.jsx`:** `S` e a gravação em `localStorage` representam a camada de dados. Trocar por chamadas de API mantém as telas intactas.
- **`src/data/seed.js`:** pode ser removido quando houver dados reais.
- **`classify()` em `src/lib/finance.js`:** trocar por classificação do backend, se houver.
- **Autenticação:** não existe; o usuário é fixo.

---

## 10. Limitações conhecidas

- A leitura real do QR Code da NFC-e não está implementada; a nota exibida vem de uma base de exemplo.
- O período Personalizado é uma janela fixa de 30 dias, sem seletor de datas livre.
- A tela Notas fiscais tem apenas a visão por nota.
- Os dados ficam só no navegador atual.
- O `xlsx` 0.18.5 é a última versão publicada no npm; versões mais novas da biblioteca são distribuídas pelo site oficial do SheetJS.

---

## 11. Como estender

- **Nova tela:** criar `src/pages/Nova.jsx`, registrar a rota em `src/App.jsx` e a entrada em `NAV` (`src/components/Sidebar.jsx`).
- **Nova categoria:** incluir a cor em `CATS` (`seed.js`) e palavras-chave em `classify()` (`finance.js`).
- **Novo estabelecimento:** incluir um objeto em `EST` (`seed.js`).
- **Nova pergunta do chatbot:** incluir uma condição em `chatAnswer()` (`src/lib/chat.js`).
- **Paleta:** variáveis no início de `src/styles/base.css`.

---

## 12. Solução de problemas

- **`npm: command not found`:** o Node.js não está instalado. Instale-o e abra um novo terminal.
- **Erro ao instalar:** apague a pasta `node_modules` e o arquivo `package-lock.json` e rode `npm install` de novo.
- **Porta ocupada:** o Vite escolhe outra porta e informa no terminal; use o endereço exibido.
- **A webcam não abre:** use `localhost` ou `https` e permita a câmera. Em outros contextos, use "Simular leitura da nota".
- **Os dados parecem estranhos depois de testes:** use "Restaurar dados de demonstração" em Configurações ou no menu do perfil.
