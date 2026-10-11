// Interactive figure int-koscek (ch-deformacija, sec-odvod): the difference quotient of the hanging
// bar, u(x) = a (2 L x - x^2), for a piece from x to x + Δx. The line through two points of the
// graph turns into the tangent as Δx shrinks. Numbers as in the book: L = 10 m, a = 1,952e-7 1/m.
BookInt.define("koscek", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Viseča palica s koščkom in graf njenega pomika s premico skozi dve točki in tangento",
      xaxis: "*x* (m)", uaxis: "*u* (µm)", tangent: "tangenta", zoom: "Povečaj okolico koščka",
      len: "dolžina koščka Δ*x*",
      du: "raztezek koščka Δ*u* = *u*(*x* + Δ*x*) − *u*(*x*)",
      q: "deformacija koščka Δ*u* / Δ*x*",
      d: "odvod *u*′(*x*) = 2*a*(*L* − *x*)",
      diff: "razlika *u*′(*x*) − Δ*u* / Δ*x* = *a*Δ*x*",
    },
    en: {
      aria: "The hanging bar with a piece, and the graph of its displacement with the line through two points and the tangent",
      xaxis: "*x* (m)", uaxis: "*u* (µm)", tangent: "tangent", zoom: "Magnify around the piece",
      len: "length of the piece Δ*x*",
      du: "elongation of the piece Δ*u* = *u*(*x* + Δ*x*) − *u*(*x*)",
      q: "strain of the piece Δ*u* / Δ*x*",
      d: "derivative *u*′(*x*) = 2*a*(*L* − *x*)",
      diff: "difference *u*′(*x*) − Δ*u* / Δ*x* = *a*Δ*x*",
    },
  });
  const L = 10;
  const a = 1.952e-7; // 1/m
  const u = (x) => a * (2 * L * x - x * x); // m
  const st = { x: 0, dx: 1, zoom: false };

  // ---------- drawing ----------
  const H = 320;
  const s = I.svg(root, 560, H, T.aria);
  const gx0 = 125, gy0 = 30, gy1 = 270; // graph area, its right edge gx1 follows the width
  let gx1 = 545;
  const clip = I.uid("koscek-clip");
  const clipRect = I.el("rect", { x: gx0, y: gy0, height: gy1 - gy0 }, I.el("clipPath", { id: clip }, I.el("defs", {}, s)));

  // The bar, hanging from the ceiling: 10 m drawn as 240 units.
  const by = I.scale(0, L, gy0, gy1);
  const bar = I.el("g", {}, s);
  I.line(bar, 34, gy0, 68, gy0, "thick");
  for (let k = 0; k < 5; k += 1) I.line(bar, 36 + 7 * k, gy0 - 8, 42 + 7 * k, gy0 - 1, "thin");
  I.el("rect", { x: 44, y: gy0, width: 14, height: gy1 - gy0 }, bar);
  const piece = I.el("rect", { x: 44, width: 14, class: "acc fill nostroke" }, bar);
  const xTick = I.line(bar, 58, 0, 66, 0, "acc");
  const xLab = I.text(bar, 70, 0, "*x*", { class: "acc" });

  const axes = I.el("g", {}, s);
  const plot = I.el("g", { "clip-path": `url(#${clip})` }, s);
  const marks = I.el("g", {}, s);

  // ---------- controls and readout ----------
  const ctl = I.div(root, "int-ctls");
  const xs = I.slider(ctl, { label: "*x*", min: 0, max: 5, step: 0.1, value: st.x,
    fmt: (v) => `${I.fix(v, 1)} m`, input: (v) => { st.x = v; draw(); } });
  const dxs = I.slider(ctl, { label: "Δ*x*", min: 0.001, max: 5, log: true, value: st.dx,
    snap: (v) => +v.toPrecision(2), fmt: (v) => `${I.num(v, 2)} m`, input: (v) => { st.dx = v; draw(); } });
  const ctl2 = I.div(root, "int-ctls");
  I.button(ctl2, "Δ*x* · 0,1", () => dxs.set(st.dx / 10));
  I.button(ctl2, "Δ*x* · 10", () => dxs.set(st.dx * 10));
  I.check(ctl2, T.zoom, st.zoom, (on) => { st.zoom = on; draw(); });
  const out = I.div(root, "int-out");

  function draw() {
    const { x, dx } = st;
    const x2 = x + dx;
    const q = a * (2 * L - 2 * x - dx); // Δu/Δx, factored so that no digits cancel
    const du = q * dx;
    const d = 2 * a * (L - x);

    // the piece on the bar, at least 2 units tall so that it stays visible
    const y1 = by(x), y2 = Math.max(by(x2), y1 + 2);
    piece.setAttribute("y", y1);
    piece.setAttribute("height", y2 - y1);
    for (const k of ["y1", "y2"]) xTick.setAttribute(k, y1);
    xLab.setAttribute("y", Math.max(y1 + 5, gy0 + 15)); // below the ceiling at the top

    // The graph window. Without magnification the whole bar, 0 to 10 m and 0 to 20 µm. With it, a
    // window three pieces wide around the piece, enlarged equally in both directions, so that slopes
    // and angles look the same as in the whole graph.
    let wx0 = 0, wx1 = L, wu0 = 0, wu1 = 20;
    if (st.zoom && 3 * dx < L) {
      const w = 3 * dx, xc = x + dx / 2, uc = 1e6 * (u(x) + u(x2)) / 2;
      wx0 = xc - w / 2; wx1 = xc + w / 2;
      wu0 = uc - w; wu1 = uc + w; // 20 µm per 10 m in the whole graph, so 2 µm per m of window
    }
    const sx = I.scale(wx0, wx1, gx0, gx1), su = I.scale(wu0, wu1, gy1, gy0);
    const P = [sx(x), su(1e6 * u(x))], Q = [sx(x2), su(1e6 * u(x2))];

    axes.replaceChildren();
    I.line(axes, gx0, gy1, gx1, gy1, "siv");
    I.line(axes, gx0, gy0, gx0, gy1, "siv");
    const tx = I.ticks(wx0, wx1, gx1 - gx0 < 300 ? 3 : 5), tu = I.ticks(wu0, wu1, 4);
    for (const v of tx.values) {
      I.line(axes, sx(v), gy1, sx(v), gy1 + 5, "siv");
      I.text(axes, sx(v), gy1 + 20, I.fix(v, tx.decimals), { anchor: "middle", class: "siv", "font-size": 13 });
    }
    for (const v of tu.values) {
      I.line(axes, gx0 - 5, su(v), gx0, su(v), "siv");
      I.text(axes, gx0 - 8, su(v) + 4, I.fix(v, tu.decimals), { anchor: "end", class: "siv", "font-size": 13 });
    }
    I.text(axes, gx1, gy1 + 42, T.xaxis, { anchor: "end", class: "siv" });
    I.text(axes, gx0 - 8, gy0 - 12, T.uaxis, { anchor: "middle", class: "siv" });

    plot.replaceChildren();
    // the graph of u, only over the bar (0 ≤ x ≤ L)
    const a0 = Math.max(0, wx0), a1 = Math.min(L, wx1);
    let dpath = "";
    for (let k = 0; k <= 200; k += 1) {
      const t = a0 + ((a1 - a0) * k) / 200;
      dpath += `${k ? "L" : "M"}${sx(t).toFixed(2)},${su(1e6 * u(t)).toFixed(2)}`;
    }
    I.path(plot, dpath, "thick");
    // the tangent at x (blue) and the line through the two points (grey), across the whole window
    const lineAt = (slope) => {
      const ya = 1e6 * u(x) + slope * 1e6 * (wx0 - x), yb = 1e6 * u(x) + slope * 1e6 * (wx1 - x);
      return `M${sx(wx0)},${su(ya)}L${sx(wx1)},${su(yb)}`;
    };
    I.path(plot, lineAt(q), "siv thick");
    I.path(plot, lineAt(d), "acc");
    marks.replaceChildren();
    // the triangle of changes: Δx along, Δu up (left out while the two points nearly coincide).
    // Not clipped, so that its labels may stand below the axis.
    if (Q[0] - P[0] > 4) {
      I.dist(marks, P[0], P[1], Q[0], P[1], "siv");
      I.dist(marks, Q[0], P[1], Q[0], Q[1], "acc");
    }
    if (Q[0] - P[0] > 30) I.text(marks, (P[0] + Q[0]) / 2, P[1] + 19, "Δ*x*", { anchor: "middle", class: "siv" });
    if (P[1] - Q[1] > 16) I.text(marks, Q[0] + 7, (P[1] + Q[1]) / 2 + 5, "Δ*u*", { class: "acc" });
    for (const [px, py] of [P, Q]) I.el("circle", { cx: px, cy: py, r: 3.5, class: "fill" }, marks);

    // label the tangent near the end of its visible part
    const yA = su(1e6 * u(x) + d * 1e6 * (wx0 - x)), yB = su(1e6 * u(x) + d * 1e6 * (wx1 - x));
    let t0 = 0, t1 = 1;
    if (yA !== yB) {
      const ta = (gy0 - yA) / (yB - yA), tb = (gy1 - yA) / (yB - yA);
      t0 = Math.max(0, Math.min(ta, tb)); t1 = Math.min(1, Math.max(ta, tb));
    }
    if (t1 > t0) {
      const t = t1 - 0.04;
      I.text(marks, gx0 + t * (gx1 - gx0) - 6, yA + t * (yB - yA) - 8, T.tangent, { anchor: "end", class: "acc", "font-size": 13 });
    }

    const row = (label, value, cls = "") => `<tr${cls}><td>${I.html(label)}</td><td>${I.html(value)}</td></tr>`;
    out.innerHTML = `<table><tbody>${
      row(T.len, `${I.num(dx, 2)} m`)
      + row(T.du, `${I.sci(du, 4)} m`)
      + row(T.q, I.sci(q, 4))
      + row(T.d, I.sci(d, 4))
      + row(T.diff, I.sci(a * dx, 4))
    }</tbody></table>`;
  }
  I.fit(root, s, 320, 560, () => H, (W) => {
    gx1 = W - 15;
    clipRect.setAttribute("width", gx1 - gx0);
    draw();
  });
});
