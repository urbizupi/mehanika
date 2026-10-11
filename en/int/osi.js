// Interactive figure int-osi (ch-deformacija, sec-enotski-vektorji, next to fig-zasukane-osi): the
// part of the fly's flight along the floor, (1, 2), seen from above, in the old axes and in axes
// turned about the vertical axis z. The arrow stays, its components in the turned axes change, its
// length does not. The turn is set by dragging the end of the turned axis x, by a slider or by two
// buttons. No angle is shown or named, because chapter 1 measures no angles. At the quarter turn of
// the book (the new x along the old y) the components are exactly the book's 2 and -1.
BookInt.define("osi", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Del leta muhe vzdolž tal v starih in v zasukanih oseh, pogled od zgoraj",
      turn: "zasuk osi", none: "brez zasuka", quarter: "četrt kroga", and: "in",
      oldc: "komponenti v starih oseh *x*, *y*",
      newc: "komponenti v zasukanih oseh *x̄*, *ȳ*",
      oldL: "dolžina iz komponent v starih oseh",
      newL: "dolžina iz komponent v zasukanih oseh",
    },
    en: {
      aria: "The part of the fly's flight along the floor in the old and in the turned axes, seen from above",
      turn: "turn of the axes", none: "no turn", quarter: "quarter turn", and: "and",
      oldc: "components in the old axes *x*, *y*",
      newc: "components in the turned axes *x̄*, *ȳ*",
      oldL: "length from the components in the old axes",
      newL: "length from the components in the turned axes",
    },
  });
  const V = [1, 2]; // the arrow in the old axes (m), the floor part of the flight (1, 2, -2)
  const N = 100; // positions of the turn in a full circle: the quarter turn is 25
  // Turns at which the turned axis x or y lies along the arrow, so that one component is zero.
  const along = (Math.atan2(V[1], V[0]) / (2 * Math.PI)) * N;
  const SPECIAL = [0, 1, 2, 3].map((j) => along + (N / 4) * j);
  const R0 = 2.5, R1 = 2.9; // lengths of the old (grey) and the turned (blue) axes drawn, in m
  const st = { t: 0 };

  // The nearest allowed turn: a whole position, or one of the special turns if it is close.
  function snap(v) {
    v = ((v % N) + N) % N;
    for (const s of SPECIAL) {
      const d = Math.abs(v - s);
      if (Math.min(d, N - d) < 0.6) return s;
    }
    return Math.round(v) % N;
  }
  // Values that are whole numbers up to rounding become whole numbers (cos of a quarter turn is 6e-17).
  const clean = (v) => Math.round(v * 1e12) / 1e12;
  const near = (v) => Math.abs(v - Math.round(v)) < 1e-9;
  // A component: a whole number as it is (2, −1), otherwise with two decimals.
  const fc = (v) => (near(v) ? I.fix(Math.round(v), 0) : I.fix(v, 2));
  const sq = (v) => { const f = fc(v); return f.startsWith("−") ? `(${f})^{2}` : `${f}^{2}`; };

  // Labels on a halo of the page colour, so that a line passing under them does not cross the text.
  const halo = (t) => {
    t.setAttribute("style", "stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; paint-order: stroke");
    return t;
  };
  // A label next to the point (x, y), on the side (nx, ny) (a unit direction in pixels).
  function place(g, x, y, nx, ny, str, cls, gap = 7) {
    let anchor = "middle", tx = x + nx * gap, ty = y + ny * gap + 5;
    if (nx > 0.38) anchor = "start";
    else if (nx < -0.38) anchor = "end";
    if (anchor === "middle") ty = y + ny * (gap + 7) + 5;
    else ty += ny * 5;
    return halo(I.text(g, tx, ty, str, { anchor, class: cls }));
  }

  // ---------- drawing ----------
  const s = I.svg(root, 360, 360, T.aria);
  const g = I.el("g", {}, s);
  const handle = I.el("g", {}, s);
  const ring = I.el("circle", { r: 12, class: "acc band" }, handle);
  const hit = I.el("circle", { r: 22, class: "hit" }, handle);
  let cx = 180, cy = 180, u = 54;
  const P = (v) => [cx + u * v[0], cy - u * v[1]];

  // An axis through O along the unit vector e, from -R to R, with an arrowhead at R and ticks at
  // every metre.
  function axis(e, R, cls) {
    const a = P([-R * e[0], -R * e[1]]), b = P([R * e[0], R * e[1]]);
    I.arrow(g, a[0], a[1], b[0], b[1], cls, 9);
    for (const k of [-2, -1, 1, 2]) {
      const p = P([k * e[0], k * e[1]]);
      I.line(g, p[0] - 4 * e[1], p[1] - 4 * e[0], p[0] + 4 * e[1], p[1] + 4 * e[0], cls);
    }
  }
  // A step from the point p to the point q (in m), dashed, with its number beside it on the side n.
  function step(p, q, n, value, cls) {
    const a = P(p), b = P(q);
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) return;
    I.arrow(g, a[0], a[1], b[0], b[1], `${cls} dash thick`.trim(), 11);
    place(g, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, n[0], -n[1], fc(value), cls, 10);
  }

  // ---------- controls and readout ----------
  const ctl = I.div(root, "int-ctls");
  const ts = I.slider(ctl, { label: T.turn, min: 0, max: N, value: 0, snap,
    fmt: () => "", input: (v) => { st.t = v; draw(); } });
  ts.el.querySelector("output").style.display = "none";
  const ctl2 = I.div(root, "int-ctls");
  I.button(ctl2, T.none, () => ts.set(0));
  I.button(ctl2, T.quarter, () => ts.set(N / 4));
  const out = I.div(root, "int-out");

  I.drag(s, handle, (p) => {
    const t = snap((Math.atan2(cy - p.y, p.x - cx) / (2 * Math.PI)) * N);
    ts.set(t, true);
    st.t = t;
    draw();
  });

  function draw() {
    const th = (2 * Math.PI * st.t) / N;
    const c = clean(Math.cos(th)), sn = clean(Math.sin(th));
    const ex = [c, sn], ey = [-sn, c]; // unit vectors of the turned axes, in the old axes
    const c1 = clean(V[0] * c + V[1] * sn), c2 = clean(-V[0] * sn + V[1] * c);

    g.replaceChildren();
    axis([1, 0], R0, "siv");
    axis([0, 1], R0, "siv");
    axis(ex, R1, "acc");
    axis(ey, R1, "acc");
    // the steps in the turned axes, dashed in the text colour as in fig-zasukane-osi: c1 along the
    // turned x, then c2 along the turned y. Each number stands on the side away from the arrow.
    const Q = [c1 * ex[0], c1 * ex[1]];
    const s2 = c2 < 0 ? 1 : -1, s1 = c1 < 0 ? -1 : 1;
    step([0, 0], Q, [s2 * ey[0], s2 * ey[1]], c1, "");
    step(Q, V, [s1 * ex[0], s1 * ex[1]], c2, "");
    // the arrow itself (orange), the same in both axes
    const o = P([0, 0]), v = P(V);
    I.arrow(g, o[0], o[1], v[0], v[1], "nov thick", 13);

    // axis names: the old ones beside their ends, the turned ones beyond their ends
    const xo = P([R0, 0]), yo = P([0, R0]);
    halo(I.text(g, xo[0] - 2, xo[1] + 20, "*x*", { anchor: "middle", class: "siv" }));
    halo(I.text(g, yo[0] - 11, yo[1] + 6, "*y*", { anchor: "end", class: "siv" }));
    const xn = P([(R1 + 16 / u) * ex[0], (R1 + 16 / u) * ex[1]]);
    const yn = P([(R1 + 16 / u) * ey[0], (R1 + 16 / u) * ey[1]]);
    halo(I.text(g, xn[0], xn[1] + 5, "*x̄*", { anchor: "middle", class: "acc" }));
    halo(I.text(g, yn[0], yn[1] + 5, "*ȳ*", { anchor: "middle", class: "acc" }));
    halo(I.text(g, o[0] - 7, o[1] + 18, "*O*", { anchor: "end" }));

    const h = P([R1 * ex[0], R1 * ex[1]]);
    for (const e of [ring, hit]) { e.setAttribute("cx", h[0]); e.setAttribute("cy", h[1]); }

    // A root and its value may go on two lines on a phone, each part stays whole.
    const nb = (str) => `<span style="white-space: nowrap">${I.html(str)}</span>`;
    const row = (label, value) => `<tr><td>${I.html(label)}</td><td style="white-space: normal">${value}</td></tr>`;
    // the length is a whole number only for some arrows, otherwise it is rounded, so ≈
    const root2 = (p, q) => {
      const len = Math.hypot(p, q), exact = Math.abs(len - Math.round(len)) < 1e-9;
      return `${nb(`√(${sq(p)} + ${sq(q)})`)} ${nb(`${exact ? "=" : "≈"} ${I.fix(len, exact ? 0 : 2)} m`)}`;
    };
    out.innerHTML = `<table><tbody>${
      row(T.oldc, nb(`${fc(V[0])} ${T.and} ${fc(V[1])}`))
      + row(T.newc, nb(`${fc(c1)} ${T.and} ${fc(c2)}`))
      + row(T.oldL, root2(V[0], V[1]))
      + row(T.newL, root2(c1, c2))
    }</tbody></table>`;
  }

  I.fit(root, s, 300, 640, (W) => Math.round(2 * (R1 * Math.min(54, (W - 70) / (2 * R1)) + 30)), (W) => {
    u = Math.min(54, (W - 70) / (2 * R1));
    cx = W / 2;
    cy = R1 * u + 30;
    draw();
  });
});
