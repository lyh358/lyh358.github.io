/* =========================================================
   拾遗 · 扩展模块
   ① 首页 landing   ② 手撕题库(custom)   ③ 知识库(kb)
   复用 app.js 的 renderMarkdown / toast / ICON / Sync / PdfDB
   ========================================================= */

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

/* ---------- 顶栏导航高亮 ---------- */
function setNav(section) {
  document.querySelectorAll("#topnav a").forEach(a => a.classList.toggle("active", a.dataset.nav === section));
}

/* ---------- 全站备份：全部 localStorage(除 token) + 全部 PDF ---------- */
function blobToB64(blob) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(blob); }); }
function b64ToBlob(b64, type) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type }); }
const Backup = {
  async export() {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("leetweb:") && k !== "leetweb:gh") ls[k] = localStorage.getItem(k);
    }
    const pdfs = {};
    try { for (const e of await PdfDB.all()) pdfs[e.key] = { name: e.name, data: await blobToB64(e.blob) }; } catch (e) {}
    return { app: "leetweb", version: 2, exportedAt: new Date().toISOString(), ls, pdfs };
  },
  async import(data) {
    if (data && data.items && !data.ls) { Store.importAll(data); return; } // 兼容旧版 v1
    if (!data || !data.ls) throw new Error("文件格式不正确");
    Object.entries(data.ls).forEach(([k, v]) => { if (k.startsWith("leetweb:") && k !== "leetweb:gh") localStorage.setItem(k, v); });
    if (data.pdfs) for (const [key, v] of Object.entries(data.pdfs)) { try { await PdfDB.put(key, b64ToBlob(v.data, "application/pdf"), v.name); } catch (e) {} }
  },
};

/* ---------- 全屏切换 ---------- */
function toggleFullscreen(el) {
  if (document.fullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document); }
  else { (el.requestFullscreen || el.webkitRequestFullscreen || function () { toast("当前浏览器不支持全屏"); }).call(el); }
}

/* ---------- 通用输入弹窗 ---------- */
function isMarkdownFile(file) {
  return !!file && (/\.(md|markdown|txt)$/i.test(file.name || "") || /^text\//i.test(file.type || ""));
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result || "");
    r.onerror = () => reject(r.error || new Error("read failed"));
    r.readAsText(file);
  });
}

async function importMarkdownFile(file, mde, persist, label) {
  if (!isMarkdownFile(file)) { toast("请选择 Markdown 文档"); return false; }
  if (mde.get().trim() && !confirm(`将覆盖当前${label}，继续？`)) return false;
  const text = await readFileAsText(file);
  mde.set(text);
  mde.setMode("view");
  await persist(true);
  toast(`已导入 ${file.name}`);
  return true;
}

function bindPaneMarkdownDrop(pane, mde, persist, label) {
  if (!pane) return;
  let depth = 0;
  const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
  const clear = () => { depth = 0; pane.classList.remove("drop-target"); };
  pane.addEventListener("dragenter", e => {
    if (!hasFiles(e)) return;
    e.preventDefault(); e.stopPropagation();
    depth++;
    pane.classList.add("drop-target");
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  });
  pane.addEventListener("dragover", e => {
    if (!hasFiles(e)) return;
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  });
  pane.addEventListener("dragleave", e => {
    if (!hasFiles(e)) return;
    e.stopPropagation();
    depth--;
    if (depth <= 0) clear();
  });
  pane.addEventListener("drop", async e => {
    if (!hasFiles(e)) return;
    e.preventDefault(); e.stopPropagation();
    clear();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    try { await importMarkdownFile(file, mde, persist, label); }
    catch (err) { toast("导入失败：" + err.message); }
  });
}

function bindPaneFullscreen(pane, btn) {
  if (!pane || !btn) return;
  const paint = () => {
    const on = document.fullscreenElement === pane || document.webkitFullscreenElement === pane;
    btn.innerHTML = on ? ICON.compress : ICON.expand;
    btn.classList.toggle("primary", on);
  };
  btn.onclick = () => toggleFullscreen(pane);
  document.addEventListener("fullscreenchange", paint);
  document.addEventListener("webkitfullscreenchange", paint);
  paint();
}

function openPrompt(opts) {
  return new Promise(resolve => {
    const mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.innerHTML = `<div class="modal">
      <h3>${opts.title}</h3>
      ${(opts.desc ? `<p class="modal-sub">${opts.desc}</p>` : "")}
      ${opts.fields.map(f => `<div class="field"><label>${f.label}</label>
        <input id="pf_${f.id}" value="${esc(f.value || "")}" placeholder="${esc(f.placeholder || "")}" /></div>`).join("")}
      <div class="modal-actions"><div class="spacer"></div>
        <button class="btn" id="pCancel">取消</button>
        <button class="btn primary" id="pOk">${opts.okText || "确定"}</button></div>
    </div>`;
    document.body.appendChild(mask);
    const first = mask.querySelector("input"); if (first) setTimeout(() => first.focus(), 40);
    const close = (v) => { mask.remove(); resolve(v); };
    mask.onclick = e => { if (e.target === mask) close(null); };
    mask.querySelector("#pCancel").onclick = () => close(null);
    const ok = () => {
      const vals = {}; opts.fields.forEach(f => vals[f.id] = mask.querySelector("#pf_" + f.id).value.trim());
      if (opts.required && opts.required.some(r => !vals[r])) { toast("请填写必填项"); return; }
      close(vals);
    };
    mask.querySelector("#pOk").onclick = ok;
    mask.querySelectorAll("input").forEach(inp => inp.onkeydown = e => { if (e.key === "Enter") ok(); });
  });
}

/* =========================================================
   首页
   ========================================================= */
function renderHome() {
  document.body.classList.remove("detail-mode");
  setNav("home");
  const st = Store.stats();
  const customN = CustomStore.list().length;
  const kbN = KbStore.load().notes.length;
  const resumeN = ResumeStore.list().length;
  app.innerHTML = `
  <div class="view"><div class="wrap home">
    <section class="home-hero">
      <div class="home-seal">拾</div>
      <h1>拾遗</h1>
      <p class="home-tagline">缺者补之，散者拾之<br/>一处收纳算法与知识的笔记庭院</p>
    </section>
    <section class="hero-arsenal" aria-label="英雄素材">
      <div class="hero-arsenal-main">
        <img src="assets/ow-genji-hero.png" alt="忍者英雄主视觉" />
        <div class="hero-arsenal-caption"><span>HERO FILE 01</span><strong>CYBER NINJA</strong><small>机动 · 近战 · 侦察</small></div>
      </div>
      <div class="hero-arsenal-side">
        <article class="hero-slice hero-slice-dva">
          <img src="assets/ow-dva-card.png" alt="D.Va 角色视觉" />
          <div><span>MEKA PILOT</span><strong>D.VA</strong></div>
        </article>
        <article class="hero-slice hero-slice-roster">
          <img src="assets/ow-roster-lounge.png" alt="英雄阵容大厅" />
          <div><span>ROSTER // READY</span><strong>TEAM ASSEMBLY</strong></div>
        </article>
      </div>
      <div class="hero-portrait" title="英雄头像">
        <img src="assets/ow-genji-avatar.png" alt="忍者英雄头像" />
        <span>LV. 76</span>
      </div>
    </section>
    <div class="module-grid">
      <a class="module-card" href="#/hot100">
        <span class="mc-num">壹</span>
        <div class="mc-body">
          <h3>热题 100</h3>
          <p>LeetCode 官方精选，双栏题笔记，进度可追。</p>
          <span class="mc-stat">${st.solved} / ${st.total} 已解决</span>
        </div>
      </a>
      <a class="module-card" href="#/custom">
        <span class="mc-num">贰</span>
        <div class="mc-body">
          <h3>手撕题库</h3>
          <p>自定义添加面试手撕题，分门别类，题面与解法自成一册。</p>
          <span class="mc-stat">${customN} 条记录</span>
        </div>
      </a>
      <a class="module-card" href="#/kb">
        <span class="mc-num">叁</span>
        <div class="mc-body">
          <h3>知识库</h3>
          <p>基础知识笔记，支持文件夹归档、Markdown 与 PDF。</p>
          <span class="mc-stat">${kbN} 篇笔记</span>
        </div>
      </a>
      <a class="module-card" href="#/resume">
        <span class="mc-num">肆</span>
        <div class="mc-body">
          <h3>简历</h3>
          <p>多版本简历的收纳与查看，支持 PDF 与 Markdown 上传下载。</p>
          <span class="mc-stat">${resumeN} 个版本</span>
        </div>
      </a>
    </div>
    <div class="footer"><span class="seal-sm">拾遗</span> · 侘寂 · 残缺 · 朴拙 · 无常</div>
  </div></div>`;
}

/* =========================================================
   手撕题库（custom）
   ========================================================= */
const CustomStore = {
  KEY: "leetweb:custom:index",
  list() { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save(arr) { localStorage.setItem(this.KEY, JSON.stringify(arr)); },
  get(id) { return this.list().find(x => x.id === id); },
  add(title, type) { const arr = this.list(); const it = { id: uid(), title, type: normalizeCustomType(type), created: Date.now() }; arr.push(it); this.save(arr); return it; },
  update(id, patch) { const arr = this.list(); const i = arr.findIndex(x => x.id === id); if (i >= 0) { if (patch && Object.prototype.hasOwnProperty.call(patch, "type")) patch.type = normalizeCustomType(patch.type); arr[i] = Object.assign(arr[i], patch); this.save(arr); } },
  remove(id) { this.save(this.list().filter(x => x.id !== id)); localStorage.removeItem("leetweb:custom:desc:" + id); localStorage.removeItem("leetweb:custom:note:" + id); },
  getDesc(id) { return localStorage.getItem("leetweb:custom:desc:" + id) || ""; },
  setDesc(id, md) { md && md.trim() ? localStorage.setItem("leetweb:custom:desc:" + id, md) : localStorage.removeItem("leetweb:custom:desc:" + id); },
  getNote(id) { return localStorage.getItem("leetweb:custom:note:" + id) || ""; },
  setNote(id, md) { md && md.trim() ? localStorage.setItem("leetweb:custom:note:" + id, md) : localStorage.removeItem("leetweb:custom:note:" + id); },
};
const cDescPath = id => `custom/${id}-desc.md`;
const cNotePath = id => `custom/${id}-note.md`;
const cPdfPath  = id => `custom/${id}-desc.pdf`;

function customTypeParts(type) {
  return String(type || "")
    .replace(/[，、；;|/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function normalizeCustomType(type) {
  const parts = customTypeParts(type);
  return parts.length ? [...new Set(parts)].join(" ") : "未分类";
}

function customTypeKey(type) {
  const parts = [...new Set(customTypeParts(type).map(x => x.toLowerCase()))].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  return parts.length ? parts.join("\u0001") : "未分类";
}

function groupCustomItems(items) {
  const groups = new Map();
  items.forEach(it => {
    const label = normalizeCustomType(it.type);
    const key = customTypeKey(label);
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key).items.push(it);
  });
  return [...groups.values()];
}

async function syncCustomIndex() {
  await trySync("customindex", "手撕题库目录", () => Sync.writeText("custom/index.json", JSON.stringify(CustomStore.list(), null, 2), "update custom index"));
}
async function pullCustomIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("custom/index.json"); if (t) CustomStore.save(JSON.parse(t)); } catch (e) {}
}

function renderCustomList() {
  document.body.classList.remove("detail-mode");
  setNav("custom");
  const items = CustomStore.list().sort((a, b) => b.created - a.created);
  const groups = groupCustomItems(items);
  let listHtml = "";
  if (!items.length) {
    listHtml = `<div class="kb-empty"><span class="brush">撕</span><p>还没有手撕题。点击右上「＋ 新建题目」开始收录。</p></div>`;
  } else {
    groups.forEach(g => {
      const group = g.items;
      listHtml += `<section class="category">
        <div class="category-head"><h2>${esc(g.label)}</h2><span class="count">${group.length} 题</span></div>
        <div class="problem-grid">${group.map(customCard).join("")}</div>
      </section>`;
    });
  }
  app.innerHTML = `
  <div class="view"><div class="wrap">
    <section class="hero compact">
      <h1>手撕题库</h1>
      <p>面试与自学中遇到的非 LeetCode 题目，自定义题目与分类，题面、解法各自成册。</p>
    </section>
    <div class="toolbar">
      <div class="search">${ICON.search}<input id="cSearch" type="text" placeholder="搜索题目或分类…" /></div>
      <div class="spacer" style="flex:1"></div>
      <button class="btn primary" id="cAdd">＋ 新建题目</button>
    </div>
    <div id="cList">${listHtml}</div>
    <div class="footer"><span class="seal-sm">拾遗</span> · 手撕题库</div>
  </div></div>`;

  document.getElementById("cAdd").onclick = addCustom;
  bindCustomCards();
  const search = document.getElementById("cSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll("#cList .problem-card").forEach(el => {
      const it = CustomStore.get(el.dataset.id);
      const hit = !q || (it && (it.title.toLowerCase().includes(q) || (it.type || "").toLowerCase().includes(q)));
      el.style.display = hit ? "" : "none";
    });
  };
}

function customCard(it) {
  const noted = !!CustomStore.getNote(it.id).trim();
  const type = normalizeCustomType(it.type);
  return `<div class="problem-card" data-id="${it.id}">
    <span class="pc-id">撕</span>
    <div class="pc-body">
      <div class="pc-title">${esc(it.title)}</div>
      <div class="pc-meta"><span class="diff" style="color:var(--ink-faint)">${esc(type)}</span></div>
    </div>
    <div class="pc-icons">
      ${noted ? `<span class="note-on" title="已有解法">${ICON.note}</span>` : ""}
      <span class="card-del" title="删除">${ICON.trash}</span>
    </div>
  </div>`;
}

function bindCustomCards() {
  document.querySelectorAll("#cList .problem-card").forEach(el => {
    el.onclick = (e) => { if (e.target.closest(".card-del")) return; location.hash = "#/custom/" + el.dataset.id; };
    const del = el.querySelector(".card-del");
    if (del) del.onclick = async (e) => {
      e.stopPropagation();
      const it = CustomStore.get(el.dataset.id);
      if (!confirm(`确定删除「${it ? it.title : ""}」及其题面与解法？`)) return;
      CustomStore.remove(el.dataset.id);
      if (Sync.configured()) { try { await Sync.remove(cDescPath(el.dataset.id)); } catch (e) {} try { await Sync.remove(cNotePath(el.dataset.id)); } catch (e) {} await syncCustomIndex(); }
      toast("已删除"); renderCustomList();
    };
  });
}

async function addCustom() {
  const v = await openPrompt({
    title: "新建手撕题",
    fields: [
      { id: "title", label: "题目名称", placeholder: "如：手写 LRU / 反转链表" },
      { id: "type", label: "分类", placeholder: "如：链表 / 字符串 / 设计", value: "未分类" },
    ],
    required: ["title"], okText: "创建",
  });
  if (!v) return;
  const it = CustomStore.add(v.title, v.type);
  await syncCustomIndex();
  location.hash = "#/custom/" + it.id;
}

function renderCustomDetail(cid) {
  const it = CustomStore.get(cid);
  if (!it) { location.hash = "#/custom"; return; }
  setNav("custom");
  const type = normalizeCustomType(it.type);
  renderEditorDetail({
    backHref: "#/custom",
    key: "c" + cid,
    eyebrow: "手撕 · " + type,
    title: it.title,
    tags: [{ text: type }],
    onEditInfo: async () => {
      const v = await openPrompt({
        title: "编辑题目信息",
        fields: [{ id: "title", label: "题目名称", value: it.title }, { id: "type", label: "分类", value: it.type }],
        required: ["title"], okText: "保存",
      });
      if (!v) return;
      CustomStore.update(cid, { title: v.title, type: v.type });
      await syncCustomIndex();
      renderCustomDetail(cid);
    },
    onDelete: async () => {
      if (!confirm(`确定删除「${it.title}」？`)) return;
      CustomStore.remove(cid);
      if (Sync.configured()) { try { await Sync.remove(cDescPath(cid)); } catch (e) {} try { await Sync.remove(cNotePath(cid)); } catch (e) {} await syncCustomIndex(); }
      toast("已删除"); location.hash = "#/custom";
    },
    desc: {
      get: () => CustomStore.getDesc(cid),
      set: md => CustomStore.setDesc(cid, md),
      push: md => Sync.writeText(cDescPath(cid), md, "custom desc " + cid),
      pushEmpty: () => Sync.remove(cDescPath(cid)),
      pull: () => Sync.readText(cDescPath(cid)),
    },
    pdf: { localKey: "custom-" + cid, remotePath: cPdfPath(cid) },
    note: {
      get: () => CustomStore.getNote(cid),
      set: md => CustomStore.setNote(cid, md),
      push: md => Sync.writeText(cNotePath(cid), md, "custom note " + cid),
      pushEmpty: () => Sync.remove(cNotePath(cid)),
      pull: () => Sync.readText(cNotePath(cid)),
      downloadName: `${it.title}.md`,
    },
  });
}

/* =========================================================
   通用双栏详情（题面 + 笔记），供手撕题库使用
   ========================================================= */
let genDescTimer, genNoteTimer;
function initDetailResizer() {
  const detail = document.querySelector(".detail");
  const grip = document.getElementById("detailResizer");
  if (!detail || !grip) return;

  const key = "leetweb:detail:leftPct";
  const clamp = v => Math.max(25, Math.min(75, v));
  const applyPct = pct => {
    const next = clamp(pct);
    detail.style.setProperty("--detail-left", next + "%");
    localStorage.setItem(key, String(next));
  };
  const saved = parseFloat(localStorage.getItem(key));
  if (!Number.isNaN(saved)) applyPct(saved);

  const setFromClientX = x => {
    const rect = detail.getBoundingClientRect();
    if (!rect.width) return;
    applyPct(((x - rect.left) / rect.width) * 100);
  };

  grip.addEventListener("pointerdown", e => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    detail.classList.add("is-resizing");
    document.body.classList.add("resizing-detail");
    setFromClientX(e.clientX);
  });
  grip.addEventListener("pointermove", e => {
    if (!grip.hasPointerCapture(e.pointerId)) return;
    setFromClientX(e.clientX);
  });
  function stopResize(e) {
    if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId);
    detail.classList.remove("is-resizing");
    document.body.classList.remove("resizing-detail");
  }
  grip.addEventListener("pointerup", stopResize);
  grip.addEventListener("pointercancel", stopResize);
  grip.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const current = parseFloat(getComputedStyle(detail).getPropertyValue("--detail-left")) || 50;
    applyPct(current + (e.key === "ArrowRight" ? 2 : -2));
  });
}
function renderEditorDetail(cfg) {
  document.body.classList.add("detail-mode");
  setTopbarVar();
  const desc = cfg.desc.get();
  const note = cfg.note.get();

  app.innerHTML = `
  <div class="view"><div class="detail">
    <div class="pane left">
      <div class="pane-head">
        <span class="back-btn" onclick="location.hash='${cfg.backHref}'">${ICON.back} 返回</span>
        <span class="label" style="margin-left:14px">题面</span>
        <div class="spacer"></div>
        <span class="save-hint" id="descHint">题面自动保存</span>
      </div>
      <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
        <div class="prob-header">
          <h1 class="detail-title">${esc(cfg.title)}
            ${cfg.onEditInfo ? `<button class="icon-btn tiny" id="editInfo" title="编辑信息">${ICON.pencil}</button>` : ""}
          </h1>
          <div class="detail-meta">
            ${cfg.eyebrow ? `<span class="tag">${esc(cfg.eyebrow)}</span>` : ""}
            ${(cfg.tags || []).map(t => `<span class="tag ${t.cls || ""}">${esc(t.text)}</span>`).join("")}
            ${cfg.link ? `<a class="lc-link sm" href="${cfg.link.href}" target="_blank" rel="noopener">${ICON.external} 原题</a>` : ""}
          </div>
        </div>
        <div id="descMount" style="flex:1; min-height:0;"></div>
      </div>
      <div class="pane-foot">
        <button class="btn" id="upDescMd">${ICON.upload} 上传 MD</button>
        ${cfg.pdf ? `<button class="btn" id="upDescPdf">${ICON.file} 上传 PDF</button><button class="btn" id="rmPdf" style="display:none;">${ICON.trash} 移除 PDF</button>` : ""}
        <div class="spacer"></div>
        <button class="btn primary" id="saveDesc">${ICON.save} 保存</button>
      </div>
      <input type="file" id="descMdFile" accept=".md,.markdown,.txt" hidden />
      ${cfg.pdf ? `<input type="file" id="descPdfFile" accept="application/pdf,.pdf" hidden />` : ""}
    </div>

    <div class="detail-resizer" id="detailResizer" role="separator" aria-label="调整题面与笔记比例" aria-orientation="vertical" tabindex="0"></div>

    <div class="pane right">
      <div class="pane-head">
        <span class="label note-label">${esc(cfg.noteLabel || "解法笔记")}</span>
        <div class="spacer"></div>
        <span class="save-hint" id="noteHint">自动保存</span>
        ${cfg.status ? `<select class="status-select" id="statusSel"><option value="0">○ 未开始</option><option value="1">✓ 已解决</option><option value="2">↻ 待复习</option></select>` : ""}
        ${cfg.star ? `<button class="btn star-detail" id="starDetail" title="收藏">${ICON.star}</button>` : ""}
        ${cfg.onDelete ? `<button class="btn" id="delItem" title="删除此条">${ICON.trash}</button>` : ""}
      </div>
      <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
        <div id="noteMount" style="flex:1; min-height:0;"></div>
      </div>
      <div class="pane-foot">
        <button class="btn" id="upNoteMd">${ICON.upload} 上传 .md</button>
        <button class="btn" id="dlNoteMd">${ICON.download} 下载 .md</button>
        <div class="spacer"></div>
        <button class="btn primary" id="saveNote">${ICON.save} 保存</button>
      </div>
      <input type="file" id="noteMdFile" accept=".md,.markdown,.txt" hidden />
    </div>
  </div></div>`;

  initDetailResizer();

  const leftPane = document.querySelector(".pane.left");
  const rightPane = document.querySelector(".pane.right");
  function addPaneFullButton(pane, hintId, title) {
    const hint = document.getElementById(hintId);
    if (!pane || !hint) return null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn pane-full";
    btn.title = title;
    btn.innerHTML = ICON.expand;
    hint.parentNode.insertBefore(btn, hint);
    bindPaneFullscreen(pane, btn);
    return btn;
  }
  addPaneFullButton(leftPane, "descHint", "左栏全屏");
  addPaneFullButton(rightPane, "noteHint", "右栏全屏");

  function flash(el, text, base) { el.textContent = text; el.classList.add("show"); setTimeout(() => { el.classList.remove("show"); el.textContent = base; }, 1600); }

  /* ---- 左：题面 ---- */
  const descHint = document.getElementById("descHint");
  let pdfUrl = null;
  async function persistDesc(showToast) {
    cfg.desc.set(descMde.get());
    flash(descHint, Sync.configured() ? "同步中…" : "已保存", "题面自动保存");
    if (Sync.configured()) {
      const val = descMde.get();
      const ok = await trySync("desc:" + cfg.key, (cfg.title || "题面") + " · 题面", () => val.trim() ? cfg.desc.push(val) : cfg.desc.pushEmpty());
      flash(descHint, ok ? "已同步" : "待补传·联网自动", "题面自动保存");
    }
    if (showToast) toast("题面已保存");
  }
  const descMde = createMde({
    value: desc,
    placeholder: "在此写下或粘贴题目描述（支持 Markdown）。\n也可以用下方按钮上传 .md，或上传 PDF 题面。",
    mode: desc.trim() ? "view" : "edit",
    onInput: () => { clearTimeout(genDescTimer); genDescTimer = setTimeout(() => persistDesc(false), 800); },
    decoratePreview: () => pdfUrl ? `<div class="pdf-wrap"><iframe class="pdf-frame" src="${pdfUrl}#toolbar=1&navpanes=0&view=FitH" title="PDF 题面"></iframe></div>` : "",
  });
  document.getElementById("descMount").appendChild(descMde.el);
  descMde.textarea.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persistDesc(true); } });
  document.getElementById("saveDesc").onclick = () => persistDesc(true);
  if (cfg.onEditInfo) document.getElementById("editInfo").onclick = cfg.onEditInfo;
  if (cfg.onDelete) document.getElementById("delItem").onclick = cfg.onDelete;

  const descMdFile = document.getElementById("descMdFile");
  document.getElementById("upDescMd").onclick = () => descMdFile.click();
  descMdFile.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (descMde.get().trim() && !confirm("将覆盖当前题面，继续？")) { descMdFile.value = ""; return; } descMde.set(r.result); descMde.setMode("view"); persistDesc(true); toast(`已导入 ${f.name}`); descMdFile.value = ""; };
    r.readAsText(f);
  };
  descMdFile.onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importMarkdownFile(f, descMde, persistDesc, "题面"); }
    catch (err) { toast("导入失败：" + err.message); }
    descMdFile.value = "";
  };
  bindPaneMarkdownDrop(leftPane, descMde, persistDesc, "题面");

  /* ---- PDF ---- */
  if (cfg.pdf) {
    const rmPdfBtn = document.getElementById("rmPdf");
    const showPdf = (blob) => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl = URL.createObjectURL(blob); rmPdfBtn.style.display = ""; descMde.setMode("view"); descMde.refresh(); };
    const hidePdf = () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl = null; rmPdfBtn.style.display = "none"; descMde.refresh(); };
    const pdfFile = document.getElementById("descPdfFile");
    document.getElementById("upDescPdf").onclick = () => pdfFile.click();
    pdfFile.onchange = async e => {
      const f = e.target.files[0]; if (!f) return; pdfFile.value = "";
      if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("请选择 PDF 文件"); return; }
      const buf = await f.arrayBuffer();
      await PdfDB.put(cfg.pdf.localKey, new Blob([buf], { type: "application/pdf" }), f.name);
      showPdf(new Blob([buf], { type: "application/pdf" })); toast(`已加载 ${f.name}`);
      if (Sync.configured()) {
        if (buf.byteLength > 10 * 1024 * 1024) { toast("PDF 超 10MB，仅存本设备"); return; }
        try { setSyncState("busy"); await Sync.writeBinary(cfg.pdf.remotePath, buf, "pdf"); setSyncState("ok"); toast("PDF 已同步"); }
        catch (err) { setSyncState("err", err.message); toast("PDF 同步失败（已存本地）"); }
      }
    };
    rmPdfBtn.onclick = async () => {
      if (!confirm("移除该 PDF 题面？")) return;
      hidePdf(); await PdfDB.del(cfg.pdf.localKey);
      if (Sync.configured()) { try { await Sync.remove(cfg.pdf.remotePath); } catch (e) {} }
      toast("已移除 PDF");
    };
    (async () => {
      try {
        const local = await PdfDB.get(cfg.pdf.localKey);
        if (local && local.blob) { showPdf(local.blob); return; }
        if (Sync.configured()) { const blob = await Sync.readBinary(cfg.pdf.remotePath, "application/pdf"); if (blob) { await PdfDB.put(cfg.pdf.localKey, blob, "题面.pdf"); showPdf(blob); } }
      } catch (e) {}
    })();
  }

  // 云端拉取题面
  if (Sync.configured()) {
    const at = desc;
    cfg.desc.pull().then(remote => {
      if (remote != null && remote !== descMde.get() && descMde.get() === at) { descMde.set(remote); cfg.desc.set(remote); }
    }).catch(() => {});
  }

  /* ---- 右：笔记 ---- */
  const noteHint = document.getElementById("noteHint");
  async function persistNote(showToast) {
    cfg.note.set(noteMde.get());
    flash(noteHint, Sync.configured() ? "同步中…" : "已保存", "自动保存");
    if (Sync.configured()) {
      const val = noteMde.get();
      const ok = await trySync("note:" + cfg.key, (cfg.title || "笔记") + " · 笔记", () => val.trim() ? cfg.note.push(val) : cfg.note.pushEmpty());
      flash(noteHint, ok ? "已同步" : "待补传·联网自动", "自动保存");
    }
    if (showToast) toast("笔记已保存");
  }
  const noteMde = createMde({
    value: note,
    placeholder: "# 思路\n\n写下你的解法笔记，支持 Markdown…\n\n```java\n// 代码\n```",
    mode: note.trim() ? "view" : "edit",
    onInput: () => { clearTimeout(genNoteTimer); genNoteTimer = setTimeout(() => persistNote(false), 800); },
  });
  document.getElementById("noteMount").appendChild(noteMde.el);
  noteMde.textarea.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persistNote(true); } });
  document.getElementById("saveNote").onclick = () => persistNote(true);

  if (cfg.status) {
    const sel = document.getElementById("statusSel");
    sel.value = String(cfg.status.get());
    sel.onchange = e => { cfg.status.set(parseInt(e.target.value, 10)); toast("状态已更新"); };
  }
  if (cfg.star) {
    const sb = document.getElementById("starDetail");
    const paint = on => { sb.classList.toggle("primary", on); sb.innerHTML = on ? ICON.starFill : ICON.star; };
    paint(cfg.star.get());
    sb.onclick = () => paint(cfg.star.toggle());
  }

  const noteMdFile = document.getElementById("noteMdFile");
  document.getElementById("upNoteMd").onclick = () => noteMdFile.click();
  noteMdFile.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (noteMde.get().trim() && !confirm("将覆盖当前笔记，继续？")) { noteMdFile.value = ""; return; } noteMde.set(r.result); persistNote(true); toast(`已导入 ${f.name}`); noteMdFile.value = ""; };
    r.readAsText(f);
  };
  noteMdFile.onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { await importMarkdownFile(f, noteMde, persistNote, "笔记"); }
    catch (err) { toast("导入失败：" + err.message); }
    noteMdFile.value = "";
  };
  bindPaneMarkdownDrop(rightPane, noteMde, persistNote, "笔记");
  document.getElementById("dlNoteMd").onclick = () => {
    const blob = new Blob([noteMde.get()], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = cfg.note.downloadName || "note.md"; a.click(); URL.revokeObjectURL(a.href);
    toast("已下载");
  };
  if (Sync.configured()) {
    const at = note;
    cfg.note.pull().then(remote => {
      if (remote != null && remote !== noteMde.get() && noteMde.get() === at) { noteMde.set(remote); cfg.note.set(remote); }
    }).catch(() => {});
  }
}

/* =========================================================
   知识库（kb）：文件夹 + md/pdf 笔记
   ========================================================= */
const KbStore = {
  KEY: "leetweb:kb:index",
  load() { try { return JSON.parse(localStorage.getItem(this.KEY) || '{"folders":[],"notes":[]}'); } catch (e) { return { folders: [], notes: [] }; } },
  save(t) { localStorage.setItem(this.KEY, JSON.stringify(t)); },
  addFolder(name, parent) { const t = this.load(); const f = { id: uid(), name, parent: parent || null, created: Date.now() }; t.folders.push(f); this.save(t); return f; },
  addNote(name, parent, kind) { const t = this.load(); const n = { id: uid(), name, parent: parent || null, kind: kind || "md", created: Date.now() }; t.notes.push(n); this.save(t); return n; },
  getFolder(id) { return this.load().folders.find(f => f.id === id); },
  getNote(id) { return this.load().notes.find(n => n.id === id); },
  rename(id, name) { const t = this.load(); const f = t.folders.find(x => x.id === id) || t.notes.find(x => x.id === id); if (f) { f.name = name; this.save(t); } },
  move(id, newParent) {
    const t = this.load(); newParent = newParent || null;
    const note = t.notes.find(n => n.id === id);
    if (note) { if ((note.parent || null) === newParent) return false; note.parent = newParent; this.save(t); return true; }
    const folder = t.folders.find(f => f.id === id);
    if (folder) {
      if (id === newParent || (folder.parent || null) === newParent) return false;
      let cur = newParent ? t.folders.find(f => f.id === newParent) : null;   // 防环：目标不能是自己的后代
      while (cur) { if (cur.id === id) return false; cur = cur.parent ? t.folders.find(f => f.id === cur.parent) : null; }
      folder.parent = newParent; this.save(t); return true;
    }
    return false;
  },
  children(parent) { const t = this.load(); parent = parent || null; return { folders: t.folders.filter(f => (f.parent || null) === parent), notes: t.notes.filter(n => (n.parent || null) === parent) }; },
  crumbs(folderId) { const t = this.load(); const path = []; let cur = folderId ? t.folders.find(f => f.id === folderId) : null; while (cur) { path.unshift(cur); cur = cur.parent ? t.folders.find(f => f.id === cur.parent) : null; } return path; },
  removeNote(id) { const t = this.load(); t.notes = t.notes.filter(n => n.id !== id); this.save(t); localStorage.removeItem("leetweb:kb:md:" + id); },
  removeFolderDeep(id) {
    const t = this.load(); const rmF = new Set(), rmN = new Set();
    const walk = (fid) => { rmF.add(fid); t.folders.filter(f => f.parent === fid).forEach(f => walk(f.id)); t.notes.filter(n => n.parent === fid).forEach(n => rmN.add(n.id)); };
    walk(id);
    rmN.forEach(nid => localStorage.removeItem("leetweb:kb:md:" + nid));
    t.folders = t.folders.filter(f => !rmF.has(f.id)); t.notes = t.notes.filter(n => !rmN.has(n.id));
    this.save(t); return { folders: [...rmF], notes: [...rmN] };
  },
  getMd(id) { return localStorage.getItem("leetweb:kb:md:" + id) || ""; },
  setMd(id, md) { md && md.trim() ? localStorage.setItem("leetweb:kb:md:" + id, md) : localStorage.removeItem("leetweb:kb:md:" + id); },
};
const kbMdPath = id => `kb/notes/${id}.md`;
const kbPdfPath = id => `kb/notes/${id}.pdf`;

async function syncKbIndex() {
  await trySync("kbindex", "知识库目录", () => Sync.writeText("kb/index.json", JSON.stringify(KbStore.load(), null, 2), "update kb index"));
}
async function pullKbIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("kb/index.json"); if (t) KbStore.save(JSON.parse(t)); } catch (e) {}
}

// 批量导入文件到知识库当前文件夹（支持 md 与 pdf，多文件）
async function importFilesToKb(folderId, fileList) {
  const files = [...fileList].filter(f => f.type === "application/pdf" || /\.(pdf|md|markdown|txt)$/i.test(f.name));
  const skipped = fileList.length - files.length;
  if (!files.length) { toast("请选择 PDF 或 Markdown 文件"); return; }
  setSyncState("busy");
  let done = 0;
  for (const f of files) {
    const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    const name = f.name.replace(/\.(pdf|md|markdown|txt)$/i, "");
    if (isPdf) {
      const n = KbStore.addNote(name, folderId, "pdf");
      const buf = await f.arrayBuffer();
      await PdfDB.put("kb-" + n.id, new Blob([buf], { type: "application/pdf" }), f.name);
      if (Sync.configured() && buf.byteLength <= 10 * 1024 * 1024) { try { await Sync.writeBinary(kbPdfPath(n.id), buf, "kb pdf"); } catch (e) {} }
    } else {
      const n = KbStore.addNote(name, folderId, "md");
      const text = await f.text();
      KbStore.setMd(n.id, text);
      if (Sync.configured()) { try { await Sync.writeText(kbMdPath(n.id), text, "kb md"); } catch (e) {} }
    }
    done++;
  }
  await syncKbIndex();
  setSyncState(Sync.configured() ? "ok" : "off");
  toast(`已上传 ${done} 个文件${skipped ? `，跳过 ${skipped} 个不支持的` : ""}`);
  if ((location.hash || "").startsWith("#/kb")) renderKb(folderId);
}

function renderKb(folderId) {
  document.body.classList.remove("detail-mode");
  setNav("kb");
  folderId = folderId || null;
  const { folders, notes } = KbStore.children(folderId);
  const crumbs = KbStore.crumbs(folderId);
  const crumbHtml = `<a href="#/kb" class="crumb">知识库</a>` +
    crumbs.map(c => ` <span class="crumb-sep">/</span> <a href="#/kb/f/${c.id}" class="crumb" data-fid="${c.id}">${esc(c.name)}</a>`).join("");

  let grid = "";
  folders.forEach(f => {
    grid += `<div class="kb-card folder" data-fid="${f.id}" draggable="true">
      <span class="kb-ic">${ICON.folder}</span>
      <div class="kb-name">${esc(f.name)}</div>
      <div class="kb-actions"><span class="kb-rename" title="重命名">${ICON.pencil}</span><span class="kb-del" title="删除">${ICON.trash}</span></div>
    </div>`;
  });
  notes.forEach(n => {
    grid += `<div class="kb-card note" data-nid="${n.id}" draggable="true">
      <span class="kb-ic ${n.kind}">${n.kind === "pdf" ? ICON.file : ICON.note}</span>
      <div class="kb-name">${esc(n.name)}<span class="kb-kind">${n.kind.toUpperCase()}</span></div>
      <div class="kb-actions"><span class="kb-rename" title="重命名">${ICON.pencil}</span><span class="kb-del" title="删除">${ICON.trash}</span></div>
    </div>`;
  });
  if (!folders.length && !notes.length) grid = `<div class="kb-empty"><span class="brush">库</span><p>这里还是空的。新建文件夹归档，或新建 / 上传一篇笔记。</p></div>`;

  app.innerHTML = `
  <div class="view"><div class="wrap">
    <section class="hero compact">
      <h1>知识库</h1>
      <p>基础知识与随手笔记的归档之处，可建文件夹分类，支持 Markdown 与 PDF。</p>
    </section>
    <div class="kb-bar">
      <div class="kb-crumbs">${crumbHtml}</div>
      <div class="spacer" style="flex:1"></div>
      <button class="btn" id="kbNewFolder">＋ 文件夹</button>
      <button class="btn" id="kbNewNote">＋ 笔记</button>
      <button class="btn" id="kbUpload">${ICON.upload} 上传文件</button>
    </div>
    <div class="kb-grid">${grid}</div>
    <div class="footer"><span class="seal-sm">拾遗</span> · 知识库 · 可将 MD / PDF 文件直接拖入此页上传</div>
    <input type="file" id="kbFileInput" accept="application/pdf,.pdf,.md,.markdown,.txt" multiple hidden />
  </div></div>`;

  document.getElementById("kbNewFolder").onclick = async () => {
    const v = await openPrompt({ title: "新建文件夹", fields: [{ id: "name", label: "名称", placeholder: "如：操作系统 / 网络" }], required: ["name"], okText: "创建" });
    if (!v) return; KbStore.addFolder(v.name, folderId); await syncKbIndex(); renderKb(folderId);
  };
  document.getElementById("kbNewNote").onclick = async () => {
    const v = await openPrompt({ title: "新建 Markdown 笔记", fields: [{ id: "name", label: "标题", placeholder: "如：TCP 三次握手" }], required: ["name"], okText: "创建" });
    if (!v) return; const n = KbStore.addNote(v.name, folderId, "md"); await syncKbIndex(); location.hash = "#/kb/n/" + n.id;
  };
  const fileInput = document.getElementById("kbFileInput");
  document.getElementById("kbUpload").onclick = () => fileInput.click();
  fileInput.onchange = async e => { const fs = e.target.files; if (!fs || !fs.length) return; await importFilesToKb(folderId, fs); fileInput.value = ""; };

  document.querySelectorAll(".kb-card.folder").forEach(el => {
    el.onclick = e => { if (e.target.closest(".kb-actions")) return; location.hash = "#/kb/f/" + el.dataset.fid; };
    el.querySelector(".kb-rename").onclick = async e => { e.stopPropagation(); const f = KbStore.getFolder(el.dataset.fid); const v = await openPrompt({ title: "重命名文件夹", fields: [{ id: "name", label: "名称", value: f.name }], required: ["name"], okText: "保存" }); if (!v) return; KbStore.rename(el.dataset.fid, v.name); await syncKbIndex(); renderKb(folderId); };
    el.querySelector(".kb-del").onclick = async e => {
      e.stopPropagation(); const f = KbStore.getFolder(el.dataset.fid);
      if (!confirm(`删除文件夹「${f.name}」及其中全部内容？`)) return;
      const removed = KbStore.removeFolderDeep(el.dataset.fid);
      if (Sync.configured()) { for (const nid of removed.notes) { try { await Sync.remove(kbMdPath(nid)); } catch (e) {} try { await Sync.remove(kbPdfPath(nid)); } catch (e) {} } await syncKbIndex(); }
      toast("已删除"); renderKb(folderId);
    };
  });
  document.querySelectorAll(".kb-card.note").forEach(el => {
    el.onclick = e => { if (e.target.closest(".kb-actions")) return; location.hash = "#/kb/n/" + el.dataset.nid; };
    el.querySelector(".kb-rename").onclick = async e => { e.stopPropagation(); const n = KbStore.getNote(el.dataset.nid); const v = await openPrompt({ title: "重命名笔记", fields: [{ id: "name", label: "标题", value: n.name }], required: ["name"], okText: "保存" }); if (!v) return; KbStore.rename(el.dataset.nid, v.name); await syncKbIndex(); renderKb(folderId); };
    el.querySelector(".kb-del").onclick = async e => {
      e.stopPropagation(); const n = KbStore.getNote(el.dataset.nid);
      if (!confirm(`删除笔记「${n.name}」？`)) return;
      KbStore.removeNote(el.dataset.nid); await PdfDB.del("kb-" + el.dataset.nid);
      if (Sync.configured()) { try { await Sync.remove(kbMdPath(el.dataset.nid)); } catch (e) {} try { await Sync.remove(kbPdfPath(el.dataset.nid)); } catch (e) {} await syncKbIndex(); }
      toast("已删除"); renderKb(folderId);
    };
  });

  /* ---- 拖拽整理：把笔记/文件夹拖进文件夹或面包屑 ---- */
  let kbDrag = null;
  async function moveKbItem(id, target) {
    if (!id || id === target) return;
    if (!KbStore.move(id, target)) { toast("无法移动到该位置"); return; }
    await syncKbIndex(); toast("已移动"); renderKb(folderId);
  }
  document.querySelectorAll(".kb-card[draggable]").forEach(el => {
    const id = el.dataset.fid || el.dataset.nid;
    el.addEventListener("dragstart", e => { kbDrag = id; el.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); });
    el.addEventListener("dragend", () => { kbDrag = null; el.classList.remove("dragging"); document.querySelectorAll(".drop-in").forEach(x => x.classList.remove("drop-in")); });
  });
  document.querySelectorAll(".kb-card.folder").forEach(el => {
    el.addEventListener("dragover", e => { if (kbDrag && kbDrag !== el.dataset.fid) { e.preventDefault(); el.classList.add("drop-in"); } });
    el.addEventListener("dragleave", () => el.classList.remove("drop-in"));
    el.addEventListener("drop", e => { e.preventDefault(); el.classList.remove("drop-in"); moveKbItem(kbDrag, el.dataset.fid); });
  });
  document.querySelectorAll(".kb-crumbs .crumb").forEach(el => {
    const target = el.dataset.fid || null;   // 知识库根为 null
    el.addEventListener("dragover", e => { if (kbDrag) { e.preventDefault(); el.classList.add("drop-in"); } });
    el.addEventListener("dragleave", () => el.classList.remove("drop-in"));
    el.addEventListener("drop", e => { e.preventDefault(); el.classList.remove("drop-in"); moveKbItem(kbDrag, target); });
  });
}

let kbNoteTimer;
function renderKbNote(nid) {
  const n = KbStore.getNote(nid);
  if (!n) { location.hash = "#/kb"; return; }
  setNav("kb");
  document.body.classList.add("detail-mode");
  setTopbarVar();
  const backHref = n.parent ? "#/kb/f/" + n.parent : "#/kb";

  if (n.kind === "pdf") {
    app.innerHTML = `
    <div class="view"><div class="kb-note-page">
      <div class="pane-head">
        <span class="back-btn" onclick="location.hash='${backHref}'">${ICON.back} 返回</span>
        <span class="label" style="margin-left:14px">${esc(n.name)} · PDF</span>
        <div class="spacer" style="flex:1"></div>
        <button class="btn" id="dlPdf">${ICON.download} 下载</button>
      </div>
      <div class="kb-pdf-body" id="pdfBody"><div class="empty-note"><span class="spin"></span><p style="margin-top:12px">正在载入 PDF…</p></div></div>
    </div></div>`;
    (async () => {
      let blob = null;
      const local = await PdfDB.get("kb-" + nid);
      if (local && local.blob) blob = local.blob;
      else if (Sync.configured()) { try { blob = await Sync.readBinary(kbPdfPath(nid), "application/pdf"); if (blob) await PdfDB.put("kb-" + nid, blob, n.name + ".pdf"); } catch (e) {} }
      const body = document.getElementById("pdfBody"); if (!body) return;
      if (!blob) { body.innerHTML = `<div class="empty-note"><span class="brush">缺</span><p>未找到该 PDF 文件。</p></div>`; return; }
      const url = URL.createObjectURL(blob);
      body.innerHTML = `<iframe class="pdf-frame" src="${url}#toolbar=1&navpanes=0&view=FitH" title="${esc(n.name)}"></iframe>`;
      const dl = document.getElementById("dlPdf"); if (dl) dl.onclick = () => { const a = document.createElement("a"); a.href = url; a.download = n.name + ".pdf"; a.click(); };
    })();
    return;
  }

  // md 笔记：公共编辑器组件
  const md = KbStore.getMd(nid);
  app.innerHTML = `
  <div class="view"><div class="kb-note-page">
    <div class="pane-head">
      <span class="back-btn" onclick="location.hash='${backHref}'">${ICON.back} 返回</span>
      <span class="label" style="margin-left:14px">${esc(n.name)}</span>
      <div class="spacer" style="flex:1"></div>
      <span class="save-hint" id="kbHint">自动保存</span>
      <button class="btn" id="kbDl">${ICON.download} .md</button>
      <button class="btn primary" id="kbSave">${ICON.save} 保存</button>
    </div>
    <div class="kb-note-body" id="kbMount"></div>
  </div></div>`;

  const hint = document.getElementById("kbHint");
  async function persist(showToast) {
    KbStore.setMd(nid, mde.get());
    hint.textContent = Sync.configured() ? "同步中…" : "已保存"; hint.classList.add("show");
    if (Sync.configured()) {
      const val = mde.get();
      const ok = await trySync("kbmd:" + nid, n.name, () => val.trim() ? Sync.writeText(kbMdPath(nid), val, "kb note") : Sync.remove(kbMdPath(nid)));
      hint.textContent = ok ? "已同步" : "待补传";
    }
    setTimeout(() => { hint.textContent = "自动保存"; hint.classList.remove("show"); }, 1600);
    if (showToast) toast("已保存");
  }
  const mde = createMde({
    value: md,
    placeholder: `# ${n.name}\n\n在此记录知识点，支持 Markdown…`,
    mode: md.trim() ? "view" : "edit",
    onInput: () => { clearTimeout(kbNoteTimer); kbNoteTimer = setTimeout(() => persist(false), 800); },
  });
  document.getElementById("kbMount").appendChild(mde.el);
  mde.textarea.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persist(true); } });
  document.getElementById("kbSave").onclick = () => persist(true);
  document.getElementById("kbDl").onclick = () => { const blob = new Blob([mde.get()], { type: "text/markdown;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = n.name + ".md"; a.click(); URL.revokeObjectURL(a.href); };

  if (Sync.configured()) {
    const at = md;
    Sync.readText(kbMdPath(nid)).then(remote => {
      if (remote != null && remote !== mde.get() && mde.get() === at) { mde.set(remote); KbStore.setMd(nid, remote); }
    }).catch(() => {});
  }
}

/* =========================================================
   简历（resume）：多版本上传 / 下载 / 查看
   ========================================================= */
const ResumeStore = {
  KEY: "leetweb:resume:index",
  list() { try { return JSON.parse(localStorage.getItem(this.KEY) || "[]"); } catch (e) { return []; } },
  save(arr) { localStorage.setItem(this.KEY, JSON.stringify(arr)); },
  get(id) { return this.list().find(x => x.id === id); },
  add(name, kind) { const arr = this.list(); const it = { id: uid(), name, kind, created: Date.now() }; arr.push(it); this.save(arr); return it; },
  rename(id, name) { const arr = this.list(); const i = arr.findIndex(x => x.id === id); if (i >= 0) { arr[i].name = name; this.save(arr); } },
  toggleCurrent(id) { const arr = this.list(); const it = arr.find(x => x.id === id); const make = !(it && it.current); arr.forEach(x => x.current = false); if (make && it) it.current = true; this.save(arr); return make; },
  remove(id) { this.save(this.list().filter(x => x.id !== id)); localStorage.removeItem("leetweb:resume:md:" + id); },
  getMd(id) { return localStorage.getItem("leetweb:resume:md:" + id) || ""; },
  setMd(id, md) { md && md.trim() ? localStorage.setItem("leetweb:resume:md:" + id, md) : localStorage.removeItem("leetweb:resume:md:" + id); },
};
const rsMdPath = id => `resume/${id}.md`;
const rsPdfPath = id => `resume/${id}.pdf`;

async function syncResumeIndex() {
  await trySync("resumeindex", "简历目录", () => Sync.writeText("resume/index.json", JSON.stringify(ResumeStore.list(), null, 2), "update resume index"));
}
async function pullResumeIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("resume/index.json"); if (t) ResumeStore.save(JSON.parse(t)); } catch (e) {}
}

// 批量导入简历版本（支持 md 与 pdf，多文件）
async function importFilesToResume(fileList) {
  const files = [...fileList].filter(f => f.type === "application/pdf" || /\.(pdf|md|markdown|txt)$/i.test(f.name));
  if (!files.length) { toast("请上传 PDF 或 Markdown 文件"); return; }
  setSyncState("busy");
  let last = null;
  for (const f of files) {
    const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    const name = f.name.replace(/\.(pdf|md|markdown|txt)$/i, "");
    const it = ResumeStore.add(name, isPdf ? "pdf" : "md");
    if (isPdf) {
      const buf = await f.arrayBuffer();
      await PdfDB.put("resume-" + it.id, new Blob([buf], { type: "application/pdf" }), f.name);
      if (Sync.configured() && buf.byteLength <= 10 * 1024 * 1024) { try { await Sync.writeBinary(rsPdfPath(it.id), buf, "resume pdf"); } catch (e) {} }
    } else {
      const text = await f.text();
      ResumeStore.setMd(it.id, text);
      if (Sync.configured()) { try { await Sync.writeText(rsMdPath(it.id), text, "resume md"); } catch (e) {} }
    }
    last = it;
  }
  await syncResumeIndex();
  setSyncState(Sync.configured() ? "ok" : "off");
  toast(`已上传 ${files.length} 个版本`);
  if (last) { location.hash = "#/resume/" + last.id; renderResume(last.id); }
}

function fmtDate(ts) { const d = new Date(ts); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; }

let resumeMdTimer;
function renderResume(selId) {
  document.body.classList.remove("detail-mode");
  setNav("resume");
  setTopbarVar();
  const items = ResumeStore.list().sort((a, b) => (b.current ? 1 : 0) - (a.current ? 1 : 0) || b.created - a.created);
  if (!selId && items.length) selId = (items.find(x => x.current) || items[0]).id;
  const sel = selId ? ResumeStore.get(selId) : null;

  const sideList = items.length
    ? items.map(it => `
      <div class="resume-item ${sel && sel.id === it.id ? "active" : ""} ${it.current ? "current" : ""}" data-id="${it.id}">
        <span class="ri-ic ${it.kind}">${it.kind === "pdf" ? ICON.file : ICON.note}</span>
        <div class="ri-body"><div class="ri-name">${esc(it.name)}${it.current ? `<span class="ri-badge">当前</span>` : ""}</div><div class="ri-sub">${it.kind.toUpperCase()} · ${fmtDate(it.created)}</div></div>
        <div class="ri-actions">
          <span class="ri-cur ${it.current ? "on" : ""}" title="设为当前版本">${it.current ? ICON.starFill : ICON.star}</span>
          <span class="ri-dl" title="下载">${ICON.download}</span><span class="ri-rn" title="重命名">${ICON.pencil}</span><span class="ri-del" title="删除">${ICON.trash}</span></div>
      </div>`).join("")
    : `<div class="resume-empty"><p>还没有简历。<br/>点上方按钮上传第一个版本。</p></div>`;

  app.innerHTML = `
  <div class="view"><div class="resume-layout">
    <aside class="resume-side">
      <div class="resume-side-head">
        <h2>简历</h2>
        <button class="btn primary sm" id="rsUpload">${ICON.upload} 上传</button>
      </div>
      <div class="resume-side-sub">共 ${items.length} 个版本</div>
      <div class="resume-list">${sideList}</div>
      <input type="file" id="rsFile" accept="application/pdf,.pdf,.md,.markdown,.txt" multiple hidden />
    </aside>
    <main class="resume-main" id="resumeMain"></main>
  </div></div>`;

  const fileInput = document.getElementById("rsFile");
  document.getElementById("rsUpload").onclick = () => fileInput.click();
  fileInput.onchange = async e => { const fs = e.target.files; if (!fs || !fs.length) return; await importFilesToResume(fs); fileInput.value = ""; };

  // 版本条目事件
  document.querySelectorAll(".resume-item").forEach(el => {
    el.onclick = e => { if (e.target.closest(".ri-actions")) return; location.hash = "#/resume/" + el.dataset.id; };
    el.querySelector(".ri-cur").onclick = async e => {
      e.stopPropagation();
      const on = ResumeStore.toggleCurrent(el.dataset.id);
      await syncResumeIndex();
      toast(on ? "已设为当前版本" : "已取消当前标记");
      renderResume(sel ? sel.id : null);
    };
    el.querySelector(".ri-dl").onclick = e => { e.stopPropagation(); downloadResume(el.dataset.id); };
    el.querySelector(".ri-rn").onclick = async e => {
      e.stopPropagation(); const it = ResumeStore.get(el.dataset.id);
      const v = await openPrompt({ title: "重命名版本", fields: [{ id: "name", label: "名称", value: it.name }], required: ["name"], okText: "保存" });
      if (!v) return; ResumeStore.rename(el.dataset.id, v.name); await syncResumeIndex(); renderResume(sel ? sel.id : null);
    };
    el.querySelector(".ri-del").onclick = async e => {
      e.stopPropagation(); const it = ResumeStore.get(el.dataset.id);
      if (!confirm(`删除简历版本「${it.name}」？`)) return;
      ResumeStore.remove(el.dataset.id); await PdfDB.del("resume-" + el.dataset.id);
      if (Sync.configured()) { try { await Sync.remove(rsPdfPath(el.dataset.id)); } catch (e) {} try { await Sync.remove(rsMdPath(el.dataset.id)); } catch (e) {} await syncResumeIndex(); }
      toast("已删除");
      const rest = ResumeStore.list();
      location.hash = "#/resume" + (rest.length ? "/" + rest[0].id : "");
      renderResume(rest.length ? rest[0].id : null);
    };
  });

  renderResumeMain(sel);
}

function renderResumeMain(sel) {
  const main = document.getElementById("resumeMain");
  if (!main) return;
  if (!sel) { main.innerHTML = `<div class="empty-note"><span class="brush">简</span><p>左侧上传或选择一份简历，在此查看。</p></div>`; return; }

  if (sel.kind === "pdf") {
    main.innerHTML = `
      <div class="resume-bar"><span class="rb-title">${esc(sel.name)}</span><div class="spacer" style="flex:1"></div>
        <button class="btn" id="rbFull">${ICON.expand} 全屏</button>
        <button class="btn" id="rbDl">${ICON.download} 下载</button></div>
      <div class="resume-view pdf" id="rsView"><div class="empty-note"><span class="spin"></span><p style="margin-top:12px">正在载入…</p></div></div>`;
    document.getElementById("rbDl").onclick = () => downloadResume(sel.id);
    document.getElementById("rbFull").onclick = () => toggleFullscreen(main);
    (async () => {
      let blob = null;
      const local = await PdfDB.get("resume-" + sel.id);
      if (local && local.blob) blob = local.blob;
      else if (Sync.configured()) { try { blob = await Sync.readBinary(rsPdfPath(sel.id), "application/pdf"); if (blob) await PdfDB.put("resume-" + sel.id, blob, sel.name + ".pdf"); } catch (e) {} }
      const view = document.getElementById("rsView"); if (!view) return;
      if (!blob) { view.innerHTML = `<div class="empty-note"><span class="brush">缺</span><p>未找到该 PDF 文件。</p></div>`; return; }
      const url = URL.createObjectURL(blob);
      view.innerHTML = `<iframe class="pdf-frame" src="${url}#toolbar=0&navpanes=0&view=FitH" title="${esc(sel.name)}"></iframe>`;
    })();
    return;
  }

  // md 简历：公共编辑器组件
  const md = ResumeStore.getMd(sel.id);
  main.innerHTML = `
    <div class="resume-bar">
      <span class="rb-title">${esc(sel.name)}</span>
      <div class="spacer" style="flex:1"></div>
      <span class="save-hint" id="rsHint">自动保存</span>
      <button class="btn" id="rbFull">${ICON.expand} 全屏</button>
      <button class="btn" id="rbDl">${ICON.download} .md</button>
      <button class="btn primary" id="rsSave">${ICON.save} 保存</button>
    </div>
    <div class="resume-view md" id="rsBody"></div>`;
  const hint = document.getElementById("rsHint");
  async function persist(showToast) {
    ResumeStore.setMd(sel.id, mde.get());
    hint.textContent = Sync.configured() ? "同步中…" : "已保存"; hint.classList.add("show");
    if (Sync.configured()) {
      const val = mde.get();
      const ok = await trySync("rsmd:" + sel.id, sel.name, () => val.trim() ? Sync.writeText(rsMdPath(sel.id), val, "resume md") : Sync.remove(rsMdPath(sel.id)));
      hint.textContent = ok ? "已同步" : "待补传";
    }
    setTimeout(() => { hint.textContent = "自动保存"; hint.classList.remove("show"); }, 1600);
    if (showToast) toast("已保存");
  }
  const mde = createMde({
    value: md,
    placeholder: `# ${sel.name}\n\n用 Markdown 书写简历…`,
    mode: md.trim() ? "view" : "edit",
    onInput: () => { clearTimeout(resumeMdTimer); resumeMdTimer = setTimeout(() => persist(false), 800); },
  });
  document.getElementById("rsBody").appendChild(mde.el);
  mde.textarea.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persist(true); } });
  document.getElementById("rsSave").onclick = () => persist(true);
  document.getElementById("rbDl").onclick = () => downloadResume(sel.id);
  document.getElementById("rbFull").onclick = () => toggleFullscreen(document.getElementById("resumeMain"));
  if (Sync.configured()) {
    const at = md;
    Sync.readText(rsMdPath(sel.id)).then(remote => {
      if (remote != null && remote !== mde.get() && mde.get() === at) { mde.set(remote); ResumeStore.setMd(sel.id, remote); }
    }).catch(() => {});
  }
}

async function downloadResume(id) {
  const it = ResumeStore.get(id); if (!it) return;
  if (it.kind === "pdf") {
    let blob = null;
    const local = await PdfDB.get("resume-" + id);
    if (local && local.blob) blob = local.blob;
    else if (Sync.configured()) { try { blob = await Sync.readBinary(rsPdfPath(id), "application/pdf"); } catch (e) {} }
    if (!blob) { toast("未找到文件"); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = it.name + ".pdf"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } else {
    const blob = new Blob([ResumeStore.getMd(id)], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = it.name + ".md"; a.click(); URL.revokeObjectURL(a.href);
  }
  toast("已下载 " + it.name);
}

/* =========================================================
   全局搜索（Cmd/Ctrl+K 命令面板）：跨模块 + 搜正文
   ========================================================= */
function buildSearchIndex() {
  const idx = [];
  PROBLEMS.forEach(p => idx.push({
    hash: `#/p/${p.id}`, module: "热题", title: `${p.id}. ${p.title}`, sub: `${p.cat} · ${DIFF_TEXT[p.diff]}`,
    content: Store.getDesc(p.id) + "\n" + Store.getNote(p.id),
  }));
  CustomStore.list().forEach(it => idx.push({
    hash: `#/custom/${it.id}`, module: "手撕", title: it.title, sub: it.type || "",
    content: CustomStore.getDesc(it.id) + "\n" + CustomStore.getNote(it.id),
  }));
  const kb = KbStore.load();
  kb.folders.forEach(f => idx.push({ hash: `#/kb/f/${f.id}`, module: "知识库·文件夹", title: f.name, sub: "", content: "" }));
  kb.notes.forEach(n => idx.push({
    hash: `#/kb/n/${n.id}`, module: "知识库", title: n.name, sub: n.kind.toUpperCase(),
    content: n.kind === "md" ? KbStore.getMd(n.id) : "",
  }));
  ResumeStore.list().forEach(r => idx.push({
    hash: `#/resume/${r.id}`, module: "简历", title: r.name, sub: r.kind.toUpperCase(),
    content: r.kind === "md" ? ResumeStore.getMd(r.id) : "",
  }));
  return idx;
}
function _snippet(text, i, len) {
  const start = Math.max(0, i - 30);
  return (start > 0 ? "…" : "") + text.slice(start, i + len + 50).replace(/\s+/g, " ").trim() + "…";
}
function searchIndex(idx, q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const res = [];
  for (const e of idx) {
    const title = e.title.toLowerCase(), sub = (e.sub || "").toLowerCase(), content = (e.content || "").toLowerCase();
    let score = -1, snippet = "";
    if (title.includes(q)) score = 0;
    else if (sub.includes(q)) score = 1;
    else { const i = content.indexOf(q); if (i >= 0) { score = 2; snippet = _snippet(e.content, i, q.length); } }
    if (score >= 0) res.push({ e, score, snippet });
  }
  res.sort((a, b) => a.score - b.score || a.e.title.length - b.e.title.length);
  return res.slice(0, 40);
}
function _hl(text, q) {
  const i = (text || "").toLowerCase().indexOf(q);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
}
function openSearch() {
  if (document.querySelector(".search-mask")) return;
  const idx = buildSearchIndex();
  const mask = document.createElement("div");
  mask.className = "modal-mask search-mask";
  mask.innerHTML = `<div class="search-box">
    <div class="sk-input"><span class="sk-ic">${ICON.search}</span><input id="skInput" placeholder="搜索题目 / 笔记 / 知识库 / 简历…" autocomplete="off" spellcheck="false"></div>
    <div class="sk-results" id="skResults"><div class="sk-hint">输入关键词开始搜索 · 支持搜正文</div></div>
    <div class="sk-foot"><span>↑ ↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>
  </div>`;
  document.body.appendChild(mask);
  const input = mask.querySelector("#skInput");
  const resultsEl = mask.querySelector("#skResults");
  let results = [], sel = 0;
  const close = () => mask.remove();
  mask.onclick = e => { if (e.target === mask) close(); };

  function setSel(i) {
    sel = i;
    resultsEl.querySelectorAll(".sk-item").forEach((el, j) => el.classList.toggle("active", j === i));
    const cur = resultsEl.querySelector(".sk-item.active"); if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function go(i) { const r = results[i]; if (!r) return; close(); location.hash = r.e.hash; }
  function render() {
    const q = input.value.trim().toLowerCase();
    results = q ? searchIndex(idx, q) : [];
    if (!q) { resultsEl.innerHTML = `<div class="sk-hint">输入关键词开始搜索 · 支持搜正文</div>`; return; }
    if (!results.length) { resultsEl.innerHTML = `<div class="sk-hint">没有匹配的结果</div>`; return; }
    resultsEl.innerHTML = results.map((r, i) => `<div class="sk-item ${i === 0 ? "active" : ""}" data-i="${i}">
      <span class="sk-mod">${r.e.module}</span>
      <div class="sk-main"><div class="sk-title">${_hl(r.e.title, q)}</div>
      ${r.snippet ? `<div class="sk-snip">${_hl(r.snippet, q)}</div>` : (r.e.sub ? `<div class="sk-snip">${esc(r.e.sub)}</div>` : "")}</div></div>`).join("");
    sel = 0;
    resultsEl.querySelectorAll(".sk-item").forEach(el => { el.onmousemove = () => setSel(+el.dataset.i); el.onclick = () => go(+el.dataset.i); });
  }
  input.oninput = render;
  input.onkeydown = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (results.length) setSel((sel + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (results.length) setSel((sel - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); go(sel); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };
  setTimeout(() => input.focus(), 30);
}
function initSearch() {
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
  });
  const btn = document.getElementById("searchBtn");
  if (btn) btn.onclick = openSearch;
}

/* =========================================================
   全局拖拽上传：知识库 / 简历 页面可直接拖入文件
   ========================================================= */
function dndContext() {
  const h = location.hash || "#/";
  if (/^#\/kb\/n\//.test(h)) return null;                       // 笔记详情页不接管
  const kf = h.match(/^#\/kb\/f\/([\w-]+)/);
  if (kf) return { type: "kb", folder: kf[1], label: "松开：上传到当前文件夹" };
  if (/^#\/kb\b/.test(h) || h === "#/kb") return { type: "kb", folder: null, label: "松开：上传到知识库根目录" };
  if (/^#\/resume/.test(h)) return { type: "resume", label: "松开：添加为简历版本" };
  return null;
}
function initGlobalDnd() {
  const overlay = document.createElement("div");
  overlay.className = "drop-overlay";
  overlay.innerHTML = `<div class="drop-inner"><div class="drop-ic">⇪</div><p id="dropMsg">松开以上传</p><small>支持 Markdown 与 PDF · 可多选</small></div>`;
  document.body.appendChild(overlay);
  const msg = () => document.getElementById("dropMsg");
  let depth = 0;
  const hasFiles = e => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");

  window.addEventListener("dragenter", e => {
    if (!hasFiles(e)) return;
    e.preventDefault(); depth++;
    const c = dndContext();
    overlay.classList.add("show");
    overlay.classList.toggle("deny", !c);
    msg().textContent = c ? c.label : "仅「知识库」与「简历」页支持拖拽上传";
  });
  window.addEventListener("dragover", e => { if (overlay.classList.contains("show")) e.preventDefault(); });
  window.addEventListener("dragleave", e => { if (!hasFiles(e)) return; depth--; if (depth <= 0) { depth = 0; overlay.classList.remove("show"); } });
  window.addEventListener("drop", async e => {
    if (!overlay.classList.contains("show")) return;
    e.preventDefault(); depth = 0; overlay.classList.remove("show");
    const c = dndContext();
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!c || !files || !files.length) return;
    if (c.type === "kb") await importFilesToKb(c.folder, files);
    else await importFilesToResume(files);
  });
}

/* ---------- 首次登录后拉取各模块目录 ---------- */
async function moduleInitialPull() {
  await pullCustomIndex();
  await pullKbIndex();
  await pullResumeIndex();
}

function initModulesUi() { initGlobalDnd(); initSearch(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initModulesUi);
else initModulesUi();
