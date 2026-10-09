// Knowls: a click on a cross-reference opens the target in place, below the
// paragraph that holds the link. A second click closes it. Ctrl or Cmd click
// follows the link instead. Knowl content comes from knowls.js.
(() => {
  const HOSTS = "p, li, .eq, td, th, figcaption, summary, h1, h2, h3, .blk-head";

  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("a.xref[data-knowl]");
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    const k = (window.KNOWLS || {})[a.dataset.knowl];
    if (!k) return;
    ev.preventDefault();

    if (a._knowl) {
      a._knowl.remove();
      a._knowl = null;
      a.classList.remove("open");
      return;
    }

    const box = document.createElement("div");
    box.className = "knowl";
    box.innerHTML = k.html;
    const foot = document.createElement("div");
    foot.className = "knowl-foot";
    const link = document.createElement("a");
    link.href = k.href;
    link.textContent = window.KNOWL_IN_CONTEXT || "→";
    foot.appendChild(link);
    box.appendChild(foot);

    // Several knowls opened from one paragraph stack in click order.
    const host = a.closest(HOSTS) || a.parentElement;
    let after = host;
    while (after.nextElementSibling && after.nextElementSibling._host === host) {
      after = after.nextElementSibling;
    }
    box._host = host;
    after.after(box);
    a._knowl = box;
    a.classList.add("open");
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]);
  });

  // Toolbar: open or close every born-hidden block on the page.
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-details]");
    if (!b) return;
    const open = b.dataset.details === "open";
    document.querySelectorAll("main details.hid").forEach((d) => { d.open = open; });
  });

  // Theme button: switch between light and dark. The choice is kept in localStorage and applied
  // before the page is drawn by a short script in the page head. Without a choice the system setting holds.
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest("button.theme-toggle")) return;
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* private mode: not kept */ }
  });

  // Figures alongside (wide screens only, see style.css): a panel on the right shows the figure of
  // the passage being read, that is, the last figure or link to a figure above a reading line at 40 %
  // of the window height. The toolbar button switches the mode, the choice is kept in localStorage
  // (on by default). Links inside closed parts and opened knowls do not count.
  const sideBtn = document.querySelector("button.fig-side-toggle");
  const figs = [...document.querySelectorAll("main figure.slika[id]")];
  if (sideBtn && !figs.length) sideBtn.remove();
  if (sideBtn && figs.length) {
    const ids = new Set(figs.map((f) => f.id));
    const target = (a) => (a.tagName === "FIGURE" ? a.id : (a.getAttribute("href") || "").split("#")[1]);
    const anchors = [...document.querySelectorAll("main figure.slika[id], main a.xref[href*='#fig-']")]
      .filter((a) => ids.has(target(a)));
    const panel = document.createElement("aside");
    panel.className = "fig-panel";
    document.body.appendChild(panel);
    let shown = null;
    const pick = () => {
      if (!document.body.classList.contains("fig-side")) return;
      const line = innerHeight * 0.4;
      let cur = null;
      for (const a of anchors) {
        if (!a.getClientRects().length) continue;
        if (a.getBoundingClientRect().top > line) break;
        cur = a;
      }
      const id = cur ? target(cur) : null;
      if (id === shown) return;
      shown = id;
      if (!id) { panel.replaceChildren(); return; }
      const fig = document.getElementById(id).cloneNode(true);
      fig.removeAttribute("id");
      panel.replaceChildren(fig);
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([panel]);
    };
    const set = (on) => {
      document.body.classList.toggle("fig-side", on);
      sideBtn.classList.toggle("on", on);
      sideBtn.setAttribute("aria-pressed", String(on));
      try { localStorage.setItem("figside", on ? "1" : "0"); } catch (e) { /* not kept */ }
      shown = undefined;
      pick();
    };
    let start = true;
    try { start = localStorage.getItem("figside") !== "0"; } catch (e) { /* default */ }
    sideBtn.addEventListener("click", () => set(!document.body.classList.contains("fig-side")));
    let queued = false;
    const later = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; pick(); });
    };
    addEventListener("scroll", later, { passive: true });
    addEventListener("resize", later);
    document.addEventListener("toggle", later, true);
    set(start);
  }

  // Temporary reread markers (local build only, removed from the source once read): a Done button
  // on each marker and a floating button that jumps to the next unread one. Kept in localStorage.
  const marks = [...document.querySelectorAll("main .preberi")];
  if (marks.length) {
    const L = window.REREAD || { label: "Reread", done: "Done", page: "All on one page" };
    let store = {};
    try { store = JSON.parse(localStorage.getItem("reread") || "{}"); } catch (e) { /* not kept */ }
    const save = () => { try { localStorage.setItem("reread", JSON.stringify(store)); } catch (e) { /* not kept */ } };
    const unread = () => marks.filter((m) => !m.classList.contains("prebrano"));
    const next = document.createElement("button");
    next.type = "button";
    next.className = "reread-next";
    const update = () => {
      const n = unread().length;
      next.textContent = `${L.label}: ${n} ↓`;
      next.hidden = n === 0;
    };
    marks.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "reread-done";
      const show = () => { b.textContent = m.classList.contains("prebrano") ? "↺" : `✓ ${L.done}`; };
      if (store[m.dataset.key]) m.classList.add("prebrano");
      show();
      b.addEventListener("click", () => {
        if (m.classList.toggle("prebrano")) store[m.dataset.key] = 1; else delete store[m.dataset.key];
        save(); show(); update();
      });
      if (m.tagName === "MARK") m.after(b); else m.prepend(b);
    });
    next.addEventListener("click", () => {
      const left = unread();
      const below = left.find((m) => m.getBoundingClientRect().top > 90) || left[0];
      if (below) below.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.body.appendChild(next);
    // Link to preberi.html, the page that collects all markers (not shown on that page itself).
    if (!location.pathname.endsWith("/preberi.html")) {
      const list = document.createElement("a");
      list.className = "reread-list";
      list.href = "preberi.html";
      list.textContent = L.page;
      document.body.appendChild(list);
    }
    update();
  }

  // Comments on a selection (local build only, window.COMMENTS comes from config.js): select text,
  // click the button and write what is wrong. tools/serve.py appends the comment to
  // book/comments.jsonl. Without the server the comment waits in localStorage and is sent on the
  // next page load that reaches the server. Commented passages are underlined, and a button lists
  // the comments of the page with their state.
  const C = window.COMMENTS;
  const main = document.querySelector("main");
  if (C && main) {
    const page = location.pathname.split("/").pop() || "index.html";
    const api = "/api/comments";
    const online = location.protocol.startsWith("http");
    let pending = [];
    try { pending = JSON.parse(localStorage.getItem("comments-pending") || "[]"); } catch (e) { /* not kept */ }
    const keep = () => { try { localStorage.setItem("comments-pending", JSON.stringify(pending)); } catch (e) { /* not kept */ } };
    const post = (rec) => online
      ? fetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) })
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      : Promise.reject(new Error("no server"));
    const el = (tag, cls, text) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text !== undefined) e.textContent = text;
      return e;
    };
    const toast = (text) => {
      const t = el("div", "comment-toast", text);
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 5000);
    };

    // Where a selection lies: the section heading before it, the nearest block with an id (not a
    // reread marker) and the text of the paragraph that holds it.
    const where = (node) => {
      const start = node.nodeType === 1 ? node : node.parentElement;
      let block = start;
      while (block && block !== main && !(block.id && !block.id.startsWith("preberi-"))) block = block.parentElement;
      const host = start.closest("p, li, td, th, figcaption, .eq, .blk, h1, h2, h3") || start;
      let sec = null;
      main.querySelectorAll("h1[id], h2[id], h3[id]").forEach((h) => {
        if (h === start || (h.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING)) sec = h;
      });
      return {
        block: block && block !== main ? block.id : "",
        section: sec ? sec.id : "",
        section_title: sec ? sec.textContent.replace(/\s+/g, " ").trim() : "",
        context: host.textContent.replace(/\s+/g, " ").trim().slice(0, 1500),
      };
    };

    const btn = el("button", "comment-btn", `💬 ${C.button}`);
    btn.type = "button";
    btn.hidden = true;
    document.body.appendChild(btn);
    let sel = null;
    const onSelect = (ev) => {
      if (ev.target.closest(".comment-box, .comment-btn, .comment-panel")) return;
      setTimeout(() => {
        const s = getSelection();
        const text = s && !s.isCollapsed ? s.toString().trim() : "";
        if (!text || !main.contains(s.anchorNode)) { btn.hidden = true; return; }
        const r = s.getRangeAt(0).getBoundingClientRect();
        sel = { text, node: s.anchorNode };
        btn.style.top = `${scrollY + r.bottom + 6}px`;
        btn.style.left = `${scrollX + Math.max(8, Math.min(r.left, innerWidth - 150))}px`;
        btn.hidden = false;
      }, 0);
    };
    document.addEventListener("mouseup", onSelect);
    document.addEventListener("touchend", onSelect);

    btn.addEventListener("click", () => {
      if (!sel) return;
      btn.hidden = true;
      const box = el("div", "comment-box");
      box.style.top = btn.style.top;
      box.style.left = `${scrollX + Math.max(8, Math.min(parseFloat(btn.style.left) - scrollX, innerWidth - 370))}px`;
      box.appendChild(el("blockquote", "", sel.text.length > 300 ? `${sel.text.slice(0, 300)} …` : sel.text));
      const ta = el("textarea");
      ta.rows = 4;
      ta.placeholder = C.placeholder;
      const row = el("div", "row");
      const no = el("button", "", C.cancel);
      const ok = el("button", "save", C.save);
      no.type = ok.type = "button";
      row.append(no, ok);
      box.append(ta, row);
      document.body.appendChild(box);
      ta.focus();
      const close = () => box.remove();
      const save = () => {
        const comment = ta.value.trim();
        if (!comment) return;
        const rec = { time: new Date().toISOString(), page, lang: C.lang, quote: sel.text, comment, ...where(sel.node) };
        close();
        getSelection().removeAllRanges();
        post(rec).then(() => { toast(C.saved); refresh(); })
          .catch(() => { pending.push(rec); keep(); toast(C.offline); });
      };
      no.addEventListener("click", close);
      ok.addEventListener("click", save);
      ta.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape") close();
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) save();
      });
    });

    // Underline a commented passage: the first text node in its block that contains the quote.
    const mark = (c) => {
      const scope = (c.block && document.getElementById(c.block)) || main;
      const q = (c.quote || "").trim();
      if (!q || q.length > 400) return null;
      const walk = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const i = n.data.indexOf(q);
        if (i < 0 || n.parentElement.closest("mark.komentar, script, .MathJax, mjx-container")) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + q.length);
        const m = el("mark", `komentar${c.status === "done" ? " done" : ""}`);
        m.title = c.comment;
        r.surroundContents(m);
        return m;
      }
      return null;
    };

    const listBtn = el("button", "comment-list-btn");
    listBtn.type = "button";
    listBtn.hidden = true;
    const panel = el("div", "comment-panel");
    panel.hidden = true;
    document.body.append(listBtn, panel);
    listBtn.addEventListener("click", () => { panel.hidden = !panel.hidden; });

    const show = (list) => {
      main.querySelectorAll("mark.komentar").forEach((m) => m.replaceWith(...m.childNodes));
      panel.replaceChildren();
      const open = list.filter((c) => c.status !== "done").length;
      listBtn.textContent = `💬 ${C.list}: ${open}`;
      listBtn.hidden = list.length === 0;
      list.sort((a, b) => (a.status === "done") - (b.status === "done") || a.time.localeCompare(b.time));
      list.forEach((c) => {
        const m = mark(c);
        const item = el("div", `item${c.status === "done" ? " done" : ""}`);
        item.appendChild(el("div", "q", `“${(c.quote || "").slice(0, 120)}”`));
        item.appendChild(el("div", "", c.comment));
        if (c.status === "done") item.appendChild(el("div", "q", `✓ ${C.done}${c.done_note ? `: ${c.done_note}` : ""}`));
        item.addEventListener("click", () => {
          const target = m || (c.block && document.getElementById(c.block)) || (c.section && document.getElementById(c.section));
          if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        panel.appendChild(item);
      });
    };
    const refresh = () => {
      if (!online) { show(pending.filter((c) => c.page === page)); return; }
      fetch(`${api}?page=${encodeURIComponent(page)}`).then((r) => (r.ok ? r.json() : [])).then(show).catch(() => {});
    };

    // Send what waited in the browser, then show the comments of this page.
    (async () => {
      if (online && pending.length) {
        const left = [];
        for (const rec of pending) {
          try { await post(rec); } catch (e) { left.push(rec); }
        }
        if (left.length < pending.length) toast(C.saved);
        pending = left;
        keep();
      }
      refresh();
    })();
  }
})();
