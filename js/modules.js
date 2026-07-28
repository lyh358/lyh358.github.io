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

/* ---------- 通用输入弹窗 ---------- */
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
  add(title, type) { const arr = this.list(); const it = { id: uid(), title, type: type || "未分类", created: Date.now() }; arr.push(it); this.save(arr); return it; },
  update(id, patch) { const arr = this.list(); const i = arr.findIndex(x => x.id === id); if (i >= 0) { arr[i] = Object.assign(arr[i], patch); this.save(arr); } },
  remove(id) { this.save(this.list().filter(x => x.id !== id)); localStorage.removeItem("leetweb:custom:desc:" + id); localStorage.removeItem("leetweb:custom:note:" + id); },
  getDesc(id) { return localStorage.getItem("leetweb:custom:desc:" + id) || ""; },
  setDesc(id, md) { md && md.trim() ? localStorage.setItem("leetweb:custom:desc:" + id, md) : localStorage.removeItem("leetweb:custom:desc:" + id); },
  getNote(id) { return localStorage.getItem("leetweb:custom:note:" + id) || ""; },
  setNote(id, md) { md && md.trim() ? localStorage.setItem("leetweb:custom:note:" + id, md) : localStorage.removeItem("leetweb:custom:note:" + id); },
};
const cDescPath = id => `custom/${id}-desc.md`;
const cNotePath = id => `custom/${id}-note.md`;
const cPdfPath  = id => `custom/${id}-desc.pdf`;

async function syncCustomIndex() {
  if (!Sync.configured()) return;
  try { setSyncState("busy"); await Sync.writeText("custom/index.json", JSON.stringify(CustomStore.list(), null, 2), "update custom index"); setSyncState("ok"); }
  catch (e) { setSyncState("err", e.message); toast("题库目录同步失败：" + e.message); }
}
async function pullCustomIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("custom/index.json"); if (t) CustomStore.save(JSON.parse(t)); } catch (e) {}
}

function renderCustomList() {
  document.body.classList.remove("detail-mode");
  setNav("custom");
  const items = CustomStore.list().sort((a, b) => b.created - a.created);
  const types = [...new Set(items.map(i => i.type || "未分类"))];
  let listHtml = "";
  if (!items.length) {
    listHtml = `<div class="kb-empty"><span class="brush">撕</span><p>还没有手撕题。点击右上「＋ 新建题目」开始收录。</p></div>`;
  } else {
    types.forEach(t => {
      const group = items.filter(i => (i.type || "未分类") === t);
      listHtml += `<section class="category">
        <div class="category-head"><h2>${esc(t)}</h2><span class="count">${group.length} 题</span></div>
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
  return `<div class="problem-card" data-id="${it.id}">
    <span class="pc-id">撕</span>
    <div class="pc-body">
      <div class="pc-title">${esc(it.title)}</div>
      <div class="pc-meta"><span class="diff" style="color:var(--ink-faint)">${esc(it.type || "未分类")}</span></div>
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
  renderEditorDetail({
    backHref: "#/custom",
    eyebrow: "手撕 · " + (it.type || "未分类"),
    title: it.title,
    tags: [{ text: it.type || "未分类" }],
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
        <div class="seg" id="descSeg"><button data-mode="edit">编辑</button><button data-mode="view" class="active">预览</button></div>
        <div class="spacer"></div>
        <span class="save-hint" id="descHint">题面自动保存</span>
      </div>
      <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
        <div class="prob-header">
          <h1 class="detail-title">${esc(cfg.title)}
            ${cfg.onEditInfo ? `<button class="icon-btn tiny" id="editInfo" title="编辑信息">${ICON.note}</button>` : ""}
          </h1>
          <div class="detail-meta">
            ${cfg.eyebrow ? `<span class="tag">${esc(cfg.eyebrow)}</span>` : ""}
            ${cfg.link ? `<a class="lc-link sm" href="${cfg.link.href}" target="_blank" rel="noopener">${ICON.external} 原题</a>` : ""}
          </div>
        </div>
        <div id="descEdit" style="flex:1; display:none; flex-direction:column; padding:clamp(18px,2.5vw,30px);">
          <textarea class="editor" id="descEditor" placeholder="在此写下或粘贴题目描述（支持 Markdown）。&#10;也可以用下方按钮上传 .md，或上传 PDF 题面。">${esc(desc)}</textarea>
        </div>
        <div id="descView" style="flex:1; overflow-y:auto; padding:clamp(18px,2.5vw,30px);"></div>
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

    <div class="pane right">
      <div class="pane-head">
        <div class="seg" id="noteSeg"><button data-mode="edit" class="active">编辑</button><button data-mode="view">预览</button></div>
        <span class="label note-label">解法笔记</span>
        <div class="spacer"></div>
        <span class="save-hint" id="noteHint">自动保存</span>
        ${cfg.onDelete ? `<button class="btn" id="delItem" title="删除此条">${ICON.trash}</button>` : ""}
      </div>
      <div class="pane-body" style="padding:0; display:flex; flex-direction:column;">
        <div id="noteEdit" style="flex:1; display:flex; flex-direction:column; padding:clamp(20px,3vw,36px);">
          <textarea class="editor" id="noteEditor" placeholder="# 思路&#10;&#10;写下你的解法笔记，支持 Markdown…&#10;&#10;\`\`\`java&#10;// 代码&#10;\`\`\`">${esc(note)}</textarea>
        </div>
        <div id="noteView" style="flex:1; overflow-y:auto; padding:clamp(20px,3vw,36px); display:none;"></div>
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

  /* ---- 左：题面 ---- */
  const descEditor = document.getElementById("descEditor");
  const descEdit = document.getElementById("descEdit");
  const descView = document.getElementById("descView");
  const descHint = document.getElementById("descHint");
  let pdfUrl = null;

  function flash(el, text, base) { el.textContent = text; el.classList.add("show"); setTimeout(() => { el.classList.remove("show"); el.textContent = base; }, 1600); }
  function renderDescView() {
    const parts = [];
    if (pdfUrl) parts.push(`<div class="pdf-wrap"><iframe class="pdf-frame" src="${pdfUrl}" title="PDF 题面"></iframe></div>`);
    if (descEditor.value.trim()) parts.push(`<div class="markdown">${renderMarkdown(descEditor.value)}</div>`);
    if (!parts.length) { descView.innerHTML = `<div class="empty-note"><span class="brush">题</span><p>还没有题目描述。<br/>切到「编辑」写下，或上传 MD / PDF。</p></div>`; return; }
    descView.innerHTML = parts.join("");
    descView.querySelectorAll("pre code").forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
  }
  function setDescMode(mode) {
    document.querySelectorAll("#descSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") { renderDescView(); descEdit.style.display = "none"; descView.style.display = "block"; }
    else { descEdit.style.display = "flex"; descView.style.display = "none"; }
  }
  async function persistDesc(showToast) {
    cfg.desc.set(descEditor.value);
    flash(descHint, Sync.configured() ? "同步中…" : "已保存", "题面自动保存");
    if (Sync.configured()) {
      try { setSyncState("busy"); descEditor.value.trim() ? await cfg.desc.push(descEditor.value) : await cfg.desc.pushEmpty(); setSyncState("ok"); flash(descHint, "已同步", "题面自动保存"); }
      catch (e) { setSyncState("err", e.message); toast("题面同步失败：" + e.message); return; }
    }
    if (showToast) toast("题面已保存");
  }
  descEditor.oninput = () => { clearTimeout(genDescTimer); genDescTimer = setTimeout(() => persistDesc(false), 800); };
  descEditor.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persistDesc(true); } };
  document.getElementById("saveDesc").onclick = () => persistDesc(true);
  document.querySelectorAll("#descSeg button").forEach(b => b.onclick = () => setDescMode(b.dataset.mode));
  setDescMode(desc.trim() ? "view" : "edit");
  if (cfg.onEditInfo) document.getElementById("editInfo").onclick = cfg.onEditInfo;
  if (cfg.onDelete) document.getElementById("delItem").onclick = cfg.onDelete;

  const descMdFile = document.getElementById("descMdFile");
  document.getElementById("upDescMd").onclick = () => descMdFile.click();
  descMdFile.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (descEditor.value.trim() && !confirm("将覆盖当前题面，继续？")) { descMdFile.value = ""; return; } descEditor.value = r.result; persistDesc(true); setDescMode("view"); toast(`已导入 ${f.name}`); descMdFile.value = ""; };
    r.readAsText(f);
  };

  /* ---- PDF ---- */
  if (cfg.pdf) {
    const rmPdfBtn = document.getElementById("rmPdf");
    const showPdf = (blob) => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl = URL.createObjectURL(blob); rmPdfBtn.style.display = ""; setDescMode("view"); };
    const hidePdf = () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); pdfUrl = null; rmPdfBtn.style.display = "none"; renderDescView(); };
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
      if (remote != null && remote !== descEditor.value && descEditor.value === at) {
        descEditor.value = remote; cfg.desc.set(remote);
        if (document.querySelector("#descSeg button.active")?.dataset.mode === "view") renderDescView();
      }
    }).catch(() => {});
  }

  /* ---- 右：笔记 ---- */
  const noteEditor = document.getElementById("noteEditor");
  const noteEdit = document.getElementById("noteEdit");
  const noteView = document.getElementById("noteView");
  const noteHint = document.getElementById("noteHint");

  async function persistNote(showToast) {
    cfg.note.set(noteEditor.value);
    flash(noteHint, Sync.configured() ? "同步中…" : "已保存", "自动保存");
    if (Sync.configured()) {
      try { setSyncState("busy"); noteEditor.value.trim() ? await cfg.note.push(noteEditor.value) : await cfg.note.pushEmpty(); setSyncState("ok"); flash(noteHint, "已同步", "自动保存"); }
      catch (e) { setSyncState("err", e.message); toast("同步失败：" + e.message); return; }
    }
    if (showToast) toast("笔记已保存");
  }
  function setNoteMode(mode) {
    document.querySelectorAll("#noteSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") { noteEditor.value.trim() ? renderMarkdownInto(noteView, noteEditor.value) : (noteView.innerHTML = `<div class="empty-note"><span class="brush">墨</span><p>暂无笔记，切到「编辑」写下第一笔。</p></div>`); noteEdit.style.display = "none"; noteView.style.display = "block"; }
    else { noteEdit.style.display = "flex"; noteView.style.display = "none"; }
  }
  noteEditor.oninput = () => { clearTimeout(genNoteTimer); genNoteTimer = setTimeout(() => persistNote(false), 800); };
  noteEditor.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persistNote(true); } };
  document.getElementById("saveNote").onclick = () => persistNote(true);
  document.querySelectorAll("#noteSeg button").forEach(b => b.onclick = () => setNoteMode(b.dataset.mode));
  setNoteMode(note.trim() ? "view" : "edit");

  const noteMdFile = document.getElementById("noteMdFile");
  document.getElementById("upNoteMd").onclick = () => noteMdFile.click();
  noteMdFile.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (noteEditor.value.trim() && !confirm("将覆盖当前笔记，继续？")) { noteMdFile.value = ""; return; } noteEditor.value = r.result; persistNote(true); toast(`已导入 ${f.name}`); noteMdFile.value = ""; };
    r.readAsText(f);
  };
  document.getElementById("dlNoteMd").onclick = () => {
    const blob = new Blob([noteEditor.value], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = cfg.note.downloadName || "note.md"; a.click(); URL.revokeObjectURL(a.href);
    toast("已下载");
  };
  if (Sync.configured()) {
    const at = note;
    cfg.note.pull().then(remote => {
      if (remote != null && remote !== noteEditor.value && noteEditor.value === at) {
        noteEditor.value = remote; cfg.note.set(remote);
        if (document.querySelector("#noteSeg button.active")?.dataset.mode === "view") renderMarkdownInto(noteView, remote);
      }
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
  if (!Sync.configured()) return;
  try { setSyncState("busy"); await Sync.writeText("kb/index.json", JSON.stringify(KbStore.load(), null, 2), "update kb index"); setSyncState("ok"); }
  catch (e) { setSyncState("err", e.message); toast("知识库目录同步失败：" + e.message); }
}
async function pullKbIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("kb/index.json"); if (t) KbStore.save(JSON.parse(t)); } catch (e) {}
}

function renderKb(folderId) {
  document.body.classList.remove("detail-mode");
  setNav("kb");
  folderId = folderId || null;
  const { folders, notes } = KbStore.children(folderId);
  const crumbs = KbStore.crumbs(folderId);
  const crumbHtml = `<a href="#/kb" class="crumb">知识库</a>` +
    crumbs.map(c => ` <span class="crumb-sep">/</span> <a href="#/kb/f/${c.id}" class="crumb">${esc(c.name)}</a>`).join("");

  let grid = "";
  folders.forEach(f => {
    grid += `<div class="kb-card folder" data-fid="${f.id}">
      <span class="kb-ic">${ICON.folder}</span>
      <div class="kb-name">${esc(f.name)}</div>
      <div class="kb-actions"><span class="kb-rename" title="重命名">${ICON.pencil}</span><span class="kb-del" title="删除">${ICON.trash}</span></div>
    </div>`;
  });
  notes.forEach(n => {
    grid += `<div class="kb-card note" data-nid="${n.id}">
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
      <button class="btn" id="kbUpPdf">${ICON.file} 上传 PDF</button>
    </div>
    <div class="kb-grid">${grid}</div>
    <div class="footer"><span class="seal-sm">拾遗</span> · 知识库</div>
    <input type="file" id="kbPdfInput" accept="application/pdf,.pdf" hidden />
  </div></div>`;

  document.getElementById("kbNewFolder").onclick = async () => {
    const v = await openPrompt({ title: "新建文件夹", fields: [{ id: "name", label: "名称", placeholder: "如：操作系统 / 网络" }], required: ["name"], okText: "创建" });
    if (!v) return; KbStore.addFolder(v.name, folderId); await syncKbIndex(); renderKb(folderId);
  };
  document.getElementById("kbNewNote").onclick = async () => {
    const v = await openPrompt({ title: "新建 Markdown 笔记", fields: [{ id: "name", label: "标题", placeholder: "如：TCP 三次握手" }], required: ["name"], okText: "创建" });
    if (!v) return; const n = KbStore.addNote(v.name, folderId, "md"); await syncKbIndex(); location.hash = "#/kb/n/" + n.id;
  };
  const pdfInput = document.getElementById("kbPdfInput");
  document.getElementById("kbUpPdf").onclick = () => pdfInput.click();
  pdfInput.onchange = async e => {
    const f = e.target.files[0]; if (!f) return; pdfInput.value = "";
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) { toast("请选择 PDF 文件"); return; }
    const name = f.name.replace(/\.pdf$/i, "");
    const n = KbStore.addNote(name, folderId, "pdf");
    const buf = await f.arrayBuffer();
    await PdfDB.put("kb-" + n.id, new Blob([buf], { type: "application/pdf" }), f.name);
    await syncKbIndex();
    if (Sync.configured()) {
      if (buf.byteLength > 10 * 1024 * 1024) toast("PDF 超 10MB，仅存本设备");
      else { try { setSyncState("busy"); await Sync.writeBinary(kbPdfPath(n.id), buf, "kb pdf"); setSyncState("ok"); } catch (err) { setSyncState("err", err.message); toast("PDF 同步失败（已存本地）"); } }
    }
    toast(`已上传 ${f.name}`); renderKb(folderId);
  };

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
      body.innerHTML = `<iframe class="pdf-frame" src="${url}" title="${esc(n.name)}"></iframe>`;
      const dl = document.getElementById("dlPdf"); if (dl) dl.onclick = () => { const a = document.createElement("a"); a.href = url; a.download = n.name + ".pdf"; a.click(); };
    })();
    return;
  }

  // md 笔记：单栏 编辑/预览
  const md = KbStore.getMd(nid);
  app.innerHTML = `
  <div class="view"><div class="kb-note-page">
    <div class="pane-head">
      <span class="back-btn" onclick="location.hash='${backHref}'">${ICON.back} 返回</span>
      <div class="seg" id="kbSeg" style="margin-left:14px"><button data-mode="edit">编辑</button><button data-mode="view" class="active">预览</button></div>
      <span class="label" style="margin-left:14px">${esc(n.name)}</span>
      <div class="spacer" style="flex:1"></div>
      <span class="save-hint" id="kbHint">自动保存</span>
      <button class="btn" id="kbDl">${ICON.download} .md</button>
      <button class="btn primary" id="kbSave">${ICON.save} 保存</button>
    </div>
    <div class="kb-note-body">
      <div id="kbEdit" style="display:none; height:100%; padding:clamp(22px,4vw,48px);"><textarea class="editor" id="kbEditor" placeholder="# ${esc(n.name)}\n\n在此记录知识点，支持 Markdown…">${esc(md)}</textarea></div>
      <div id="kbView" style="height:100%; overflow-y:auto; padding:clamp(22px,4vw,48px);"></div>
    </div>
  </div></div>`;

  const editor = document.getElementById("kbEditor");
  const editWrap = document.getElementById("kbEdit");
  const viewWrap = document.getElementById("kbView");
  const hint = document.getElementById("kbHint");

  function setMode(mode) {
    document.querySelectorAll("#kbSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") { editor.value.trim() ? renderMarkdownInto(viewWrap, editor.value) : (viewWrap.innerHTML = `<div class="empty-note"><span class="brush">墨</span><p>还没有内容，切到「编辑」开始记录。</p></div>`); editWrap.style.display = "none"; viewWrap.style.display = "block"; }
    else { editWrap.style.display = "block"; viewWrap.style.display = "none"; }
  }
  async function persist(showToast) {
    KbStore.setMd(nid, editor.value);
    hint.textContent = Sync.configured() ? "同步中…" : "已保存"; hint.classList.add("show");
    if (Sync.configured()) {
      try { setSyncState("busy"); editor.value.trim() ? await Sync.writeText(kbMdPath(nid), editor.value, "kb note") : await Sync.remove(kbMdPath(nid)); setSyncState("ok"); hint.textContent = "已同步"; }
      catch (e) { setSyncState("err", e.message); toast("同步失败：" + e.message); }
    }
    setTimeout(() => { hint.textContent = "自动保存"; hint.classList.remove("show"); }, 1600);
    if (showToast) toast("已保存");
  }
  editor.oninput = () => { clearTimeout(kbNoteTimer); kbNoteTimer = setTimeout(() => persist(false), 800); };
  editor.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persist(true); } };
  document.getElementById("kbSave").onclick = () => persist(true);
  document.getElementById("kbDl").onclick = () => { const blob = new Blob([editor.value], { type: "text/markdown;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = n.name + ".md"; a.click(); URL.revokeObjectURL(a.href); };
  document.querySelectorAll("#kbSeg button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  setMode(md.trim() ? "view" : "edit");

  if (Sync.configured()) {
    const at = md;
    Sync.readText(kbMdPath(nid)).then(remote => {
      if (remote != null && remote !== editor.value && editor.value === at) {
        editor.value = remote; KbStore.setMd(nid, remote);
        if (document.querySelector("#kbSeg button.active")?.dataset.mode === "view") renderMarkdownInto(viewWrap, remote);
      }
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
  remove(id) { this.save(this.list().filter(x => x.id !== id)); localStorage.removeItem("leetweb:resume:md:" + id); },
  getMd(id) { return localStorage.getItem("leetweb:resume:md:" + id) || ""; },
  setMd(id, md) { md && md.trim() ? localStorage.setItem("leetweb:resume:md:" + id, md) : localStorage.removeItem("leetweb:resume:md:" + id); },
};
const rsMdPath = id => `resume/${id}.md`;
const rsPdfPath = id => `resume/${id}.pdf`;

async function syncResumeIndex() {
  if (!Sync.configured()) return;
  try { setSyncState("busy"); await Sync.writeText("resume/index.json", JSON.stringify(ResumeStore.list(), null, 2), "update resume index"); setSyncState("ok"); }
  catch (e) { setSyncState("err", e.message); toast("简历目录同步失败：" + e.message); }
}
async function pullResumeIndex() {
  if (!Sync.configured()) return;
  try { const t = await Sync.readText("resume/index.json"); if (t) ResumeStore.save(JSON.parse(t)); } catch (e) {}
}

function fmtDate(ts) { const d = new Date(ts); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`; }

let resumeMdTimer;
function renderResume(selId) {
  document.body.classList.remove("detail-mode");
  setNav("resume");
  setTopbarVar();
  const items = ResumeStore.list().sort((a, b) => b.created - a.created);
  if (!selId && items.length) selId = items[0].id;
  const sel = selId ? ResumeStore.get(selId) : null;

  const sideList = items.length
    ? items.map(it => `
      <div class="resume-item ${sel && sel.id === it.id ? "active" : ""}" data-id="${it.id}">
        <span class="ri-ic ${it.kind}">${it.kind === "pdf" ? ICON.file : ICON.note}</span>
        <div class="ri-body"><div class="ri-name">${esc(it.name)}</div><div class="ri-sub">${it.kind.toUpperCase()} · ${fmtDate(it.created)}</div></div>
        <div class="ri-actions"><span class="ri-dl" title="下载">${ICON.download}</span><span class="ri-rn" title="重命名">${ICON.pencil}</span><span class="ri-del" title="删除">${ICON.trash}</span></div>
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
      <input type="file" id="rsFile" accept="application/pdf,.pdf,.md,.markdown,.txt" hidden />
    </aside>
    <main class="resume-main" id="resumeMain"></main>
  </div></div>`;

  const fileInput = document.getElementById("rsFile");
  document.getElementById("rsUpload").onclick = () => fileInput.click();
  fileInput.onchange = async e => {
    const f = e.target.files[0]; if (!f) return; fileInput.value = "";
    const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
    const isMd = /\.(md|markdown|txt)$/i.test(f.name);
    if (!isPdf && !isMd) { toast("请上传 PDF 或 Markdown 文件"); return; }
    const kind = isPdf ? "pdf" : "md";
    const name = f.name.replace(/\.(pdf|md|markdown|txt)$/i, "");
    const it = ResumeStore.add(name, kind);
    if (isPdf) {
      const buf = await f.arrayBuffer();
      await PdfDB.put("resume-" + it.id, new Blob([buf], { type: "application/pdf" }), f.name);
      if (Sync.configured()) {
        if (buf.byteLength > 10 * 1024 * 1024) toast("PDF 超 10MB，仅存本设备");
        else { try { setSyncState("busy"); await Sync.writeBinary(rsPdfPath(it.id), buf, "resume pdf"); setSyncState("ok"); } catch (err) { setSyncState("err", err.message); toast("同步失败（已存本地）"); } }
      }
    } else {
      const text = await f.text();
      ResumeStore.setMd(it.id, text);
      if (Sync.configured()) { try { setSyncState("busy"); await Sync.writeText(rsMdPath(it.id), text, "resume md"); setSyncState("ok"); } catch (err) { setSyncState("err", err.message); } }
    }
    await syncResumeIndex();
    toast(`已上传 ${f.name}`);
    location.hash = "#/resume/" + it.id;
    renderResume(it.id);
  };

  // 版本条目事件
  document.querySelectorAll(".resume-item").forEach(el => {
    el.onclick = e => { if (e.target.closest(".ri-actions")) return; location.hash = "#/resume/" + el.dataset.id; };
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
        <button class="btn" id="rbDl">${ICON.download} 下载</button></div>
      <div class="resume-view" id="rsView"><div class="empty-note"><span class="spin"></span><p style="margin-top:12px">正在载入…</p></div></div>`;
    document.getElementById("rbDl").onclick = () => downloadResume(sel.id);
    (async () => {
      let blob = null;
      const local = await PdfDB.get("resume-" + sel.id);
      if (local && local.blob) blob = local.blob;
      else if (Sync.configured()) { try { blob = await Sync.readBinary(rsPdfPath(sel.id), "application/pdf"); if (blob) await PdfDB.put("resume-" + sel.id, blob, sel.name + ".pdf"); } catch (e) {} }
      const view = document.getElementById("rsView"); if (!view) return;
      if (!blob) { view.innerHTML = `<div class="empty-note"><span class="brush">缺</span><p>未找到该 PDF 文件。</p></div>`; return; }
      const url = URL.createObjectURL(blob);
      view.innerHTML = `<iframe class="pdf-frame" src="${url}" title="${esc(sel.name)}"></iframe>`;
    })();
    return;
  }

  // md 简历：预览 / 编辑
  const md = ResumeStore.getMd(sel.id);
  main.innerHTML = `
    <div class="resume-bar">
      <div class="seg" id="rsSeg"><button data-mode="edit">编辑</button><button data-mode="view" class="active">预览</button></div>
      <span class="rb-title" style="margin-left:14px">${esc(sel.name)}</span>
      <div class="spacer" style="flex:1"></div>
      <span class="save-hint" id="rsHint">自动保存</span>
      <button class="btn" id="rbDl">${ICON.download} .md</button>
      <button class="btn primary" id="rsSave">${ICON.save} 保存</button>
    </div>
    <div class="resume-view" id="rsBody">
      <div id="rsEdit" style="display:none; height:100%; padding:clamp(22px,4vw,52px);"><textarea class="editor" id="rsEditor" placeholder="# ${esc(sel.name)}\n\n用 Markdown 书写简历…">${esc(md)}</textarea></div>
      <div id="rsMdView" style="height:100%; overflow-y:auto; padding:clamp(28px,5vw,64px);"></div>
    </div>`;
  const editor = document.getElementById("rsEditor");
  const editWrap = document.getElementById("rsEdit");
  const viewWrap = document.getElementById("rsMdView");
  const hint = document.getElementById("rsHint");
  function setMode(mode) {
    document.querySelectorAll("#rsSeg button").forEach(x => x.classList.toggle("active", x.dataset.mode === mode));
    if (mode === "view") { editor.value.trim() ? renderMarkdownInto(viewWrap, editor.value) : (viewWrap.innerHTML = `<div class="empty-note"><span class="brush">简</span><p>还没有内容，切到「编辑」书写。</p></div>`); editWrap.style.display = "none"; viewWrap.style.display = "block"; }
    else { editWrap.style.display = "block"; viewWrap.style.display = "none"; }
  }
  async function persist(showToast) {
    ResumeStore.setMd(sel.id, editor.value);
    hint.textContent = Sync.configured() ? "同步中…" : "已保存"; hint.classList.add("show");
    if (Sync.configured()) {
      try { setSyncState("busy"); editor.value.trim() ? await Sync.writeText(rsMdPath(sel.id), editor.value, "resume md") : await Sync.remove(rsMdPath(sel.id)); setSyncState("ok"); hint.textContent = "已同步"; }
      catch (e) { setSyncState("err", e.message); toast("同步失败：" + e.message); }
    }
    setTimeout(() => { hint.textContent = "自动保存"; hint.classList.remove("show"); }, 1600);
    if (showToast) toast("已保存");
  }
  editor.oninput = () => { clearTimeout(resumeMdTimer); resumeMdTimer = setTimeout(() => persist(false), 800); };
  editor.onkeydown = e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); persist(true); } };
  document.getElementById("rsSave").onclick = () => persist(true);
  document.getElementById("rbDl").onclick = () => downloadResume(sel.id);
  document.querySelectorAll("#rsSeg button").forEach(b => b.onclick = () => setMode(b.dataset.mode));
  setMode(md.trim() ? "view" : "edit");
  if (Sync.configured()) {
    const at = md;
    Sync.readText(rsMdPath(sel.id)).then(remote => {
      if (remote != null && remote !== editor.value && editor.value === at) {
        editor.value = remote; ResumeStore.setMd(sel.id, remote);
        if (document.querySelector("#rsSeg button.active")?.dataset.mode === "view") renderMarkdownInto(viewWrap, remote);
      }
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

/* ---------- 首次登录后拉取各模块目录 ---------- */
async function moduleInitialPull() {
  await pullCustomIndex();
  await pullKbIndex();
  await pullResumeIndex();
}
