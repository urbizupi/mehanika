// Interactive figure int-vektorji (ch-deformacija, sec-racunanje-z-vektorji, after fig-vsota-vektorjev):
// the sum, the difference and the multiple of vectors (eq-vektor-operacije) for vectors whose component
// z is zero, drawn in the plane of the axes x and y. The reader drags the tips of a and b (whole
// numbers, or the sliders) and chooses what to show. Components are computed component by component.
// No lengths: the length of a vector is defined only in sec-dolzina-vektorja, after this figure.
BookInt.define("vektorji", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Vektorja a in b v ravnini osi x in y ter njuna vsota, razlika ali večkratnik",
      cx: "komponenta *x*", cy: "komponenta *y*", cut: "Konica rezultata je zunaj slike, njegove komponente so v tabeli.",
    },
    en: {
      aria: "The vectors a and b in the plane of the axes x and y, and their sum, difference or multiple",
      cx: "component *x*", cy: "component *y*", cut: "The tip of the result lies outside the figure, its components are in the table.",
    },
  });
  const LIM = [6, 4]; // the tips of a and b stay within |x| ≤ 6 and |y| ≤ 4
  const st = { a: [1, 2], b: [2, 0], k: 2, mode: "sum" };

  // ---------- text: the markup of I.text, plus #a# for an upright bold letter (a vector, \vek) ----------
  function parse(str, sty = {}) {
    const out = [];
    let buf = "";
    const push = () => { if (buf) out.push({ t: buf, ...sty }); buf = ""; };
    for (let i = 0; i < str.length;) {
      const c = str[i];
      const j = c === "*" || c === "#" ? str.indexOf(c, i + 1) : -1;
      if (j > i) {
        push();
        out.push(...parse(str.slice(i + 1, j), { ...sty, [c === "#" ? "bf" : "it"]: true }));
        i = j + 1;
      } else if ((c === "_" || c === "^") && str[i + 1] === "{" && str.indexOf("}", i) > i) {
        const k = str.indexOf("}", i);
        push();
        out.push(...parse(str.slice(i + 2, k), { ...sty, [c === "_" ? "sub" : "sup"]: true }));
        i = k + 1;
      } else {
        buf += c;
        i += 1;
      }
    }
    push();
    return out;
  }
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = (str) => parse(String(str)).map((p) => {
    let t = esc(p.t);
    if (p.it) t = `<i>${t}</i>`;
    if (p.bf) t = `<b>${t}</b>`;
    if (p.sub) t = `<sub>${t}</sub>`;
    if (p.sup) t = `<sup>${t}</sup>`;
    return t;
  }).join("");
  // SVG text on a halo of the page colour, so that grid lines under it do not cross the letters.
  function label(g, x, y, str, anchor, cls) {
    const t = I.el("text", { x, y, "text-anchor": anchor, class: cls || undefined }, g);
    t.setAttribute("style", "stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; paint-order: stroke");
    let shift = 0;
    for (const p of parse(str)) {
      const want = p.sub ? 4.5 : p.sup ? -6.75 : 0;
      const sp = I.el("tspan", {}, t);
      if (want !== shift) { sp.setAttribute("dy", want - shift); shift = want; }
      if (p.it) sp.setAttribute("font-style", "italic");
      if (p.bf) sp.setAttribute("font-weight", "bold");
      if (p.sub || p.sup) sp.setAttribute("font-size", 11);
      sp.textContent = p.t;
    }
    return t;
  }

  // ---------- numbers ----------
  const near = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  const f = (v) => (near(v) ? I.fix(Math.round(v), 0) : I.fix(v, 1)); // k has one decimal, a whole numbers
  const p = (v) => (f(v).startsWith("−") ? `(${f(v)})` : f(v)); // a negative number in brackets
  const kname = () => `${p(st.k)} #a#`; // the multiple as the book writes it: 2 a, (−1) a

  // ---------- drawing ----------
  const s = I.svg(root, 560, 300, T.aria);
  const clipId = I.uid("vektorji-clip");
  const clipRect = I.el("rect", {}, I.el("clipPath", { id: clipId }, I.el("defs", {}, s)));
  const grid = I.el("g", {}, s);
  const plot = I.el("g", { "clip-path": `url(#${clipId})` }, s);
  const marks = I.el("g", {}, s);
  const handles = I.el("g", {}, s);
  const handle = () => {
    const h = I.el("g", {}, handles);
    return { h, ring: I.el("circle", { r: 10, class: "acc band" }, h), hit: I.el("circle", { r: 18, class: "hit" }, h) };
  };
  const HA = handle(), HB = handle();
  let u = 30, ox = 280, oy = 160, X = 8;
  const Y = 4;
  const P = (v) => [ox + u * v[0], oy - u * v[1]];
  const box = () => [ox - X * u, oy - Y * u, ox + X * u, oy + Y * u];

  // A label next to the pixel point (x, y) on the side (nx, ny), kept inside the grid.
  function place(x, y, nx, ny, str, cls, gap = 8) {
    let anchor = "middle", tx = x + nx * gap, ty = y + ny * gap + 5;
    if (nx > 0.38) anchor = "start";
    else if (nx < -0.38) anchor = "end";
    if (anchor === "middle") ty = y + ny * (gap + 7) + 5;
    else ty += ny * 5;
    const [x0, y0, x1, y1] = box();
    tx = Math.min(x1 - 4, Math.max(x0 + 4, tx));
    ty = Math.min(y1 - 4, Math.max(y0 + 14, ty));
    label(marks, tx, ty, str, anchor, cls);
  }
  // An arrow from the point p to the point q (in grid units), moved by off pixels.
  function vec(p0, q, cls, head, off = [0, 0]) {
    const a = P(p0), b = P(q);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return;
    I.arrow(plot, a[0] + off[0], a[1] + off[1], b[0] + off[0], b[1] + off[1], cls, head);
  }
  // The name of the arrow from p to q at its middle, on the side away from the point away.
  function side(p0, q, away, str, cls, gap = 8) {
    const a = P(p0), b = P(q), w = P(away);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 2) return;
    let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    if (nx * (w[0] - mx) + ny * (w[1] - my) > 1e-6) { nx = -nx; ny = -ny; }
    place(mx, my, nx, ny, str, cls, gap);
  }
  // The name of an arrow from O, beyond its tip.
  function tip(q, str, cls) {
    const a = P([0, 0]), b = P(q);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 2) return;
    place(b[0], b[1], (b[0] - a[0]) / L, (b[1] - a[1]) / L, str, cls, 10);
  }

  function drawGrid() {
    grid.replaceChildren();
    const [x0, y0, x1, y1] = box();
    for (let i = -X; i <= X; i += 1) I.line(grid, ox + i * u, y0, ox + i * u, y1, "siv thin").setAttribute("stroke-opacity", 0.3);
    for (let j = -Y; j <= Y; j += 1) I.line(grid, x0, oy - j * u, x1, oy - j * u, "siv thin").setAttribute("stroke-opacity", 0.3);
    I.arrow(grid, x0, oy, x1 + 6, oy, "siv", 8);
    I.arrow(grid, ox, y1, ox, y0 - 6, "siv", 8);
    label(grid, x1 + 2, oy - 9, "*x*", "end", "siv");
    label(grid, ox + 9, y0 + 9, "*y*", "start", "siv");
    label(grid, ox - 5, oy + 15, "*O*", "end", "siv");
    const every = u < 28 ? 2 : 1;
    for (let i = -X; i <= X; i += 1) {
      if (i % every) continue;
      I.text(grid, ox + i * u, y1 + 17, I.fix(i, 0), { anchor: "middle", class: "siv", "font-size": 12 });
    }
    for (let j = -Y; j <= Y; j += 1) {
      if (j % every) continue;
      I.text(grid, x0 - 6, oy - j * u + 4, I.fix(j, 0), { anchor: "end", class: "siv", "font-size": 12 });
    }
  }

  // ---------- controls and readout ----------
  const ctl0 = I.div(root, "int-ctls");
  const modes = [{ v: "sum", label: "#a# + #b#" }, { v: "diff", label: "#a# − #b#" }, { v: "mult", label: "*k* #a#" }];
  I.choice(ctl0, modes, st.mode, (v) => { st.mode = v; show(); draw(); });
  ctl0.querySelectorAll(".int-btn").forEach((b, i) => { b.innerHTML = html(modes[i].label); });
  const sl = (parent, key, i, name) => I.slider(parent, {
    label: name, min: -LIM[i], max: LIM[i], step: 1, value: st[key][i], fmt: (v) => I.fix(v, 0),
    input: (v) => { st[key][i] = v; draw(); },
  });
  const ctlA = I.div(root, "int-ctls");
  const ctlB = I.div(root, "int-ctls");
  const ctlK = I.div(root, "int-ctls");
  const sliders = {
    a: [sl(ctlA, "a", 0, "*a*_{x}"), sl(ctlA, "a", 1, "*a*_{y}")],
    b: [sl(ctlB, "b", 0, "*b*_{x}"), sl(ctlB, "b", 1, "*b*_{y}")],
  };
  I.slider(ctlK, { label: "*k*", min: -2, max: 2, step: 0.1, value: st.k, snap: (v) => Math.round(v * 10) / 10,
    fmt: (v) => f(v), input: (v) => { st.k = v; draw(); } });
  const out = I.div(root, "int-out");
  function show() {
    const m = st.mode === "mult";
    ctlB.style.display = m ? "none" : "";
    ctlK.style.display = m ? "" : "none";
    HB.h.style.display = m ? "none" : "";
  }

  const drag = (key) => (pt) => {
    const v = [Math.round((pt.x - ox) / u), Math.round((oy - pt.y) / u)].map((c, i) => Math.max(-LIM[i], Math.min(LIM[i], c)));
    if (v[0] === st[key][0] && v[1] === st[key][1]) return;
    st[key] = v;
    sliders[key].forEach((x, i) => x.set(v[i], true));
    draw();
  };
  I.drag(s, HA.h, drag("a"));
  I.drag(s, HB.h, drag("b"));

  function draw() {
    plot.replaceChildren();
    marks.replaceChildren();
    const O = [0, 0], A = st.a, B = st.b;
    let rows, R;
    if (st.mode === "sum") {
      const S = (R = [A[0] + B[0], A[1] + B[1]]);
      // the parallelogram: b attached to the tip of a, a attached to the tip of b (grey, dashed)
      vec(A, S, "siv dash", 10);
      vec(B, S, "siv dash", 10);
      vec(O, S, "nov thick", 13);
      vec(O, A, "acc thick", 13);
      vec(O, B, "acc thick", 13);
      side(A, S, O, "#b#", "siv");
      side(B, S, O, "#a#", "siv");
      side(O, A, B, "#a#", "acc");
      side(O, B, A, "#b#", "acc");
      tip(S, "#a# + #b#", "nov");
      rows = [["#a#", f(A[0]), f(A[1])], ["#b#", f(B[0]), f(B[1])],
        ["#a# + #b#", `${f(A[0])} + ${p(B[0])} = ${f(S[0])}`, `${f(A[1])} + ${p(B[1])} = ${f(S[1])}`]];
    } else if (st.mode === "diff") {
      // The orange a − b goes between the tips of b and a, which are always inside the grid, so there
      // is no note about the edge here even when the grey copy from O is cut.
      const D = [A[0] - B[0], A[1] - B[1]];
      R = O;
      // a − b from the tip of b to the tip of a (orange), and the same arrow from O (grey, dashed)
      vec(O, D, "siv dash", 10);
      vec(B, A, "nov thick", 13);
      vec(O, A, "acc thick", 13);
      vec(O, B, "acc thick", 13);
      side(O, A, B, "#a#", "acc");
      side(O, B, A, "#b#", "acc");
      side(B, A, O, "#a# − #b#", "nov");
      side(O, D, A, "#a# − #b#", "siv");
      rows = [["#a#", f(A[0]), f(A[1])], ["#b#", f(B[0]), f(B[1])],
        ["#a# − #b#", `${f(A[0])} − ${p(B[0])} = ${f(D[0])}`, `${f(A[1])} − ${p(B[1])} = ${f(D[1])}`]];
    } else {
      const k = st.k, K = (R = [k * A[0], k * A[1]]);
      // The multiple lies on the line of a. It is drawn 5 pixels to the right of a, so that a does
      // not hide it, with its name on that side and the name of a on the other.
      const n = [-A[1], A[0]], L = Math.hypot(A[0], A[1]) || 1;
      vec(O, K, "nov thick", 13, [(5 * A[1]) / L, (5 * A[0]) / L]);
      vec(O, A, "acc thick", 13);
      side(O, A, [-n[0], -n[1]], "#a#", "acc");
      if (Math.abs(k) > 1e-9) side(O, K, n, kname(), "nov", 16);
      rows = [["#a#", f(A[0]), f(A[1])],
        [kname(), `${p(k)} · ${p(A[0])} = ${f(K[0])}`, `${p(k)} · ${p(A[1])} = ${f(K[1])}`]];
    }
    // the tips that can be dragged
    for (const [H, v] of [[HA, A], [HB, B]]) {
      const q = P(v);
      for (const e of [H.ring, H.hit]) { e.setAttribute("cx", q[0]); e.setAttribute("cy", q[1]); }
    }

    // On a phone a calculation may break before its "=", nothing else breaks.
    const nb = (str) => `<span style="white-space: nowrap">${html(str)}</span>`;
    const cell = (str) => {
      const i = str.lastIndexOf(" = ");
      return `<td style="white-space: normal">${i < 0 ? nb(str) : `${nb(str.slice(0, i))} ${nb(str.slice(i + 1))}`}</td>`;
    };
    out.innerHTML = `<table><thead><tr><th></th><th>${html(T.cx)}</th><th>${html(T.cy)}</th></tr></thead><tbody>${
      rows.map((r) => `<tr><td>${nb(r[0])}</td>${cell(r[1])}${cell(r[2])}</tr>`).join("")
    }</tbody></table>${
      // a result drawn from O whose tip the edge of the grid cuts off is said to be so
      Math.abs(R[0]) > X + 1e-9 || Math.abs(R[1]) > Y + 1e-9 ? `<p>${html(T.cut)}</p>` : ""}`;
  }

  show();
  I.fit(root, s, 300, 640, (W) => Math.round(34 + 2 * Y * Math.max(22, Math.min(40, W / 15))), (W) => {
    u = Math.max(22, Math.min(40, W / 15));
    X = Math.floor((W - 34) / (2 * u));
    ox = 26 + (W - 34) / 2;
    oy = 10 + Y * u;
    const [x0, y0, x1, y1] = box();
    for (const [k, v] of [["x", x0 - 2], ["y", y0 - 2], ["width", x1 - x0 + 4], ["height", y1 - y0 + 4]]) clipRect.setAttribute(k, v);
    drawGrid();
    draw();
  });
});
