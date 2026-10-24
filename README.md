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
| `axios` | Chamadas à API de autenticação (JWT). |
| `xlsx` (SheetJS 0.18.5) | Geração do `.xlsx`, carregado sob demanda no momento do download. |
| `vite` e `@vitejs/plugin-react` | Servidor de desenvolvimento e build. |

---

## 3. Estrutura de pastas

```
gestoria/
├── index.html
├── package.json
├── vite.config.js
├── scripts/
│   ├── gerar-base.mjs
│   ├── xml-para-json.mjs
│   └── validar-notas.mjs
├── .gitignore
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/
    │   ├── base.css
    │   └── components.css
    ├── data/
    │   ├── seed.js
    │   └── notas.json
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
- **`package.json`**: dependências e scripts (`dev`, `build`, `preview`, `dados`, `validar`, `gerar-base`).
- **`vite.config.js`**: ativa o plugin do React e define `base: './'`.

### `src/`

- **`main.jsx`**: inicia o React, envolvendo o app em `HashRouter`, `AuthProvider` e `AppProvider`, e importa os estilos.
- **`App.jsx`**: layout geral (menu lateral, cabeçalho, área de conteúdo), tabela de rotas, modal e aviso.

### `src/styles/`

- **`base.css`**: paleta (variáveis CSS), tipografia, estrutura geral, título e linha de destaque.
- **`components.css`**: abas, botões, filtros, cartões, indicadores, tabelas com colunas fixas, formulários, modal, chatbot e menu do perfil.

### `src/data/`

- **`seed.js`**: lê `notas.json` e monta `EST` (emitentes), `CATS` (cores), `BASE_NOTES`, `APP_TODAY` (último dia da base), `ensureEst` (inclui um mercado novo pelo CNPJ), `PALETTE` e `colorOf`.
- **`notas.json`**: a base de notas fiscais fictícias (formato na seção 8), usada em Finanças, Notas fiscais e Chatbot. É o único arquivo a trocar para mudar a base.
- **`nota-teste.xml`**: nota fiscal fictícia "crua" (15 itens, alimentares e não alimentares) que a leitura simulada do Cadastro carrega. Usada apenas no Cadastro (seção 14).

### `src/lib/` (lógica sem interface)

- **`utils.js`**: formatação de moeda e porcentagem, datas (`add`, `dm`, `dmy`, `today`), nomes de meses, `estName` e `norm`.
- **`finance.js`**: `createFinance(S, F)` devolve as funções de consulta ligadas aos dados e filtros atuais: `range`, `prevRange`, `lab`, `prevLab`, `phrase`, `notesIn`, `items`, `nTot`, `byDay`, `allCats`, `sheetRows` (aba Detalhada) e `sheetSimple` (aba Simples). Também exporta `shiftAnchor` (setas do período).
- **`chat.js`**: `chatAnswer` responde às perguntas do chatbot por consultas aos dados. `SUG` guarda as sugestões. Trechos entre `**` viram negrito na tela.
- **`export.js`**: `exportSheet` gera `GestorIA_AAAA-MM.xlsx` (ou com intervalo de datas para semana e período personalizado) com as abas "Detalhada" e "Simples", total por fórmula, formato de moeda e largura de colunas ajustada ao texto. Se a biblioteca falhar, baixa dois `.csv`.
- **`nfce.js`**: nota do Cadastro: `parseNfceXml` (lê o XML), `toNum`/`fmtNum`/`fmtPreco` (números com vírgula), `totais`, `editarItem` (recalcula valores), `errosItem`, `validarNota`, `categorizar` (ponto de entrada da LLM de categorização) e `paraNotaDoApp`.

### `src/store/`

- **`AppContext.jsx`**: estado global, acessado por `useApp()`.
  - `S`: visão completa dos dados (notas da base, menos as excluídas, mais as cadastradas; `catalog`, a quantidade de produtos diferentes pelo nome; usuário). Só o que o usuário altera é gravado em `localStorage`, na chave `gestoria.v3`: notas cadastradas, notas da base excluídas, mercados novos e perfil.
  - `F`: filtros e estado da interface (período, categoria, estabelecimento, aba, alternadores, busca, nota aberta).
  - `fin`: funções de consulta recalculadas quando `S` ou `F` mudam.
  - `draft`, `catColor` (cor de cada categoria), `chat`, `toast`, `modal` e `syncing`.
  - Ações: `confirmNote` e `resetAll`.

### `src/components/`

- **`Sidebar.jsx`**: menu lateral com seis entradas.
- **`Topbar.jsx`**: logotipo, status de sincronização, contador de itens catalogados (produtos diferentes, pelo nome, em todas as notas) e menu do perfil (nome, e-mail, números, editar perfil, falar com o chatbot, exportar dados em JSON e restaurar demonstração).
- **`Overlays.jsx`**: `Modal` e `Toast`.
- **`PageHead.jsx`**: linha de destaque e título.
- **`FilterBar.jsx`**: período (Semana, Mês e Personalizado com data inicial e final), setas, atalho "Últimos 30 dias" e filtros de categoria e estabelecimento.
- **`TabRow.jsx`**: abas, legenda e botão "Gerar planilha" (abre a prévia em modal; em Notas fiscais rola até a prévia da página).
- **`SheetPreview.jsx`**: prévia das abas Detalhada e Simples (alternáveis) e botão de download.
- **`LineChart.jsx`**: gráfico de linha em SVG com curva monotônica e tooltip.
- **`Donut.jsx`**: rosca de categorias com segmentos clicáveis.
- **`Icon.jsx`**: ícones SVG.

### `src/pages/`

- **`Inicio.jsx`**: saudação e três atalhos.
- **`Cadastro.jsx`**: leitura da nota (webcam ou simulação), tela de confirmação com todos os campos editáveis e classificação alimentar ou não alimentar antes de gravar (seção 14).
- **`Financas.jsx`**: cabeçalho, abas, filtros e escolha entre Visão geral e Detalhamento.
- **`FinVisao.jsx`**: indicadores, gráfico de linha, total por estabelecimento, rosca por categoria e destaques em frase.
- **`FinDetalhamento.jsx`**: "Tabela comparativa de menor preço" (com rolagem vertical e horizontal), frase de análise e atalho para as notas.
- **`Notas.jsx`**: histórico de notas (sem coluna de categoria), busca, exclusão e prévia da planilha.
- **`Chatbot.jsx`**: conversa com sugestões e campo de texto.
- **`Configuracoes.jsx`**: edição de nome e e-mail e restauração dos dados.

---

## 5. Rotas

| Rota | Tela |
|---|---|
| `#/login` | Entrar (pública) |
| `#/criar-conta` | Criar conta (pública) |
| `#/esqueci-senha` | Solicitar recuperação de senha (pública) |
| `#/recuperar-senha/:uid/:token` | Definir nova senha (pública) |
| `#/inicio` | Início |
| `#/cadastro` | Cadastro |
| `#/financas` | Finanças (Visão geral e Detalhamento) |
| `#/notas` | Notas fiscais |
| `#/chatbot` | Chatbot |
| `#/configuracoes` | Configurações |

As rotas de Início em diante exigem sessão; sem ela, o usuário é levado ao login. Qualquer outra rota redireciona para `#/inicio`.

---

## 6. Modelo de dados

```js
// Nota
{ id, nf, est, date: 'AAAA-MM-DD', items: [ /* itens */ ], total }

// Item
{ name, cat, qty, unit, unitPrice, total, storage }   // storage: geladeira, despensa ou freezer

// Estabelecimento
{ id, name, cnpj }                                     // s1 a s4

// Objeto persistido (S)
{ added: [...], removed: [...], estNovos: [...], user: { name, email } }   // persistido (gestoria.v3)
```

Categorias: Mercearia, Laticínios, Carnes, Bebidas, Padaria e Não alimentício (e Hortifruti, quando houver). As demais usam a próxima cor livre de `PALETTE`. O gráfico "Consumo por categoria alimentar" não inclui itens "Não alimentício", e uma observação informa o valor deixado de fora.

---

## 7. Regras de negócio

### Período
- **Semana:** segunda a domingo. **Mês:** primeiro ao último dia. **Personalizado:** data inicial e data final escolhidas pelo usuário (tamanho variável).
- O período anterior (para comparações) tem sempre o mesmo número de dias do período atual e termina no dia anterior ao início dele. Por exemplo, 15/10 a 30/10 (16 dias) é comparado com 29/09 a 14/10 (16 dias). Vale para os indicadores Variação do gasto, Compras registradas e Valor médio por compra.

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
Arquivo `.xlsx` com duas abas, ambas com linha final de total (fórmula `SUM`), valores em formato de moeda e colunas com largura ajustada ao maior texto. As duas refletem o período e os filtros ativos. A prévia mostra as duas abas antes de baixar.

| Aba | Colunas |
|---|---|
| Detalhada | Data, Estabelecimento, Item, Categoria, Quantidade, Unidade, Preço unitário, Total do item (uma linha por item) |
| Simples | Data, Estabelecimento, Quantidade de itens, Categoria principal, Total da compra (uma linha por compra) |

A categoria principal é a de maior gasto naquela compra (empate: ordem alfabética). Com filtro de categoria ou estabelecimento ativo, a aba Simples considera só os itens filtrados.

### Chatbot
Responde por regras e consultas aos dados, sem modelo de linguagem. Entende: gasto total (mês ou semana), gasto por categoria, onde gastou mais, última compra, dia mais caro, quantidade de compras e onde comprar um item mais barato. O histórico da conversa fica em memória e se perde ao recarregar.

---

## 8. Base de dados (NFC-e fictícias) e como trocá-la

Toda a base fica em **`src/data/notas.json`**. Para usar outra base, basta substituir esse arquivo e conferir com `npm run validar`. Emitentes, categorias e a data de "hoje" (último dia da base) são lidos do próprio JSON, sem alterar código.

### Base atual
1.000 notas fictícias de alimentos (4.575 itens), de 01/08/2024 a 30/09/2026, de 8 emitentes com CNPJ, 64 produtos e unidades un, kg e dz (quantidades fracionadas em kg). Usada em Finanças, Notas fiscais e Chatbot.

Gerada por `npm run gerar-base` (`scripts/gerar-base.mjs`), sempre igual por usar semente fixa:
- Cada mês recebe uma quantidade de notas proporcional aos seus dias (36 a 40 notas por mês).
- Rotina de uma família: uma compra grande por semana (sábado, 11 a 16 itens) e reposições rápidas nos outros dias (2 a 5 itens).
- Gasto mensal entre cerca de R$ 1.700 e R$ 2.500, sem meses muito destoantes.
- Preços de referência de setembro/2026, inflação de cerca de 4,5% ao ano para trás e variação de preço entre mercados de até 10%.

### Formato do `notas.json`
```json
{
  "emitentes": [
    { "id": "s1", "nome": "Mercantil São José Ltda.", "cnpj": "12.345.678/0001-95" }
  ],
  "notas": [
    {
      "id": "nfce-000001",
      "numero": "000001",
      "codigo": "NFCT-000001",
      "chave": "90000000000000000000000000000000000000000001",
      "emitente": "s1",
      "data": "2026-06-16",
      "pagamento": "Em espécie",
      "total": 85.32,
      "itens": [
        { "nome": "Chocolate em pó 200 g", "categoria": "Mercearia", "quantidade": 3, "unidade": "un", "valorUnitario": 8.26, "valorTotal": 24.78 }
      ]
    }
  ]
}
```

Regras (conferidas por `npm run validar`):
- `id` e `numero` únicos em cada nota; `emitente` deve ser um `id` existente em `emitentes`.
- `data` no formato `AAAA-MM-DD`; `pagamento` preenchido.
- `unidade` entre `un`, `kg`, `g`, `l`, `ml` e `dz` (minúsculas).
- `quantidade`, `valorUnitario` e `valorTotal` maiores que zero; `valorTotal` igual a quantidade vezes valor unitário (diferença de até R$ 0,01); `total` igual à soma dos `valorTotal`.
- `categoria` é um texto livre. Categorias com cor própria: Hortifruti, Mercearia, Laticínios, Carnes, Bebidas, Padaria, Congelados e Não alimentício; as demais recebem cores da paleta automaticamente. Itens "Não alimentício" ficam fora do gráfico de categorias alimentares.
- Opcional por item: `armazenamento` (`geladeira`, `despensa` ou `freezer`). Sem ele, Laticínios e Hortifruti vão para a geladeira, Carnes e Congelados para o freezer e o restante para a despensa.

### Comandos
| Comando | O que faz |
|---|---|
| `npm run gerar-base` | Gera novamente `src/data/notas.json` (1.000 notas). Use `npm run gerar-base -- 1500` para outra quantidade. |
| `npm run validar` | Valida `src/data/notas.json`. Use `npm run validar -- outro.json` para validar outro arquivo. |
| `npm run dados -- <pasta-com-xmls>` | Converte uma pasta de XMLs de NFC-e em `notas.json`. As categorias são definidas por nome de produto em `REGRAS`, dentro de `scripts/xml-para-json.mjs`. |

### Outros pontos
- As notas cadastradas pelo usuário e as exclusões ficam no `localStorage` (chave `gestoria.v3`); a base não é copiada para lá. Se trocar o `notas.json`, use "Restaurar dados de demonstração" para limpar exclusões antigas.
- **Campos do modelo oficial da NFC-e que a base não tem:** endereço do emitente, código do item, descontos, valor pago e hora de emissão. Esses campos existem na nota de teste do Cadastro (`nota-teste.xml`).

---

## 9. Pontos de integração com um backend

- **`lerNota()` em `src/pages/Cadastro.jsx`:** carrega `nota-teste.xml`. Substituir pela consulta da NFC-e a partir do QR Code; o resultado deve passar por `parseNfceXml` (ou montar o mesmo objeto).
- **`categorizar()` em `src/lib/nfce.js`:** hoje classifica os itens alimentares por palavras-chave. É aqui que entra a chamada à LLM de categorização.
- **`src/store/AppContext.jsx`:** `S` e a gravação em `localStorage` representam a camada de dados. Trocar por chamadas de API mantém as telas intactas.
- **`src/data/seed.js` e `notas.json`:** substituir pela leitura da API quando houver dados reais.
- **Autenticação:** não existe; o usuário é fixo.

---

## 10. Limitações conhecidas

- A leitura real do QR Code da NFC-e não está implementada; a leitura simulada carrega sempre `nota-teste.xml`.
- Os descontos ficam gravados na nota, mas as análises somam o valor dos itens (sem ratear o desconto).
- A tela Notas fiscais tem apenas a visão por nota.
- Os dados ficam só no navegador atual.
- O `xlsx` 0.18.5 é a última versão publicada no npm; versões mais novas da biblioteca são distribuídas pelo site oficial do SheetJS.

---

## 11. Como estender

- **Nova tela:** criar `src/pages/Nova.jsx`, registrar a rota em `src/App.jsx` e a entrada em `NAV` (`src/components/Sidebar.jsx`).
- **Nova categoria:** incluir a cor em `CATS` (`seed.js`) (categorias novas recebem automaticamente a próxima cor livre de `PALETTE`, com 30 cores reservadas).
- **Novo estabelecimento:** incluir o emitente em `emitentes` e usar o `id` dele nas notas (`notas.json`).
- **Nova pergunta do chatbot:** incluir uma condição em `chatAnswer()` (`src/lib/chat.js`).
- **Paleta:** variáveis no início de `src/styles/base.css`.

---

## 12. Solução de problemas

- **`npm: command not found`:** o Node.js não está instalado. Instale-o e abra um novo terminal.
- **Erro ao instalar:** apague a pasta `node_modules` e o arquivo `package-lock.json` e rode `npm install` de novo.
- **Porta ocupada:** o Vite escolhe outra porta e informa no terminal; use o endereço exibido.
- **A webcam não abre:** use `localhost` ou `https` e permita a câmera. Em outros contextos, use "Simular leitura da nota".
- **Os dados parecem estranhos depois de testes:** use "Restaurar dados de demonstração" em Configurações ou no menu do perfil.

---

## 13. Autenticação (login e criar conta)

Baseada no código do projeto `GestorIA-Frontend-feature-auth` (API Django com JWT, rotas `/auth/...`).

### Arquivos
- `src/services/api.js`: cliente axios. Anexa o token (`Authorization: Bearer`) às rotas protegidas, traduz erros da API em mensagens e, em caso de 401 numa rota protegida, limpa a sessão e volta ao login.
- `src/services/mockAuth.js`: autenticação local para testar sem backend.
- `src/store/AuthContext.jsx`: `login`, `cadastro`, `logout`, `solicitarRecuperacao` e `redefinirSenha`; o hook `useAuth()` expõe `signed` e `user`.
- `src/routes/PrivateRoute.jsx`: bloqueia as telas internas para quem não está logado.
- `src/components/AuthLayout.jsx`: moldura visual das telas públicas.
- `src/pages/auth/`: `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx` e `ResetPassword.jsx`.

### Campos
- **Entrar:** e-mail e senha.
- **Criar conta:** nome completo, e-mail, senha e confirmação de senha (mínimo de 8 caracteres e senhas iguais).

### Variáveis de ambiente (arquivo `.env`)
| Variável | Função |
|---|---|
| `VITE_API_URL` | Endereço da API (padrão `http://localhost:8000`). |
| `VITE_MOCK_AUTH` | `true` usa contas locais de demonstração, sem backend; `false` usa a API. |

O projeto vem com `VITE_MOCK_AUTH=true` para funcionar de imediato. Com a API no ar, troque para `false` e reinicie o `npm run dev`.

### Endpoints usados (modo API)
`POST /auth/users/` (criar conta), `POST /auth/jwt/create/` (login), `GET /auth/users/me/` (nome do usuário, opcional), `POST /auth/jwt/logout/`, `POST /auth/users/reset_password/` e `POST /auth/users/reset_password_confirm/`.

O link de recuperação enviado por e-mail deve apontar para `https://SEU_SITE/#/recuperar-senha/{uid}/{token}` (ajuste o modelo de URL no backend, por causa do `#`).

Sessão: tokens em `localStorage` (`@GestorIA:token`, `@GestorIA:refresh` e `@GestorIA:user`). O botão "Sair da conta" está no menu do perfil.

---

## 14. Cadastro de nota (confirmação e classificação)

Fluxo em três etapas, guardado no estado global (`draft`), por isso sobrevive à troca de tela:

1. **Leitura:** a webcam aguarda o QR Code; "Simular leitura da nota" carrega `src/data/nota-teste.xml`.
2. **Pop-up de confirmação (`draft.stage = 'editar'`):** abre sobre a tela de Cadastro, com o fundo translúcido, para o usuário conferir a leitura. Tem duas células, ambas editáveis:
   - **Estabelecimento:** razão social, CNPJ, endereço, número da nota, data de emissão, protocolo de autorização e chave de acesso.
   - **Itens da nota**, na ordem do XML: descrição, quantidade, unidade, valor unitário e valor total. Itens podem ser excluídos (×) ou incluídos na linha "+" (obrigatórios: nome, quantidade, unidade e valor unitário; o total é calculado). Editar quantidade ou valor unitário recalcula o total do item; editar o total recalcula o valor unitário. Números aceitam vírgula decimal (1,235).
   - Pagamento, descontos, tributos, consumidor e demais informações gerais continuam vindo do XML, mas não aparecem nem são editados no pop-up.
   - "Confirmar nota" valida razão social, CNPJ (14 dígitos), número, data, chave de acesso (44 dígitos) e todos os itens. "Cancelar" (botão vermelho) fecha o pop-up e descarta a leitura.
3. **Classificação (`draft.stage = 'classificar'`):** itens em colunas (Item, Qtd, Un, Valor unit., Valor total, Tipo). A etiqueta alterna entre **ALIMENTAR** (verde) e **NÃO ALIMENTAR** (vermelho). "Confirmar itens" grava a nota: os itens alimentares recebem categoria por `categorizar()` (futura LLM) e os demais ficam como "Não alimentício". Nota com a mesma chave de acesso de outra já cadastrada é recusada. "Descartar" (vermelho) abandona a nota.

Botões de cancelar e descartar usam a classe `.btn.cancel` (vermelho), padrão para toda a aplicação.

### `nota-teste.xml`
NFC-e fictícia baseada no modelo oficial do DANFE NFC-e, com 15 itens (10 alimentares e 5 não alimentares), descrições abreviadas como impressas pelo caixa, desconto, pagamento em dinheiro com troco e chave de acesso com dígito verificador. Campo criado só para o React: `<alimenticio>sim|nao</alimenticio>` em cada item, a sugestão inicial da etiqueta.
