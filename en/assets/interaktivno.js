// Interactive figures (book/README.md, "Interactive figures"). A block
// ::: {.interaktivno #int-x src="name"} is rendered as <div class="int-root" data-int="name">.
// This file loads int/name.js once per page. That script calls BookInt.define("name", setup), and
// setup(root, I) draws the figure into root with the helpers I below. book.js calls BookInt.mount
// on every knowl it opens. Colours come from CSS classes (style.css), so both themes work.
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const lang = document.documentElement.lang || "sl";
  const defs = {};
  const asked = new Set();

  // ---------- numbers: a decimal comma in both languages (style.md 13) ----------
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴",
                5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  // Groups of three digits with a thin space from 10 000 on, as in the book.
  const group = (s) => s.replace(/^\d+/, (m) => (m.length > 4 ? m.replace(/\B(?=(\d{3})+$)/g, " ") : m));
  // v with d decimals: fix(0.5, 2) = "0,50", fix(-3, 0) = "−3".
  function fix(v, d) {
    const s = Math.abs(v).toFixed(d);
    const neg = v < 0 && /[1-9]/.test(s);
    return (neg ? "−" : "") + group(s).replace(".", ",");
  }
  // v with sig significant digits times a power of ten: sci(3.904e-6) = "3,904 · 10⁻⁶".
  function sci(v, sig = 4) {
    if (v === 0) return "0";
    let e = Math.floor(Math.log10(Math.abs(v)));
    if (Math.abs(+(v / 10 ** e).toFixed(sig - 1)) >= 10) e += 1; // 9,9996 rounds up to 10,000
    const m = fix(v / 10 ** e, sig - 1);
    return e === 0 ? m : `${m} · 10${String(e).split("").map((c) => SUP[c]).join("")}`;
  }
  // v with sig significant digits, trailing zeros dropped: num(0.1) = "0,1", num(1234.5, 3) = "1230".
  function num(v, sig = 3) {
    if (v === 0) return "0";
    const d = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(v))));
    let s = fix(v, d);
    if (s.includes(",")) s = s.replace(/0+$/, "").replace(/,$/, "");
    return s;
  }

  // ---------- text: *italic* variables, _{subscript}, ^{superscript} ----------
  // "Δ*u*", "*u*′(*x*)", "*ε*_{xx}" (indices upright, as in the book). No nesting of braces.
  function parse(str, style = {}) {
    const out = [];
    let buf = "";
    const push = () => { if (buf) out.push({ t: buf, ...style }); buf = ""; };
    for (let i = 0; i < str.length;) {
      const c = str[i];
      if (c === "*" && str.indexOf("*", i + 1) > i) {
        const j = str.indexOf("*", i + 1);
        push();
        out.push(...parse(str.slice(i + 1, j), { ...style, it: true }));
        i = j + 1;
      } else if ((c === "_" || c === "^") && str[i + 1] === "{" && str.indexOf("}", i) > i) {
        const j = str.indexOf("}", i);
        push();
        out.push(...parse(str.slice(i + 2, j), { ...style, [c === "_" ? "sub" : "sup"]: true }));
        i = j + 1;
      } else {
        buf += c;
        i += 1;
      }
    }
    push();
    return out;
  }
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // The same markup as HTML, for the readouts and the controls.
  const html = (str) => parse(String(str)).map((s) => {
    let t = esc(s.t);
    if (s.it) t = `<i>${t}</i>`;
    if (s.sub) t = `<sub>${t}</sub>`;
    if (s.sup) t = `<sup>${t}</sup>`;
    return t;
  }).join("");

  // ---------- SVG ----------
  function el(tag, attrs = {}, parent = null) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  // An SVG of w × h units that fills the width of the figure.
  function svg(parent, w, h, label) {
    const s = el("svg", { viewBox: `0 0 ${w} ${h}`, class: "int-svg", role: "img", "aria-label": label || "" });
    parent.appendChild(s);
    return s;
  }
  function setText(t, str) {
    t.replaceChildren();
    const fs = parseFloat(t.getAttribute("font-size")) || 15;
    let shift = 0;
    for (const s of parse(String(str))) {
      const want = s.sub ? 0.3 * fs : s.sup ? -0.45 * fs : 0;
      const sp = el("tspan", {}, t);
      if (want !== shift) { sp.setAttribute("dy", want - shift); shift = want; }
      if (s.it) sp.setAttribute("font-style", "italic");
      if (s.sub || s.sup) sp.setAttribute("font-size", 0.72 * fs);
      sp.textContent = s.t;
    }
    return t;
  }
  // Text at (x, y). attrs may hold anchor: "start" | "middle" | "end" and a class (colour).
  function text(parent, x, y, str, attrs = {}) {
    const { anchor, ...rest } = attrs;
    const t = el("text", { x, y, "text-anchor": anchor, ...rest }, parent);
    return setText(t, str);
  }
  const line = (parent, x1, y1, x2, y2, cls) => el("line", { x1, y1, x2, y2, class: cls }, parent);
  const path = (parent, d, cls) => el("path", { d, class: cls }, parent);
  // A distance or displacement: a line with short bars across both ends (style.md 14).
  function dist(parent, x1, y1, x2, y2, cls, bar = 5) {
    const g = el("g", { class: cls }, parent);
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / L) * bar, ny = ((x2 - x1) / L) * bar;
    path(g, `M${x1},${y1}L${x2},${y2}M${x1 - nx},${y1 - ny}L${x1 + nx},${y1 + ny}M${x2 - nx},${y2 - ny}L${x2 + nx},${y2 + ny}`);
    return g;
  }
  // A force: a line with a filled head at (x2, y2).
  function arrow(parent, x1, y1, x2, y2, cls, head = 9) {
    const g = el("g", { class: cls }, parent);
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const bx = x2 - ux * head, by = y2 - uy * head;
    path(g, `M${x1},${y1}L${bx},${by}`);
    el("polygon", { points: `${x2},${y2} ${bx - uy * head * 0.4},${by + ux * head * 0.4} ${bx + uy * head * 0.4},${by - ux * head * 0.4}`,
                    class: "fill nostroke" }, g);
    return g;
  }
  // Lay the svg out for the width of root: one unit is one CSS pixel up to maxW, so that text keeps
  // its size on a phone, and wider figures scale up. layout(W) redraws for the width W (at least minW).
  function fit(root, s, minW, maxW, height, layout) {
    let last = 0;
    const apply = () => {
      const W = Math.round(Math.max(minW, Math.min(maxW, root.clientWidth || maxW)));
      if (W === last) return;
      last = W;
      s.setAttribute("viewBox", `0 0 ${W} ${height(W)}`);
      layout(W);
    };
    // The next frame, because the new height would otherwise resize root inside its own observer.
    if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(apply)).observe(root);
    apply();
  }
  // A straight scale y = a + b x from a value interval to a pixel interval.
  function scale(v0, v1, p0, p1) {
    const f = (v) => p0 + ((v - v0) * (p1 - p0)) / (v1 - v0);
    f.inv = (p) => v0 + ((p - p0) * (v1 - v0)) / (p1 - p0);
    return f;
  }
  // Pointer dragging (mouse, pen and touch) of target in the coordinates of the svg.
  function drag(svgEl, target, move, end) {
    target.classList.add("int-drag");
    target.style.touchAction = "none";
    const pt = (e) => new DOMPoint(e.clientX, e.clientY).matrixTransform(svgEl.getScreenCTM().inverse());
    target.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      target.setPointerCapture(ev.pointerId);
      const mv = (e) => move(pt(e));
      const up = () => {
        target.removeEventListener("pointermove", mv);
        target.removeEventListener("pointerup", up);
        target.removeEventListener("pointercancel", up);
        if (end) end();
      };
      target.addEventListener("pointermove", mv);
      target.addEventListener("pointerup", up);
      target.addEventListener("pointercancel", up);
      mv(ev);
    });
  }

  // ---------- controls ----------
  function div(parent, cls) {
    const d = document.createElement("div");
    d.className = cls;
    parent.appendChild(d);
    return d;
  }
  // A slider. o: label, min, max, value, log (logarithmic), step, snap(v), fmt(v) -> markup, input(v).
  function slider(parent, o) {
    const lab = document.createElement("label");
    lab.className = "int-ctl";
    const name = document.createElement("span");
    name.className = "int-ctl-name";
    name.innerHTML = html(o.label);
    const inp = document.createElement("input");
    inp.type = "range";
    const to = (v) => (o.log ? Math.log10(v) : v);
    const from = (u) => (o.log ? 10 ** u : u);
    inp.min = to(o.min);
    inp.max = to(o.max);
    inp.step = o.step ?? "any";
    const out = document.createElement("output");
    out.className = "int-ctl-val";
    lab.append(name, inp, out);
    parent.appendChild(lab);
    const fmt = o.fmt || ((v) => num(v));
    const api = {
      value: o.value,
      // Set the value from the figure (a button, a drag), quiet: without calling input.
      set(v, quiet) {
        v = Math.min(o.max, Math.max(o.min, v));
        api.value = v;
        inp.value = to(v);
        out.innerHTML = html(fmt(v));
        if (!quiet && o.input) o.input(v);
      },
      el: lab,
    };
    inp.addEventListener("input", () => {
      let v = from(+inp.value);
      if (o.snap) v = o.snap(v);
      api.value = v;
      out.innerHTML = html(fmt(v));
      if (o.input) o.input(v);
    });
    api.set(o.value, true);
    return api;
  }
  function button(parent, label, onclick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "int-btn";
    b.innerHTML = html(label);
    b.addEventListener("click", onclick);
    parent.appendChild(b);
    return b;
  }
  // Buttons of which one is chosen. options: [{v, label}].
  function choice(parent, options, value, onchange) {
    const g = div(parent, "int-choice");
    g.setAttribute("role", "group");
    const bs = options.map((o) => {
      const b = button(g, o.label, () => api.set(o.v));
      b.dataset.v = String(o.v);
      return b;
    });
    const api = {
      value,
      set(v, quiet) {
        api.value = v;
        for (const b of bs) {
          const on = b.dataset.v === String(v);
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", String(on));
        }
        if (!quiet && onchange) onchange(v);
      },
    };
    api.set(value, true);
    return api;
  }
  function check(parent, label, value, onchange) {
    const lab = document.createElement("label");
    lab.className = "int-check";
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = value;
    const s = document.createElement("span");
    s.innerHTML = html(label);
    lab.append(inp, s);
    parent.appendChild(lab);
    inp.addEventListener("change", () => onchange(inp.checked));
    return inp;
  }

  // Ticks for an axis from v0 to v1: about n round values, and the decimals to show them with.
  function ticks(v0, v1, n = 5) {
    const raw = Math.abs(v1 - v0) / n;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((k) => k * p).find((s) => s >= raw * 0.999);
    const lo = Math.min(v0, v1), hi = Math.max(v0, v1);
    const out = [];
    for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + step * 1e-9; k += 1) out.push(k * step);
    return { values: out, decimals: Math.max(0, -Math.floor(Math.log10(step) + 1e-9)) };
  }
  let uidCount = 0;
  const uid = (prefix) => `${prefix}-${(uidCount += 1)}`;

  const I = {
    lang, el, svg, fit, ticks, uid, text, setText, line, path, dist, arrow, scale, drag, div, slider, button, choice, check,
    fix, sci, num, html,
    pick: (o) => o[lang] || o.sl,
  };

  function mount(scope = document) {
    for (const root of scope.querySelectorAll(".int-root[data-int]")) {
      if (root.dataset.mounted) continue;
      const name = root.dataset.int;
      if (defs[name]) {
        root.dataset.mounted = "1";
        root.replaceChildren();
        try {
          defs[name](root, I);
        } catch (e) {
          root.textContent = String(e);
          console.error(e);
        }
      } else if (!asked.has(name)) {
        asked.add(name);
        const s = document.createElement("script");
        s.src = `int/${name}.js`;
        document.head.appendChild(s);
      }
    }
  }
  function define(name, setup) {
    defs[name] = setup;
    mount();
  }
  window.BookInt = { define, mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount());
  else mount();
})();
