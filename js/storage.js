// 本地存储层：笔记 / 状态 / 主题，全部存于浏览器 localStorage
// 键名前缀，避免与其它站点冲突
const NS = "leetweb:";

const Store = {
  // ---- 笔记（markdown 文本）----
  getNote(id) {
    return localStorage.getItem(NS + "note:" + id) || "";
  },
  setNote(id, md) {
    if (md && md.trim()) localStorage.setItem(NS + "note:" + id, md);
    else localStorage.removeItem(NS + "note:" + id);
  },
  hasNote(id) {
    const v = localStorage.getItem(NS + "note:" + id);
    return !!(v && v.trim());
  },

  // ---- 题目描述（用户自填的 markdown）----
  getDesc(id) { return localStorage.getItem(NS + "desc:" + id) || ""; },
  setDesc(id, md) {
    if (md && md.trim()) localStorage.setItem(NS + "desc:" + id, md);
    else localStorage.removeItem(NS + "desc:" + id);
  },
  hasDesc(id) { const v = localStorage.getItem(NS + "desc:" + id); return !!(v && v.trim()); },

  // ---- 完成状态：0 未开始 / 1 已解决 / 2 需复习 ----
  getStatus(id) {
    return parseInt(localStorage.getItem(NS + "status:" + id) || "0", 10);
  },
  setStatus(id, s) {
    if (s) localStorage.setItem(NS + "status:" + id, String(s));
    else localStorage.removeItem(NS + "status:" + id);
  },

  // ---- 收藏 / 标记 ----
  isStarred(id) {
    return localStorage.getItem(NS + "star:" + id) === "1";
  },
  toggleStar(id) {
    const now = !this.isStarred(id);
    if (now) localStorage.setItem(NS + "star:" + id, "1");
    else localStorage.removeItem(NS + "star:" + id);
    return now;
  },

  // ---- 主题 ----
  getTheme() {
    return localStorage.getItem(NS + "theme") ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  },
  setTheme(t) {
    localStorage.setItem(NS + "theme", t);
  },

  // ---- 整体导入 / 导出（备份全部笔记与状态）----
  exportAll() {
    const data = { version: 1, exportedAt: new Date().toISOString(), items: {} };
    PROBLEMS.forEach(p => {
      const note = this.getNote(p.id);
      const status = this.getStatus(p.id);
      const star = this.isStarred(p.id);
      if (note || status || star) {
        data.items[p.id] = { note, status, star };
      }
    });
    return data;
  },
  importAll(data) {
    if (!data || !data.items) throw new Error("文件格式不正确");
    Object.entries(data.items).forEach(([id, v]) => {
      if (v.note) this.setNote(id, v.note);
      if (v.status) this.setStatus(id, v.status);
      if (v.star) localStorage.setItem(NS + "star:" + id, "1");
    });
  },

  // ---- 统计 ----
  stats() {
    let solved = 0, review = 0, noted = 0;
    PROBLEMS.forEach(p => {
      const s = this.getStatus(p.id);
      if (s === 1) solved++;
      else if (s === 2) review++;
      if (this.hasNote(p.id)) noted++;
    });
    return { solved, review, noted, total: PROBLEMS.length };
  }
};

// ---- PDF 题面：存 IndexedDB（二进制，不占 localStorage 容量）----
const PdfDB = {
  _db: null,
  _open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open("leetweb", 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains("pdf")) r.result.createObjectStore("pdf"); };
      r.onsuccess = () => { this._db = r.result; res(r.result); };
      r.onerror = () => rej(r.error);
    });
  },
  async put(id, blob, name) {
    const db = await this._open();
    return new Promise((res, rej) => {
      const tx = db.transaction("pdf", "readwrite");
      tx.objectStore("pdf").put({ blob, name }, String(id));
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  },
  async get(id) {
    const db = await this._open();
    return new Promise((res, rej) => {
      const tx = db.transaction("pdf", "readonly");
      const rq = tx.objectStore("pdf").get(String(id));
      rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error);
    });
  },
  async del(id) {
    const db = await this._open();
    return new Promise((res, rej) => {
      const tx = db.transaction("pdf", "readwrite");
      tx.objectStore("pdf").delete(String(id));
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  },
  async all() {
    const db = await this._open();
    return new Promise((res, rej) => {
      const out = [];
      const rq = db.transaction("pdf", "readonly").objectStore("pdf").openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { out.push({ key: c.key, blob: c.value.blob, name: c.value.name }); c.continue(); } else res(out); };
      rq.onerror = () => rej(rq.error);
    });
  }
};
