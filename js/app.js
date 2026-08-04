/* =========================================================
   LeetWeb 应用主逻辑：hash 路由 + 列表页 + 详情页
   ========================================================= */

const app = document.getElementById("app");
const toastEl = document.getElementById("toast");

/* ---------- 图标 ---------- */
const ICON = {
  star:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.9 6.3 6.6.8-4.9 4.6 1.3 6.5L12 17.8 6.1 20.8l1.3-6.5L2.5 9.7l6.6-.8L12 2z"/></svg>',
  starFill:  '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.9 6.3 6.6.8-4.9 4.6 1.3 6.5L12 17.8 6.1 20.8l1.3-6.5L2.5 9.7l6.6-.8L12 2z"/></svg>',
  note:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  moon:      '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun:       '<circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1.5 12h3M19.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  back:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  external:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>',
  save:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>',
  upload:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 8l5-5 5 5M12 3v12"/></svg>',
  download:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  search:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  file:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  trash:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  folder:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>',
  pencil:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  expand:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m8 0h3a2 2 0 0 0 2-2v-3"/></svg>',
  compress:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m8 0v-3a2 2 0 0 1 2-2h3"/></svg>',
  bulb:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  palette:   '<path d="M12 3a9 9 0 0 0 0 18h1.1a1.9 1.9 0 0 0 1.3-3.2 1.2 1.2 0 0 1 .8-2h1.3A4.5 4.5 0 0 0 21 11.3C21 6.7 17 3 12 3z"/><circle cx="7.8" cy="11" r="1"/><circle cx="10" cy="7.8" r="1"/><circle cx="14.1" cy="7.8" r="1"/><circle cx="16.3" cy="11" r="1"/>',
};

/* ---------- 主题 ---------- */
const THEMES = [
  { id: "light", name: "素纸", tone: "light" },
  { id: "dark", name: "夜墨", tone: "dark" },
  { id: "pixel", name: "像素", tone: "light" },
  { id: "cosmos", name: "宇宙", tone: "dark" },
  { id: "orbital", name: "航天", tone: "dark" },
  { id: "hero", name: "英雄竞技", tone: "light" },
  { id: "arena", name: "峡谷", tone: "dark" },
  { id: "battlefield", name: "战地", tone: "dark" },
  { id: "cyberpunk", name: "赛博朋克", tone: "dark" },
];
function getThemeInfo(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
function isDarkTheme(id) {
  return getThemeInfo(id).tone === "dark";
}
function applyTheme(t) {
  if (!THEMES.some(x => x.id === t)) t = "light";
  const info = getThemeInfo(t);
  document.documentElement.setAttribute("data-theme", t);
  const icon = document.getElementById("themeIcon");
  const btn = document.getElementById("themeBtn");
  if (icon) icon.innerHTML = ICON.palette;
  if (btn) btn.title = "主题：" + info.name;
  syncHljsTheme(t);
}
function openThemeMenu() {
  const old = document.querySelector(".theme-menu");
  if (old) { old.remove(); return; }
  const btn = document.getElementById("themeBtn");
  if (!btn) return;
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const menu = document.createElement("div");
  menu.className = "theme-menu";
  menu.innerHTML = THEMES.map(t => `
    <button type="button" class="theme-choice ${t.id === current ? "active" : ""}" data-theme="${t.id}">
      <span class="theme-swatch" data-theme-swatch="${t.id}"></span>
      <span>${t.name}</span>
    </button>`).join("");
  document.body.appendChild(menu);
  const rect = btn.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 10}px`;
  menu.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
  menu.querySelectorAll(".theme-choice").forEach(choice => {
    choice.onclick = () => {
      const next = choice.dataset.theme;
      Store.setTheme(next);
      applyTheme(next);
      menu.remove();
      toast("已切换主题：" + getThemeInfo(next).name);
    };
  });
  setTimeout(() => {
    const close = e => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) {
        menu.remove();
        document.removeEventListener("pointerdown", close);
      }
    };
    document.addEventListener("pointerdown", close);
  }, 0);
}
function initTheme() {
  const t = Store.getTheme();
  applyTheme(t);
  document.getElementById("themeBtn").onclick = openThemeMenu;
}

/* ---------- 布局：测量顶栏高度，保证详情页左右独立滚动 ---------- */
function setTopbarVar() {
  const tb = document.querySelector(".topbar");
  if (tb) document.documentElement.style.setProperty("--topbar-h", tb.offsetHeight + "px");
}
window.addEventListener("resize", setTopbarVar);

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

/* ---------- GitHub 同步：状态指示 + 待补传队列 ---------- */
function markSynced() { localStorage.setItem("leetweb:lastSync", String(Date.now())); }
function lastSyncText() {
  const t = parseInt(localStorage.getItem("leetweb:lastSync") || "0", 10);
  if (!t) return "尚未同步";
  const d = Date.now() - t;
  if (d < 60000) return "刚刚";
  if (d < 3600000) return Math.floor(d / 60000) + " 分钟前";
  if (d < 86400000) return Math.floor(d / 3600000) + " 小时前";
  return new Date(t).toLocaleString();
}

// 待补传队列（会话内，按逻辑键去重；联网后自动重试）
const PendingSync = {
  map: new Map(),                       // key -> { label, fn }
  add(key, label, fn) { this.map.set(key, { label, fn }); refreshSyncUi(); },
  clear(key) { this.map.delete(key); },
  count() { return this.map.size; },
  labels() { return [...this.map.values()].map(v => v.label); },
  async flush() {
    if (!Sync.configured() || !this.map.size) return;
    setSyncState("busy");
    for (const [key, { fn }] of [...this.map]) {
      try { await fn(); this.map.delete(key); } catch (e) { break; }   // 仍失败则停下，等下次
    }
    if (this.map.size === 0) markSynced();
    refreshSyncUi();
  },
};

function setSyncState(state, msg) {
  const dot = document.getElementById("syncDot");
  if (!dot) return;
  if (state === "ok" && PendingSync.count() > 0) state = "pending";
  dot.className = "sync-dot " + state; // off / ok / busy / err / pending
  const btn = document.getElementById("syncBtn");
  const titles = {
    off: "未连接 GitHub（点击设置）", busy: "同步中…", err: "同步失败：" + (msg || ""),
    ok: "已同步 · " + lastSyncText(), pending: PendingSync.count() + " 项待补传（联网后自动，点此查看）",
  };
  if (btn) btn.title = titles[state] || "GitHub 同步";
}
function refreshSyncUi() { setSyncState(Sync.configured() ? (PendingSync.count() ? "pending" : "ok") : "off"); }
function refreshSyncDot() { refreshSyncUi(); }

// 执行一次同步操作；失败则入队，联网后自动补传
async function trySync(key, label, fn) {
  if (!Sync.configured()) return true;
  try { setSyncState("busy"); await fn(); PendingSync.clear(key); markSynced(); refreshSyncUi(); return true; }
  catch (e) { PendingSync.add(key, label, fn); refreshSyncUi(); return false; }
}

// 状态/收藏变化：推 meta.json
async function pushMetaSafe() {
  await trySync("meta", "进度与收藏", () => Sync.pushMeta());
}

window.addEventListener("online", () => {
  if (Sync.configured() && PendingSync.count()) {
    toast("网络恢复，正在补传…");
    PendingSync.flush().then(() => { if (!PendingSync.count()) toast("已全部补传完成"); });
  }
});
// 某题是否存在笔记（本地或远端）
function noteExists(id) { return Store.hasNote(id) || Sync.hasRemoteNote(id); }

/* ---------- 设置弹窗 ---------- */
function openSettings() {
  const c = Sync.getCfg() || { owner: "lyh358", repo: "leetweb-notes", branch: "main", token: "" };
  const mask = document.createElement("div");
  mask.className = "modal-mask";
  mask.innerHTML = `
    <div class="modal">
      <h3>GitHub 同步</h3>
      <p class="modal-sub">把笔记同步到你的私有仓库，多设备通用。Token 只保存在本浏览器，不会进入代码或仓库。</p>
      ${Sync.configured() ? `<div class="sync-status-row">已连接 · 上次同步 <b>${lastSyncText()}</b>${PendingSync.count() ? ` · <span class="pending-tag">${PendingSync.count()} 项待补传</span>` : ""}</div>` : ""}
      <div class="field"><label>仓库拥有者 owner</label><input id="ghOwner" value="${c.owner||''}" placeholder="lyh358" /></div>
      <div class="field"><label>仓库名 repo</label><input id="ghRepo" value="${c.repo||''}" placeholder="leetweb-notes" /></div>
      <div class="field"><label>分支 branch</label><input id="ghBranch" value="${c.branch||'main'}" placeholder="main" /></div>
      <div class="field">
        <label>访问令牌 Token</label>
        <input id="ghToken" type="password" value="${c.token||''}" placeholder="github_pat_..." autocomplete="off" />
        <div class="hint">需<b>细粒度</b> Token，仅对该仓库授予 <b>Contents · 读写</b> 权限。
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">前往创建 →</a></div>
      </div>
      <div class="modal-msg" id="ghMsg"></div>
      <div class="modal-actions">
        ${Sync.configured() ? '<button class="btn" id="ghDisconnect">断开</button>' : ''}
        ${Sync.configured() ? '<button class="btn" id="ghFlush">立即同步</button>' : ''}
        <div class="spacer"></div>
        <button class="btn" id="ghCancel">取消</button>
        <button class="btn primary" id="ghSave">测试并保存</button>
      </div>
      <div class="modal-note">
        提示：请先在 GitHub 建好这个<b>私有仓库</b>（可以是空仓库）。首次保存笔记时会自动创建
        <code>notes/</code> 目录与 <code>meta.json</code>。
      </div>
    </div>`;
  document.body.appendChild(mask);

  const close = () => mask.remove();
  mask.onclick = (e) => { if (e.target === mask) close(); };
  mask.querySelector("#ghCancel").onclick = close;
  const disc = mask.querySelector("#ghDisconnect");
  if (disc) disc.onclick = () => { Sync.clearCfg(); refreshSyncDot(); close(); toast("已断开 GitHub"); route(); };
  const flushBtn = mask.querySelector("#ghFlush");
  if (flushBtn) flushBtn.onclick = async () => {
    if (!PendingSync.count()) { toast("已是最新，无待补传"); return; }
    flushBtn.innerHTML = '<span class="spin"></span> 补传中…'; flushBtn.disabled = true;
    await PendingSync.flush();
    toast(PendingSync.count() ? `仍有 ${PendingSync.count()} 项未成功（检查网络/Token）` : "已全部补传");
    close(); openSettings();
  };

  mask.querySelector("#ghSave").onclick = async () => {
    const cfg = {
      owner: mask.querySelector("#ghOwner").value.trim(),
      repo: mask.querySelector("#ghRepo").value.trim(),
      branch: mask.querySelector("#ghBranch").value.trim() || "main",
      token: mask.querySelector("#ghToken").value.trim(),
    };
    const msg = mask.querySelector("#ghMsg");
    if (!cfg.owner || !cfg.repo || !cfg.token) { msg.className = "modal-msg err"; msg.textContent = "请填写完整的 owner / repo / token"; return; }
    Sync.setCfg(cfg);
    const saveBtn = mask.querySelector("#ghSave");
    saveBtn.innerHTML = '<span class="spin"></span> 连接中…'; saveBtn.disabled = true;
    try {
      await Sync.test();
      msg.className = "modal-msg ok"; msg.textContent = "连接成功，正在拉取云端笔记…";
      setSyncState("busy");
      await Sync.initialPull();
      markSynced();
      setSyncState("ok");
      toast("GitHub 已连接");
      close(); route();
    } catch (e) {
      msg.className = "modal-msg err"; msg.textContent = "失败：" + e.message;
      saveBtn.innerHTML = "测试并保存"; saveBtn.disabled = false;
      setSyncState("err", e.message);
    }
  };
}

/* ---------- 导入 / 导出 ---------- */
function initBackup() {
  document.getElementById("exportBtn").onclick = async () => {
    toast("正在打包全站备份…");
    const data = await Backup.export();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `拾遗-全站备份-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast("已导出全站备份（含四个模块与 PDF）");
  };
  const fileInput = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (!confirm("导入备份会覆盖当前同名数据，确定继续？")) { fileInput.value = ""; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await Backup.import(JSON.parse(reader.result));
        toast("导入成功");
        route();
      } catch (err) { toast("导入失败：" + err.message); }
      fileInput.value = "";
    };
    reader.readAsText(f);
  };
}

/* ---------- Markdown 渲染 ---------- */
if (window.marked) {
  marked.setOptions({ breaks: true, gfm: true });
}
function renderMarkdown(md) {
  const raw = marked.parse(md || "");
  return window.DOMPurify ? DOMPurify.sanitize(raw) : raw;
}
// 把 markdown 渲染进容器并高亮代码块
function renderMarkdownInto(el, md) {
  el.innerHTML = `<div class="markdown">${renderMarkdown(md)}</div>`;
  if (window.hljs) {
    el.querySelectorAll("pre code").forEach(block => {
      try { hljs.highlightElement(block); } catch (e) {}
    });
  }
}
// 代码高亮主题随明暗切换
function syncHljsTheme(t) {
  const light = document.getElementById("hljsLight");
  const dark = document.getElementById("hljsDark");
  const darkMode = isDarkTheme(t);
  if (light) light.disabled = darkMode;
  if (dark) dark.disabled = !darkMode;
}

/* =========================================================
   列表页
   ========================================================= */
function statusClass(id) {
  const s = Store.getStatus(id);
  return s === 1 ? "solved" : s === 2 ? "review" : "";
}

let filterState = { cat: "全部", diff: 0, star: false, q: "" };

function renderList() {
  document.body.classList.remove("detail-mode");
  const st = Store.stats();
  const done = st.solved + st.review;              // 已解决 + 待复习 都计入进度
  const pct = Math.round(done / st.total * 100);
  const circ = 2 * Math.PI * 52;
  const offset = circ * (1 - done / st.total);

  app.innerHTML = `
  <div class="view">
    <div class="wrap">
      <section class="hero">
        <h1>热题 100</h1>
        <p>LeetCode 官方精选 100 题。左手题目，右手心得，以 Markdown 记录每一次推敲。此处崇尚素简 —— 残缺、朴拙、无常，皆是学习的痕迹。</p>
        <div class="dashboard">
          <div class="progress-ring">
            <svg width="118" height="118">
              <circle class="ring-bg" cx="59" cy="59" r="52"></circle>
              <circle class="ring-fg" cx="59" cy="59" r="52"
                stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
            </svg>
            <div class="ring-text"><b>${pct}%</b><span>进度</span></div>
          </div>
          <div class="stat-group">
            <div class="stat solved"><b>${st.solved}</b><span>已解决</span></div>
            <div class="stat review"><b>${st.review}</b><span>待复习</span></div>
            <div class="stat noted"><b>${st.noted}</b><span>已记录</span></div>
            <div class="stat"><b>${st.total}</b><span>总题数</span></div>
          </div>
        </div>
      </section>

      <div class="toolbar">
        <div class="search">
          ${ICON.search}
          <input id="searchInput" type="text" placeholder="搜索题号或题名…" value="${filterState.q}" />
        </div>
        <div class="filters" id="diffFilters">
          <span class="chip ${filterState.diff===0?'active':''}" data-diff="0">全部难度</span>
          <span class="chip ${filterState.diff===1?'active':''}" data-diff="1"><span class="dot" style="background:var(--easy)"></span>简单</span>
          <span class="chip ${filterState.diff===2?'active':''}" data-diff="2"><span class="dot" style="background:var(--medium)"></span>中等</span>
          <span class="chip ${filterState.diff===3?'active':''}" data-diff="3"><span class="dot" style="background:var(--hard)"></span>困难</span>
          <span class="chip ${filterState.star?'active':''}" id="starFilter">★ 收藏</span>
        </div>
      </div>

      <div id="catList"></div>

      <div class="footer">
        <span class="seal-sm">拾遗</span> · 侘寂 · 以 Markdown 记学习之痕 ·
        数据存于本地浏览器，请常用右上角导出备份
      </div>
    </div>
  </div>`;

  renderCategories();

  // 事件绑定
  const search = document.getElementById("searchInput");
  search.oninput = () => { filterState.q = search.value.trim(); renderCategories(); };
  document.getElementById("diffFilters").querySelectorAll("[data-diff]").forEach(c => {
    c.onclick = () => { filterState.diff = parseInt(c.dataset.diff,10); renderList(); };
  });
  document.getElementById("starFilter").onclick = () => { filterState.star = !filterState.star; renderList(); };
}

function matchFilter(p) {
  if (filterState.diff && p.diff !== filterState.diff) return false;
  if (filterState.star && !Store.isStarred(p.id)) return false;
  if (filterState.q) {
    const q = filterState.q.toLowerCase();
    if (!(String(p.id).includes(q) || p.title.toLowerCase().includes(q) || p.slug.includes(q))) return false;
  }
  return true;
}

function renderCategories() {
  const container = document.getElementById("catList");
  let html = "";
  CATEGORIES.forEach((cat, i) => {
    const items = PROBLEMS.filter(p => p.cat === cat && matchFilter(p));
    if (!items.length) return;
    const idx = String(i + 1).padStart(2, "0");
    const catAll = PROBLEMS.filter(p => p.cat === cat);
    const catDone = catAll.filter(p => { const s = Store.getStatus(p.id); return s === 1 || s === 2; }).length;
    const catPct = Math.round(catDone / catAll.length * 100);
    html += `
      <section class="category">
        <div class="category-head">
          <span class="idx">${idx}</span>
          <h2>${cat}</h2>
          <div class="cat-prog" title="${catDone}/${catAll.length}（已解决 + 待复习）">
            <div class="cat-prog-bar"><span style="width:${catPct}%"></span></div>
            <span class="cat-prog-num">${catDone}/${catAll.length}</span>
          </div>
          <span class="count">${items.length} 题</span>
        </div>
        <div class="problem-grid">
          ${items.map(cardHtml).join("")}
        </div>
      </section>`;
  });
  if (!html) html = `<div style="text-align:center;color:var(--ink-faint);padding:60px 0">没有符合条件的题目</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".problem-card").forEach(el => {
    el.onclick = (e) => {
      if (e.target.closest(".star-toggle")) return;
      location.hash = "#/p/" + el.dataset.id;
    };
    const starBtn = el.querySelector(".star-toggle");
    if (starBtn) starBtn.onclick = (e) => {
      e.stopPropagation();
      const on = Store.toggleStar(el.dataset.id);
      starBtn.innerHTML = on ? ICON.starFill : ICON.star;
      starBtn.classList.toggle("on", on);
    };
  });
}

function cardHtml(p) {
  const starred = Store.isStarred(p.id);
  const noted = noteExists(p.id);
  return `
    <div class="problem-card ${statusClass(p.id)}" data-id="${p.id}">
      <span class="pc-id">${p.id}</span>
      <div class="pc-body">
        <div class="pc-title">${p.title}</div>
        <div class="pc-meta">
          <span class="diff d${p.diff}">${DIFF_TEXT[p.diff]}</span>
        </div>
      </div>
      <div class="pc-icons">
        ${Store.getStatus(p.id) === 2 ? `<span class="review-mark" title="待复习">${ICON.bulb}</span>` : ""}
        ${noted ? `<span class="note-on" title="已有笔记">${ICON.note}</span>` : ""}
        <span class="star-toggle ${starred?'on':''}" title="收藏">${starred ? ICON.starFill : ICON.star}</span>
      </div>
    </div>`;
}

/* =========================================================
   详情页
   ========================================================= */
function renderDetail(id) {
  const p = PROBLEM_BY_ID[id];
  if (!p) { location.hash = "#/hot100"; return; }
  setNav("hot100");
  const lcUrl = `https://leetcode.cn/problems/${p.slug}/`;
  // 复用通用双栏编辑器（题面 + 笔记），并接入热题的难度/分类标签、原题链接、状态与收藏
  renderEditorDetail({
    backHref: "#/hot100",
    key: "p" + id,
    title: p.title,
    noteLabel: "笔记",
    tags: [{ text: DIFF_TEXT[p.diff], cls: "d" + p.diff }, { text: p.cat }, { text: "#" + p.id }],
    link: { href: lcUrl },
    status: { get: () => Store.getStatus(id), set: v => { Store.setStatus(id, v); pushMetaSafe(); } },
    star: { get: () => Store.isStarred(id), toggle: () => { const on = Store.toggleStar(id); pushMetaSafe(); return on; } },
    desc: {
      get: () => Store.getDesc(id), set: md => Store.setDesc(id, md),
      push: md => Sync.pushDesc(id, md), pushEmpty: () => Sync.pushDesc(id, ""), pull: () => Sync.pullDesc(id),
    },
    pdf: { localKey: id, remotePath: Sync.pdfPath(id) },
    note: {
      get: () => Store.getNote(id), set: md => Store.setNote(id, md),
      push: md => Sync.pushNote(id, md), pushEmpty: () => Sync.pushNote(id, ""), pull: () => Sync.pullNote(id),
      downloadName: `${p.id}-${p.slug}.md`,
    },
  });
}

function escapeHtml(s) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* =========================================================
   路由
   ========================================================= */
function route() {
  const hash = location.hash || "#/";
  let m;
  if (hash === "#/" || hash === "") { renderHome(); return; }
  if (hash === "#/hot100") { setNav("hot100"); renderList(); return; }
  if ((m = hash.match(/^#\/p\/(\d+)/))) { setNav("hot100"); renderDetail(parseInt(m[1], 10)); window.scrollTo(0, 0); return; }
  if (hash === "#/custom") { renderCustomList(); return; }
  if ((m = hash.match(/^#\/custom\/([\w-]+)/))) { renderCustomDetail(m[1]); window.scrollTo(0, 0); return; }
  if (hash === "#/kb") { renderKb(null); return; }
  if ((m = hash.match(/^#\/kb\/f\/([\w-]+)/))) { renderKb(m[1]); return; }
  if ((m = hash.match(/^#\/kb\/n\/([\w-]+)/))) { renderKbNote(m[1]); window.scrollTo(0, 0); return; }
  if (hash === "#/resume") { renderResume(null); return; }
  if ((m = hash.match(/^#\/resume\/([\w-]+)/))) { renderResume(m[1]); return; }
  renderHome();
}

// 列表类路由（拉取云端目录后可安全重渲染，不会打断编辑）
function isListRoute() {
  const h = location.hash || "#/";
  return h === "#/" || h === "" || h === "#/hot100" || h === "#/custom" || h === "#/kb" || /^#\/kb\/f\//.test(h) || /^#\/resume/.test(h);
}

function initSync() {
  const btn = document.getElementById("syncBtn");
  if (btn) btn.onclick = openSettings;
  document.querySelectorAll("#topnav a").forEach(a => {}); // 导航为原生链接，无需绑定
  refreshSyncDot();
  // 已连接则后台拉取云端状态、笔记清单与各模块目录，完成后刷新列表页
  if (Sync.configured()) {
    setSyncState("busy");
    Sync.initialPull()
      .then(() => moduleInitialPull())
      .then(() => { markSynced(); setSyncState("ok"); if (isListRoute()) route(); })
      .catch(e => setSyncState("err", e.message));
  }
}

function boot() { initTheme(); initBackup(); initSync(); route(); }

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", boot);
// 若脚本在 DOMContentLoaded 之后加载
if (document.readyState !== "loading") boot();
