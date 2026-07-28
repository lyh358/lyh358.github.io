/* =========================================================
   GitHub 同步层
   笔记 -> 私有仓库的 notes/<id>-<slug>.md
   状态/收藏 -> 仓库根的 meta.json
   全程 GitHub REST API，Token 仅存于浏览器 localStorage
   ========================================================= */
const Sync = (() => {
  const GH_KEY = "leetweb:gh";
  const shaCache = {};           // path -> 最新 sha，减少一次读
  let remoteNoteIds = new Set();  // 远端已有笔记的题目 id

  // ---- 配置 ----
  function getCfg() {
    try { return JSON.parse(localStorage.getItem(GH_KEY) || "null"); }
    catch (e) { return null; }
  }
  function setCfg(c) { localStorage.setItem(GH_KEY, JSON.stringify(c)); }
  function clearCfg() { localStorage.removeItem(GH_KEY); for (const k in shaCache) delete shaCache[k]; remoteNoteIds = new Set(); }
  function configured() { const c = getCfg(); return !!(c && c.token && c.owner && c.repo); }
  function branch() { return (getCfg() || {}).branch || "main"; }

  // ---- 编码 ----
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = ""; const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  function base64ToUtf8(b64) {
    const bin = atob((b64 || "").replace(/\n/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encPath(p) { return p.split("/").map(encodeURIComponent).join("/"); }

  // ---- 底层请求 ----
  async function api(path, opts = {}) {
    const c = getCfg();
    if (!c || !c.token) throw new Error("未配置 GitHub");
    const headers = Object.assign({
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer " + c.token,
      "X-GitHub-Api-Version": "2022-11-28",
    }, opts.headers || {});
    return fetch("https://api.github.com" + path, Object.assign({}, opts, { headers }));
  }

  async function getFile(path) {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}/contents/${encPath(path)}?ref=${branch()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`读取失败 (${res.status})`);
    const d = await res.json();
    shaCache[path] = d.sha;
    return { sha: d.sha, content: base64ToUtf8(d.content) };
  }

  async function putFile(path, contentStr, message) {
    const c = getCfg();
    const body = { message, content: utf8ToBase64(contentStr), branch: branch() };
    let sha = shaCache[path];
    if (sha === undefined) { const f = await getFile(path); sha = f ? f.sha : null; }
    if (sha) body.sha = sha;
    const url = `/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`;
    let res = await api(url, { method: "PUT", body: JSON.stringify(body) });
    if (res.status === 409 || res.status === 422) { // sha 过期，重取重试一次
      const f = await getFile(path);
      if (f) body.sha = f.sha; else delete body.sha;
      res = await api(url, { method: "PUT", body: JSON.stringify(body) });
    }
    if (!res.ok) throw new Error(`保存失败 (${res.status})`);
    const d = await res.json();
    if (d.content) shaCache[path] = d.content.sha;
    return d;
  }

  async function deleteFile(path, message) {
    const c = getCfg();
    let sha = shaCache[path];
    if (!sha) { const f = await getFile(path); if (!f) return; sha = f.sha; }
    const url = `/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`;
    const res = await api(url, { method: "DELETE", body: JSON.stringify({ message, sha, branch: branch() }) });
    if (!res.ok && res.status !== 404) throw new Error(`删除失败 (${res.status})`);
    delete shaCache[path];
  }

  // ---- 业务 ----
  function notePath(id) {
    const p = PROBLEM_BY_ID[id];
    return `notes/${id}-${p ? p.slug : id}.md`;
  }

  async function test() {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}`);
    if (res.status === 401) throw new Error("Token 无效或已过期");
    if (res.status === 404) throw new Error("仓库不存在，或该 Token 无权访问它");
    if (!res.ok) throw new Error(`连接失败 (${res.status})`);
    const d = await res.json();
    if (!d.permissions || !d.permissions.push) throw new Error("该 Token 没有此仓库的写入权限");
    return d;
  }

  function descPath(id) { const p = PROBLEM_BY_ID[id]; return `desc/${id}-${p ? p.slug : id}.md`; }
  function pdfPath(id) { const p = PROBLEM_BY_ID[id]; return `desc/${id}-${p ? p.slug : id}.pdf`; }

  async function pushDesc(id, md) {
    if (md && md.trim()) await putFile(descPath(id), md, `desc: ${id}`);
    else await deleteFile(descPath(id), `remove desc: ${id}`);
  }
  async function pullDesc(id) {
    const f = await getFile(descPath(id));
    return f ? f.content : null;
  }

  // 取文件 sha（不解码内容，供二进制/覆盖用）
  async function getSha(path) {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}/contents/${encPath(path)}?ref=${branch()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`读取失败 (${res.status})`);
    const d = await res.json();
    shaCache[path] = d.sha;
    return d.sha;
  }
  function abToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = ""; const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(bin);
  }
  async function pushPdf(id, arrayBuffer) {
    const c = getCfg();
    const path = pdfPath(id);
    const body = { message: `pdf: ${id}`, content: abToBase64(arrayBuffer), branch: branch() };
    let sha = shaCache[path]; if (sha === undefined) sha = await getSha(path);
    if (sha) body.sha = sha;
    const url = `/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`;
    let res = await api(url, { method: "PUT", body: JSON.stringify(body) });
    if (res.status === 409 || res.status === 422) { const s = await getSha(path); if (s) body.sha = s; else delete body.sha; res = await api(url, { method: "PUT", body: JSON.stringify(body) }); }
    if (!res.ok) throw new Error(`PDF 上传失败 (${res.status})`);
    const d = await res.json(); if (d.content) shaCache[path] = d.content.sha;
  }
  async function pullPdf(id) {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}/contents/${encPath(pdfPath(id))}?ref=${branch()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`读取 PDF 失败 (${res.status})`);
    const d = await res.json();
    shaCache[pdfPath(id)] = d.sha;
    let b64 = d.content;
    if (!b64) { // 文件较大，contents 不带内容，走 blobs API
      const br = await api(`/repos/${c.owner}/${c.repo}/git/blobs/${d.sha}`);
      if (!br.ok) throw new Error(`读取 PDF 失败 (${br.status})`);
      b64 = (await br.json()).content;
    }
    const bin = atob((b64 || "").replace(/\n/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: "application/pdf" });
  }
  async function deletePdf(id) { await deleteFile(pdfPath(id), `remove pdf: ${id}`); }

  async function pushNote(id, md) {
    if (md && md.trim()) { await putFile(notePath(id), md, `note: ${id}`); remoteNoteIds.add(Number(id)); }
    else { await deleteFile(notePath(id), `remove note: ${id}`); remoteNoteIds.delete(Number(id)); }
  }
  async function pullNote(id) {
    const f = await getFile(notePath(id));
    return f ? f.content : null;
  }

  async function pushMeta() {
    const meta = { status: {}, star: {}, updatedAt: new Date().toISOString() };
    PROBLEMS.forEach(p => {
      const s = Store.getStatus(p.id);
      if (s) meta.status[p.id] = s;
      if (Store.isStarred(p.id)) meta.star[p.id] = true;
    });
    await putFile("meta.json", JSON.stringify(meta, null, 2), "update meta");
  }
  async function pullMeta() {
    const f = await getFile("meta.json");
    if (!f) return null;
    let meta; try { meta = JSON.parse(f.content); } catch (e) { return null; }
    Object.entries(meta.status || {}).forEach(([id, s]) => Store.setStatus(id, s));
    Object.entries(meta.star || {}).forEach(([id, v]) => { if (v) localStorage.setItem("leetweb:star:" + id, "1"); });
    return meta;
  }

  async function listNotes() {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}/contents/notes?ref=${branch()}`);
    if (res.status === 404) return [];           // notes 目录尚不存在
    if (!res.ok) throw new Error(`列目录失败 (${res.status})`);
    const arr = await res.json();
    remoteNoteIds = new Set();
    (Array.isArray(arr) ? arr : []).forEach(x => {
      if (x.type === "file" && /\.md$/i.test(x.name)) {
        const m = x.name.match(/^(\d+)/);
        if (m) { remoteNoteIds.add(Number(m[1])); shaCache["notes/" + x.name] = x.sha; }
      }
    });
    return [...remoteNoteIds];
  }

  // 首次进入的整体拉取：状态/收藏 + 哪些题有笔记
  async function initialPull() {
    await pullMeta();
    await listNotes();
  }

  function hasRemoteNote(id) { return remoteNoteIds.has(Number(id)); }

  // ---- 通用文件读写（供手撕题库 / 知识库使用，路径任意）----
  async function readText(path) { const f = await getFile(path); return f ? f.content : null; }
  async function writeText(path, str, msg) { await putFile(path, str, msg || ("update " + path)); }
  async function remove(path, msg) { await deleteFile(path, msg || ("remove " + path)); }
  async function writeBinary(path, buf, msg) {
    const c = getCfg();
    const body = { message: msg || ("update " + path), content: abToBase64(buf), branch: branch() };
    let sha = shaCache[path]; if (sha === undefined) sha = await getSha(path);
    if (sha) body.sha = sha;
    const url = `/repos/${c.owner}/${c.repo}/contents/${encPath(path)}`;
    let res = await api(url, { method: "PUT", body: JSON.stringify(body) });
    if (res.status === 409 || res.status === 422) { const s = await getSha(path); if (s) body.sha = s; else delete body.sha; res = await api(url, { method: "PUT", body: JSON.stringify(body) }); }
    if (!res.ok) throw new Error(`上传失败 (${res.status})`);
    const d = await res.json(); if (d.content) shaCache[path] = d.content.sha;
  }
  async function readBinary(path, mime) {
    const c = getCfg();
    const res = await api(`/repos/${c.owner}/${c.repo}/contents/${encPath(path)}?ref=${branch()}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`读取失败 (${res.status})`);
    const d = await res.json(); shaCache[path] = d.sha;
    let b64 = d.content;
    if (!b64) { const br = await api(`/repos/${c.owner}/${c.repo}/git/blobs/${d.sha}`); if (!br.ok) throw new Error(`读取失败 (${br.status})`); b64 = (await br.json()).content; }
    const bin = atob((b64 || "").replace(/\n/g, "")); const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime || "application/octet-stream" });
  }

  return {
    getCfg, setCfg, clearCfg, configured, branch,
    test, pushNote, pullNote, pushMeta, pullMeta, listNotes, initialPull,
    hasRemoteNote, notePath,
    pushDesc, pullDesc, pushPdf, pullPdf, deletePdf, descPath, pdfPath,
    readText, writeText, writeBinary, readBinary, remove,
  };
})();
