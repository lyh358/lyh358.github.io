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
};

/* ---------- 主题 ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.getElementById("themeIcon").innerHTML = t === "dark" ? ICON.sun : ICON.moon;
  syncHljsTheme(t);
}
function initTheme() {
  const t = Store.getTheme();
  applyTheme(t);
  document.getElementById("themeBtn").onclick = () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    Store.setTheme(next); applyTheme(next);
  };
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

/* ---------- GitHub 同步：状态指示 + 推送封装 ---------- */
function setSyncState(state, msg) {
  const dot = document.getElementById("syncDot");
  if (!dot) return;
  dot.className = "sync-dot " + state; // off / ok / err / busy
  const titles = { off: "未连接 GitHub（点击设置）", ok: "已与 GitHub 同步", busy: "同步中…", err: "同步失败：" + (msg || "") };
  const btn = document.getElementById("syncBtn");
  if (btn) btn.title = titles[state] || "GitHub 同步";
}
function refreshSyncDot() { setSyncState(Sync.configured() ? "ok" : "off"); }

// 保存笔记：先本地，再推 GitHub
async function saveNoteEverywhere(id, md) {
  Store.setNote(id, md);
  if (Sync.configured()) {
    try { setSyncState("busy"); await Sync.pushNote(id, md); setSyncState("ok"); }
    catch (e) { setSyncState("err", e.message); toast("GitHub 同步失败：" + e.message); return false; }
  }
  return true;
}
// 状态/收藏变化：推 meta.json
async function pushMetaSafe() {
  if (!Sync.configured()) return;
  try { setSyncState("busy"); await Sync.pushMeta(); setSyncState("ok"); }
  catch (e) { setSyncState("err", e.message); toast("GitHub 同步失败：" + e.message); }
}
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
  document.getElementById("exportBtn").onclick = () => {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leetweb-备份-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast("已导出全部笔记与进度");
  };
  const fileInput = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importAll(JSON.parse(reader.result));
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
  if (light) light.disabled = (t === "dark");
  if (dark) dark.disabled = (t !== "dark");
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
  const pct = Math.round(st.solved / st.total * 100);
  const circ = 2 * Math.PI * 52;
  const offset = circ * (1 - st.solved / st.total);

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
            <div class="ring-text"><b>${pct}%</b><span>已解决</span></div>
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
    html += `
      <section class="category">
        <div class="category-head">
          <span class="idx">${idx}</span>
          <h2>${cat}</h2>
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
        ${noted ? `<span class="note-on" title="已有笔记">${ICON.note}</span>` : ""}
        <span class="star-toggle ${starred?'on':''}" title="收藏">${starred ? ICON.starFill : ICON.star}</span>
      </div>
    </div>`;
}

/* =========================================================
   详情页
   ========================================================= */
let saveTimer, descTimer;
function renderDetail(id) {
  const p = PROBLEM_BY_ID[id];
  if (!p) { location.hash = "#/"; return; }
  document.body.classList.add("detail-mode");
  setTopbarVar();
  const lcUrl = `https://leetcode.cn/problems/${p.slug}/`;
  const note = Store.getNote(id);
  const desc = Store.getDesc(id);
  const status = Store.getStatus(id);
  const starred = Store.isStarred(id);

  app.innerHTML = `
  <div class="view">
    <div class="detail">
      <!-- 左：题目描述（可编辑/预览）-->
      <div class="pane left">
        <div class="pane-head">
          <span class="back-btn" onclick="location.hash='#/hot100'">${ICON.back} 返回</span>
          <div class="seg" id="descSeg">
            <button data-mode="edit">编辑</button>
            <button data-mode="view" class="active">预览</button>
          </div>
          <div class="spacer"></div>
          <span class="save-hint" id="descHint">题面自动保存</span>
        </div>
        <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
          <div class="prob-header">
            <h1 class="detail-title">${p.title}</h1>
            <div class="detail-meta">
              <span class="tag d${p.diff}">${DIFF_TEXT[p.diff]}</span>
              <span class="tag">${p.cat}</span>
              <span class="tag">#${p.id}</span>
              <a class="lc-link sm" href="${lcUrl}" target="_blank" rel="noopener">${ICON.external} LeetCode 原题</a>
            </div>
          </div>
          <div id="descEdit" style="flex:1; display:none; flex-direction:column; padding:clamp(18px,2.5vw,30px);">
            <textarea class="editor" id="descEditor" placeholder="在此写下或粘贴题目描述（支持 Markdown）。\n也可以用下方按钮上传整理好的 .md，或上传 PDF 题面。">${escapeHtml(desc)}</textarea>
          </div>
          <div id="descView" style="flex:1; overflow-y:auto; padding:clamp(18px,2.5vw,30px);"></div>
        </div>
        <div class="pane-foot">
          <button class="btn" id="upDescMd">${ICON.upload} 上传 MD</button>
          <button class="btn" id="upDescPdf">${ICON.file} 上传 PDF</button>
          <button class="btn" id="rmPdf" style="display:none;">${ICON.trash} 移除 PDF</button>
          <div class="spacer"></div>
          <button class="btn primary" id="saveDesc">${ICON.save} 保存</button>
        </div>
        <input type="file" id="descMdFile" accept=".md,.markdown,.txt" hidden />
        <input type="file" id="descPdfFile" accept="application/pdf,.pdf" hidden />
      </div>

      <!-- 右：笔记 -->
      <div class="pane right">
        <div class="pane-head">
          <div class="seg" id="modeSeg">
            <button data-mode="edit" class="active">编辑</button>
            <button data-mode="view">预览</button>
          </div>
          <span class="label note-label">笔记</span>
          <div class="spacer"></div>
          <span class="save-hint" id="saveHint">自动保存</span>
          <select class="status-select" id="statusSel">
            <option value="0" ${status===0?'selected':''}>○ 未开始</option>
            <option value="1" ${status===1?'selected':''}>✓ 已解决</option>
            <option value="2" ${status===2?'selected':''}>↻ 待复习</option>
          </select>
          <button class="btn star-detail ${starred?'primary':''}" id="starDetail" title="收藏">
            ${starred ? ICON.starFill : ICON.star}
          </button>
        </div>
        <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
          <div id="editWrap" style="flex:1; display:flex; flex-direction:column; padding:clamp(20px,3vw,36px);">
            <textarea class="editor" id="editor" placeholder="# 思路\n\n在此写下你的解题笔记，支持 Markdown 语法…\n\n- 关键思路\n- 复杂度分析\n\n\`\`\`java\n// 你的代码\n\`\`\`">${escapeHtml(note)}</textarea>
          </div>
          <div id="viewWrap" style="flex:1; overflow-y:auto; padding:clamp(20px,3vw,36px); display:none;"></div>
        </div>
        <div class="pane-foot">
          <button class="btn" id="uploadMd">${ICON.upload} 上传 .md</button>
          <button class="btn" id="downloadMd">${ICON.download} 下载 .md</button>
          <div class="spacer"></div>
          <button class="btn primary" id="saveBtn">${ICON.save} 保存</button>
        </div>
        <input type="file" id="mdFile" accept=".md,.markdown,.txt" hidden />
      </div>
    </div>
  </div>`;

  /* ---------------- 左栏：题目描述 ---------------- */
  const descEditor = document.getElementById("descEditor");
  const descEdit = document.getElementById("descEdit");
  const descView = document.getElementById("descView");
  const descHint = document.getElementById("descHint");
  let pdfUrl = null, pdfName = null;

  function flashHint(el, text) {
    el.textContent = text; el.classList.add("show");
    setTimeout(() => { el.classList.remove("show"); el.textContent = el === descHint ? "题面自动保存" : "自动保存"; }, 1600);
  }
  function renderDescView() {
    const parts = [];
    if (pdfUrl) parts.push(`<div class="pdf-wrap"><iframe class="pdf-frame" src="${pdfUrl}" title="PDF 题面"></iframe></div>`);
    const md = descEditor.value;
    if (md.trim()) parts.push(`<div class="markdown">${renderMarkdown(md)}</div>`);
    if (!parts.length) { descView.innerHTML = `<div class="empty-note"><span class="brush">题</span><p>还没有题目描述。<br/>切到「编辑」写下，或上传 MD / PDF 题面。</p></div>`; return; }
    descView.innerHTML = parts.join("");
    descView.querySelectorAll("pre code").forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
  }
  function setDescMode(mode) {
    document.querySelectorAll("#descSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") { renderDescView(); descEdit.style.display = "none"; descView.style.display = "block"; }
    else { descEdit.style.display = "flex"; descView.style.display = "none"; }
  }
  async function persistDesc(showToast) {
    Store.setDesc(id, descEditor.value);
    flashHint(descHint, Sync.configured() ? "同步中…" : "已保存");
    if (Sync.configured()) {
      try { setSyncState("busy"); await Sync.pushDesc(id, descEditor.value); setSyncState("ok"); flashHint(descHint, "已同步"); }
      catch (e) { setSyncState("err", e.message); toast("题面同步失败：" + e.message); return; }
    }
    if (showToast) toast("题目描述已保存");
  }
  descEditor.oninput = () => { clearTimeout(descTimer); descTimer = setTimeout(() => persistDesc(false), 800); };
  descEditor.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persistDesc(true); } };
  document.getElementById("saveDesc").onclick = () => persistDesc(true);
  document.querySelectorAll("#descSeg button").forEach(b => b.onclick = () => setDescMode(b.dataset.mode));
  setDescMode(desc.trim() ? "view" : "edit");

  // 上传描述 MD
  const descMdFile = document.getElementById("descMdFile");
  document.getElementById("upDescMd").onclick = () => descMdFile.click();
  descMdFile.onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (descEditor.value.trim() && !confirm("当前已有描述内容，上传的文件将覆盖它，确定继续？")) { descMdFile.value = ""; return; }
      descEditor.value = reader.result; persistDesc(true); setDescMode("view"); toast(`已导入 ${f.name}`); descMdFile.value = "";
    };
    reader.readAsText(f);
  };

  // PDF：展示 / 上传 / 移除
  const rmPdfBtn = document.getElementById("rmPdf");
  function showPdf(blob, name) {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = URL.createObjectURL(blob); pdfName = name || "题面.pdf";
    rmPdfBtn.style.display = "";
    setDescMode("view");
  }
  function hidePdf() {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = null; pdfName = null; rmPdfBtn.style.display = "none"; renderDescView();
  }
  const descPdfFile = document.getElementById("descPdfFile");
  document.getElementById("upDescPdf").onclick = () => descPdfFile.click();
  descPdfFile.onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return; descPdfFile.value = "";
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("请选择 PDF 文件"); return; }
    const buf = await f.arrayBuffer();
    await PdfDB.put(id, new Blob([buf], { type: "application/pdf" }), f.name);
    showPdf(new Blob([buf], { type: "application/pdf" }), f.name);
    toast(`已加载 ${f.name}`);
    if (Sync.configured()) {
      if (buf.byteLength > 10 * 1024 * 1024) { toast("PDF 超过 10MB，仅保存在本设备，未上传 GitHub"); return; }
      try { setSyncState("busy"); await Sync.pushPdf(id, buf); setSyncState("ok"); toast("PDF 已同步到 GitHub"); }
      catch (err) { setSyncState("err", err.message); toast("PDF 同步失败（已存本地）：" + err.message); }
    }
  };
  rmPdfBtn.onclick = async () => {
    if (!confirm("确定移除这道题的 PDF 题面？")) return;
    hidePdf(); await PdfDB.del(id);
    if (Sync.configured()) { try { await Sync.deletePdf(id); } catch (e) {} }
    toast("已移除 PDF");
  };

  // 载入本题 PDF（本地优先，其次云端）
  (async () => {
    try {
      const local = await PdfDB.get(id);
      if (local && local.blob) { showPdf(local.blob, local.name); return; }
      if (Sync.configured()) {
        const blob = await Sync.pullPdf(id);
        if (blob) { await PdfDB.put(id, blob, `${id}.pdf`); showPdf(blob, `${id}.pdf`); }
      }
    } catch (e) { /* 忽略 PDF 载入错误 */ }
  })();

  // 云端拉取题目描述（用户未改动时覆盖）
  if (Sync.configured()) {
    const descAtOpen = desc;
    Sync.pullDesc(id).then(remote => {
      if (remote != null && remote !== descEditor.value && descEditor.value === descAtOpen) {
        descEditor.value = remote; Store.setDesc(id, remote);
        if (document.querySelector("#descSeg button.active")?.dataset.mode === "view") renderDescView();
      }
    }).catch(() => {});
  }

  /* ---------------- 右栏：笔记 ---------------- */
  const editor = document.getElementById("editor");
  const editWrap = document.getElementById("editWrap");
  const viewWrap = document.getElementById("viewWrap");
  const saveHint = document.getElementById("saveHint");

  async function persist(showToast) {
    saveHint.textContent = Sync.configured() ? "同步中…" : "已保存";
    saveHint.classList.add("show");
    const ok = await saveNoteEverywhere(id, editor.value);
    saveHint.textContent = ok ? (Sync.configured() ? "已同步" : "已保存") : "同步失败";
    setTimeout(() => { saveHint.textContent = "自动保存"; saveHint.classList.remove("show"); }, 1600);
    if (showToast && ok) toast(Sync.configured() ? "已保存并同步到 GitHub" : "笔记已保存");
  }
  // 自动保存（输入后 800ms）
  editor.oninput = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => persist(false), 800); };
  document.getElementById("saveBtn").onclick = () => persist(true);

  // 若已连接 GitHub，进入时拉取云端笔记（仅在用户尚未改动时覆盖）
  if (Sync.configured()) {
    const localAtOpen = note;
    setSyncState("busy");
    Sync.pullNote(id).then(remote => {
      setSyncState("ok");
      if (remote != null && remote !== editor.value && editor.value === localAtOpen) {
        editor.value = remote;
        Store.setNote(id, remote);
        if (document.querySelector("#modeSeg button.active")?.dataset.mode === "view") renderMarkdownInto(viewWrap, remote);
        saveHint.textContent = "已载入云端笔记"; saveHint.classList.add("show");
        setTimeout(() => { saveHint.textContent = "自动保存"; saveHint.classList.remove("show"); }, 1600);
      }
    }).catch(e => setSyncState("err", e.message));
  }

  // Ctrl/Cmd+S 保存
  editor.onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persist(true); }
  };

  // 模式切换
  function setNoteMode(mode) {
    document.querySelectorAll("#modeSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") {
      const md = editor.value;
      if (md.trim()) renderMarkdownInto(viewWrap, md);
      else viewWrap.innerHTML = `<div class="empty-note"><span class="brush">墨</span><p>暂无笔记，切到「编辑」写下第一笔。</p></div>`;
      editWrap.style.display = "none";
      viewWrap.style.display = "block";
    } else {
      editWrap.style.display = "flex";
      viewWrap.style.display = "none";
    }
  }
  document.querySelectorAll("#modeSeg button").forEach(b => b.onclick = () => setNoteMode(b.dataset.mode));
  // 默认：有内容显示预览，空白显示编辑
  setNoteMode(note.trim() ? "view" : "edit");

  // 状态
  document.getElementById("statusSel").onchange = (e) => {
    Store.setStatus(id, parseInt(e.target.value, 10));
    toast("状态已更新");
    pushMetaSafe();
  };

  // 收藏
  document.getElementById("starDetail").onclick = (e) => {
    const on = Store.toggleStar(id);
    e.currentTarget.classList.toggle("primary", on);
    e.currentTarget.innerHTML = on ? ICON.starFill : ICON.star;
    pushMetaSafe();
  };

  // 上传 md
  const mdFile = document.getElementById("mdFile");
  document.getElementById("uploadMd").onclick = () => mdFile.click();
  mdFile.onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const existing = editor.value.trim();
      if (existing && !confirm("当前已有笔记内容，上传的文件将覆盖它，确定继续？")) { mdFile.value=""; return; }
      editor.value = reader.result;
      persist(true);
      toast(`已导入 ${f.name}`);
      mdFile.value = "";
    };
    reader.readAsText(f);
  };

  // 下载 md
  document.getElementById("downloadMd").onclick = () => {
    const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${p.id}-${p.slug}.md`;
    a.click(); URL.revokeObjectURL(a.href);
    toast("已下载 Markdown 文件");
  };
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
      .then(() => { setSyncState("ok"); if (isListRoute()) route(); })
      .catch(e => setSyncState("err", e.message));
  }
}

function boot() { initTheme(); initBackup(); initSync(); route(); }

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", boot);
// 若脚本在 DOMContentLoaded 之后加载
if (document.readyState !== "loading") boot();
