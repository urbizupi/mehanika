// Interactive figure int-strig (ch-deformacija, sec-zamaknjena-kocka): the front face of the sheared
// steel cube, h = 10 000 µm, with the field u_x = (s/h) z (eq-strig-kocke), and a fibre through the
// centre of the face whose two ends lie on the edges of the face. Left: the face and the fibre before
// and after loading, the shift drawn F times larger. Right: the strain of the fibres through the centre
// in every direction, drawn as a closed curve around a circle that stands for zero strain.
// Lengths and strains are exact: the vector after loading is (dx + k dz, dz) by eq-vlakno-po-obremenitvi,
// and the strain is (L1² − L0²)/(L0 (L1 + L0)) (eq-deformacija-kvadrati) with L1² − L0² = 2k dx dz + k² dz²,
// so that no digits cancel.
BookInt.define("strig", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Sprednja ploskev zamaknjene kocke z vlaknom skozi središče pred obremenitvijo in po njej ter krivulja deformacij vlaken v vseh smereh",
      s: "premik zgornje ploskve *s*", end: "krajišče vlakna",
      horiz: "vodoravno (kot *AB*)", vert: "navpično (kot *AD*)", ac: "diagonala *AC*", bd: "diagonala *BD*",
      polar: "deformacija vlaken skozi središče",
      vec: "vektor vlakna pred obremenitvijo",
      L0: "dolžina pred obremenitvijo *L*_{0}",
      L1: "dolžina po obremenitvi *L*_{1}",
      eps: "deformacija *ε*\u00a0=\u00a0(*L*_{1}\u00a0−\u00a0*L*_{0})\u00a0/\u00a0*L*_{0}",
    },
    en: {
      aria: "The front face of the sheared cube with a fibre through its centre before and after loading, and a curve of the strains of the fibres in all directions",
      s: "shift of the top face *s*", end: "end of the fibre",
      horiz: "horizontal (like *AB*)", vert: "vertical (like *AD*)", ac: "diagonal *AC*", bd: "diagonal *BD*",
      polar: "strain of the fibres through the centre",
      vec: "vector of the fibre before loading",
      L0: "length before loading *L*_{0}",
      L1: "length after loading *L*_{1}",
      eps: "strain *ε*\u00a0=\u00a0(*L*_{1}\u00a0−\u00a0*L*_{0})\u00a0/\u00a0*L*_{0}",
    },
  });
  const h = 10000; // edge of the cube, µm
  const F = 200;   // the drawing shows the displacements F times larger
  const K = 500;   // right panel: a strain of 0,001 moves the curve by half the radius of the circle
  // p is the place of the end E on the path from D along the top edge to C and down the right edge to B
  // (0 ≤ p ≤ 2h). The other end E′ lies opposite, through the centre M = (h/2, h/2).
  const st = { s: 10, p: 10000 };
  const endOf = (p) => (p <= h ? [p, h] : [h, 2 * h - p]);
  // whole micrometres, grouped by three digits also below 10 000, as in the vectors of the book's table
  const whole = (v) => I.fix(v, 0).replace(/(\d)(?=\d{3}$)/, "$1\u2009");
  function strain(dx, dz, k) {
    const L0 = Math.hypot(dx, dz);
    const d2 = 2 * k * dx * dz + k * k * dz * dz; // L1² − L0²
    const L1 = Math.sqrt(L0 * L0 + d2);
    return { L0, L1, e: d2 / (L0 * (L1 + L0)) };
  }

  // ---------- drawing ----------
  const s = I.svg(root, 640, 340, T.aria);
  const gStatic = I.el("g", {}, s);  // table, face before, axes, polar frame
  const gFace = I.el("g", {}, s);    // face after, fibre
  const gPolar = I.el("g", {}, s);   // curve, current direction
  const gHandles = I.el("g", {}, s);
  const hE = I.el("circle", { r: 18, class: "hit" }, gHandles);
  const hE2 = I.el("circle", { r: 18, class: "hit" }, gHandles);
  let G = null; // geometry for the current width

  function layout(W) {
    const wide = W >= 560;
    const faceW = wide ? Math.round(W * 0.58) : W;
    const S = Math.round(Math.min(230, (faceW - 80) / (1 + (F * 20) / h)));
    const ax = wide ? 52 : Math.round((W - S * (1 + (F * 20) / h)) / 2) + 14;
    const ay = 34 + S;
    const faceH = ay + 46;
    const R0 = Math.round(Math.min(70, ((wide ? W - faceW : W) / 2 - 26) / 1.65));
    const polarH = 2 * (1.65 * R0 + 24) + 22;
    const cx = wide ? faceW + (W - faceW) / 2 : W / 2;
    const top = wide ? Math.max(0, (faceH - polarH) / 2) : faceH + 6;
    const cy = top + 22 + 1.65 * R0 + 24;
    G = { W, S, ax, ay, R0, cx, cy, top, H: wide ? Math.max(faceH, polarH) : faceH + 6 + polarH };
    return G.H;
  }
  const X = (x) => G.ax + (x / h) * G.S;
  const Y = (z) => G.ay - (z / h) * G.S;

  function drawStatic() {
    const { S, ax, ay, R0, cx, cy } = G;
    gStatic.replaceChildren();
    // the table under the bottom face
    const t0 = ax - 14, t1 = ax + S * (1 + (F * 20) / h) + 10;
    I.line(gStatic, t0, ay, t1, ay, "siv");
    let d = "";
    for (let x = t0 + 4; x <= t1; x += 9) d += `M${x},${ay}L${x - 7},${ay + 8}`;
    I.path(gStatic, d, "siv thin");
    // the face before loading
    I.path(gStatic, `M${X(0)},${Y(0)}L${X(h)},${Y(0)}L${X(h)},${Y(h)}L${X(0)},${Y(h)}Z`, "");
    I.text(gStatic, X(0) - 6, Y(0) + 18, "*A*", { anchor: "end" });
    I.text(gStatic, X(h) + 4, Y(0) + 18, "*B*", { anchor: "start" });
    I.text(gStatic, X(0) - 6, Y(h) - 6, "*D*", { anchor: "end" });
    // the axes x and z, left of the face
    const ox = ax - 40, oz = ay - 26;
    I.arrow(gStatic, ox, oz, ox + 22, oz, "siv", 7);
    I.arrow(gStatic, ox, oz, ox, oz - 22, "siv", 7);
    I.text(gStatic, ox + 22, oz + 15, "*x*", { anchor: "middle", class: "siv", "font-size": 13 });
    I.text(gStatic, ox - 5, oz - 18, "*z*", { anchor: "end", class: "siv", "font-size": 13 });
    // the right panel: zero strain is the circle, the four named directions are thin grey lines
    I.text(gStatic, cx, G.top + 14, T.polar, { anchor: "middle", class: "siv", "font-size": 13 });
    I.el("circle", { cx, cy, r: R0, class: "siv dash" }, gStatic);
    const r1 = 1.65 * R0;
    const dirs = [[1, 0, "*AB*"], [1, 1, "*AC*"], [0, 1, "*AD*"], [-1, 1, "*BD*"]];
    for (const [ux, uz, lab] of dirs) {
      const n = Math.hypot(ux, uz), vx = ux / n, vz = uz / n;
      I.line(gStatic, cx - vx * r1, cy + vz * r1, cx + vx * r1, cy - vz * r1, "siv thin");
      const lx = cx + vx * (r1 + 13), ly = cy - vz * (r1 + 13) + 5;
      I.text(gStatic, lx, ly, lab, { anchor: ux > 0 && uz === 0 ? "start" : "middle", class: "siv", "font-size": 13 });
    }
    // label the circle just below it, right of the vertical line, where the curve stays on the circle
    I.text(gStatic, cx + 6, cy + R0 + 15, "*ε* = 0", { anchor: "start", class: "siv", "font-size": 13 });
  }

  // ---------- controls and readout ----------
  const ss = I.slider(I.div(root, "int-ctls"), { label: T.s, min: 0, max: 20, step: 1, value: st.s,
    fmt: (v) => `${I.fix(v, 0)} µm`, input: (v) => { st.s = v; draw(); } });
  ss.el.querySelector(".int-ctl-name").style.whiteSpace = "normal"; // the long name may wrap on a phone
  // The place of the end is read off the drawing and the vector in the table, so this slider shows no value.
  const ps = I.slider(I.div(root, "int-ctls"), { label: T.end, min: 0, max: 2 * h, step: 250, value: st.p,
    fmt: () => "", input: (v) => { st.p = v; draw(); } });
  ps.el.querySelector("output").style.display = "none";
  const ctl2 = I.div(root, "int-ctls");
  const presets = I.div(ctl2, "int-choice");
  for (const [lab, p] of [[T.horiz, 15000], [T.vert, 5000], [T.ac, 10000], [T.bd, 0]]) {
    I.button(presets, lab, () => ps.set(p));
  }
  const out = I.div(root, "int-out");

  // Drag either end: the direction from the centre to the pointer sets the fibre. A direction that points
  // to the bottom or the left edge is turned around, since the fibre runs through the centre both ways.
  function dragTo(pt) {
    let dx = ((pt.x - X(h / 2)) / G.S) * h, dz = -((pt.y - Y(h / 2)) / G.S) * h;
    if (dx === 0 && dz === 0) return;
    if (!(dz >= Math.abs(dx) || dx >= Math.abs(dz))) { dx = -dx; dz = -dz; }
    let p = dz >= Math.abs(dx) ? h / 2 + (h / 2) * (dx / dz) : 2 * h - (h / 2 + (h / 2) * (dz / dx));
    p = Math.round(p / 250) * 250;
    ps.set(p);
  }
  I.drag(s, hE, dragTo);
  I.drag(s, hE2, dragTo);

  function draw() {
    const k = st.s / h;
    const [ex, ez] = endOf(st.p);
    const fx = h - ex, fz = h - ez; // the other end, opposite through the centre
    const dx = ex - fx, dz = ez - fz;
    const { L0, L1, e } = strain(dx, dz, k);
    const sh = (z) => F * k * z; // drawn shift of a point at the height z

    gFace.replaceChildren();
    const c1 = [h + sh(h), h], d1 = [sh(h), h];
    I.path(gFace, `M${X(0)},${Y(0)}L${X(h)},${Y(0)}L${X(c1[0])},${Y(h)}L${X(d1[0])},${Y(h)}Z`, "nov thick");
    // C above C, and D1 and C1 above the shifted corners once they are far enough from D and C
    const far = X(d1[0]) - X(0) > 22;
    I.text(gFace, X(h), Y(h) - 8, "*C*", { anchor: "middle" });
    if (far) {
      I.text(gFace, X(d1[0]), Y(h) - 8, "*D*_{1}", { anchor: "middle", class: "nov" });
      I.text(gFace, X(c1[0]) + 6, Y(h) - 8, "*C*_{1}", { anchor: "start", class: "nov" });
    }
    // the fibre before loading and after it
    I.line(gFace, X(fx), Y(fz), X(ex), Y(ez), "thick");
    I.line(gFace, X(fx + sh(fz)), Y(fz), X(ex + sh(ez)), Y(ez), "nov thick");
    I.el("circle", { cx: X(h / 2), cy: Y(h / 2), r: 3, class: "fill nostroke" }, gFace);
    for (const [px, pz] of [[ex, ez], [fx, fz]]) {
      I.el("circle", { cx: X(px), cy: Y(pz), r: 6, class: "fill nostroke" }, gFace);
    }
    for (const [hc, px, pz] of [[hE, ex, ez], [hE2, fx, fz]]) {
      hc.setAttribute("cx", X(px));
      hc.setAttribute("cy", Y(pz));
    }

    // the right panel
    gPolar.replaceChildren();
    const { cx, cy, R0 } = G;
    let dp = "";
    for (let i = 0; i <= 240; i += 1) {
      const t = (2 * Math.PI * i) / 240, ux = Math.cos(t), uz = Math.sin(t);
      const r = R0 * (1 + K * strain(ux, uz, k).e);
      dp += `${i ? "L" : "M"}${(cx + r * ux).toFixed(2)},${(cy - r * uz).toFixed(2)}`;
    }
    I.path(gPolar, dp, "acc thick");
    // the direction of the chosen fibre, from the centre towards its end on the top or right edge
    const ux = dx / L0, uz = dz / L0, r1 = 1.65 * R0;
    I.line(gPolar, cx, cy, cx + ux * r1, cy - uz * r1, "");
    const rr = R0 * (1 + K * e);
    I.el("circle", { cx: cx + rr * ux, cy: cy - rr * uz, r: 5, class: "acc fill nostroke" }, gPolar);

    const row = (label, value) => `<tr><td>${I.html(label)}</td><td>${I.html(value)}</td></tr>`;
    const eps = Math.abs(e) < 1e-15 ? "0" : I.sci(e, 5);
    out.innerHTML = `<table><tbody>${
      row(T.vec, `(${whole(dx)}, 0, ${whole(dz)}) µm`)
      + row(T.L0, `${I.fix(L0, 3)} µm`)
      + row(T.L1, `${I.fix(L1, 3)} µm`)
      + row(T.eps, eps)
    }</tbody></table>`;
  }

  I.fit(root, s, 320, 680, (W) => layout(W), (W) => {
    layout(W);
    drawStatic();
    draw();
  });
});
