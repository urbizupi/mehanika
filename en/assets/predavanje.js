// Lecture (book/README.md "Lecture"): the page as a lecture at the board, a pilot (2026-11-05: "almost
// like slides where the text appears next to the image and the image is constructed, the user presses space
// to proceed to the next step of the construction"). The text comes one sentence at a time next to its
// figure, and the figure is built up as the sentences name its parts (pointers a.kaz, TikZ scopes g.del).
// Nothing in the source marks a step: a step is a sentence of a paragraph or list item, a display, a table.
// Headings and the opening of a block come with the step after them, a source line (p.vir) with the one before.
// The figure of a step is the figure its pointers name, else the one a figure reference names if that figure
// was on the board before, else the last figure block or figure of the step before. A part that a pointer names in the figure's own stretch of text
// (from its first step to the next figure block) is hidden until that pointer's sentence, the others are
// there from the start. The text column holds the steps of the current figure since the last heading.
(() => {
  const main = document.querySelector("main");
  const tools = document.querySelector("header.top .tools");
  if (!main || !tools || !main.querySelector("figure.slika g.del")) return;
  const sl = document.documentElement.lang === "sl";
  const T = sl
    ? { btn: "Predavanje", tip: "Predavanje: stavek za stavkom, slika nastaja sproti. Naprej: preslednica, puščica desno ali dotik. Nazaj: puščica levo ali dotik leve tretjine. Esc zapre.", next: "Naprej", back: "Nazaj", close: "Zapri" }
    : { btn: "Lecture", tip: "Lecture: one sentence at a time, the figure is built as you go. Next: space, right arrow or a tap. Back: left arrow or a tap on the left third. Esc closes.", next: "Next", back: "Back", close: "Close" };

  const SKIP = "p.updated, p.crumb, p.one-page, nav, script, style, button, aside, .interaktivno";
  const CONT = "div.tabla, div.blk, div.blk-body, div.zgodovina, div.hid-row, details, div.hid-body, section";
  const HEAD = "h1, h2, h3, h4, h5, .blk-head, summary, p.zgodovina-label";
  const BLOCKY = "p, ul, ol, li, div, table, pre, blockquote";
  const figOf = (a) => a.dataset.knowl || (a.getAttribute("href") || "").split("#")[1];
  const figEl = (id) => {
    const f = id && document.getElementById(id);
    return f && f.matches("figure.slika") && f.querySelector(".svgfig svg") ? f : null;
  };

  // Sentences. A sentence ends at . ! ? (with closing quotes or brackets) followed by white space and a
  // capital letter or a formula, unless the plain word before the full stop is an abbreviation. A full stop
  // right after a formula or a link ends the sentence, and so does one after a unit ("1 m.").
  const ABBR = new Set(("npr tj itd ipd idr oz str sl pribl prim gl ang angl lat št pr dr prof mag doc tzv "
    + "e.g i.e cf vs fig figs eq eqs p pp ch sec approx resp al ca no vol ed eds cca").split(" "));
  const END = /[.!?…]["'»”)\]]*$/;
  const CAP = /^[„“"«(\[]?[A-ZČŠŽĆĐ]/;
  const isMath = (n) => n.nodeType === 1 && (n.matches("mjx-container")
    || (n.firstElementChild && n.firstElementChild.matches("mjx-container")
      && (n.firstChild === n.firstElementChild || !n.firstChild.textContent.trim())));
  const opens = (n, text) => {
    if (text !== undefined) return CAP.test(text) || text.startsWith("\\(");
    if (!n) return false;
    if (n.nodeType === 3) return opens(null, n.data.trimStart());
    if (n.nodeType !== 1) return false;
    if (isMath(n)) return true;
    return opens(null, n.textContent.trimStart());
  };
  // had: the text of the sentence so far before this text node, own: this text node up to the white space.
  const ends = (had, own) => {
    if (!END.test((had + own).trimEnd())) return false;
    const w = own.trimEnd().match(/(?:^|[^\p{L}.])([\p{L}][\p{L}.]*)\.$/u);
    return !(w && ABBR.has(w[1].toLowerCase()));
  };
  // Wrap the sentences of box's inline content in span.pr-st, in place. Block children are walked in turn.
  // Each sentence, display or table becomes a piece {el, mode: "own"}, in reading order.
  const split = (box, pieces) => {
    let group = [];
    const flush = () => {
      if (group.some((n) => n.nodeType === 1 || n.data.trim())) {
        const span = document.createElement("span");
        span.className = "pr-st";
        group[0].before(span);
        group.forEach((n) => span.appendChild(n));
        pieces.push({ el: span, mode: "own" });
      }
      group = [];
    };
    let node = box.firstChild;
    while (node) {
      const next = node.nextSibling;
      if (node.nodeType === 1 && node.matches(BLOCKY)) {
        flush();
        if (node.matches("div.eq, table, pre, blockquote")) pieces.push({ el: node, mode: "own" });
        else split(node, pieces);
        node = next;
        continue;
      }
      if (node.nodeType === 3) {
        const d = node.data;
        const had = group.map((n) => n.textContent).join("");
        let cut = null;
        for (const m of d.matchAll(/\s+/g)) {
          const after = d.slice(m.index + m[0].length);
          if (!after && !next) break;
          if (!ends(had, d.slice(0, m.index))) continue;
          if (!(after ? opens(null, after) : opens(next))) continue;
          cut = m;
          break;
        }
        if (cut) {
          const ws = node.splitText(cut.index);
          const rest = ws.splitText(cut[0].length);
          if (node.data) group.push(node);
          flush();
          node = rest;
          continue;
        }
      }
      group.push(node);
      node = next;
    }
    flush();
  };

  let data = null;
  const build = () => {
    const leaves = [];
    const seq = [];
    const walk = (el, chain) => {
      for (const c of el.children) {
        if (c.matches(SKIP)) continue;
        if (c.matches("figure.slika")) { if (c.id) seq.push({ fig: c.id }); continue; }
        if (c.matches("figure")) continue;
        if (c.matches(CONT)) { walk(c, c.matches("div.tabla") ? chain : [...chain, c]); continue; }
        const leaf = { orig: c, chain, min: Infinity, max: -1 };
        leaves.push(leaf);
        seq.push({ leaf });
      }
    };
    walk(main, []);
    const steps = [];
    const marks = [];
    let waiting = [];
    let cur = null;
    const mark = (p, i) => {
      p.el.dataset.step = i;
      p.leaf.min = Math.min(p.leaf.min, i);
      p.leaf.max = Math.max(p.leaf.max, i);
    };
    for (const it of seq) {
      if (it.fig) { marks.push({ id: it.fig, at: steps.length }); cur = it.fig; continue; }
      const leaf = it.leaf;
      const tpl = leaf.orig.cloneNode(true);
      tpl.removeAttribute("id");
      tpl.querySelectorAll("[id]").forEach((e) => { if (!e.closest("svg")) e.removeAttribute("id"); });
      tpl.querySelectorAll("button").forEach((e) => e.remove());
      tpl.querySelectorAll(".kaz-now").forEach((e) => e.classList.remove("kaz-now"));
      leaf.tpl = tpl;
      const pieces = [];
      if (leaf.orig.matches(HEAD)) pieces.push({ el: tpl, mode: "next" });
      else if (leaf.orig.matches("p.vir")) pieces.push({ el: tpl, mode: "prev" });
      else if (leaf.orig.matches("p, li, ul, ol")) split(tpl, pieces);
      else pieces.push({ el: tpl, mode: "own" });
      for (const p of pieces) {
        p.leaf = leaf;
        if (p.mode === "next") { waiting.push(p); continue; }
        if (p.mode === "prev" && steps.length) { mark(p, steps.length - 1); continue; }
        const kaz = [...p.el.querySelectorAll("a.kaz")].filter((a) => figEl(figOf(a)));
        const refs = [...p.el.querySelectorAll("a.xref[data-knowl^='fig-']")].filter((a) => figEl(a.dataset.knowl));
        // A mere mention of a figure not yet started leaves the board as it is: its construction starts at
        // its first pointer or at its block.
        if (kaz.length) cur = figOf(kaz[0]);
        else if (refs.length && steps.some((s) => s.fig === refs[0].dataset.knowl)) cur = refs[0].dataset.knowl;
        const parts = new Set(kaz.filter((a) => figOf(a) === cur).flatMap((a) => a.dataset.del.split(",")));
        const i = steps.length;
        steps.push({ fig: cur, parts, orig: leaf.orig, head: waiting.some((w) => w.el.matches(HEAD)) });
        waiting.forEach((w) => mark(w, i));
        waiting = [];
        mark(p, i);
      }
    }
    if (steps.length) waiting.forEach((w) => mark(w, steps.length - 1));
    // Hidden at first: the parts named in the figure's own stretch, from its first step to the next figure block.
    const first = new Map();
    const hidden = new Map();
    steps.forEach((s, i) => { if (s.fig && !first.has(s.fig)) first.set(s.fig, i); });
    for (const [id, i0] of first) {
      const m = marks.find((x) => x.id !== id && x.at > i0);
      const h = new Set();
      for (let i = i0; i < (m ? m.at : steps.length); i++) if (steps[i].fig === id) steps[i].parts.forEach((d) => h.add(d));
      hidden.set(id, h);
    }
    return { leaves, steps, first, hidden };
  };

  // The view: the figure (stage) on the left or on top, the text on the right or below, a bar with the controls.
  let ovl = null, stage = null, text = null, count = null, cap = null;
  let k = 0, shown, lastK = null, lastY = null, pushed = false;
  const runStart = (i) => {
    const s = data.steps;
    let j = i;
    while (j > 0 && s[j - 1].fig === s[i].fig && !s[j].head) j--;
    return j;
  };
  const light = (dels) => {
    if (!stage) return;
    stage.querySelectorAll("g.del").forEach((g) => g.classList.toggle("pr-sveti", dels.has(g.dataset.del)));
  };
  const render = () => {
    const { leaves, steps, first, hidden } = data;
    const s = steps[k];
    const r0 = runStart(k);
    // Text: the steps of this figure up to the current one, inside copies of their boxes (definition, history).
    text.replaceChildren();
    const path = [];
    for (const leaf of leaves) {
      if (leaf.max < r0 || leaf.min > k) continue;
      const c = leaf.tpl.cloneNode(true);
      const marked = [...(c.matches("[data-step]") ? [c] : []), ...c.querySelectorAll("[data-step]")];
      let any = false;
      for (const e of marked) {
        const i = +e.dataset.step;
        if (i < r0 || i > k) { e.classList.add("pr-skrit"); continue; }
        any = true;
        e.classList.add("pr-vid");
        if (i === k) e.classList.add("pr-zdaj");
      }
      if (!any) continue;
      for (const e of [c, ...c.querySelectorAll("p, li")]) {
        if (e.matches(".pr-vid") || e.querySelector(".pr-vid")) continue;
        if (e.matches("[data-step]") || e.querySelector("[data-step]")) e.classList.add("pr-skrit");
      }
      let i = 0;
      while (i < path.length && i < leaf.chain.length && path[i].orig === leaf.chain[i]) i++;
      path.length = i;
      let parent = i ? path[i - 1].shell : text;
      for (; i < leaf.chain.length; i++) {
        const sh = leaf.chain[i].cloneNode(false);
        sh.removeAttribute("id");
        if (sh.tagName === "DETAILS") sh.open = true;
        parent.append(sh);
        path.push({ orig: leaf.chain[i], shell: sh });
        parent = sh;
      }
      parent.append(c);
    }
    const z = text.querySelector(".pr-zdaj");
    if (z) z.scrollIntoView({ block: "nearest" });
    // Figure: built anew when it changes, else only the parts change, so a new part fades in alone.
    if (s.fig !== shown) {
      shown = s.fig;
      stage.replaceChildren();
      cap = null;
      ovl.classList.toggle("pr-brez", !s.fig);
      const f = figEl(s.fig);
      if (f) {
        const box = f.querySelector(".svgfig").cloneNode(true);
        box.querySelectorAll("g.del").forEach((g) => g.classList.remove("risba", "narisan", "kaz-on", "kaz-puls"));
        if (f.closest(".zgodovina")) box.classList.add("pr-zgod");
        const w = parseFloat(box.querySelector("svg").getAttribute("width")) || 300;
        box.style.maxWidth = `${Math.round(w * 4 / 3 * 2.2)}px`;
        stage.append(box);
        const fc = f.querySelector("figcaption");
        if (fc) { cap = fc.cloneNode(true); stage.append(cap); }
      }
    }
    if (s.fig) {
      const hid = hidden.get(s.fig);
      const drawn = new Set();
      for (let i = first.get(s.fig); i <= k; i++) if (steps[i].fig === s.fig) steps[i].parts.forEach((d) => drawn.add(d));
      let whole = true;
      stage.querySelectorAll("g.del").forEach((g) => {
        const h = hid.has(g.dataset.del);
        const on = h && drawn.has(g.dataset.del);
        g.classList.toggle("risba", h);
        if (on !== g.classList.contains("narisan")) g.classList.toggle("narisan", on);
        if (h && !on) whole = false;
      });
      // The caption only sums up, so it comes when the figure is complete.
      if (cap) cap.hidden = !whole;
      light(s.parts);
    }
    count.textContent = `${k + 1} / ${steps.length}`;
  };
  const go = (i) => {
    const n = Math.max(0, Math.min(data.steps.length - 1, i));
    if (n === k && text.childNodes.length) return;
    k = n;
    render();
  };
  const startAt = () => {
    if (lastK !== null && Math.abs(scrollY - lastY) < 4) return lastK;
    if (scrollY < 40) return 0;
    const h = document.querySelector("header.top");
    const top = (h ? h.getBoundingClientRect().bottom : 0) + 8;
    const i = data.steps.findIndex((s) => { const r = s.orig.getBoundingClientRect(); return r.height && r.bottom > top; });
    return Math.max(0, i);
  };
  const onKey = (ev) => {
    if (!ovl || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.target.closest && ev.target.closest("input, textarea, [contenteditable]")) return;
    const key = ev.key;
    if (key === "Escape") close();
    else if ((key === " " && !ev.shiftKey) || key === "ArrowRight" || key === "PageDown" || key === "Enter") go(k + 1);
    else if ((key === " " && ev.shiftKey) || key === "ArrowLeft" || key === "PageUp" || key === "Backspace") go(k - 1);
    else if (key === "Home") go(0);
    else if (key === "End") go(data.steps.length - 1);
    else return;
    ev.preventDefault();
    ev.stopPropagation();
  };
  const close = (fromHistory = false) => {
    if (!ovl) return;
    ovl.remove();
    ovl = null;
    document.documentElement.classList.remove("pr-odprto");
    removeEventListener("keydown", onKey, true);
    const o = data.steps[k].orig;
    if (o.getClientRects().length) o.scrollIntoView({ block: "center" });
    lastK = k;
    lastY = scrollY;
    if (pushed && !fromHistory) history.back();
    pushed = false;
  };
  addEventListener("popstate", () => { if (ovl) { pushed = false; close(true); } });
  const button = (label, cls, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    const [icon, words] = label;
    b.title = words;
    b.setAttribute("aria-label", words);
    b.innerHTML = cls === "pr-next" ? `<span class="pr-bt">${words} </span>${icon}` : `${icon}<span class="pr-bt"> ${words}</span>`;
    b.addEventListener("click", (ev) => { ev.stopPropagation(); fn(); ovl && ovl.focus(); });
    return b;
  };
  const open = async () => {
    if (ovl) return;
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) await MathJax.startup.promise;
    if (!data) data = build();
    if (!data.steps.length) return;
    ovl = document.createElement("div");
    ovl.className = "pr-ovl";
    ovl.tabIndex = -1;
    ovl.setAttribute("role", "dialog");
    ovl.setAttribute("aria-label", T.btn);
    stage = document.createElement("div");
    stage.className = "pr-stage";
    text = document.createElement("div");
    text.className = "pr-text";
    const bar = document.createElement("div");
    bar.className = "pr-bar";
    count = document.createElement("span");
    count.className = "pr-count";
    bar.append(button(["←", T.back], "pr-back", () => go(k - 1)), count,
      button(["→", T.next], "pr-next", () => go(k + 1)), button(["✕", T.close], "pr-close", () => close()));
    ovl.append(stage, text, bar);
    // A tap goes on, a tap on the left third goes back. A pointer lights its parts again, links work as on the page.
    ovl.addEventListener("click", (ev) => {
      const a = ev.target.closest("a");
      if (a && a.classList.contains("kaz") && figOf(a) === shown) {
        ev.preventDefault();
        ev.stopPropagation();
        light(new Set(a.dataset.del.split(",")));
        return;
      }
      if (a || ev.target.closest("button, input, textarea, summary, .knowl")) return;
      if (String(getSelection()).trim()) return;
      go(ev.clientX < innerWidth / 3 ? k - 1 : k + 1);
    });
    ovl.addEventListener("pointerover", (ev) => {
      const a = ev.target.closest && ev.target.closest("a.kaz");
      if (a && figOf(a) === shown) light(new Set(a.dataset.del.split(",")));
    });
    ovl.addEventListener("pointerout", (ev) => {
      const a = ev.target.closest && ev.target.closest("a.kaz");
      if (a && !a.contains(ev.relatedTarget)) light(data.steps[k].parts);
    });
    document.body.append(ovl);
    document.documentElement.classList.add("pr-odprto");
    addEventListener("keydown", onKey, true);
    history.pushState({ predavanje: true }, "");
    pushed = true;
    shown = undefined;
    k = startAt();
    render();
    ovl.focus();
  };
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pr-btn";
  b.title = T.tip;
  b.setAttribute("aria-label", T.tip);
  b.innerHTML = `<span aria-hidden="true">▶</span><span class="pr-btn-t"> ${T.btn}</span>`;
  b.addEventListener("click", open);
  tools.insertBefore(b, tools.querySelector(".theme-toggle"));
})();
