/* =========================================================
   公共 Markdown 编辑器组件
   工具栏 · 图片粘贴/插入 · 编辑 / 分屏 / 预览 三态实时渲染
   依赖全局：renderMarkdown, hljs, toast
   用法：const mde = createMde({...}); mount.appendChild(mde.el);
   ========================================================= */

// 图片压缩为 data URL（内嵌进 markdown，随笔记一同同步，私库/离线均可用）
function imageToDataUrl(file, maxDim = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width, h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      const isPng = /png/i.test(file.type);
      let out = cv.toDataURL(isPng ? "image/png" : "image/jpeg", quality);
      if (isPng && out.length > 1.6 * 1024 * 1024) out = cv.toDataURL("image/jpeg", quality); // 过大的 PNG 退回 JPEG
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("图片读取失败")); };
    img.src = url;
  });
}

function _wrapSel(ta, before, after, placeholder) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.slice(s, e) || placeholder || "";
  ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
  ta.focus(); ta.selectionStart = s + before.length; ta.selectionEnd = s + before.length + sel.length;
}
function _linePrefix(ta, prefix) {
  const s = ta.selectionStart, e = ta.selectionEnd, val = ta.value;
  const lineStart = val.lastIndexOf("\n", s - 1) + 1;
  const ordered = prefix === "1. ";
  const seg = val.slice(lineStart, e).split("\n").map((ln, i) => (ordered ? `${i + 1}. ` : prefix) + ln).join("\n");
  ta.value = val.slice(0, lineStart) + seg + val.slice(e);
  ta.focus(); ta.selectionStart = lineStart; ta.selectionEnd = lineStart + seg.length;
}
function _insertAt(ta, text) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
  const pos = s + text.length; ta.focus(); ta.selectionStart = ta.selectionEnd = pos;
}

const MDE_TOOLS = [
  ["h", "标题", "H"], ["bold", "加粗", "<b>B</b>"], ["italic", "斜体", "<i>I</i>"],
  ["code", "行内代码", "&lt;/&gt;"], ["codeblock", "代码块", "{ }"], ["quote", "引用", "❝"],
  ["ul", "无序列表", "•"], ["ol", "有序列表", "1."], ["link", "链接", "🔗"], ["image", "插入图片", "🖼"],
];

/*
  opts:
    value            初始文本
    placeholder      占位符
    mode             'edit' | 'split' | 'view'（默认 edit）
    onInput(value)   每次输入回调（用于自动保存，调用方自行防抖）
    decoratePreview()  可选，返回预览区顶部要额外插入的 HTML（如 PDF）
*/
function createMde(opts) {
  opts = opts || {};
  const root = document.createElement("div");
  root.className = "mde";
  root.innerHTML = `
    <div class="mde-tools">
      <div class="mde-fmt">
        ${MDE_TOOLS.map(([c, t, l]) => `<button type="button" data-cmd="${c}" title="${t}">${l}</button>`).join("")}
      </div>
      <div class="spacer"></div>
      <div class="seg mde-modes">
        <button type="button" data-mode="edit">编辑</button>
        <button type="button" data-mode="split">分屏</button>
        <button type="button" data-mode="view">预览</button>
      </div>
    </div>
    <div class="mde-body">
      <div class="mde-edit"><textarea class="editor mde-ta" spellcheck="false"></textarea></div>
      <div class="mde-view"></div>
    </div>`;

  const ta = root.querySelector(".mde-ta");
  const view = root.querySelector(".mde-view");
  ta.value = opts.value || "";
  ta.placeholder = opts.placeholder || "";
  let mode = opts.mode || "edit";
  let previewTimer = null, imgInput = null;

  function renderPreview() {
    let html = "";
    if (opts.decoratePreview) html += opts.decoratePreview() || "";
    const md = ta.value;
    if (md.trim()) html += `<div class="markdown">${renderMarkdown(md)}</div>`;
    if (!html) html = `<div class="empty-note"><span class="brush">墨</span><p>还没有内容。</p></div>`;
    view.innerHTML = html;
    view.querySelectorAll("pre code").forEach(b => { try { hljs.highlightElement(b); } catch (e) {} });
  }
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(renderPreview, 140); }
  function apply() {
    root.dataset.mode = mode;
    root.querySelectorAll(".mde-modes button").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    if (mode !== "edit") renderPreview();
    if (opts.onModeChange) opts.onModeChange(mode);
  }

  ta.addEventListener("input", () => { if (mode === "split") schedulePreview(); if (opts.onInput) opts.onInput(ta.value); });
  ta.addEventListener("keydown", e => {
    if (e.key === "Tab") { e.preventDefault(); _insertAt(ta, "  "); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") { e.preventDefault(); runCmd("bold"); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") { e.preventDefault(); runCmd("italic"); }
  });

  // 图片：粘贴 或 工具栏按钮
  async function insertImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    try { const url = await imageToDataUrl(file); _insertAt(ta, `![${(file.name || "image").replace(/\.[^.]+$/, "")}](${url})\n`); ta.dispatchEvent(new Event("input")); toast("已插入图片"); }
    catch (e) { toast("图片插入失败：" + e.message); }
  }
  ta.addEventListener("paste", e => {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const it of items) { if (it.type && it.type.startsWith("image/")) { e.preventDefault(); insertImage(it.getAsFile()); break; } }
  });
  function pickImage() {
    if (!imgInput) { imgInput = document.createElement("input"); imgInput.type = "file"; imgInput.accept = "image/*"; imgInput.onchange = () => { const f = imgInput.files[0]; imgInput.value = ""; insertImage(f); }; }
    imgInput.click();
  }

  function runCmd(name) {
    switch (name) {
      case "bold": _wrapSel(ta, "**", "**", "粗体"); break;
      case "italic": _wrapSel(ta, "_", "_", "斜体"); break;
      case "code": _wrapSel(ta, "`", "`", "code"); break;
      case "codeblock": _wrapSel(ta, "\n```\n", "\n```\n", "代码"); break;
      case "quote": _linePrefix(ta, "> "); break;
      case "ul": _linePrefix(ta, "- "); break;
      case "ol": _linePrefix(ta, "1. "); break;
      case "h": _linePrefix(ta, "# "); break;
      case "link": _wrapSel(ta, "[", "](https://)", "链接文字"); break;
      case "image": pickImage(); return;
    }
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
  root.querySelectorAll(".mde-fmt button").forEach(b => b.onclick = () => runCmd(b.dataset.cmd));
  root.querySelectorAll(".mde-modes button").forEach(b => b.onclick = () => { mode = b.dataset.mode; apply(); });

  apply();

  return {
    el: root,
    get: () => ta.value,
    set: v => { ta.value = v || ""; if (mode !== "edit") renderPreview(); },
    getMode: () => mode,
    setMode: m => { mode = m; apply(); },
    refresh: () => { if (mode !== "edit") renderPreview(); },
    focus: () => ta.focus(),
    textarea: ta,
  };
}
