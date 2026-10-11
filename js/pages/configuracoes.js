'use strict';

P.configuracoes = () =>
  head('Conta · ' + esc(S.user.name.split(' ')[0]).toUpperCase(), 'Configurações') +
  `
    <div style="max-width:950px">
      <div class="card mt">
        <div class="mono lab" style="margin-bottom:18px">Perfil</div>
        <div class="grid2">
          <div class="fld">
            <label class="mono lab">Nome</label>
            <input id="u_n" value="${esc(S.user.name)}">
          </div>
          <div class="fld">
            <label class="mono lab">E-mail</label>
            <input id="u_e" value="${esc(S.user.email)}">
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:22px">
        <button
          class="btn"
          style="background:transparent;color:var(--mute);border:1px solid #bfc4ae"
          data-a="reset"
        >
          Restaurar dados de demonstração
        </button>
        <button class="btn dk big" data-a="saveu">Salvar alterações</button>
      </div>
    </div>
  `;
