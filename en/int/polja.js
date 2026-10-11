// Interactive figure int-polja (ch-deformacija, sec-vlakna): five displacement fields of a bar 60 mm long
// and 20 mm high, seen from the side, with a grid of points every 10 mm, and one fibre PQ whose ends the
// reader drags. Drawn to true scale: an enlarged drawing of a small turn is not a turn (it also enlarges
// the body), so the displacements are drawn as they are, and they are large. Each field gives the position
// after loading of the point (x, y), exactly, so that the lengths and the strain are exact:
//   move by the same vector:  (x + 2a, y + a)
//   turn about the centre (30, 10): an exact rotation, the midpoint of the right end rises by v
//   stretching:  (x (1 + ΔL/L), y), the left end held in a wall (u = ε0 x of sec-deformacija-v-tocki)
//   shear:       (x + s y/H, y), the bottom face glued to a table, as for the cube (eq-strig-kocke)
//   bending:     the left end fixed in a wall, the axis y = 10 bends evenly (along a circle of radius R)
//                and keeps its length, the cross sections stay straight and perpendicular to it.
//                R follows from the drop w of the right end of the axis, w = R (1 − cos(L/R)).
BookInt.define("polja", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Palica z mrežo točk, puščicami pomikov in vlaknom pred obremenitvijo in po njej",
      move: "premik za isti vektor", turn: "zasuk", stretch: "raztezanje", shear: "strig", bend: "upogib",
      a: { move: "pomik vseh točk", turn: "dvig desnega konca", stretch: "raztezek palice Δ*L*", shear: "premik zgornje ploskve *s*", bend: "spust desnega konca" },
      fibre: "Vlakno:", top: "vodoravno zgoraj", bottom: "vodoravno spodaj", vert: "navpično", slant: "poševno",
      end: "krajišče",
      L0: "dolžina vlakna pred obremenitvijo *L*_{0}",
      L1: "dolžina vlakna po obremenitvi *L*_{1}",
      eps: "deformacija vlakna *ε*\u00a0=\u00a0(*L*_{1}\u00a0−\u00a0*L*_{0})\u00a0/\u00a0*L*_{0}",
    },
    en: {
      aria: "A bar with a grid of points, displacement arrows and a fibre before and after loading",
      move: "move by the same vector", turn: "turn", stretch: "stretching", shear: "shear", bend: "bending",
      a: { move: "displacement of all points", turn: "rise of the right end", stretch: "elongation of the bar Δ*L*", shear: "shift of the top face *s*", bend: "drop of the right end" },
      fibre: "Fibre:", top: "horizontal, top", bottom: "horizontal, bottom", vert: "vertical", slant: "slanted",
      end: "end",
      L0: "length of the fibre before loading *L*_{0}",
      L1: "length of the fibre after loading *L*_{1}",
      eps: "strain of the fibre *ε*\u00a0=\u00a0(*L*_{1}\u00a0−\u00a0*L*_{0})\u00a0/\u00a0*L*_{0}",
    },
  });
  const L = 60, H = 20, xc = 30, yc = 10; // the bar and its centre, mm
  const mm = (v) => `${I.fix(v, 0)} mm`;
  const FIELDS = [
    { v: "move", max: 10, value: 5, fmt: (a) => `(${I.fix(2 * a, 0)}, ${I.fix(a, 0)}) mm` },
    { v: "turn", max: 12, value: 8, fmt: mm },
    { v: "stretch", max: 15, value: 10, fmt: mm },
    { v: "shear", max: 8, value: 6, fmt: mm },
    { v: "bend", max: 15, value: 10, fmt: mm },
  ];
  const st = { f: "move", amp: {}, P: [10, 4], Q: [50, 16] };
  for (const f of FIELDS) st.amp[f.v] = f.value;

  // The curvature k of the bent axis whose right end drops by w: (1 − cos kL)/k = w, by halving an
  // interval on which the left side grows.
  function bendCurv(w) {
    if (w <= 0) return 0;
    const g = (k) => (2 * Math.sin((k * L) / 2) ** 2) / k;
    let lo = 0, hi = 2.3 / L;
    for (let i = 0; i < 80; i += 1) {
      const m = (lo + hi) / 2;
      if (g(m) < w) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }
  // The position after loading of the point (x, y), for the field f with the amplitude a.
  function field(f, a) {
    if (f === "move") return (x, y) => [x + 2 * a, y + a];
    if (f === "turn") {
      const sn = a / (L - xc), cs = Math.sqrt(1 - sn * sn);
      return (x, y) => [xc + cs * (x - xc) - sn * (y - yc), yc + sn * (x - xc) + cs * (y - yc)];
    }
    if (f === "stretch") return (x, y) => [x + (a * x) / L, y];
    if (f === "shear") return (x, y) => [x + (a * y) / H, y];
    const k = bendCurv(a);
    if (k === 0) return (x, y) => [x, y];
    const R = 1 / k;
    return (x, y) => {
      const e = y - yc, ph = k * x, c1 = 2 * Math.sin(ph / 2) ** 2; // c1 = 1 − cos(kx)
      return [(R + e) * Math.sin(ph), yc + e * (1 - c1) - R * c1];
    };
  }
  // the boundary of the bar, walked around, as points before loading
  const rim = [];
  for (let i = 0; i < 30; i += 1) rim.push([(L * i) / 30, 0]);
  for (let i = 0; i < 10; i += 1) rim.push([L, (H * i) / 10]);
  for (let i = 0; i < 30; i += 1) rim.push([L - (L * i) / 30, H]);
  for (let i = 0; i < 10; i += 1) rim.push([0, H - (H * i) / 10]);

  // A fixed view for all fields at their largest amplitudes, so that the scale never jumps.
  let bx0 = -7, bx1 = L, by0 = -6, by1 = H + 2;
  for (const f of FIELDS) {
    const m = field(f.v, f.max);
    for (const [x, y] of rim) {
      const [px, py] = m(x, y);
      bx0 = Math.min(bx0, px); bx1 = Math.max(bx1, px); by0 = Math.min(by0, py); by1 = Math.max(by1, py);
    }
  }

  // ---------- drawing ----------
  const s = I.svg(root, 640, 360, T.aria);
  const gSupport = I.el("g", {}, s);
  const gBefore = I.el("g", {}, s);
  const gAfter = I.el("g", {}, s);
  const gFibre = I.el("g", {}, s);
  const gHandles = I.el("g", {}, s);
  let k = 1; // pixels per mm
  const X = (x) => 14 + (x - bx0) * k;
  const Y = (y) => 26 + (by1 - y) * k;
  const handles = ["P", "Q"].map((name) => {
    const ring = I.el("circle", { r: 11, class: "acc dash", visibility: "hidden" }, gHandles);
    const hit = I.el("circle", { r: 18, class: "hit", tabindex: 0, "aria-label": `${T.end} ${name}` }, gHandles);
    hit.addEventListener("focus", () => ring.setAttribute("visibility", "visible"));
    hit.addEventListener("blur", () => ring.setAttribute("visibility", "hidden"));
    return { name, ring, hit };
  });
  const clampX = (v) => Math.min(L, Math.max(0, v)), clampY = (v) => Math.min(H, Math.max(0, v));
  for (const hd of handles) {
    const set = (x, y) => {
      st[hd.name] = [Math.round(clampX(x) * 2) / 2, Math.round(clampY(y) * 2) / 2];
      draw();
    };
    I.drag(s, hd.hit, (pt) => set(bx0 + (pt.x - 14) / k, by1 - (pt.y - 26) / k));
    // keyboard: the arrow keys move the focused end by 1 mm, with Shift by 5 mm
    hd.hit.addEventListener("keydown", (ev) => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
      if (!d) return;
      ev.preventDefault();
      const step = ev.shiftKey ? 5 : 1, [x, y] = st[hd.name];
      set(x + d[0] * step, y + d[1] * step);
    });
  }

  function drawSupport() {
    gSupport.replaceChildren();
    if (st.f === "stretch" || st.f === "bend") { // a wall at the left end
      const y0 = Y(H + 5), y1 = Y(-5);
      I.line(gSupport, X(0), y0, X(0), y1, "siv");
      let d = "";
      for (let y = y0 + 4; y <= y1; y += 9) d += `M${X(0)},${y}L${X(0) - 8},${y + 7}`;
      I.path(gSupport, d, "siv thin");
    } else if (st.f === "shear") { // a table under the bottom face
      const x0 = X(-5), x1 = X(L + 5);
      I.line(gSupport, x0, Y(0), x1, Y(0), "siv");
      let d = "";
      for (let x = x0 + 4; x <= x1; x += 9) d += `M${x},${Y(0)}L${x - 7},${Y(0) + 8}`;
      I.path(gSupport, d, "siv thin");
    }
  }

  // ---------- controls and readout ----------
  const ctl = I.div(root, "int-ctls");
  I.choice(ctl, FIELDS.map((f) => ({ v: f.v, label: T[f.v] })), st.f, (v) => { st.f = v; showSlider(); draw(); });
  const sliderRow = I.div(root, "int-ctls");
  const sliders = {};
  for (const f of FIELDS) {
    sliders[f.v] = I.slider(sliderRow, { label: T.a[f.v], min: 0, max: f.max, step: 1, value: f.value,
      fmt: f.fmt, input: (v) => { st.amp[f.v] = v; draw(); } });
    sliders[f.v].el.querySelector(".int-ctl-name").style.whiteSpace = "normal"; // may wrap on a phone
  }
  function showSlider() {
    for (const f of FIELDS) sliders[f.v].el.style.display = f.v === st.f ? "" : "none";
  }
  showSlider();
  const ctl3 = I.div(root, "int-ctls");
  const presets = I.div(ctl3, "int-choice");
  const lab = document.createElement("span");
  lab.className = "int-ctl-name";
  lab.textContent = T.fibre;
  presets.appendChild(lab);
  for (const [name, P, Q] of [[T.top, [10, 18], [55, 18]], [T.bottom, [10, 2], [55, 2]],
                               [T.vert, [30, 2], [30, 18]], [T.slant, [10, 4], [50, 16]]]) {
    I.button(presets, name, () => { st.P = P; st.Q = Q; draw(); });
  }
  const out = I.div(root, "int-out");

  // a displacement arrow from (x0, y0) to (x1, y1) in pixels, left out when it is shorter than a pixel
  function disp(g, x0, y0, x1, y1) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1) return;
    if (len < 10) I.line(g, x0, y0, x1, y1, "acc");
    else I.arrow(g, x0, y0, x1, y1, "acc", 7);
  }
  // a label at the point (x, y), pushed 15 px from it in the direction (dx, dy)
  // A halo in the page colour keeps it readable where it crosses a line.
  function label(g, x, y, dx, dy, str, cls) {
    const n = Math.hypot(dx, dy) || 1;
    I.text(g, x + (15 * dx) / n, y + (15 * dy) / n + 5, str, { anchor: "middle", class: cls,
      style: "stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; paint-order: stroke" });
  }

  function draw() {
    const m = field(st.f, st.amp[st.f]);
    drawSupport();

    gBefore.replaceChildren();
    I.path(gBefore, `M${X(0)},${Y(0)}L${X(L)},${Y(0)}L${X(L)},${Y(H)}L${X(0)},${Y(H)}Z`, "");
    gAfter.replaceChildren();
    let d = "";
    rim.forEach(([x, y], i) => { const [px, py] = m(x, y); d += `${i ? "L" : "M"}${X(px).toFixed(2)},${Y(py).toFixed(2)}`; });
    I.path(gAfter, `${d}Z`, "nov thick");
    for (let x = 0; x <= L; x += 10) {
      for (let y = 0; y <= H; y += 10) {
        const [px, py] = m(x, y);
        I.el("circle", { cx: X(x), cy: Y(y), r: 2.5, class: "fill nostroke" }, gBefore);
        disp(gAfter, X(x), Y(y), X(px), Y(py));
      }
    }

    // the fibre: before, after, and (where the field bends it) the line of material it becomes
    gFibre.replaceChildren();
    const [P, Q] = [st.P, st.Q];
    const P1 = m(...P), Q1 = m(...Q);
    const pts = [];
    let dev = 0;
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40, [px, py] = m(P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1]));
      pts.push([X(px), Y(py)]);
      const cx = X(P1[0]) + t * (X(Q1[0]) - X(P1[0])), cy = Y(P1[1]) + t * (Y(Q1[1]) - Y(P1[1]));
      dev = Math.max(dev, Math.hypot(X(px) - cx, Y(py) - cy));
    }
    if (dev > 1.5) I.path(gFibre, pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(""), "nov thin dash");
    I.line(gFibre, X(P[0]), Y(P[1]), X(Q[0]), Y(Q[1]), "thick");
    I.line(gFibre, X(P1[0]), Y(P1[1]), X(Q1[0]), Y(Q1[1]), "nov thick");
    disp(gFibre, X(P[0]), Y(P[1]), X(P1[0]), Y(P1[1]));
    disp(gFibre, X(Q[0]), Y(Q[1]), X(Q1[0]), Y(Q1[1]));
    for (const [px, py] of [P1, Q1]) I.el("circle", { cx: X(px), cy: Y(py), r: 4, class: "nov fill nostroke" }, gFibre);
    for (const [px, py] of [P, Q]) I.el("circle", { cx: X(px), cy: Y(py), r: 6, class: "fill nostroke" }, gFibre);
    // Labels across each fibre, a little beyond its ends: P and Q on the side away from the fibre after
    // loading, P1 and Q1 on the side away from the fibre before loading.
    const ux = X(Q[0]) - X(P[0]), uy = Y(Q[1]) - Y(P[1]), ul = Math.hypot(ux, uy) || 1;
    let vx = X(Q1[0]) - X(P1[0]), vy = Y(Q1[1]) - Y(P1[1]);
    const vl = Math.hypot(vx, vy) || 1;
    vx /= vl; vy /= vl;
    const nx = -uy / ul, ny = ux / ul; // a normal of PQ
    const mid = ((X(P1[0]) + X(Q1[0]) - X(P[0]) - X(Q[0])) / 2) * nx + ((Y(P1[1]) + Y(Q1[1]) - Y(P[1]) - Y(Q[1])) / 2) * ny;
    const side = mid >= 0 ? 1 : -1; // the side of PQ on which the fibre after loading lies
    let mx = -vy, my = vx; // a normal of P1Q1 that points to the same side as (nx, ny)
    if (mx * nx + my * ny < 0) { mx = -mx; my = -my; }
    const ex = ux / ul, ey = uy / ul;
    label(gFibre, X(P[0]), Y(P[1]), -side * nx - 0.6 * ex, -side * ny - 0.6 * ey, "*P*", "");
    label(gFibre, X(Q[0]), Y(Q[1]), -side * nx + 0.6 * ex, -side * ny + 0.6 * ey, "*Q*", "");
    label(gFibre, X(P1[0]), Y(P1[1]), side * mx - 0.6 * vx, side * my - 0.6 * vy, "*P*_{1}", "nov");
    label(gFibre, X(Q1[0]), Y(Q1[1]), side * mx + 0.6 * vx, side * my + 0.6 * vy, "*Q*_{1}", "nov");
    for (const hd of handles) {
      const [px, py] = st[hd.name];
      for (const c of [hd.hit, hd.ring]) { c.setAttribute("cx", X(px)); c.setAttribute("cy", Y(py)); }
    }

    // Lengths before and after loading from the vectors PQ and P1Q1 (eq-vlakno-po-obremenitvi), the strain
    // as (L1² − L0²)/(L0 (L1 + L0)). For the move and the turn this is zero up to the rounding of the
    // computer (below 10⁻¹²), and it is shown as 0.
    const dx0 = Q[0] - P[0], dy0 = Q[1] - P[1], dx1 = Q1[0] - P1[0], dy1 = Q1[1] - P1[1];
    const L0 = Math.hypot(dx0, dy0), L1 = Math.hypot(dx1, dy1);
    const e = L0 > 0 ? (dx1 * dx1 + dy1 * dy1 - dx0 * dx0 - dy0 * dy0) / (L0 * (L1 + L0)) : 0;
    const eps = Math.abs(e) < 1e-12 ? "0" : Math.abs(e) >= 0.001 ? I.num(e, 3) : I.sci(e, 3);
    const row = (a, b) => `<tr><td>${I.html(a)}</td><td>${I.html(b)}</td></tr>`;
    out.innerHTML = `<table><tbody>${
      row(T.L0, `${I.fix(L0, 3)} mm`) + row(T.L1, `${I.fix(L1, 3)} mm`) + row(T.eps, eps)
    }</tbody></table>`;
  }

  I.fit(root, s, 320, 680, (W) => Math.round((by1 - by0) * ((W - 30) / (bx1 - bx0)) + 46), (W) => {
    k = (W - 30) / (bx1 - bx0);
    draw();
  });
});
