'use strict';

// Roteador, render e eventos globais.
function render() {
  $('#pmenu').hidden = true;

  const r = (location.hash.replace('#/', '') || 'inicio').split('/')[0];
  const k = P[r] ? r : 'inicio';

  chrome(k);
  $('#view').innerHTML = P[k]();
  document.title = 'GestorIA · ' + k;

  if (k === 'chatbot') chatBind();

  if (k === 'cadastro' && cadTab === 'webcam') {
    startCam();
    const v = $('#vid');
    if (v && window.camSt) v.srcObject = window.camSt;
  } else {
    stopCam();
  }

  const h = $('#hit');
  if (h) {
    const mv = (e) => {
      const b = $('#lc').getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width * 640;
      let bi = 0;
      LP.forEach((a, i) => {
        if (Math.abs(a.x - x) < Math.abs(LP[bi].x - x)) bi = i;
      });
      tip(bi);
    };
    h.onmousemove = mv;
    tip(LP.indexOf(LP.reduce((a, b) => (b.v > a.v ? b : a))));
  }

  const q = $('#q');
  if (q) {
    q.oninput = (e) => {
      F.q = e.target.value;
      const p = e.target.selectionStart;
      render();
      const n = $('#q');
      n.focus();
      n.setSelectionRange(p, p);
    };
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#pmenu') && !e.target.closest('#av')) $('#pmenu').hidden = true;

  const g = e.target.closest('[data-go]');
  if (g) {
    location.hash = '#/' + g.dataset.go;
    if (g.dataset.go === 'financas') F.tab = 'visao';
    return;
  }

  const t = e.target.closest('[data-a]');
  if (!t) {
    if (e.target.id === 'modal') modal();
    return;
  }

  const a = t.dataset.a;
  const v = t.dataset.v;

  const A = {
    mode() {
      F.mode = v;
      F.anchor = F.mode === '30' ? today() : F.anchor;
    },
    shift() {
      shift(+v);
    },
    cat() {
      F.cat = v;
    },
    est() {
      F.est = v;
    },
    ftab() {
      F.tab = v;
    },
    line() {
      F.line = v;
    },
    bar() {
      F.bar = v;
    },
    all() {
      F.all = true;
    },
    open() {
      if (location.hash.includes('notas')) {
        F.open = F.open === v ? null : v;
      } else {
        F.open = v;
        location.hash = '#/notas';
      }
    },
    ctab() {
      cadTab = v;
      stopCam();
    },
    scan: readNote,
    chave() {
      const k = ($('#chave').value || '').replace(/\D/g, '');
      k.length === 44 ? readNote() : toast('A chave de acesso tem 44 dígitos.');
    },
    madd() {
      const nm = $('#m_nm').value.trim();
      const q = +$('#m_q').value;
      const tv = +$('#m_v').value;

      if (!nm || !q || !tv) {
        return toast('Preencha item, quantidade e valor.');
      }

      const [c, s] = classify(nm);
      draft = draft || { est: $('#m_est').value, nf: '', date: $('#m_dt').value, items: [] };
      draft.est = $('#m_est').value;
      draft.date = $('#m_dt').value;
      draft.items.push({
        name: nm,
        qty: q,
        unit: $('#m_u').value,
        total: tv,
        unitPrice: Math.round((tv / q) * 100) / 100,
        cat: c,
        storage: s
      });
      $('#m_nm').value = '';
    },
    tag() {
      const o = ['geladeira', 'despensa', 'freezer'];
      const i = draft.items[+v];
      i.storage = o[(o.indexOf(i.storage) + 1) % 3];
    },
    rm() {
      draft.items.splice(+v, 1);
      if (!draft.items.length && cadTab !== 'manual') draft = null;
    },
    discard() {
      draft = null;
    },
    confirm: confirmNote,
    sheet() {
      if (location.hash.includes('notas')) {
        return document.getElementById('prev').scrollIntoView({ behavior: 'smooth' });
      }

      modal(sheetCard() + `<div style="text-align:right;margin-top:14px"><span class="sc" data-a="close">Fechar</span></div>`);
      return 1;
    },
    close() {
      modal();
      return 1;
    },
    xlsx() {
      exportXlsx();
      return 1;
    },
    del() {
      if (confirm('Excluir esta nota?')) {
        S.notes = S.notes.filter((n) => n.id != v);
        F.open = null;
        save();
      }
    },
    perfil() {
      const m = $('#pmenu');
      m.innerHTML = profileMenu();
      m.hidden = !m.hidden;
      return 1;
    },
    meusdados() {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.download = 'gestoria-meus-dados.json';
      a.click();
      return 1;
    },
    ask() {
      sendChat(v);
    },
    send() {
      const i = $('#chat-in');
      if (i.value.trim()) sendChat(i.value.trim());
    },
    saveu() {
      S.user.name = $('#u_n').value || S.user.name;
      S.user.email = $('#u_e').value;
      save();
      toast('Alterações salvas');
    },
    reset() {
      if (confirm('Restaurar os dados de demonstração?')) {
        S = fresh();
        save();
        toast('Dados restaurados');
      }
    }
  };

  if (a === 'catsel' || a === 'estsel') return;

  const keep = A[a] && A[a]();
  if (!keep) {
    if (['cat', 'est', 'shift', 'mode', 'ftab', 'open'].includes(a) && a !== 'open') F.open = null;
    save();
    render();
  }
});

document.addEventListener('change', (e) => {
  const a = e.target.dataset.a;
  if (a === 'catsel') {
    F.cat = e.target.value;
    render();
  }

  if (a === 'estsel') {
    F.est = e.target.value;
    render();
  }
});

window.addEventListener('hashchange', render);
render();
