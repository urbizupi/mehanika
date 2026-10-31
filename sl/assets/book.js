// Knowls: a click on a cross-reference opens the target in place, below the
// paragraph that holds the link. A second click closes it. Ctrl or Cmd click
// follows the link instead. The content of each knowl is a small script,
// assets/knowls/<id>.js, loaded on the first click or when the pointer comes to the link.
(() => {
  const HOSTS = "p, li, .eq, td, th, figcaption, summary, h1, h2, h3, .blk-head";

  // Chapters with several sections are split into one page per section. An old link to the chapter
  // page with an anchor that is now on a section page goes on to that page.
  const moved = document.getElementById("moved");
  if (moved && location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    const file = !document.getElementById(id) && JSON.parse(moved.textContent)[id];
    if (file) location.replace(file + location.hash);
  }

  window.KNOWLS = window.KNOWLS || {};
  const loading = {};
  const knowl = (id) => {
    if (window.KNOWLS[id]) return Promise.resolve(window.KNOWLS[id]);
    if (!loading[id]) {
      loading[id] = new Promise((resolve) => {
        const s = document.createElement("script");
        s.src = `assets/knowls/${id}.js`;
        s.onload = () => resolve(window.KNOWLS[id] || null);
        s.onerror = () => { delete loading[id]; resolve(null); };
        document.head.appendChild(s);
      });
    }
    return loading[id];
  };
  document.addEventListener("pointerover", (ev) => {
    const a = ev.target.closest && ev.target.closest("a.xref[data-knowl]");
    if (a) knowl(a.dataset.knowl);
  });

  // Typeset an element after the page and every earlier call are done. MathJax shares one document,
  // and a call during the first pass, while it loads an extension such as \boldsymbol, leaves that
  // macro undefined (red) on the page.
  const typeset = (el) => {
    if (!window.MathJax || !MathJax.startup || !MathJax.startup.promise) return;
    MathJax.startup.promise = MathJax.startup.promise
      .then(() => MathJax.typesetPromise([el]))
      .catch((e) => console.error(e));
  };

  // A target is open in at most one knowl on the page (several pointers to one figure had each opened
  // a copy). A link to a target that is already open uses that knowl: on screen it stays
  // where it is, otherwise it moves below the paragraph of the link. The link that used it last owns it,
  // and a second click on that link closes it.
  const opened = {};
  const waiting = new Set();
  const openBox = (id) => {
    const box = opened[id];
    if (box && !box.isConnected) { // closed together with the knowl that held it
      box._by.classList.remove("open");
      delete opened[id];
    }
    return opened[id] || null;
  };
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    const seen = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    return seen >= Math.min(0.7 * r.height, 0.5 * innerHeight);
  };
  // Below the paragraph that holds the link. Several knowls opened from one paragraph stack in click order.
  const place = (box, a) => {
    const host = a.closest(HOSTS) || a.parentElement;
    let after = host;
    while (after.nextElementSibling && after.nextElementSibling._host === host) after = after.nextElementSibling;
    box._host = host;
    if (after !== box) after.after(box);
  };
  const own = (box, a) => {
    if (box._by) box._by.classList.remove("open");
    box._by = a;
    a.classList.add("open");
  };
  const flash = (box) => {
    box.classList.remove("flash");
    void box.offsetWidth; // restart the animation
    box.classList.add("flash");
  };

  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("a.xref[data-knowl]");
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    ev.preventDefault();
    const id = a.dataset.knowl;
    const pointer = a.classList.contains("kaz");
    const box = openBox(id);
    if (box && box._by === a) {
      box.remove();
      Object.keys(opened).forEach(openBox);
      relight();
      return;
    }
    if (box && (box.contains(a) || onScreen(box))) {
      own(box, a);
      if (pointer) { hover = a; relight(true); } else flash(box);
      return;
    }
    if (pointer && figInView(id)) {
      hover = a;
      relight(true);
      return;
    }
    if (box) {
      place(box, a);
      own(box, a);
      if (pointer) hover = a;
      relight(pointer);
      return;
    }
    if (waiting.has(id)) return;
    waiting.add(id);
    knowl(id).then((k) => {
      waiting.delete(id);
      if (k) openKnowl(a, k);
      else location.href = a.href; // no knowl (not loaded): follow the link
    });
  });

  const openKnowl = (a, k) => {
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

    place(box, a);
    opened[a.dataset.knowl] = box;
    own(box, a);
    if (a.classList.contains("kaz")) relight();
    typeset(box);
    if (window.BookInt) BookInt.mount(box); // an interactive figure in the knowl
  };

  // Pointing at a figure (book/README.md): a link a.kaz names parts of its figure in data-del, drawn in TikZ
  // inside a scope with del=NAME (g.del in the SVG). The parts light up wherever the figure is shown (the page,
  // the side panel, a knowl opened from the pointer) while the pointer is under the mouse or focused, and in
  // the side panel while the reading line is in the pointer's paragraph, as a lecturer points while talking.
  // A click on a pointer whose figure is in view (also in its knowl) only lights the parts, with a short pulse.
  let hover = null;
  let reading = null;
  const figPanel = () => document.querySelector("aside.fig-panel");
  const figInView = (fig) => {
    const p = figPanel();
    if (document.body.classList.contains("fig-side") && p && p.getClientRects().length && p.dataset.fig === fig) return true;
    const f = document.getElementById(fig);
    if (!f) return false;
    const r = f.getBoundingClientRect();
    return r.top > -0.3 * r.height && r.bottom < innerHeight + 0.3 * r.height;
  };
  const relight = (pulse = false) => {
    document.querySelectorAll("g.del.kaz-on").forEach((g) => g.classList.remove("kaz-on", "kaz-puls"));
    // One pointer at a time, as a lecturer points: the one under the mouse wins over the reading line.
    const now = hover || reading;
    document.querySelectorAll("a.kaz-now").forEach((a) => { if (a !== now) a.classList.remove("kaz-now"); });
    if (now) now.classList.add("kaz-now");
    const light = (root, a) => {
      if (!root || !a || !a.classList.contains("kaz")) return;
      const dels = a.dataset.del.split(",");
      root.querySelectorAll("g.del").forEach((g) => {
        if (!dels.includes(g.dataset.del)) return;
        g.classList.add("kaz-on");
        if (pulse && a === hover) g.classList.add("kaz-puls");
      });
    };
    // One pointer in each picture of a figure: the one under the mouse, then (page and side panel) the
    // reading line, then the link that owns the figure's knowl.
    const to = (a, fig) => (a && a.dataset.knowl === fig ? a : null);
    const p = figPanel();
    const figs = new Set([now, ...Object.values(opened).map((b) => b._by)].filter(Boolean).map((a) => a.dataset.knowl));
    for (const fig of figs) {
      const box = openBox(fig);
      const owner = box && box._by;
      light(document.getElementById(fig), to(now, fig) || owner);
      light(p && p.dataset.fig === fig ? p : null, to(now, fig) || owner);
      light(box, to(hover, fig) || owner);
    }
  };
  const pointerOf = (ev) => ev.target.closest && ev.target.closest("a.kaz");
  document.addEventListener("pointerover", (ev) => {
    const a = pointerOf(ev);
    if (a && a !== hover) { hover = a; relight(); }
  });
  document.addEventListener("pointerout", (ev) => {
    const a = pointerOf(ev);
    if (a && a === hover && !a.contains(ev.relatedTarget)) { hover = null; relight(); }
  });
  document.addEventListener("focusin", (ev) => {
    const a = pointerOf(ev);
    if (a) { hover = a; relight(); }
  });
  document.addEventListener("focusout", (ev) => {
    if (pointerOf(ev) === hover) { hover = null; relight(); }
  });

  // Drawing as at the board (book/README.md "Drawing as at the board"): the paragraphs right after a figure
  // that point at its parts are its narration. While they are read, a figure short enough to stay on screen is
  // pinned under the page header, and each part appears when the first sentence that names it reaches the
  // reading line, in the order of the narration. Parts the narration never names are there from the start.
  // Scrolling back takes the later parts away again, a tap on the figure shows it whole. A figure too tall to
  // pin, print, knowls and pages without scripts show the whole figure.
  const figId = (a) => a.dataset.knowl || (a.getAttribute("href") || "").split("#")[1];
  const boards = [];
  document.querySelectorAll("main figure.slika[id]").forEach((fig) => {
    const mine = (el) => [...el.querySelectorAll("a.kaz")].filter((a) => figId(a) === fig.id);
    const narr = [];
    let held = [];
    let gap = 0;
    for (let el = fig.nextElementSibling; el; el = el.nextElementSibling) {
      if (el.matches("figure, h1, h2, h3, h4, h5, details, aside")) break;
      if (mine(el).length) { narr.push(...held, el); held = []; gap = 0; continue; }
      // A display, a list or up to two short paragraphs (an algebra step) between paragraphs of the narration.
      if (el.tagName === "P" && ++gap > 2) break;
      held.push(el);
    }
    const ptrs = narr.flatMap(mine);
    const named = new Set(ptrs.flatMap((a) => a.dataset.del.split(",")));
    const gs = [...fig.querySelectorAll("g.del")].filter((g) => named.has(g.dataset.del));
    if (!gs.length) return;
    const board = document.createElement("div");
    board.className = "tabla";
    fig.before(board);
    board.append(fig, ...narr);
    gs.forEach((g) => g.classList.add("risba"));
    const b = { board, fig, ptrs, whole: false };
    fig.addEventListener("click", (ev) => {
      if (ev.target.closest("a")) return;
      b.whole = !b.whole;
      draw();
    });
    boards.push(b);
  });
  const header = document.querySelector("header.top");
  const pin = () => {
    const h = header ? header.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty("--hdr", `${h}px`);
    for (const b of boards) b.board.classList.toggle("pripeta", b.fig.getBoundingClientRect().height < 0.5 * (innerHeight - h));
  };
  const draw = () => {
    const p = figPanel();
    // The side panel exists only on wide screens (style.css), so the mode counts only where it is shown.
    const side = document.body.classList.contains("fig-side") && !!p && p.getClientRects().length > 0;
    for (const b of boards) {
      const rb = b.board.getBoundingClientRect();
      if (rb.bottom < -innerHeight || rb.top > 2 * innerHeight) continue;
      const pinned = b.board.classList.contains("pripeta") && !side;
      const whole = b.whole || !(pinned || (side && p && p.dataset.fig === b.fig.id));
      const top = pinned ? Math.max(b.fig.getBoundingClientRect().bottom, 0) : 0;
      // Just below a pinned figure the reader reads the next lines, in the side panel mode at about a third of the window.
      const line = top + (pinned ? 0.2 : 0.35) * (innerHeight - top);
      const on = new Set();
      for (const a of b.ptrs) if (a.getBoundingClientRect().top < line) a.dataset.del.split(",").forEach((d) => on.add(d));
      const set = (root) => root && root.querySelectorAll("g.del.risba").forEach((g) => {
        const now = whole || on.has(g.dataset.del);
        if (now !== g.classList.contains("narisan")) g.classList.toggle("narisan", now);
      });
      set(b.fig);
      if (p && p.dataset.fig === b.fig.id) set(p);
    }
  };
  if (boards.length) {
    let drawQueued = false;
    const drawLater = () => {
      if (drawQueued) return;
      drawQueued = true;
      requestAnimationFrame(() => { drawQueued = false; draw(); });
    };
    addEventListener("scroll", drawLater, { passive: true });
    addEventListener("resize", () => { pin(); drawLater(); });
    addEventListener("load", () => { pin(); draw(); });
    pin();
    draw();
  }

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
  // (on by default). Links inside closed parts and opened knowls do not count. A figure on another
  // page (another section) is shown from its knowl.
  const sideBtn = document.querySelector("button.fig-side-toggle");
  const target = (a) => (a.tagName === "FIGURE" ? a.id : (a.getAttribute("href") || "").split("#")[1]);
  const anchors = [...document.querySelectorAll("main figure.slika[id], main a.xref[data-knowl][href*='#fig-']")]
    .filter((a) => target(a));
  if (sideBtn && !anchors.length) sideBtn.remove();
  if (sideBtn && anchors.length) {
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
      // A pointer lights its parts while the reading line is in its paragraph.
      const host = cur && cur.classList.contains("kaz") && cur.closest(HOSTS);
      const now = host && host.getBoundingClientRect().bottom > line ? cur : null;
      if (id === shown) {
        if (now !== reading) { reading = now; relight(); }
        return;
      }
      shown = id;
      reading = now;
      panel.dataset.fig = id || "";
      if (!id) { panel.replaceChildren(); relight(); return; }
      const here = document.getElementById(id);
      if (here) {
        const fig = here.cloneNode(true);
        fig.removeAttribute("id");
        panel.replaceChildren(fig);
        if (typeof draw === "function") draw();
        relight();
        typeset(panel);
        return;
      }
      knowl(id).then((k) => {
        if (shown !== id) return;
        panel.innerHTML = k ? k.html : "";
        relight();
        typeset(panel);
      });
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
    // Link to preberi-<page>, the page that collects the markers of this page (not shown on the reread pages).
    const here = location.pathname.split("/").pop();
    if (here && !here.startsWith("preberi")) {
      const list = document.createElement("a");
      list.className = "reread-list";
      list.href = `preberi-${here}`;
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

// Contents page: the i button next to a chapter's share shows or hides what the chapter still lacks.
document.querySelectorAll(".toc-info").forEach((b) => {
  b.addEventListener("click", () => {
    const box = b.closest("li").querySelector(".toc-missing");
    if (!box) return;
    box.hidden = !box.hidden;
    b.setAttribute("aria-expanded", String(!box.hidden));
  });
});
