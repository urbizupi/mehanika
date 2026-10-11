// Interactive figure int-deformacija-tocke (ch-deformacija, sec-deformacija-v-tocki): the strain along
// the steel bar of length L = 10 m hanging under its own weight, u(x) = a (2 L x - x^2) with
// a = 1,952e-7 1/m, so ε(x) = u'(x) = 2a(L - x). Left the bar under the ceiling with the point x, right
// the graph of ε(x) with the average strain ΔL/L = aL dashed, and two equal grey distances ΔL/L at the
// top, which together make ε(0) = 2aL. The ceiling can sag by 1 mm: every displacement grows by 1 mm,
// ΔL = u(L) - u(0) and the strains stay the same. The sag is drawn 1000 times enlarged (10 m are 240
// units, 1 mm is 24 units), and at that scale the elongation of the bar, 0,01952 mm, would be half a unit.
BookInt.define("deformacija-tocke", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Jeklena palica, ki visi s stropa, in graf deformacije vzdolž palice s povprečno deformacijo",
      xaxis: "*x* (m)", place: "strop na mestu", sag: "strop povešen za 1 mm",
      u0: "pomik vrha *u*(0)", ux: "pomik točke *u*(*x*)", uL: "pomik spodnjega konca *u*(*L*)",
      dL: "celotni raztezek Δ*L* = *u*(*L*) − *u*(0)", avg: "povprečna deformacija Δ*L* / *L*",
      eps: "deformacija *ε*(*x*) = 2*a*(*L* − *x*)", ratio: "razmerje *ε*(*x*) / (Δ*L* / *L*)",
    },
    en: {
      aria: "A steel bar hanging from the ceiling, and the graph of the strain along the bar with the average strain",
      xaxis: "*x* (m)", place: "ceiling in place", sag: "ceiling sagged by 1 mm",
      u0: "displacement of the top *u*(0)", ux: "displacement of the point *u*(*x*)", uL: "displacement of the bottom end *u*(*L*)",
      dL: "total elongation Δ*L* = *u*(*L*) − *u*(0)", avg: "average strain Δ*L* / *L*",
      eps: "strain *ε*(*x*) = 2*a*(*L* − *x*)", ratio: "ratio *ε*(*x*) / (Δ*L* / *L*)",
    },
  });
  const L = 10;
  const a = 1.952e-7; // 1/m
  const u = (x) => a * (2 * L * x - x * x); // m, with the top fixed to the ceiling
  const eps = (x) => 2 * a * (L - x);
  const st = { x: 0, sag: 0 }; // sag in m, 0 or 0,001

  // ---------- drawing ----------
  const H = 330;
  const s = I.svg(root, 560, H, T.aria);
  const y0 = 52, mpx = 24; // the top of the bar before the sag, units per metre of the bar
  const yb = y0 + L * mpx;
  const sagPx = 24; // 1 mm drawn as 24 units: 1000 times enlarged
  const bx = 70, bw = 16; // the bar
  const gx0 = bx + 70; // the axis of the graph, its right edge gx1 follows the width
  let gx1 = 526;
  const g = I.el("g", {}, s);

  // ---------- controls and readout ----------
  const ctl = I.div(root, "int-ctls");
  const xs = I.slider(ctl, { label: "*x*", min: 0, max: L, step: 0.1, value: st.x,
    fmt: (v) => `${I.fix(v, 1)} m`, input: (v) => { st.x = v; draw(); } });
  const ctl2 = I.div(root, "int-ctls");
  const jump = I.div(ctl2, "int-choice");
  I.button(jump, "*x* = 0", () => xs.set(0));
  I.button(jump, "*x* = 5 m", () => xs.set(5));
  I.button(jump, "*x* = 10 m", () => xs.set(10));
  I.choice(ctl2, [{ v: "0", label: T.place }, { v: "0.001", label: T.sag }], "0", (v) => { st.sag = +v; draw(); });
  const out = I.div(root, "int-out");

  function draw() {
    const { x, sag } = st;
    const ex = I.scale(0, 4.4e-6, gx0, gx1);
    const yx = (t) => y0 + t * mpx; // the height of x in the graph, the bar before the sag
    const dy = sag ? sagPx : 0;
    g.replaceChildren();

    // The ceiling and the bar. After the sag both are orange, and grey dashed lines show where the
    // ceiling and the bottom end were.
    const ceiling = (y, cls) => {
      I.line(g, bx - 12, y, bx + bw + 2, y, `thick ${cls}`);
      for (let k = 0; k < 5; k += 1) I.line(g, bx - 12 + 6 * k, y - 8, bx - 6 + 6 * k, y - 1, `thin ${cls}`);
    };
    if (sag) {
      I.line(g, bx - 12, y0, bx + bw + 2, y0, "siv dash");
      I.line(g, bx - 4, yb, bx + bw + 4, yb, "siv dash");
    }
    ceiling(y0 + dy, sag ? "nov" : "");
    I.el("rect", { x: bx, y: y0 + dy, width: bw, height: L * mpx, class: sag ? "nov" : "" }, g);
    if (sag) {
      // every point moves by the same 1 mm: the top and the bottom end
      for (const yy of [y0, yb]) {
        I.dist(g, bx - 22, yy, bx - 22, yy + dy, "siv");
        I.text(g, bx - 28, yy + dy / 2 + 5, "1 mm", { anchor: "end", class: "siv", "font-size": 13 });
      }
    }
    // the point x on the bar
    const py = yx(x) + dy;
    I.el("circle", { cx: bx + bw / 2, cy: py, r: 4, class: "acc fill" }, g);
    I.text(g, bx + bw + 8, py + 5, "*x*", { class: "acc" });

    // the graph of ε(x): x down along the bar, ε to the right
    const e0 = eps(0), avg = a * L;
    I.line(g, ex(avg), y0, ex(avg), yb, "siv dash");
    I.line(g, gx0, y0, gx0, yb, "siv");
    I.line(g, gx0, yb, gx1, yb, "siv");
    I.line(g, ex(e0), y0, gx0, yb, "acc thick");
    for (const t of [0, 5, 10]) {
      I.line(g, gx0 - 4, yx(t), gx0, yx(t), "siv");
      I.text(g, gx0 - 7, yx(t) + 5, I.fix(t, 0), { anchor: "end", class: "siv", "font-size": 13 });
    }
    for (const v of [0, 2e-6, 4e-6]) {
      I.line(g, ex(v), yb, ex(v), yb + 4, "siv");
      I.text(g, ex(v), yb + 19, I.sci(v, 1), { anchor: "middle", class: "siv", "font-size": 13 });
    }
    I.text(g, gx0 - 7, y0 - 14, T.xaxis, { anchor: "end", class: "siv", "font-size": 13 });
    I.text(g, gx1 + 4, yb + 5, "*ε*", { class: "siv" });
    // the factor 2: two equal grey distances ΔL/L side by side reach ε(0)
    for (const [e1, e2] of [[0, avg], [avg, 2 * avg]]) {
      I.dist(g, ex(e1), y0 - 12, ex(e2), y0 - 12, "siv", 4);
      I.text(g, (ex(e1) + ex(e2)) / 2, y0 - 20, "Δ*L* / *L*", { anchor: "middle", class: "siv", "font-size": 13 });
    }
    // the point x in the graph
    const qy = yx(x), qx = ex(eps(x));
    if (qx - gx0 > 6) I.line(g, gx0, qy, qx, qy, "acc thin dash");
    I.el("circle", { cx: qx, cy: qy, r: 4, class: "acc fill" }, g);
    // its label right of the point, clear of the axis at the bottom and of the line, which rises to the right
    const yl = Math.min(qy + 5, yb - 6), slope = (yb - y0) / (ex(e0) - gx0);
    I.text(g, qx + Math.max(8, (qy - yl + 11) / slope + 4), yl, "*ε*(*x*)", { class: "acc", "font-size": 14 });

    // numbers: the displacements with the sag, ΔL from them, so that the extra 1 mm really cancels
    const u0 = u(0) + sag, ux = u(x) + sag, uL = u(L) + sag;
    const dL = uL - u0;
    const mm = (v) => `${I.fix(1000 * v, 5)} mm`;
    const row = (label, value) => `<tr><td>${I.html(label)}</td><td>${I.html(value)}</td></tr>`;
    out.innerHTML = `<table><tbody>${
      row(T.u0, mm(u0)) + row(T.ux, mm(ux)) + row(T.uL, mm(uL)) + row(T.dL, mm(dL))
      + row(T.avg, I.sci(dL / L, 4)) + row(T.eps, I.sci(eps(x), 4)) + row(T.ratio, I.fix(eps(x) / (dL / L), 2))
    }</tbody></table>`;
  }
  I.fit(root, s, 320, 560, () => H, (W) => {
    gx1 = W - 34;
    draw();
  });
});
