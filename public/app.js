

// ================================================================
// 主题切换
// ================================================================



function toggleGroup(el) {
  var body = el.nextElementSibling;
  if (!body) return;
  var isOpen = body.classList.contains('open');
  body.classList.toggle('open');
  var arrow = el.querySelector('.fg-arrow');
  if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}





function extractUrl(t) {
  if (!t) return '';
  var m = t.match(/https?:\/\/[^\s]+/);
  return m ? m[0] : t;
}

function searchAndGo(query) {
  var inp = document.getElementById('sS');
  if (inp) inp.value = query;
  var allBtn = document.querySelector('.pg .fp[onclick*="all"]');
  if (allBtn) allBtn.click();
  curPage = 1;
  go('lib');
}


function searchAndGo(query) {
  var inp = document.getElementById('sS');
  if (inp) inp.value = query;
  var allBtn = document.querySelector('.pg .fp[onclick*="all"]');
  if (allBtn) allBtn.click();
  curPage = 1;
  go('lib');
}


function searchAndGo(query) {
  var inp = document.getElementById('sS');
  if (inp) inp.value = query;
  var allBtn = document.querySelector('.pg .fp[onclick*="all"]');
  if (allBtn) allBtn.click();
  curPage = 1;
  go('lib');
}


function searchAndGo(query) {
  var inp = document.getElementById('sS');
  if (inp) inp.value = query;
  var allBtn = document.querySelector('.pg .fp[onclick*="all"]');
  if (allBtn) allBtn.click();
  curPage = 1;
  go('lib');
}


function searchAndGo(query) {
  var inp = document.getElementById('sS');
  if (inp) inp.value = query;
  var allBtn = document.querySelector('.pg .fp[onclick*="all"]');
  if (allBtn) allBtn.click();
  curPage = 1;
  go('lib');
}
function toggleTheme() {
  var html = document.documentElement;
  var isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    document.getElementById('themeIcon').textContent = '🌙';
    document.getElementById('themeLabel').textContent = '暗色主题';
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('themeIcon').textContent = '☀️';
    document.getElementById('themeLabel').textContent = '亮色主题';
  }
}

function initTheme() {
  var saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    var icon = document.getElementById('themeIcon');
    var label = document.getElementById('themeLabel');
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = '亮色主题';
  }
}

function initTheme() {
  var saved = localStorage.getItem(theme);
  if (saved === dark) {
    document.documentElement.setAttribute(data-theme, dark);
    var icon = document.getElementById(themeIcon);
    var label = document.getElementById(themeLabel);
    if (icon) icon.textContent = u2600uFE0F;
    if (label) label.textContent = u4EAEu8272u4E3Bu9898;
  }
}

/* ==============================================================
   灵感库 v3 — 数据存储在 MySQL 服务端，多人实时同步
   ============================================================== */

// ============ 数据层（全部走 API） ============
let DATA = [];

async function refreshData() {
  try {
    const res = await fetch('/inspiration/api/materials');
    if (res.ok) DATA = await res.json();
  } catch (e) { console.warn('refreshData error:', e); }
  return DATA;
}

// ============ 状态 ============
let editingId = null;
let sSt = '待复刻';
let fSt = 'all';
let charts = {};
let replInspId = null;
let rfEff = '跑量';
let curPage = 1;
const PAGE_SIZE = 20;

// ============ 下拉建议管理 ============
const DL_KEY = 'inspiration_dl_opts';

function loadDlOpts() {
  const saved = JSON.parse(localStorage.getItem(DL_KEY) || '{}');
  ['dlBrand','dlCat','dlVisual','dlPsych'].forEach(id => {
    const dl = document.getElementById(id);
    if (!dl) return;
    const builtin = [...dl.querySelectorAll('option')].map(o => o.value);
    const user = saved[id] || [];
    const all = [...new Set([...builtin, ...user])];
    dl.innerHTML = all.map(v => `<option value="${esc(v)}">`).join('');
  });
}

function saveDlOpt(listId, val) {
  if (!val || !val.trim()) return;
  val = val.trim();
  const saved = JSON.parse(localStorage.getItem(DL_KEY) || '{}');
  if (!saved[listId]) saved[listId] = [];
  if (!saved[listId].includes(val)) {
    saved[listId].push(val);
    localStorage.setItem(DL_KEY, JSON.stringify(saved));
    const dl = document.getElementById(listId);
    if (dl) { const opt = document.createElement('option'); opt.value = val; dl.appendChild(opt); }
  }
}

// ================================================================
// 工具
// ================================================================

const td = () => new Date().toISOString().split('T')[0];
const esc = s => { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

// 自动处理 401 会话过期 — 全局拦截
const origFetch = window.fetch;
window.fetch = async function(url, opts) {
  const res = await origFetch(url, opts);
  if (res.status === 401 && !url.toString().includes('/inspiration/api/auth/')) {
    location.reload();
    throw new Error('未登录');
  }
  return res;
};

function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = 'tst tst-' + type;
  t.textContent = msg;
  document.getElementById('tBox').appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2600);
}

// ================================================================
// 日期选择器
// ================================================================

let dpTarget = null, dpY = 0, dpM = 0;

function openDatePicker(inputId) {
  dpTarget = document.getElementById(inputId);
  if (!dpTarget) return;
  const now = new Date();
  const val = dpTarget.value;
  if (val) { const p = val.split('-'); if (p.length === 3) { dpY = parseInt(p[0]); dpM = parseInt(p[1]) - 1; } else { dpY = now.getFullYear(); dpM = now.getMonth(); } }
  else { dpY = now.getFullYear(); dpM = now.getMonth(); }
  renderDP();
  document.getElementById('dp').style.display = 'flex';
}
function dpClose(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('dp').style.display = 'none'; dpTarget = null; }
function dpCancel() { document.getElementById('dp').style.display = 'none'; dpTarget = null; }
function dpToday() { if (!dpTarget) return; const d = new Date(); dpTarget.value = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); document.getElementById('dp').style.display = 'none'; dpTarget = null; }
function dpMonth(delta) { dpM += delta; if (dpM < 0) { dpM = 11; dpY--; } if (dpM > 11) { dpM = 0; dpY++; } renderDP(); }
function renderDP() {
  document.getElementById('dpYM').textContent = dpY + '年' + (dpM+1) + '月';
  const grid = document.getElementById('dpGD');
  const today = new Date();
  const sel = dpTarget ? dpTarget.value.split('-').map(Number) : null;
  const first = new Date(dpY, dpM, 1).getDay();
  const startOff = first === 0 ? 6 : first - 1;
  const daysInMonth = new Date(dpY, dpM+1, 0).getDate();
  const daysInPrev = new Date(dpY, dpM, 0).getDate();
  let html = '';
  for (let i = startOff - 1; i >= 0; i--) html += `<button class="dp-d dim">${daysInPrev - i}</button>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = dpY === today.getFullYear() && dpM === today.getMonth() && d === today.getDate();
    const isSel = sel && sel[0] === dpY && sel[1] === dpM+1 && sel[2] === d;
    html += `<button class="dp-d${isToday?' today':''}${isSel?' sel':''}" onclick="dpSelect(${d})">${d}</button>`;
  }
  const total = startOff + daysInMonth;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= rem; d++) html += `<button class="dp-d dim">${d}</button>`;
  grid.innerHTML = html;
}
function dpSelect(day) { if (!dpTarget) return; dpTarget.value = dpY + '-' + String(dpM+1).padStart(2,'0') + '-' + String(day).padStart(2,'0'); document.getElementById('dp').style.display = 'none'; dpTarget = null; }

// ================================================================
// 导航
// ================================================================

function toggleSidebar() { document.querySelector('.sb').classList.toggle('open'); }

async function go(tab) {
  var cur = document.querySelector('.tab.on');
  if (cur) {
    gsap.to(cur, { opacity: 0, y: -8, duration: 0.12, ease: 'power1.out', onComplete: function() {
      cur.classList.remove('on');
      cur.style.opacity = '';
      cur.style.transform = '';
      var next = document.getElementById('t-' + tab);
      if (next) {
        next.classList.add('on');
        gsap.fromTo(next, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
      }
    }});
  } else {
    var next = document.getElementById('t-' + tab);
    if (next) {
      next.classList.add('on');
      gsap.fromTo(next, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
    }
  }
  document.querySelectorAll('.sbn').forEach(function(b) { b.classList.remove('on'); });
  var sbn = document.querySelector('.sbn[data-t="' + tab + '"]');
  if (sbn) sbn.classList.add('on');
  document.querySelectorAll('.bnb').forEach(function(b) { b.classList.remove('on'); });
  var bnb = document.querySelector('.bnb[data-t="' + tab + '"]');
  if (bnb) bnb.classList.add('on');
  if (window.innerWidth <= 860) { var sb = document.querySelector('.sb'); if (sb) sb.classList.remove('open'); }
  if (tab === 'lib') await renderLib();
  if (tab === 'stats') await renderStats();
  if (tab === 'ai') await renderAI();
}

function pickSt(v) {
  sSt = v;
  document.querySelectorAll('#stG .pill').forEach(b => {
    b.className = 'pill';
    const map = { '待复刻': 't-on', '已验证': 'r-on', '淘汰': 's-on' };
    if (b.dataset.v === v) b.classList.add(map[v]);
  });
}

// ================================================================
// 灵感表单
// ================================================================

function clearF() {
  ['fLink','fName','fBrand','fCat','fVisual','fHook','fPsych','fNote'].forEach(i => document.getElementById(i).value = '');
  document.getElementById('fDate').value = td();
  pickSt('待复刻');
  editingId = null;
  document.getElementById('saveBtn').textContent = '💾 保存灵感';
  document.getElementById('cancelBtn').style.display = 'none';
}

function cancelEdit() { clearF(); toast('已取消', 'inf'); }

async function save() {
  const name = document.getElementById('fName').value.trim();
  if (!name) { toast('请填写灵感名称', 'err'); return; }

  const obj = {
    link: document.getElementById('fLink').value.trim(),
    name,
    brand: document.getElementById('fBrand').value.trim(),
    category: document.getElementById('fCat').value.trim(),
    visual: document.getElementById('fVisual').value.trim(),
    hook: document.getElementById('fHook').value.trim(),
    psychology: document.getElementById('fPsych').value.trim(),
    status: sSt,
    date: document.getElementById('fDate').value || td(),
    note: document.getElementById('fNote').value.trim()
  };

  try {
    if (editingId) {
      await fetch('/inspiration/api/materials/' + editingId, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) });
      toast('已更新', 'ok');
    } else {
      await fetch('/inspiration/api/materials', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(obj) });
      toast('已保存', 'ok');
    }
    clearF();
    await refreshData();
  } catch (err) { toast('保存失败: ' + err.message, 'err'); }
}

// ================================================================
// 编辑灵感冒窗
// ================================================================

let emId = null, emSt = '待复刻';

function editInspiration(id) {
  const d = DATA.find(x => x.id === id);
  if (!d) return;
  emId = id;
  document.getElementById('emLink').value = d.link || '';
  document.getElementById('emName').value = d.name;
  document.getElementById('emBrand').value = d.brand || '';
  document.getElementById('emCat').value = d.category || '';
  document.getElementById('emVisual').value = d.visual || '';
  document.getElementById('emHook').value = d.hook || '';
  document.getElementById('emPsych').value = d.psychology || '';
  document.getElementById('emDate').value = d.date || '';
  document.getElementById('emNote').value = d.note || '';
  emSt = d.status || '待复刻';
  document.querySelectorAll('#emStG .pill').forEach(b => {
    b.className = 'pill';
    const map = { '待复刻': 't-on', '已验证': 'r-on', '淘汰': 's-on' };
    if (b.dataset.v === emSt) b.classList.add(map[emSt]);
  });
  document.getElementById('editModal').style.display = 'flex';
}

function emPickSt(v) {
  emSt = v;
  document.querySelectorAll('#emStG .pill').forEach(b => {
    b.className = 'pill';
    const map = { '待复刻': 't-on', '已验证': 'r-on', '淘汰': 's-on' };
    if (b.dataset.v === v) b.classList.add(map[v]);
  });
}

function closeEditModal() { document.getElementById('editModal').style.display = 'none'; emId = null; }

async function saveEditModal() {
  if (!emId) return;
  const name = document.getElementById('emName').value.trim();
  if (!name) { toast('请填写灵感名称', 'err'); return; }

  try {
    await fetch('/inspiration/api/materials/' + emId, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        link: document.getElementById('emLink').value.trim(), name,
        brand: document.getElementById('emBrand').value.trim(),
        category: document.getElementById('emCat').value.trim(),
        visual: document.getElementById('emVisual').value.trim(),
        hook: document.getElementById('emHook').value.trim(),
        psychology: document.getElementById('emPsych').value.trim(),
        status: emSt,
        date: document.getElementById('emDate').value || '',
        note: document.getElementById('emNote').value.trim()
      })
    });
    closeEditModal();
    await refreshData();
    await renderLib();
    toast('已更新 ✅', 'ok');
  } catch (err) { toast('更新失败: ' + err.message, 'err'); }
}

async function delInspiration(id) {
  if (!confirm('确认删除这个灵感及其所有复刻记录？')) return;
  try {
    await fetch('/inspiration/api/materials/' + id, { method: 'DELETE' });
    await refreshData();
    await renderLib();
    toast('已删除', 'ok');
  } catch (err) { toast('删除失败: ' + err.message, 'err'); }
}

// ================================================================
// 复刻弹窗
// ================================================================

function openReplForm(id) {
  const insp = DATA.find(d => d.id === id);
  if (!insp) return;
  replInspId = id;
  document.getElementById('replModalInsp').textContent = '为「' + insp.name + '」添加复刻';
  document.getElementById('rfLink').value = '';
  document.getElementById('rfSpend').value = '';
  document.getElementById('rfImp').value = '';
  document.getElementById('rfDate').value = td();
  document.getElementById('rfNotes').value = '';
  rfEff = '跑量';
  document.querySelectorAll('#rfEffG .pill').forEach(b => { b.className = 'pill'; if (b.dataset.v === '跑量') b.classList.add('r-on'); });
  document.getElementById('replModal').style.display = 'flex';
  document.getElementById('rfLink').focus();
}

function closeReplForm() { document.getElementById('replModal').style.display = 'none'; replInspId = null; }

function pickRfEff(v) {
  rfEff = v;
  document.querySelectorAll('#rfEffG .pill').forEach(b => {
    b.className = 'pill';
    const map = { '跑量': 'r-on', '一般': 'd-on', '无效果': 's-on' };
    if (b.dataset.v === v) b.classList.add(map[v]);
  });
}

async function saveReplication() {
  if (!replInspId) return;
  const link = document.getElementById('rfLink').value.trim();
  if (!link) { toast('请填写复刻视频链接', 'err'); return; }

  try {
    await fetch('/inspiration/api/replications', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        materialId: replInspId, link,
        spend: parseFloat(document.getElementById('rfSpend').value) || 0,
        impressions: parseInt(document.getElementById('rfImp').value) || 0,
        effect: rfEff,
        notes: document.getElementById('rfNotes').value.trim(),
        date: document.getElementById('rfDate').value || td()
      })
    });
    closeReplForm();
    await refreshData();
    await renderLib();
    toast('复刻记录已保存 ✅', 'ok');
  } catch (err) { toast('保存失败: ' + err.message, 'err'); }
}

async function delReplication(inspId, replId) {
  try {
    await fetch('/inspiration/api/replications/' + replId, { method: 'DELETE' });
    await refreshData();
    await renderLib();
    toast('已删除复刻记录', 'ok');
  } catch (err) { toast('删除失败: ' + err.message, 'err'); }
}

// ================================================================
// 灵感库渲染
// ================================================================

function loadLibData() {
  if (!DATA) return [];
  let data = [...DATA];
  const search = document.getElementById('sS')?.value?.trim().toLowerCase();
  const brand = document.getElementById('sB')?.value?.trim().toLowerCase();
  if (search) {
    data = data.filter(d =>
      (d.name||'').toLowerCase().includes(search) ||
      (d.visual||'').toLowerCase().includes(search) ||
      (d.hook||'').toLowerCase().includes(search) ||
      (d.psychology||'').toLowerCase().includes(search)
    );
  }
  if (fSt !== 'all') data = data.filter(d => d.status === fSt);
  if (brand) data = data.filter(d => (d.brand||'').toLowerCase().includes(brand));
  return data;
}

async function renderLib() {
  await refreshData();
  const list = document.getElementById('libList');
  const empty = document.getElementById('libE');
  const pgBar = document.getElementById('pgBar');
  const pgInfo = document.getElementById('pgInfo');
  const pgPrev = document.getElementById('pgPrev');
  const pgNext = document.getElementById('pgNext');
  const countEl = document.getElementById('libCount');

  const allData = loadLibData();
  const totalFiltered = allData.length;
  const totalAll = DATA.length;
  const maxPage = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  if (curPage > maxPage) curPage = maxPage;
  const start = (curPage - 1) * PAGE_SIZE;
  const data = allData.slice(start, start + PAGE_SIZE);
  countEl.textContent = totalAll > 0 ? '共 ' + totalAll + ' 条' : '';

  if (!allData.length) {
    list.innerHTML = '';
    pgBar.style.display = 'none';
    empty.style.display = totalAll === 0 ? 'block' : 'none';
    if (totalAll > 0) list.innerHTML = '<div class="empty" style="padding:30px"><p>🔍 没有匹配的灵感</p><p class="hint">试试其他搜索词</p></div>';
    return;
  }
  empty.style.display = 'none';

  if (maxPage > 1) {
    pgBar.style.display = 'flex';
    pgInfo.textContent = curPage + ' / ' + maxPage;
    pgPrev.disabled = curPage <= 1;
    pgNext.disabled = curPage >= maxPage;
  } else pgBar.style.display = 'none';

  var frag = '<div class="mc-grid">' + data.map(d => {
    const stMap = { '待复刻':'s-待复刻','已验证':'s-已验证','淘汰':'s-淘汰' };
    const sc = stMap[d.status] || 's-待复刻';
    const reps = d.replications || [];
    const repCount = reps.length;
    const effCount = { '跑量':0,'一般':0,'无效果':0 };
    reps.forEach(r => { if (effCount[r.effect] !== undefined) effCount[r.effect]++; });
    let effTags = '';
    if (repCount > 0) effTags = Object.entries(effCount).filter(([k,v])=>v>0).map(([k,v])=>`<span class="eff eff-${k}">${k} ${v}</span>`).join('');

    return `<div class="mc">
      <div class="mc-top"><div class="mc-n">${esc(d.name)}</div><div class="mc-st ${sc}">${d.status}</div></div>
      ${d.link ? (function(){var m=d.link.match(/https?:\/\/([^\/]+)/);var dom=m?m[1]:'';return '<div class="mc-link-row"><span class="fav">🔗</span><a href="'+esc(extractUrl(d.link))+'" target="_blank">点击查看原视频</a></div>'})() : ''}
      <div class="mc-visual">${d.visual ? '<span class="vtag"><span class="vico">🎨</span>'+esc(d.visual)+'</span>' : ''}${d.hook ? '<span class="vtag"><span class="vico">💬</span>'+esc(d.hook)+'</span>' : ''}</div>
      <div class="mc-tg">${d.brand ? '<span class="tg"><span class="tl">品牌</span>'+esc(d.brand)+'</span>' : ''}${d.category ? '<span class="tg"><span class="tl">品类</span>'+esc(d.category)+'</span>' : ''}</div>
      <div class="mc-stats">${repCount > 0 ? '<span class="mc-stat"><span class="sv">'+repCount+'</span>次复刻</span>'+effTags : '<span class="mc-stat">⏳ 尚未复刻</span>'}</div>
      <div class="mc-act">
        <button class="btn-repl" onclick="openReplForm('${d.id}')">➕ 添加复刻</button>
        ${repCount > 0 ? `<button onclick="toggleDetail('${d.id}')">📋 详情</button>` : ''}
        <button onclick="editInspiration('${d.id}')">✏️</button>
        <button class="del" onclick="delInspiration('${d.id}')">🗑️</button>
      </div>
      <div class="mc-detail" id="detail-${d.id}" style="display:none">
        <div class="repl-list-label">复刻记录</div>
        ${reps.map(r => {
          const emoji = {'跑量':'✅','一般':'👌','无效果':'❌'};
          return `<div class="repl-item">
            <div class="repl-top"><span class="repl-eff eff-${r.effect}">${emoji[r.effect]||'👌'} ${r.effect}</span><span class="repl-date">${r.date||'-'}</span><button class="repl-del" onclick="delReplication('${d.id}','${r.id}')">✕</button></div>
            <div class="repl-row">${r.link ? '<span class="repl-link" onclick="window.open(\''+esc(r.link)+'\',\'_blank\')">🔗 视频</span>' : ''}<span>💰 ¥${(r.spend||0).toLocaleString()}</span><span>👁️ ${(r.impressions||0).toLocaleString()}</span></div>
            ${r.notes ? '<div class="repl-notes">📝 '+esc(r.notes)+'</div>' : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('') + '</div>';
}

function toggleDetail(id) { const el = document.getElementById('detail-'+id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none'; }

function onSearch() { curPage = 1; renderLib(); }
function goPage(dir) { const allData = loadLibData(); const maxPage = Math.max(1, Math.ceil(allData.length/PAGE_SIZE)); curPage = Math.max(1, Math.min(maxPage, curPage+dir)); renderLib(); window.scrollTo({top: document.getElementById('libList').offsetTop-80, behavior:'smooth'}); }
function setF(btn, val) { fSt = val; curPage = 1; document.querySelectorAll('.pg .fp').forEach(b => b.classList.remove('on')); btn.classList.add('on'); renderLib(); }

// ================================================================
// 导出 Excel
// ================================================================

async function doExport() {
  await refreshData();
  if (!DATA.length) { toast('没有数据可导出', 'err'); return; }

  const rows1 = DATA.map(d => ({
    '灵感名称': d.name, '视频链接': d.link||'', '品牌': d.brand||'', '产品类别': d.category||'',
    '视觉锤': d.visual||'', '文案钩子': d.hook||'', '心理标签': d.psychology||'',
    '灵感状态': d.status||'', '采集日期': d.date||'', '投手备注': d.note||'', '复刻次数': (d.replications||[]).length,
  }));

  const rows2 = [];
  DATA.forEach(d => { (d.replications||[]).forEach(r => { rows2.push({
    '所属灵感': d.name, '品牌': d.brand||'', '视觉锤': d.visual||'', '心理标签': d.psychology||'',
    '我们拍的链接': r.link||'', '消耗(元)': r.spend||0, '展示量': r.impressions||0,
    '投放效果': r.effect||'', '投手笔记': r.notes||'', '复刻日期': r.date||'',
  }); }); });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows1);
  ws1['!cols'] = [{wch:22},{wch:35},{wch:12},{wch:14},{wch:30},{wch:28},{wch:22},{wch:10},{wch:12},{wch:24},{wch:8}];
  XLSX.utils.book_append_sheet(wb, ws1, '灵感列表');
  const ws2 = XLSX.utils.json_to_sheet(rows2);
  ws2['!cols'] = [{wch:22},{wch:12},{wch:30},{wch:22},{wch:35},{wch:12},{wch:12},{wch:10},{wch:28},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws2, '复刻记录');
  XLSX.writeFile(wb, '灵感库_'+td()+'.xlsx');
  toast('Excel 导出成功 ✅', 'ok');


  // Trend: monthly replication data
  var allReps = [];
  DATA.forEach(function(d) { (d.replications||[]).forEach(function(r) { allReps.push({date:r.date, effect:r.effect, name:d.name, visual:d.visual, brand:d.brand}); }); });
  allReps.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });

  if (allReps.length > 0) {
    var monthMap = {};
    allReps.forEach(function(r) {
      if (!r.date) return;
      var m = r.date.substring(0,7);
      if (!monthMap[m]) monthMap[m] = {total:0, pao:0};
      monthMap[m].total++;
      if (r.effect === '跑量') monthMap[m].pao++;
    });
    var months = Object.keys(monthMap).sort();
    if (months.length > 0) {
      var trendHtml = '<div class="card"><div class="card-h">\uD83D\uDCC8 \u8D8B\u52BF\u5206\u6790 <span style="font-weight:400;font-size:.75rem;color:var(--t4);margin-left:8px">\u6309\u6708\u590D\u523B\u8D8B\u52BF</span></div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u6708\u4EFD</th><th>\u590D\u523B\u6B21\u6570</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
      months.forEach(function(m) {
        var d = monthMap[m];
        var rate = d.total > 0 ? (d.pao/d.total*100).toFixed(0) : 0;
        trendHtml += '<tr><td>'+m+'</td><td>'+d.total+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
      });
      trendHtml += '</tbody></table></div></div>';
      body.insertAdjacentHTML('beforeend', trendHtml);
    }
  }

  // Brand analysis
  var brandMap = {};
  DATA.forEach(function(d) {
    var b = (d.brand || '\u672A\u77E5').trim();
    if (!brandMap[b]) brandMap[b] = {total:0, reps:0, pao:0};
    brandMap[b].total++;
    (d.replications||[]).forEach(function(r) {
      brandMap[b].reps++;
      if(r.effect==='\u8dd1\u91cf') brandMap[b].pao++;
    });
  });
  var brandSorted = Object.keys(brandMap).filter(function(b) { return brandMap[b].reps > 0; }).sort(function(a,b) { return brandMap[b].reps - brandMap[a].reps; });
  if (brandSorted.length > 0) {
    var brandHtml = '<div class="card"><div class="card-h">\uD83C\uDFF7 \u54C1\u724C\u8868\u73B0</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u54C1\u724C</th><th>\u7075\u611F\u6570</th><th>\u590D\u523B</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
    brandSorted.forEach(function(b) {
      var d = brandMap[b];
      var rate = d.reps > 0 ? (d.pao/d.reps*100).toFixed(0) : 0;
      brandHtml += '<tr><td style="cursor:pointer;color:var(--blue)" onclick="searchAndGo(\x27'+esc(b)+'\x27)"><strong>'+esc(b)+'</strong></td><td>'+d.total+'</td><td>'+d.reps+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
    });
    brandHtml += '</tbody></table></div></div>';
    body.insertAdjacentHTML('beforeend', brandHtml);
  }


  // Trend: monthly replication data
  var allReps = [];
  DATA.forEach(function(d) { (d.replications||[]).forEach(function(r) { allReps.push({date:r.date, effect:r.effect, name:d.name, visual:d.visual, brand:d.brand}); }); });
  allReps.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });

  if (allReps.length > 0) {
    var monthMap = {};
    allReps.forEach(function(r) {
      if (!r.date) return;
      var m = r.date.substring(0,7);
      if (!monthMap[m]) monthMap[m] = {total:0, pao:0};
      monthMap[m].total++;
      if (r.effect === '跑量') monthMap[m].pao++;
    });
    var months = Object.keys(monthMap).sort();
    if (months.length > 0) {
      var trendHtml = '<div class="card"><div class="card-h">\uD83D\uDCC8 \u8D8B\u52BF\u5206\u6790 <span style="font-weight:400;font-size:.75rem;color:var(--t4);margin-left:8px">\u6309\u6708\u590D\u523B\u8D8B\u52BF</span></div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u6708\u4EFD</th><th>\u590D\u523B\u6B21\u6570</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
      months.forEach(function(m) {
        var d = monthMap[m];
        var rate = d.total > 0 ? (d.pao/d.total*100).toFixed(0) : 0;
        trendHtml += '<tr><td>'+m+'</td><td>'+d.total+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
      });
      trendHtml += '</tbody></table></div></div>';
      body.insertAdjacentHTML('beforeend', trendHtml);
    }
  }

  // Brand analysis
  var brandMap = {};
  DATA.forEach(function(d) {
    var b = (d.brand || '\u672A\u77E5').trim();
    if (!brandMap[b]) brandMap[b] = {total:0, reps:0, pao:0};
    brandMap[b].total++;
    (d.replications||[]).forEach(function(r) {
      brandMap[b].reps++;
      if(r.effect==='\u8dd1\u91cf') brandMap[b].pao++;
    });
  });
  var brandSorted = Object.keys(brandMap).filter(function(b) { return brandMap[b].reps > 0; }).sort(function(a,b) { return brandMap[b].reps - brandMap[a].reps; });
  if (brandSorted.length > 0) {
    var brandHtml = '<div class="card"><div class="card-h">\uD83C\uDFF7 \u54C1\u724C\u8868\u73B0</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u54C1\u724C</th><th>\u7075\u611F\u6570</th><th>\u590D\u523B</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
    brandSorted.forEach(function(b) {
      var d = brandMap[b];
      var rate = d.reps > 0 ? (d.pao/d.reps*100).toFixed(0) : 0;
      brandHtml += '<tr><td><strong>'+esc(b)+'</strong></td><td>'+d.total+'</td><td>'+d.reps+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
    });
    brandHtml += '</tbody></table></div></div>';
    body.insertAdjacentHTML('beforeend', brandHtml);
  }




  // Trend: monthly replication data
  var allReps = [];
  DATA.forEach(function(d) { (d.replications||[]).forEach(function(r) { allReps.push({date:r.date, effect:r.effect, name:d.name, visual:d.visual, brand:d.brand}); }); });
  allReps.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });

  if (allReps.length > 0) {
    var monthMap = {};
    allReps.forEach(function(r) {
      if (!r.date) return;
      var m = r.date.substring(0,7);
      if (!monthMap[m]) monthMap[m] = {total:0, pao:0};
      monthMap[m].total++;
      if (r.effect === '跑量') monthMap[m].pao++;
    });
    var months = Object.keys(monthMap).sort();
    if (months.length > 0) {
      var trendHtml = '<div class="card"><div class="card-h">\uD83D\uDCC8 \u8D8B\u52BF\u5206\u6790 <span style="font-weight:400;font-size:.75rem;color:var(--t4);margin-left:8px">\u6309\u6708\u590D\u523B\u8D8B\u52BF</span></div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u6708\u4EFD</th><th>\u590D\u523B\u6B21\u6570</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
      months.forEach(function(m) {
        var d = monthMap[m];
        var rate = d.total > 0 ? (d.pao/d.total*100).toFixed(0) : 0;
        trendHtml += '<tr><td>'+m+'</td><td>'+d.total+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
      });
      trendHtml += '</tbody></table></div></div>';
      body.insertAdjacentHTML('beforeend', trendHtml);
    }
  }

  // Brand analysis
  var brandMap = {};
  DATA.forEach(function(d) {
    var b = (d.brand || '\u672A\u77E5').trim();
    if (!brandMap[b]) brandMap[b] = {total:0, reps:0, pao:0};
    brandMap[b].total++;
    (d.replications||[]).forEach(function(r) {
      brandMap[b].reps++;
      if(r.effect==='\u8dd1\u91cf') brandMap[b].pao++;
    });
  });
  var brandSorted = Object.keys(brandMap).filter(function(b) { return brandMap[b].reps > 0; }).sort(function(a,b) { return brandMap[b].reps - brandMap[a].reps; });
  if (brandSorted.length > 0) {
    var brandHtml = '<div class="card"><div class="card-h">\uD83C\uDFF7 \u54C1\u724C\u8868\u73B0</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u54C1\u724C</th><th>\u7075\u611F\u6570</th><th>\u590D\u523B</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
    brandSorted.forEach(function(b) {
      var d = brandMap[b];
      var rate = d.reps > 0 ? (d.pao/d.reps*100).toFixed(0) : 0;
      brandHtml += '<tr><td><strong>'+esc(b)+'</strong></td><td>'+d.total+'</td><td>'+d.reps+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
    });
    brandHtml += '</tbody></table></div></div>';
    body.insertAdjacentHTML('beforeend', brandHtml);
  }




  // Trend: monthly replication data
  var allReps = [];
  DATA.forEach(function(d) { (d.replications||[]).forEach(function(r) { allReps.push({date:r.date, effect:r.effect, name:d.name, visual:d.visual, brand:d.brand}); }); });
  allReps.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });

  if (allReps.length > 0) {
    var monthMap = {};
    allReps.forEach(function(r) {
      if (!r.date) return;
      var m = r.date.substring(0,7);
      if (!monthMap[m]) monthMap[m] = {total:0, pao:0};
      monthMap[m].total++;
      if (r.effect === '跑量') monthMap[m].pao++;
    });
    var months = Object.keys(monthMap).sort();
    if (months.length > 0) {
      var trendHtml = '<div class="card"><div class="card-h">\uD83D\uDCC8 \u8D8B\u52BF\u5206\u6790 <span style="font-weight:400;font-size:.75rem;color:var(--t4);margin-left:8px">\u6309\u6708\u590D\u523B\u8D8B\u52BF</span></div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u6708\u4EFD</th><th>\u590D\u523B\u6B21\u6570</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
      months.forEach(function(m) {
        var d = monthMap[m];
        var rate = d.total > 0 ? (d.pao/d.total*100).toFixed(0) : 0;
        trendHtml += '<tr><td>'+m+'</td><td>'+d.total+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
      });
      trendHtml += '</tbody></table></div></div>';
      body.insertAdjacentHTML('beforeend', trendHtml);
    }
  }

  // Brand analysis
  var brandMap = {};
  DATA.forEach(function(d) {
    var b = (d.brand || '\u672A\u77E5').trim();
    if (!brandMap[b]) brandMap[b] = {total:0, reps:0, pao:0};
    brandMap[b].total++;
    (d.replications||[]).forEach(function(r) {
      brandMap[b].reps++;
      if(r.effect==='\u8dd1\u91cf') brandMap[b].pao++;
    });
  });
  var brandSorted = Object.keys(brandMap).filter(function(b) { return brandMap[b].reps > 0; }).sort(function(a,b) { return brandMap[b].reps - brandMap[a].reps; });
  if (brandSorted.length > 0) {
    var brandHtml = '<div class="card"><div class="card-h">\uD83C\uDFF7 \u54C1\u724C\u8868\u73B0</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u54C1\u724C</th><th>\u7075\u611F\u6570</th><th>\u590D\u523B</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
    brandSorted.forEach(function(b) {
      var d = brandMap[b];
      var rate = d.reps > 0 ? (d.pao/d.reps*100).toFixed(0) : 0;
      brandHtml += '<tr><td><strong>'+esc(b)+'</strong></td><td>'+d.total+'</td><td>'+d.reps+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
    });
    brandHtml += '</tbody></table></div></div>';
    body.insertAdjacentHTML('beforeend', brandHtml);
  }


  // Trend: monthly replication data
  var allReps = [];
  DATA.forEach(function(d) { (d.replications||[]).forEach(function(r) { allReps.push({date:r.date, effect:r.effect, name:d.name, visual:d.visual, brand:d.brand}); }); });
  allReps.sort(function(a,b) { return (a.date||'').localeCompare(b.date||''); });

  if (allReps.length > 0) {
    var monthMap = {};
    allReps.forEach(function(r) {
      if (!r.date) return;
      var m = r.date.substring(0,7);
      if (!monthMap[m]) monthMap[m] = {total:0, pao:0};
      monthMap[m].total++;
      if (r.effect === '跑量') monthMap[m].pao++;
    });
    var months = Object.keys(monthMap).sort();
    if (months.length > 0) {
      var trendHtml = '<div class="card"><div class="card-h">\uD83D\uDCC8 \u8D8B\u52BF\u5206\u6790 <span style="font-weight:400;font-size:.75rem;color:var(--t4);margin-left:8px">\u6309\u6708\u590D\u523B\u8D8B\u52BF</span></div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u6708\u4EFD</th><th>\u590D\u523B\u6B21\u6570</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
      months.forEach(function(m) {
        var d = monthMap[m];
        var rate = d.total > 0 ? (d.pao/d.total*100).toFixed(0) : 0;
        trendHtml += '<tr><td>'+m+'</td><td>'+d.total+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
      });
      trendHtml += '</tbody></table></div></div>';
      body.insertAdjacentHTML('beforeend', trendHtml);
    }
  }

  // Brand analysis
  var brandMap = {};
  DATA.forEach(function(d) {
    var b = (d.brand || '\u672A\u77E5').trim();
    if (!brandMap[b]) brandMap[b] = {total:0, reps:0, pao:0};
    brandMap[b].total++;
    (d.replications||[]).forEach(function(r) {
      brandMap[b].reps++;
      if(r.effect==='\u8dd1\u91cf') brandMap[b].pao++;
    });
  });
  var brandSorted = Object.keys(brandMap).filter(function(b) { return brandMap[b].reps > 0; }).sort(function(a,b) { return brandMap[b].reps - brandMap[a].reps; });
  if (brandSorted.length > 0) {
    var brandHtml = '<div class="card"><div class="card-h">\uD83C\uDFF7 \u54C1\u724C\u8868\u73B0</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>\u54C1\u724C</th><th>\u7075\u611F\u6570</th><th>\u590D\u523B</th><th>\u8DD1\u91CF</th><th>\u8DD1\u91CF\u7387</th></tr></thead><tbody>';
    brandSorted.forEach(function(b) {
      var d = brandMap[b];
      var rate = d.reps > 0 ? (d.pao/d.reps*100).toFixed(0) : 0;
      brandHtml += '<tr><td><strong>'+esc(b)+'</strong></td><td>'+d.total+'</td><td>'+d.reps+'</td><td class="cv">'+d.pao+'</td><td><span class="rate-badge '+(rate>=50?'rate-high':rate>=25?'rate-mid':'rate-low')+'">'+rate+'%</span></td></tr>';
    });
    brandHtml += '</tbody></table></div></div>';
    body.insertAdjacentHTML('beforeend', brandHtml);
  }


}

// ================================================================
// 统计看板
// ================================================================

async function renderStats() {
  const body = document.getElementById('statsBody');
  body.innerHTML = '<div class="empty" style="padding:30px"><p>⏳ 加载中…</p></div>';

  try {
    const res = await fetch('/inspiration/api/analysis');
    if (!res.ok) throw new Error('加载失败');
    const d = await res.json();

    if (!d.metrics.total) {
      body.innerHTML = '<div class="empty"><div class="ei">📊</div><p>还没有数据</p><p class="hint">录入灵感并添加复刻记录后，看板会自动生成</p></div>';
      return;
    }

    const { total, repCount, paoMian, daiFuKe } = d.metrics;
    const runRate = repCount > 0 ? ((paoMian / repCount) * 100).toFixed(0) : 0;

    body.innerHTML = `
      <div class="metrics">
        <div class="metric"><div class="mv">${total}</div><div class="ml">总灵感</div></div>
        <div class="metric g"><div class="mv">${repCount}</div><div class="ml">已复刻</div></div>
        <div class="metric o"><div class="mv">${runRate}%</div><div class="ml">跑量率</div></div>
        <div class="metric"><div class="mv">${daiFuKe}</div><div class="ml">待复刻</div></div>
      </div>

    <div style="text-align:center;padding:16px 0 8px">
      <button class="btn-m" style="font-size:.92rem;padding:10px 28px" onclick="startAIAnalysis()">🤖 AI 深度解析</button>
      <p style="font-size:.72rem;color:var(--t4);margin-top:6px;margin-bottom:0">根据当前库里的数据进行策略分析</p>
    </div>
      ${daiFuKe > 0 ? `
      <div class="card">
        <div class="card-h">📋 待复刻灵感（${daiFuKe} 条等待拍摄）</div>
        <div class="combo-wrap"><table class="combo-tbl">
          <thead><tr><th>灵感</th><th>视觉锤</th><th>操作</th></tr></thead>
          <tbody>${(d.pending||[]).map(p => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.visual||'-')}</td><td><button class="btn-sm" onclick="go('lib')">➕ 添加复刻</button></td></tr>`).join('')}</tbody>
        </table></div>
      </div>` : ''}
      <div id="aiResult"></div>

      <div class="ch-row three">
        <div class="card"><div class="card-h">📊 复刻效果分布</div><div class="ch-area"><canvas id="chart-eff"></canvas></div></div>
        <div class="card"><div class="card-h">🎨 视觉锤跑量次数 Top6</div><div class="ch-area"><canvas id="chart-vis-rank"></canvas></div></div>
        <div class="card"><div class="card-h">🧠 心理标签跑量次数 Top6</div><div class="ch-area"><canvas id="chart-psy-rank"></canvas></div></div>
      </div>
      ${d.visual && d.visual.length > 0 ? `
      <div class="card">
        <div class="card-h">🏆 视觉锤成功率排名</div>
        <div class="combo-wrap"><table class="combo-tbl">
          <thead><tr><th>#</th><th>视觉锤</th><th>复刻次数</th><th>跑量次数</th><th>成功率</th></tr></thead>
          <tbody>${d.visual.map((v,i) => `<tr><td>${i+1}</td><td style="cursor:pointer;color:var(--blue)" onclick="searchAndGo('${esc(v.name)}')">${esc(v.name)}</td><td>${v.total}</td><td class="cv">${v.pao}</td><td><span class="rate-badge ${parseInt(v.rate)>=60?'rate-high':parseInt(v.rate)>=30?'rate-mid':'rate-low'}">${v.rate}%</span></td></tr>`).join('')}</tbody>
        </table></div>
      </div>` : ''}
  `;

    Object.values(charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    charts = {};

    const effColors = {'跑量':'#34C759','一般':'#FF9500','无效果':'#FF3B30'};
    const effLabels = Object.keys(d.effCounts);
    if (effLabels.length) {
      const ctx = document.getElementById('chart-eff').getContext('2d');
      charts.eff = new Chart(ctx, { type:'doughnut', data:{ labels:effLabels, datasets:[{ data:effLabels.map(l=>d.effCounts[l]), backgroundColor:effLabels.map(l=>effColors[l]||'#8E8E93'), borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ padding:10, font:{ size:11 } } } } } });
    }
  var mvs = document.querySelectorAll('#t-stats .metric .mv');
  mvs.forEach(function(el) {
    var val = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    if (val > 0) {
      var obj = { v: 0 };
      gsap.to(obj, { v: val, duration: 0.6, ease: 'power2.out', onUpdate: function() {
        el.textContent = val >= 1 ? Math.round(obj.v) : obj.v.toFixed(1);
      }});
    }
  });

    if (d.visual && d.visual.length) {
      const ctx = document.getElementById('chart-vis-rank').getContext('2d');
      const top = d.visual.slice(0, 6);
      ctx.canvas.parentElement.style.aspectRatio = '1.2';
      charts.visRank = new Chart(ctx, { type:'bar', data:{ labels:top.map(v=>v.name.length>8?v.name.slice(0,8)+'…':v.name), datasets:[ { label:'跑量', data:top.map(v=>v.pao), backgroundColor:'#34C759', borderRadius:3 }, { label:'其他', data:top.map(v=>v.total-v.pao), backgroundColor:'#E8E8ED', borderRadius:3 } ] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ position:'top', labels:{ font:{ size:10 } } } }, scales:{ x:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:9 } } }, y:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:9 } } } } } });
    }
    if (d.psychology && d.psychology.length) {
      const ctx = document.getElementById('chart-psy-rank').getContext('2d');
      const top = d.psychology.slice(0, 6);
      ctx.canvas.parentElement.style.aspectRatio = '1.2';
      charts.psyRank = new Chart(ctx, { type:'bar', data:{ labels:top.map(v=>v.name.length>8?v.name.slice(0,8)+'…':v.name), datasets:[ { label:'跑量', data:top.map(v=>v.pao), backgroundColor:'#AF52DE', borderRadius:3 }, { label:'其他', data:top.map(v=>v.total-v.pao), backgroundColor:'#E8E8ED', borderRadius:3 } ] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ position:'top', labels:{ font:{ size:10 } } } }, scales:{ x:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:9 } } }, y:{ stacked:true, grid:{ display:false }, ticks:{ font:{ size:9 } } } } } });
    }
  } catch (err) {
    body.innerHTML = '<div class="empty"><p>❌ 加载失败: ' + err.message + '</p></div>';
  }
}

// ================================================================
// AI 分析
// ================================================================

function startAIAnalysis() {
  var el = document.getElementById('aiResult');
  if (!el) { console.warn('aiResult element missing'); return; }
  el.innerHTML = '<div class="empty" style="padding:40px"><p>⏳ AI 正在分析数据，请稍候…</p></div>';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  fetch('/inspiration/api/ai/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) })
  .then(function(r) { return r.json().then(function(j) { return { ok: r.ok, data: j }; }); })
  .then(function(result) {
    if (!result.ok) throw new Error(result.data.error || '失败');
    renderAIResult(result.data.reply);
  })
  .catch(function(err) {
    console.warn('AI API error:', err.message);
    renderLocalAI();
  });
}

function renderAIResult(reply) {
  var body = document.getElementById('aiResult');
  var total = DATA.length;
  var allRep = DATA.flatMap(function(d) { return (d.replications||[]).map(function(r) { return {inspName:d.name, visual:d.visual, psych:d.psychology, effect:r.effect}; }); });
  var repCount = allRep.length;
  var paoMianReps = allRep.filter(function(r) { return r.effect === '跑量'; });
  var paoMianInsp = DATA.filter(function(d) { return (d.replications||[]).some(function(r) { return r.effect === '跑量'; }); }).length;
  var formatted = reply.replace(/\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+\.\s)/gm,'<br>$1');

  body.innerHTML = '';
  var aiCard = '<div class="exec-card" style="background:linear-gradient(135deg,#007AFF,#5856D6)">'
    + '<div class="el">🤖 DeepSeek AI 深度分析</div>'
    + '<div class="ev" style="font-size:.88rem;font-weight:500">' + formatted + '</div>'
    + '</div>'
    + '<div class="metrics">'
    + '<div class="metric"><div class="mv">' + total + '</div><div class="ml">总灵感</div></div>'
    + '<div class="metric g"><div class="mv">' + repCount + '</div><div class="ml">复刻次数</div></div>'
    + '<div class="metric o"><div class="mv">' + paoMianReps.length + '</div><div class="ml">跑量次数</div></div>'
    + '<div class="metric"><div class="mv">' + paoMianInsp + '</div><div class="ml">跑通灵感</div></div>'
    + '</div>';
}

function renderLocalAI() {
  var body = document.getElementById('aiResult');
  var total = DATA.length;
  var allRep = DATA.flatMap(function(d) { return (d.replications||[]).map(function(r) { return {inspName:d.name, visual:d.visual, psych:d.psychology, effect:r.effect}; }); });
  var repCount = allRep.length;
  var paoMianReps = allRep.filter(function(r) { return r.effect === '跑量'; });
  var noEffReps = allRep.filter(function(r) { return r.effect === '无效果'; });
  var paoMianInsp = DATA.filter(function(d) { return (d.replications||[]).some(function(r) { return r.effect === '跑量'; }); }).length;

  var lines = [];
  if (paoMianReps.length > 0) {
    lines.push('共复刻 ' + repCount + ' 次，其中跑量 ' + paoMianReps.length + ' 次（' + (paoMianReps.length/repCount*100).toFixed(0) + '%），无效果 ' + noEffReps.length + ' 次。');
  }
  if (lines.length===0) lines.push('当前数据量不足以生成有效分析，请继续积累复刻记录。');

  body.innerHTML = ''
    + '<div class="exec-card" style="background:linear-gradient(135deg,#FF9500,#FF3B30)">'
    + '<div class="el">📊 本地规则分析（AI 未连接）</div>'
    + '<div class="ev" style="font-size:.88rem">' + lines.map(function(t) { return '• ' + t; }).join('<br>') + '<br><br><span style="font-size:.75rem;opacity:.7">提示：配置 DEEPSEEK_API_KEY 后可获得 AI 深度分析</span></div>'
    + '</div>';
}


function renderAIResult(reply) {
  const body = document.getElementById('aiResult');
  const total = DATA.length;
  const allRep = DATA.flatMap(d => (d.replications||[]).map(r => ({...r, inspName:d.name, visual:d.visual, psych:d.psychology})));
  const repCount = allRep.length;
  const paoMianReps = allRep.filter(r => r.effect === '跑量');
  const paoMianInsp = DATA.filter(d => (d.replications||[]).some(r => r.effect === '跑量')).length;
  const formatted = reply.replace(/\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/^(\d+\.\s)/gm,'<br>$1');

  body.innerHTML = `
    <div class="exec-card" style="background:linear-gradient(135deg,#007AFF,#5856D6)">
      <div class="el">🤖 DeepSeek AI 深度分析</div>
      <div class="ev" style="font-size:.88rem;font-weight:500">${formatted}</div>
    </div>
    <div class="metrics">
      <div class="metric"><div class="mv">${total}</div><div class="ml">总灵感</div></div>
      <div class="metric g"><div class="mv">${repCount}</div><div class="ml">复刻次数</div></div>
      <div class="metric o"><div class="mv">${paoMianReps.length}</div><div class="ml">跑量次数</div></div>
      <div class="metric"><div class="mv">${paoMianInsp}</div><div class="ml">跑通灵感</div></div>
    </div>`;
}

function renderLocalAI() {
  const body = document.getElementById('aiResult');
  const total = DATA.length;
  const allRep = DATA.flatMap(d => (d.replications||[]).map(r => ({...r, inspName:d.name, visual:d.visual, psych:d.psychology})));
  const repCount = allRep.length;
  const paoMianReps = allRep.filter(r => r.effect === '跑量');
  const noEffReps = allRep.filter(r => r.effect === '无效果');
  const paoMianInsp = DATA.filter(d => (d.replications||[]).some(r => r.effect === '跑量')).length;

  const lines = [];
  if (paoMianReps.length > 0) {
    lines.push(`共复刻 ${repCount} 次，其中跑量 ${paoMianReps.length} 次（${(paoMianReps.length/repCount*100).toFixed(0)}%），无效果 ${noEffReps.length} 次。`);
    lines.push(`有 ${paoMianInsp} 个灵感经过复刻验证跑通了，占${total}个灵感的 ${(paoMianInsp/total*100).toFixed(0)}%。`);
  }
  const visMap = {};
  allRep.forEach(r => { if (!r.visual) return; if (!visMap[r.visual]) visMap[r.visual] = {total:0,pao:0,no:0}; visMap[r.visual].total++; if (r.effect==='跑量') visMap[r.visual].pao++; if (r.effect==='无效果') visMap[r.visual].no++; });
  const visList = Object.entries(visMap).map(([k,v])=>({name:k,...v,rate:v.total>0?v.pao/v.total:0})).sort((a,b)=>b.rate-a.rate);
  const bestVis = visList.filter(v=>v.pao>=1&&v.rate>=0.5);
  if (bestVis.length) { const t=bestVis[0]; lines.push(`视觉锤「${t.name}」复刻 ${t.total} 次，跑量 ${t.pao} 次（成功率 ${(t.rate*100).toFixed(0)}%），是最值得复制的视觉模式。`); }

  const psyMap = {};
  allRep.forEach(r => { if (!r.psych) return; r.psych.split(/[,，、/|]/).map(s=>s.trim()).filter(Boolean).forEach(p => { if(!psyMap[p]) psyMap[p]={total:0,pao:0}; psyMap[p].total++; if(r.effect==='跑量') psyMap[p].pao++; }); });
  const psyList = Object.entries(psyMap).map(([k,v])=>({name:k,...v,rate:v.total>0?v.pao/v.total:0})).sort((a,b)=>b.rate-a.rate);
  const bestPsy = psyList.filter(p=>p.pao>=1&&p.rate>=0.5);
  if (bestPsy.length) { const t=bestPsy[0]; lines.push(`心理标签「${t.name}」复刻跑量率 ${(t.rate*100).toFixed(0)}%，是驱动转化的核心用户动机。`); }

  const comboMap = {};
  allRep.forEach(r => { const vs=r.visual||''; if(!vs||!r.psych) return; r.psych.split(/[,，、/|]/).map(s=>s.trim()).filter(Boolean).forEach(p=>{const k=vs+' × '+p; if(!comboMap[k]) comboMap[k]={name:k,visual:vs,psych:p,total:0,pao:0}; comboMap[k].total++; if(r.effect==='跑量') comboMap[k].pao++;}); });
  const comboList = Object.values(comboMap).filter(c=>c.total>=1).map(c=>({...c,rate:c.pao/c.total})).sort((a,b)=>b.rate-a.rate);
  const bestCombo = comboList.filter(c=>c.pao>=1&&c.rate>=0.5);
  if (bestCombo.length) { const c=bestCombo[0]; lines.push(`最佳组合「${c.visual} + ${c.psych}」复刻 ${c.total} 次，跑量 ${c.pao} 次，建议重点复制该模式。`); }
  if (noEffReps.length>=2) { const noVisMap={}; noEffReps.forEach(r=>{if(r.visual)noVisMap[r.visual]=(noVisMap[r.visual]||0)+1;}); const w=Object.entries(noVisMap).sort((a,b)=>b[1]-a[1])[0]; if(w&&w[1]>=2) lines.push(`⚠️ 视觉锤「${w[0]}」有 ${w[1]} 次复刻无效果，建议复盘或放弃该方向。`); }
  if (lines.length===0) lines.push('当前数据量不足以生成有效分析，请继续积累复刻记录。');
  const comboTop = comboList.filter(c=>c.total>=1).sort((a,b)=>b.total-a.total).slice(0,8);

  body.innerHTML = `
    <div class="exec-card" style="background:linear-gradient(135deg,#FF9500,#FF3B30)">
      <div class="el">📊 本地规则分析（AI 未连接）</div>
      <div class="ev" style="font-size:.88rem">${lines.map(t=>'• '+t).join('\n')}<br><br><span style="font-size:.75rem;opacity:.7">提示：配置 DEEPSEEK_API_KEY 后可获得 AI 深度分析</span></div>
    </div>
    <div class="metrics">
      <div class="metric"><div class="mv">${total}</div><div class="ml">总灵感</div></div>
      <div class="metric g"><div class="mv">${repCount}</div><div class="ml">复刻次数</div></div>
      <div class="metric o"><div class="mv">${paoMianReps.length}</div><div class="ml">跑量次数</div></div>
      <div class="metric"><div class="mv">${paoMianInsp}</div><div class="ml">跑通灵感</div></div>
    </div>
    ${comboTop.length>0 ? `<div class="card"><div class="card-h">🔗 视觉锤 × 心理标签 组合表现</div><div class="combo-wrap"><table class="combo-tbl"><thead><tr><th>#</th><th>组合</th><th>复刻</th><th>跑量</th><th>成功率</th></tr></thead><tbody>${comboTop.map((c,i)=>`<tr><td>${i+1}</td><td style="cursor:pointer;color:var(--blue)" onclick="searchAndGo('${encodeURIComponent(esc(c.name))}')">${c.name}</td><td>${c.total}</td><td class="cv">${c.pao}</td><td><span class="rate-badge ${c.rate>=0.6?'rate-high':c.rate>=0.3?'rate-mid':'rate-low'}">${(c.rate*100).toFixed(0)}%</span></td></tr>`).join('')}</tbody></table></div></div>`:''}
  `;
}

// ================================================================
// 示例数据
// ================================================================

async function loadSample() {
  try {
    await fetch('/inspiration/api/materials/sample', { method: 'POST' });
    await refreshData();
    toast('已加载示例数据（含复刻记录）', 'ok');
    go('lib');
  } catch (err) { toast('加载失败: ' + err.message, 'err'); }
}

// ================================================================
// 初始化
// ================================================================



//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」统计视觉锤成功率、心理标签转化率、最佳组合。点击名称可跳转灵感库搜索。顶部的 AI 解析按钮可调用 DeepSeek 做策略分析。' },
      ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  gsap.fromTo('.guide-card', { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.4)' });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) { gsap.to('.guide-card', { opacity: 0, scale: 0.9, y: -10, duration: 0.15, ease: 'power1.in', onComplete: function() { m.remove(); } }); }
}

// ================================================================
// 初始化
// ================================================================


//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」自动统计视觉锤成功率、心理标签转化率、最佳组合。一眼看清哪种视觉×哪种话术最容易跑量，指导下一步拍摄方向。' },
      ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.querySelector('.guide-card').classList.add('show'); });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) m.remove();
}

// ================================================================
// 初始化
// ================================================================


//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」自动统计视觉锤成功率、心理标签转化率、最佳组合。一眼看清哪种视觉×哪种话术最容易跑量，指导下一步拍摄方向。' },
      ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.querySelector('.guide-card').classList.add('show'); });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) m.remove();
}

// ================================================================
// 初始化
// ================================================================


//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」自动统计视觉锤成功率、心理标签转化率、最佳组合。一眼看清哪种视觉×哪种话术最容易跑量，指导下一步拍摄方向。' },
    { ic: String.fromCodePoint(0x1f916), title: 'AI 深度分析', desc: '「AI 分析」调用 DeepSeek 对数据做策略级解读：哪些方向值得重仓、哪些该放弃，像有经验的老投手在带你。' },
  ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.querySelector('.guide-card').classList.add('show'); });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) m.remove();
}

// ================================================================
// 初始化
// ================================================================


//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」自动统计视觉锤成功率、心理标签转化率、最佳组合。一眼看清哪种视觉×哪种话术最容易跑量，指导下一步拍摄方向。' },
    { ic: String.fromCodePoint(0x1f916), title: 'AI 深度分析', desc: '「AI 分析」调用 DeepSeek 对数据做策略级解读：哪些方向值得重仓、哪些该放弃，像有经验的老投手在带你。' },
  ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.querySelector('.guide-card').classList.add('show'); });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) m.remove();
}

// ================================================================
// 初始化
// ================================================================


//
// 首次使用引导
//

function showGuide() {
  if (localStorage.getItem('inspiration_guide_done')) return;
  localStorage.setItem('inspiration_guide_done', '1');

  var steps = [
    { ic: String.fromCodePoint(0x1f50d), title: '采集灵感', desc: '在「录入」页面粘贴竞品/同行的视频链接，标注视觉锤、文案钩子、客户心理标签，给投手团队沉淀可复制的创意素材。' },
    { ic: String.fromCodePoint(0x1f4da), title: '管理灵感库', desc: '在「灵感库」浏览所有采集的素材，添加复刻记录（投放链接、消耗、跑量效果）。好灵感直接拿去拍，拍完回来记结果。' },
    { ic: String.fromCodePoint(0x1f4ca), title: '看板分析', desc: '「看板」自动统计视觉锤成功率、心理标签转化率、最佳组合。一眼看清哪种视觉×哪种话术最容易跑量，指导下一步拍摄方向。' },
    { ic: String.fromCodePoint(0x1f916), title: 'AI 深度分析', desc: '「AI 分析」调用 DeepSeek 对数据做策略级解读：哪些方向值得重仓、哪些该放弃，像有经验的老投手在带你。' },
  ];

  var h = '<div class="modal-overlay" onclick="closeGuide()"></div>';
  h += '<div class="guide-card">';
  h += '<div class="guide-h"><span class="guide-emoji">\u2728</span> 欢迎使用灵感库</div>';
  h += '<div class="guide-sub">采集竞品素材 \u2192 复刻验证 \u2192 沉淀经验，三步跑通爆量模式</div>';
  h += '<div class="guide-steps">';
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    h += '<div class="guide-step">';
    h += '<div class="guide-step-num">' + (i + 1) + '</div>';
    h += '<div class="guide-step-body">';
    h += '<div class="guide-step-h"><span class="guide-step-ic">' + s.ic + '</span> ' + s.title + '</div>';
    h += '<div class="guide-step-d">' + s.desc + '</div>';
    h += '</div></div>';
  }
  h += '</div>';
  h += '<div class="guide-act"><button class="btn-m" onclick="closeGuide()">知道了，开始使用 \u2192</button></div>';

  var modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = h;
  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.querySelector('.guide-card').classList.add('show'); });
}

function closeGuide() {
  var m = document.querySelector('.modal');
  if (m) m.remove();
}

// ================================================================
// 初始化
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadDlOpts();
  document.getElementById('fDate').value = td();
  document.getElementById('rfDate').value = td();
  // 首次使用引导
  showGuide();
  // 检查数据
  refreshData().then(data => {
    if (!data.length) toast('欢迎使用灵感库！先去录入灵感或加载示例数据', 'inf');
  });
});
