'use strict';

// Estado: dados salvos (localStorage), filtros da tela (F), rascunho da nota (draft) e aba do Cadastro.
let S = JSON.parse(localStorage.getItem(KEY) || 'null');

const fresh = () => ({
  notes: JSON.parse(JSON.stringify(SEED_NOTES)),
  catalog: 128,
  used: [],
  user: {
    name: 'Marina Duarte',
    email: 'marina@exemplo.com'
  }
});

if (!S) S = fresh();

const save = () => localStorage.setItem(KEY, JSON.stringify(S));

const F = {
  mode: 'month',
  anchor: today(),
  cat: '',
  est: '',
  tab: 'visao',
  line: 'dia',
  bar: 'total',
  q: '',
  all: false,
  open: null,
  nview: 'nota'
};

let draft = null;
let cadTab = 'webcam';

let chat = [{
  from: 'bot',
  t: 'Oi! Eu consulto as suas notas cadastradas e respondo com números. Escolha uma sugestão ou escreva sua pergunta.'
}]; // histórico do Chatbot (somente nesta sessão)
