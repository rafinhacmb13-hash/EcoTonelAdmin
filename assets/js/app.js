const USERS = {
  gestao: { password: '123456', page: 'gestao.html', label: 'Gestão geral' },
  operacao: { password: '123456', page: 'operacao.html', label: 'Operação e logística' },
  administrativo: { password: '123456', page: 'administrativo.html', label: 'Administrativo' },
  financeiro: { password: '123456', page: 'financeiro.html', label: 'Financeiro e precificação' },
  comercial: { password: '123456', page: 'comercial.html', label: 'Comercial e atendimento' }
};

const STORAGE_KEY = 'eco-tonel-dashboard-v2';
const SESSION_KEY = 'eco-tonel-session-v2';

const defaultData = {
  notas: [
    { titulo: 'Prioridade da semana', texto: 'Expandir carteira recorrente e manter agenda operacional organizada.', createdAt: new Date().toISOString() },
    { titulo: 'Atenção ao atendimento', texto: 'Registrar observações dos clientes para facilitar retorno comercial.', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ],
  operacao: [
    { data: todayOffset(0), status: 'Agendada', cliente: 'Condomínio Atlântico', motorista: 'Equipe Norte', endereco: 'Rua das Flores, 210', tambores: 4, observacao: 'Separar material seco.' },
    { data: todayOffset(1), status: 'Em rota', cliente: 'Obra Central', motorista: 'Van 02', endereco: 'Av. Brasil, 880', tambores: 6, observacao: 'Acesso pela lateral.' }
  ],
  administrativo: [
    { cliente: 'Condomínio Atlântico', tipo: 'Contrato', vencimento: todayOffset(5), status: 'Pendente', observacao: 'Aguardando assinatura.' },
    { cliente: 'Obra Central', tipo: 'Ordem de serviço', vencimento: todayOffset(2), status: 'Em análise', observacao: 'Validar volume contratado.' }
  ],
  financeiro: [
    { data: todayOffset(-1), tipo: 'Entrada', categoria: 'Locação mensal', valor: 950, descricao: 'Recebimento cliente fixo.' },
    { data: todayOffset(0), tipo: 'Saída', categoria: 'Combustível', valor: 180, descricao: 'Abastecimento veículo.' }
  ],
  comercial: [
    { nome: 'Residencial Mar Azul', canal: 'WhatsApp', interesse: 'Coleta avulsa', valor: 420, etapa: 'Contato inicial', observacao: 'Pediu retorno hoje à tarde.' },
    { nome: 'Construtora Delta', canal: 'Indicação', interesse: 'Locação mensal', valor: 1850, etapa: 'Proposta enviada', observacao: 'Boa chance de fechamento.' }
  ]
};

function todayOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(defaultData);
      return structuredClone(defaultData);
    }
    const parsed = JSON.parse(raw);
    return {
      notas: parsed.notas || [],
      operacao: parsed.operacao || [],
      administrativo: parsed.administrativo || [],
      financeiro: parsed.financeiro || [],
      comercial: parsed.comercial || []
    };
  } catch (error) {
    console.error(error);
    saveData(defaultData);
    return structuredClone(defaultData);
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function setSession(user) {
  const role = USERS[user];
  if (!role) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, label: role.label, at: new Date().toISOString() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth(page) {
  const session = getSession();
  if (page === 'login') return;
  if (!session || !USERS[session.user]) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function bindCommon(page) {
  const session = getSession();
  document.querySelectorAll('[data-session-label]').forEach(el => {
    if (session) el.textContent = `Acesso atual: ${session.label}`;
  });

  document.querySelectorAll('.nav a[data-role]').forEach(link => {
    const role = link.dataset.role;
    if (page === role) link.classList.add('active');
    if (session && session.user !== 'gestao' && role !== session.user) {
      link.style.opacity = '0.78';
    }
  });

  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'index.html';
    });
  });

  document.querySelectorAll('#resetDemoBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      saveData(structuredClone(defaultData));
      showToast('Dados de demonstração restaurados.');
      setTimeout(() => window.location.reload(), 500);
    });
  });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderTable(containerId, columns, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = '<div class="empty-state">Nenhum registro encontrado.</div>';
    return;
  }
  const head = columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('');
  const body = rows.map(row => `<tr>${columns.map(col => `<td>${col.render ? col.render(row[col.key], row) : escapeHtml(row[col.key])}</td>`).join('')}</tr>`).join('');
  container.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderList(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!items.length) {
    container.innerHTML = '<li class="empty-state">Nenhuma anotação cadastrada.</li>';
    return;
  }
  container.innerHTML = items.slice().reverse().map(item => `
    <li>
      <strong>${escapeHtml(item.titulo)}</strong>
      <div>${escapeHtml(item.texto)}</div>
      <small>${new Date(item.createdAt).toLocaleString('pt-BR')}</small>
    </li>`).join('');
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const user = form.user.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const account = USERS[user];
    if (!account || account.password !== password) {
      showToast('Usuário ou senha inválidos.');
      return;
    }
    setSession(user);
    showToast('Login realizado com sucesso.');
    setTimeout(() => { window.location.href = account.page; }, 250);
  });
}

function setupGestao(data) {
  document.getElementById('gestaoColetas').textContent = String(data.operacao.length);
  document.getElementById('gestaoDocs').textContent = String(data.administrativo.length);
  document.getElementById('gestaoLeads').textContent = String(data.comercial.length);
  const saldo = data.financeiro.reduce((acc, item) => acc + (item.tipo === 'Entrada' ? Number(item.valor) : -Number(item.valor)), 0);
  document.getElementById('gestaoSaldo').textContent = formatMoney(saldo);
  renderList('notasList', data.notas);

  const lastOp = data.operacao.slice(-3).reverse();
  document.getElementById('gestaoResumoOperacao').innerHTML = lastOp.length
    ? lastOp.map(item => `<div class="hero-point"><strong>${escapeHtml(item.cliente)}</strong>${escapeHtml(item.data)} • ${escapeHtml(item.status)} • ${escapeHtml(String(item.tambores))} tambores</div>`).join('')
    : '<div class="empty-state">Sem dados operacionais.</div>';

  const lastFin = data.financeiro.slice(-3).reverse();
  document.getElementById('gestaoResumoFinanceiro').innerHTML = lastFin.length
    ? lastFin.map(item => `<div class="hero-point"><strong>${escapeHtml(item.categoria)}</strong>${escapeHtml(item.tipo)} • ${formatMoney(item.valor)}</div>`).join('')
    : '<div class="empty-state">Sem dados financeiros.</div>';

  const lastCom = data.comercial.slice(-3).reverse();
  document.getElementById('gestaoResumoComercial').innerHTML = lastCom.length
    ? lastCom.map(item => `<div class="hero-point"><strong>${escapeHtml(item.nome)}</strong>${escapeHtml(item.etapa)} • ${formatMoney(item.valor)}</div>`).join('')
    : '<div class="empty-state">Sem dados comerciais.</div>';

  const form = document.getElementById('gestaoForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    data.notas.push({
      titulo: form.titulo.value.trim(),
      texto: form.texto.value.trim(),
      createdAt: new Date().toISOString()
    });
    saveData(data);
    showToast('Nota salva com sucesso.');
    form.reset();
    setupGestao(data);
  });
}

function setupOperacao(data) {
  const items = data.operacao;
  document.getElementById('operacaoTotal').textContent = String(items.length);
  document.getElementById('operacaoTambores').textContent = String(items.reduce((acc, item) => acc + Number(item.tambores || 0), 0));
  document.getElementById('operacaoEmRota').textContent = String(items.filter(i => i.status === 'Em rota').length);
  document.getElementById('operacaoPendentes').textContent = String(items.filter(i => i.status === 'Pendente').length);

  renderTable('operacaoTable', [
    { key: 'data', label: 'Data' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'status', label: 'Status', render: value => `<span class="chip">${escapeHtml(value)}</span>` },
    { key: 'tambores', label: 'Tambores' },
    { key: 'motorista', label: 'Equipe' },
    { key: 'endereco', label: 'Endereço' }
  ], items.slice().reverse());

  const form = document.getElementById('operacaoForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    data.operacao.push(Object.fromEntries(new FormData(form).entries()));
    saveData(data);
    showToast('Coleta registrada.');
    form.reset();
    form.data.value = todayOffset(0);
    setupOperacao(data);
  }, { once: true });

  if (form && !form.data.value) form.data.value = todayOffset(0);
}

function setupAdministrativo(data) {
  const items = data.administrativo;
  document.getElementById('admTotal').textContent = String(items.length);
  document.getElementById('admPendentes').textContent = String(items.filter(i => i.status === 'Pendente').length);
  document.getElementById('admAnalise').textContent = String(items.filter(i => i.status === 'Em análise').length);
  document.getElementById('admVencendo').textContent = String(items.filter(i => {
    const diff = (new Date(i.vencimento) - new Date()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length);

  renderTable('administrativoTable', [
    { key: 'cliente', label: 'Cliente' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'vencimento', label: 'Vencimento' },
    { key: 'status', label: 'Status', render: value => `<span class="chip">${escapeHtml(value)}</span>` },
    { key: 'observacao', label: 'Observação' }
  ], items.slice().reverse());

  const form = document.getElementById('administrativoForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    data.administrativo.push(Object.fromEntries(new FormData(form).entries()));
    saveData(data);
    showToast('Registro administrativo salvo.');
    form.reset();
    form.vencimento.value = todayOffset(0);
    setupAdministrativo(data);
  }, { once: true });

  if (form && !form.vencimento.value) form.vencimento.value = todayOffset(0);
}

function setupFinanceiro(data) {
  const items = data.financeiro.map(item => ({ ...item, valor: Number(item.valor) }));
  const entradas = items.filter(i => i.tipo === 'Entrada').reduce((acc, item) => acc + item.valor, 0);
  const saidas = items.filter(i => i.tipo === 'Saída').reduce((acc, item) => acc + item.valor, 0);
  document.getElementById('finEntradas').textContent = formatMoney(entradas);
  document.getElementById('finSaidas').textContent = formatMoney(saidas);
  document.getElementById('finSaldo').textContent = formatMoney(entradas - saidas);
  document.getElementById('finQtde').textContent = String(items.length);

  renderTable('financeiroTable', [
    { key: 'data', label: 'Data' },
    { key: 'tipo', label: 'Tipo', render: value => `<span class="chip">${escapeHtml(value)}</span>` },
    { key: 'categoria', label: 'Categoria' },
    { key: 'valor', label: 'Valor', render: value => formatMoney(value) },
    { key: 'descricao', label: 'Descrição' }
  ], items.slice().reverse());

  const form = document.getElementById('financeiroForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const entry = Object.fromEntries(new FormData(form).entries());
    entry.valor = Number(entry.valor || 0);
    data.financeiro.push(entry);
    saveData(data);
    showToast('Lançamento financeiro salvo.');
    form.reset();
    form.data.value = todayOffset(0);
    setupFinanceiro(data);
  }, { once: true });

  if (form && !form.data.value) form.data.value = todayOffset(0);
}

function setupComercial(data) {
  const items = data.comercial.map(item => ({ ...item, valor: Number(item.valor) }));
  document.getElementById('comLeads').textContent = String(items.length);
  document.getElementById('comPipeline').textContent = formatMoney(items.reduce((acc, item) => acc + item.valor, 0));
  document.getElementById('comPropostas').textContent = String(items.filter(i => i.etapa === 'Proposta enviada').length);
  document.getElementById('comContato').textContent = String(items.filter(i => i.etapa === 'Contato inicial').length);

  renderTable('comercialTable', [
    { key: 'nome', label: 'Lead' },
    { key: 'canal', label: 'Canal' },
    { key: 'interesse', label: 'Interesse' },
    { key: 'valor', label: 'Valor estimado', render: value => formatMoney(value) },
    { key: 'etapa', label: 'Etapa', render: value => `<span class="chip">${escapeHtml(value)}</span>` }
  ], items.slice().reverse());

  const form = document.getElementById('comercialForm');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    const entry = Object.fromEntries(new FormData(form).entries());
    entry.valor = Number(entry.valor || 0);
    data.comercial.push(entry);
    saveData(data);
    showToast('Lead salvo com sucesso.');
    form.reset();
    setupComercial(data);
  }, { once: true });
}

(function init() {
  const page = document.body.dataset.page;
  if (!page) return;
  if (page !== 'login' && !requireAuth(page)) return;
  const data = loadData();
  if (page === 'login') {
    setupLogin();
    return;
  }
  bindCommon(page);
  if (page === 'gestao') setupGestao(data);
  if (page === 'operacao') setupOperacao(data);
  if (page === 'administrativo') setupAdministrativo(data);
  if (page === 'financeiro') setupFinanceiro(data);
  if (page === 'comercial') setupComercial(data);
})();
