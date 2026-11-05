# GestorIA (React)

Aplicação web para controle de gastos com alimentos a partir de notas fiscais (React + Vite): Início, Cadastro, Finanças (Visão geral e Detalhamento), Notas fiscais, Chatbot, Configurações e o menu do perfil.

Todos os dados vêm da API Django do repositório `geladeira_virtual` (autenticação JWT, cadastro da nota, listagem e dashboard). Nada de notas fica guardado no navegador; o `localStorage` guarda só a sessão. Para rodar o backend, veja a seção 9.

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
| `axios` | Chamadas à API Django (autenticação JWT, notas e dashboard). |
| `xlsx` (SheetJS 0.18.5) | Geração do `.xlsx`, carregado sob demanda no momento do download. |
| `vite` e `@vitejs/plugin-react` | Servidor de desenvolvimento e build. |

---

## 3. Estrutura de pastas

```
frontend_auth_nfce/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── scripts/                 # geram/validam o notas.json antigo (não usado pelo app)
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles/              # base.css, components.css
    ├── data/
    │   ├── seed.js          # cores das categorias
    │   ├── notas.json       # base fictícia antiga (não é mais importada)
    │   └── nota-teste.xml   # nota fictícia antiga (não é mais usada)
    ├── services/
    │   ├── api.js           # cliente axios (token JWT e mensagens de erro)
    │   ├── gestoria.js      # chamadas do cadastro, notas e dashboard
    │   └── mockAuth.js      # login local de demonstração
    ├── lib/
    │   ├── utils.js
    │   ├── finance.js
    │   ├── nfce.js          # validação e montagem dos dados do Cadastro
    │   ├── erros.js         # erros do Django REST Framework em frases
    │   ├── chat.js
    │   └── export.js
    ├── store/
    │   ├── AuthContext.jsx
    │   └── AppContext.jsx
    ├── routes/PrivateRoute.jsx
    ├── components/          # Sidebar, Topbar, Overlays, PageHead, FilterBar, TabRow, SheetPreview,
    │                        # StatusDados, LineChart, Donut, Icon, AuthLayout
    └── pages/
        ├── auth/            # Login, Register, ForgotPassword, ResetPassword
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
- **`package.json`**: dependências e scripts (`dev`, `build`, `preview`, `dados`, `validar`, `gerar-base`). Os três últimos são da base fictícia antiga.
- **`vite.config.js`**: ativa o plugin do React e define `base: './'`.

### `src/`

- **`main.jsx`**: inicia o React, envolvendo o app em `HashRouter`, `AuthProvider` e `AppProvider`, e importa os estilos.
- **`App.jsx`**: layout geral (menu lateral, cabeçalho, área de conteúdo), tabela de rotas, modal e aviso.

### `src/services/`

- **`api.js`**: cliente axios. Anexa o token às rotas protegidas, traduz os erros da API em mensagens (`error.userMessage` e, para os 400 do DRF, a lista `error.erros`) e, em caso de 401, encerra a sessão.
- **`gestoria.js`**: uma função por rota do backend (`lerNfce`, `extrairProdutos`, `classificarProdutos`, `listarCategorias`, `confirmarNota`, `listarNotas`, `detalharNota`, `dashboard`, `atualizarPerfil`), `emParalelo` (no máximo 6 chamadas ao mesmo tempo) e `notaDaApi`, que converte a nota da API para o formato das telas.
- **`mockAuth.js`**: contas locais para testar as telas de acesso sem backend.

### `src/data/`

- **`seed.js`**: cores das categorias (`CATS`, `PALETTE` e `colorOf`).
- **`notas.json`** e **`nota-teste.xml`**: dados fictícios da versão anterior. Não são mais importados.

### `src/lib/` (lógica sem interface)

- **`utils.js`**: formatação de moeda e porcentagem, datas (`add`, `dm`, `dmy`, `today` com a data local), nomes de meses, `estName` e `norm`.
- **`finance.js`**: `createFinance(S, F)` devolve as funções de consulta ligadas às notas carregadas e aos filtros: `range`, `prevRange`, `lab`, `prevLab`, `phrase`, `notesIn`, `items`, `nTot`, `byDay`, `allCats`, `sheetRows` e `sheetSimple`. Também exporta `shiftAnchor`.
- **`nfce.js`**: Cadastro. `nfceParaNota` (resposta da leitura → pop-up), `toNum`/`fmtNum`, `totais`, `editarItem`, `errosItem` e `validarNota` (as mesmas regras do backend), `paraExtracao`, `produtoDaExtracao`, `produtosSemLLM`, `errosProdutos`, `paraClassificacao` e `paraConfirmacao` (o corpo de cada chamada).
- **`erros.js`**: `errosApi` transforma os erros aninhados do DRF (`{"itens": [{}, {"non_field_errors": [...]}]}`) em frases como "Item 2: ...".
- **`chat.js`**: `chatAnswer` responde às perguntas do chatbot por consultas às notas carregadas. `SUG` guarda as sugestões.
- **`export.js`**: `exportSheet` gera o `.xlsx` com as abas "Detalhada" e "Simples" (ou dois `.csv` se a biblioteca falhar).

### `src/store/`

- **`AuthContext.jsx`**: `login`, `cadastro`, `logout`, `solicitarRecuperacao`, `redefinirSenha` e `atualizarNome`; `useAuth()` expõe `signed`, `user` e `mock`.
- **`AppContext.jsx`**: estado global, acessado por `useApp()`.
  - Notas: para a janela "período anterior + período atual" do filtro (ou todo o histórico), busca `GET /api/notas/` e o detalhe de cada nota (`GET /api/notas/<chave>/`, guardado em cache por chave).
  - Dashboard: `dashAtual` e `dashAnterior` (`GET /api/dashboard/` dos dois períodos) e os totais de todo o histórico para o cabeçalho.
  - `categorias` (`GET /api/categorias/`), `ests` (mercados das notas carregadas), `todasCats`, `catColor`.
  - `S` (`notes`, `catalog`, `qtdNotas`, `totalGeral`, `user`), `F` (filtros), `fin`, `draft` (rascunho do Cadastro), `chat`, `toast`, `modal`.
  - `carregando`, `erroDados`, `erroDash` e `recarregar()` (busca tudo de novo; usado depois de salvar uma nota).

### `src/components/`

- **`Sidebar.jsx`**: menu lateral com seis entradas.
- **`Topbar.jsx`**: logotipo, status de sincronização (aparece "Sincronizando…" enquanto as notas carregam), produtos registrados e menu do perfil (notas, produtos e gasto com alimentos de todo o histórico, editar perfil, chatbot, exportar as notas carregadas em JSON e sair).
- **`StatusDados.jsx`**: aviso de carregamento, de erro (com "Tentar novamente") e do modo de demonstração.
- **`Overlays.jsx`**, **`PageHead.jsx`**, **`FilterBar.jsx`** (período, categorias cadastradas e mercados das notas), **`TabRow.jsx`**, **`SheetPreview.jsx`**, **`LineChart.jsx`**, **`Donut.jsx`**, **`Icon.jsx`** e **`AuthLayout.jsx`**.

### `src/pages/`

- **`Inicio.jsx`**: saudação e três atalhos.
- **`Cadastro.jsx`**: leitura da nota e as etapas de confirmação até salvar no banco (seção 14).
- **`Financas.jsx`**: cabeçalho, abas, filtros e escolha entre Visão geral e Detalhamento.
- **`FinVisao.jsx`**: indicadores, evolução (por dia, acumulada ou por mês), total por estabelecimento, rosca por categoria e destaques.
- **`FinDetalhamento.jsx`**: tabela comparativa de menor preço por produto entre mercados.
- **`Notas.jsx`**: histórico de notas do usuário, com produtos, marca e categoria, busca e prévia da planilha.
- **`Chatbot.jsx`**: conversa com sugestões e campo de texto.
- **`Configuracoes.jsx`**: edição do nome (salvo no backend); o e-mail é o login e não muda.

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

Formato usado pelas telas, montado por `notaDaApi` a partir de `GET /api/notas/<chave>/`:

```js
// Nota
{ id: chave, chave, est: nome_estabelecimento, cnpj, date: 'AAAA-MM-DD', pay: metodo_pag,
  total /* gasto com alimentos */, totalCupom /* total do cupom */, qtdProdutos, items: [ /* produtos */ ] }

// Produto (só alimentícios são salvos no backend)
{ id, name, marca, cat: categoria, catId: categoria_id, qty: un, unit: '', unitPrice, total }

// Estabelecimento (lista ests, tirada das notas carregadas)
{ id: nome, name: nome }
```

Categorias: as 16 cadastradas no backend (`GET /api/categorias/`), com cores automáticas da `PALETTE`. Itens não alimentícios não são salvos; o gráfico de categorias informa quanto dos cupons ficou de fora (`total_cupons − total_alimentos`).

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

**Origem dos números:** sem filtro de categoria e de estabelecimento, os indicadores e a rosca usam o `GET /api/dashboard/` do período atual e do anterior. Com filtro, são calculados a partir das notas carregadas. A opção "Por mês" do gráfico de evolução usa o `por_mes` do dashboard dos últimos 6 meses.

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

## 8. Dados

As telas usam só os dados do usuário logado, vindos da API (seção 9). A base fictícia antiga (`src/data/notas.json`, 1.000 notas) e os scripts `npm run gerar-base`, `validar` e `dados` continuam na pasta, mas o app não os importa mais.

O "hoje" do app é a data real do computador. Para ver uma nota antiga, mude o período nos filtros ou use "Buscar em todo o histórico" em Notas fiscais.

---

## 9. Integração com o backend

Backend: repositório `geladeira_virtual` (Django + DRF). Para rodar:

```bash
docker compose up -d                 # Postgres e o gerador de NFC-e fictícias (porta 8001)
uv run python manage.py migrate      # inclui as 16 categorias (migration 0008)
uv run python manage.py runserver    # API em http://localhost:8000
```

O classificador de categorias é um container Ollama separado (`classificador-alimentos`, em `OLLAMA_URL`). Sem ele, o Cadastro segue com a escolha manual das categorias.

| Tela | Rota | Uso |
|---|---|---|
| Cadastro | `GET /leitura-qrcode/nfce/` | Nota fictícia do gerador |
| Cadastro | `POST /api/produtos/extrair/` | LLM: nome, marca e alimentício ou não (não grava) |
| Cadastro | `POST /api/produtos/classificar/` | Classificador local: categoria sugerida (não grava) |
| Cadastro, filtros | `GET /api/categorias/` | As 16 categorias |
| Cadastro | `POST /api/notas/confirmar/` | Grava a nota e os produtos alimentícios do usuário |
| Notas, Finanças, Chatbot | `GET /api/notas/?inicio=&fim=` e `GET /api/notas/<chave>/` | Notas e produtos do período |
| Finanças, cabeçalho | `GET /api/dashboard/?inicio=&fim=` | Totais, por categoria e por mês |
| Configurações | `PATCH /auth/users/me/` | Nome do perfil |

---

## 10. Limitações conhecidas

- A leitura real do QR Code não está implementada: a webcam só percebe que há um QR Code e chama o gerador fictício.
- **O gerador fictício devolve sempre a chave de acesso `1`.** Como a chave é única no banco, a partir da segunda nota a API responde "Esta nota fiscal já foi cadastrada"; troque a chave no pop-up para cadastrar.
- A rota de leitura do backend dá erro 500 depois de cerca de 20 leituras (contador interno); reinicie o `runserver`.
- Não há rota para excluir ou editar uma nota salva.
- O dashboard do backend só filtra por data; com filtro de categoria ou estabelecimento, os números são calculados no front.
- Notas e Finanças buscam o detalhe de cada nota do período (uma chamada por nota, com cache).
- O Chatbot responde sobre as notas carregadas (período atual e anterior do filtro).
- O `xlsx` 0.18.5 é a última versão publicada no npm.

---

## 11. Como estender

- **Nova tela:** criar `src/pages/Nova.jsx`, registrar a rota em `src/App.jsx` e a entrada em `NAV` (`src/components/Sidebar.jsx`).
- **Nova categoria:** é cadastrada no backend (`Categorias`); a cor vem automaticamente da `PALETTE` (ou fixe uma em `CATS`, `seed.js`).
- **Nova rota da API:** incluir a função em `src/services/gestoria.js`.
- **Nova pergunta do chatbot:** incluir uma condição em `chatAnswer()` (`src/lib/chat.js`).
- **Paleta:** variáveis no início de `src/styles/base.css`.

---

## 12. Solução de problemas

- **`npm: command not found`:** o Node.js não está instalado. Instale-o e abra um novo terminal.
- **Erro ao instalar:** apague a pasta `node_modules` e o arquivo `package-lock.json` e rode `npm install` de novo.
- **Porta ocupada:** o Vite escolhe outra porta e informa no terminal; use o endereço exibido.
- **A webcam não abre:** use `localhost` ou `https` e permita a câmera. Em outros contextos, use "Simular leitura da nota".
- **"Não foi possível conectar ao servidor":** o `runserver` do backend não está no ar em `VITE_API_URL`.
- **Categorias vazias no Cadastro:** rode `uv run python manage.py migrate` no backend.
- **Finanças vazia:** confira o período; a nota fica na data da compra, que pode ser de outro mês.

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

O padrão é `VITE_MOCK_AUTH=false`: é preciso ter o backend (e o Postgres do Docker) rodando em `VITE_API_URL`. Para testar sem backend, troque para `true` e reinicie o `npm run dev`.

### Endpoints usados (modo API)
`POST /auth/users/` (criar conta), `POST /auth/jwt/create/` (login), `GET /auth/users/me/` (nome do usuário), `PATCH /auth/users/me/` (alterar o nome em Configurações), `POST /auth/jwt/logout/`, `POST /auth/users/reset_password/` e `POST /auth/users/reset_password_confirm/`.

No modo de demonstração (`VITE_MOCK_AUTH=true`) só as telas de acesso funcionam; Cadastro, Notas e Finanças precisam da API.

O link de recuperação enviado por e-mail aponta para `http://localhost:5173/#/recuperar-senha/{uid}/{token}`; o backend já usa o `#` por causa do `HashRouter` (`FRONTEND_DOMAIN` e `FRONTEND_PROTOCOL` no `.env` do backend).

Ao abrir o app, `GET /auth/users/me/` confirma que o token ainda vale; se não valer, a sessão é encerrada. E-mails são normalizados para minúsculas.

Sessão: tokens em `localStorage` (`@GestorIA:token`, `@GestorIA:refresh` e `@GestorIA:user`). O botão "Sair da conta" está no menu do perfil.

---

## 14. Cadastro de nota (do QR Code ao banco)

O fluxo fica no estado global (`draft`), por isso sobrevive à troca de tela. Nada é gravado antes do último passo. Uma barra mostra a etapa atual (Nota · Produtos · Categorias · Salvar).

1. **Leitura:** a webcam aguarda o QR Code; "Simular leitura da nota" chama `GET /leitura-qrcode/nfce/`. `nfceParaNota` aceita `itens` como lista, como `{item: [...]}` ou como item único.
2. **Confirmar a nota (`draft.stage = 'nota'`, pop-up):**
   - Campos editáveis: nome do estabelecimento (até 60), CNPJ (14 dígitos ou vazio), data da compra, forma de pagamento (até 20) e chave de acesso (só dígitos, até 44).
   - Itens: descrição, quantidade (até 3 casas), valor unitário e valor total (2 casas). Excluir (×) ou incluir pela linha "+". Editar a quantidade ou o valor unitário recalcula o total; editar o total recalcula o valor unitário.
   - As regras são as do backend: quantidade × valor unitário = valor total (tolerância de R$ 0,01), e o total da nota é a soma dos itens.
   - "Confirmar nota" envia `POST /api/produtos/extrair/`.
     - Erro 400: a lista de problemas aparece no pop-up.
     - Erro 409: a chave já existe (veja a seção 10).
     - Erro 502 (LLM fora do ar): opções "Tentar novamente" e "Continuar sem a LLM". No modo sem LLM, o nome vem da descrição e todo item começa como alimentar, para revisão.
3. **Confirmar os produtos (`'produtos'`):**
   - Para cada item: descrição da nota, **nome** e **marca** (editáveis) e a etiqueta **ALIMENTAR** / **NÃO ALIMENTAR**.
   - Itens que a LLM marcou para revisão ficam em vermelho. Só os alimentares são salvos, e cada um precisa de nome.
   - "Classificar categorias" envia `POST /api/produtos/classificar/` (em lotes de 100).
4. **Confirmar as categorias (`'categorias'`):**
   - Cada alimento tem um seletor com as 16 categorias, já preenchido com a sugestão do classificador.
   - Itens sem categoria ficam em vermelho, com o motivo.
   - **Se o classificador não responder**, a etapa abre com as categorias em branco, um aviso e o botão "Tentar classificar de novo"; o usuário escolhe tudo à mão.
   - A escolha manual é mantida se a classificação rodar de novo.
   - Os itens não alimentícios aparecem num resumo e não são salvos.
5. **Salvar:**
   - "Salvar nota" envia `POST /api/notas/confirmar/` com todos os itens (o backend confere o total com todos e grava só os alimentícios, vinculados ao usuário logado).
   - Depois de salvar, o app recarrega os dados e abre a nota em Notas fiscais, no mês da compra.

"Voltar" retorna à etapa anterior. Voltar à nota e confirmar de novo refaz a extração. "Cancelar" e "Descartar" usam a classe `.btn.cancel` (vermelho) e apagam o rascunho.
