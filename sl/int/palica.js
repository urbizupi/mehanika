// Interactive figure int-palica (ch-deformacija, sec-raztezek-palice): bars of the same steel and the
// same cross section, held at a wall and pulled by the same force, for lengths L from 0,5 m to 4 m.
// The force is the one that stretches the 2 m bar by 1 mm (the example of the section), so the strain
// is 0,001 m / 2 m = 0,0005 for every length and the elongation is 0,0005 L. Marks every metre.
// Elongations drawn EX times larger.
BookInt.define("palica", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Palica pred obremenitvijo in po njej, z oznakami na vsak meter, dolžino L in raztezkom ΔL",
      len: "dolžina *L*",
      dL: "raztezek Δ*L*",
      eps: "deformacija *ε* = Δ*L* / *L*",
      per: "raztezek vsakega metra",
    },
    en: {
      aria: "A bar before and after loading, with marks every metre, the length L and the elongation ΔL",
      len: "length *L*",
      dL: "elongation Δ*L*",
      eps: "strain *ε* = Δ*L* / *L*",
      per: "elongation of every metre",
    },
  });
  const EPS = 0.001 / 2; // the 2 m bar stretches by 1 mm
  const EX = 400; // elongations drawn 400 times larger
  const LMAX = 4;
  const st = { L: 1 };

  const H = 176;
  const s = I.svg(root, 560, H, T.aria);
  const g = I.el("g", {}, s);
  const x0 = 30, bh = 14, y1 = 26, y2 = 76, yd = 112; // wall, bar thickness, the two bars, dimension row
  let k = 60; // pixels per metre, from the width

  const ctl = I.div(root, "int-ctls");
  I.slider(ctl, { label: "*L*", min: 0.5, max: LMAX, step: 0.5, value: st.L,
    fmt: (v) => `${I.num(v, 3)} m`, input: (v) => { st.L = v; draw(); } });
  const out = I.div(root, "int-out");

  function draw() {
    const { L } = st;
    const dL = EPS * L; // m
    const a0 = L * k, a1 = L * k * (1 + EX * EPS); // drawn lengths before and after
    g.replaceChildren();

    // the wall that holds the left ends
    I.line(g, x0, y1 - 12, x0, y2 + bh + 12, "thick");
    for (let y = y1 - 8; y <= y2 + bh + 12; y += 8) I.line(g, x0 - 9, y + 7, x0 - 1, y - 1, "thin");

    // before loading, marks every metre
    I.el("rect", { x: x0, y: y1, width: a0, height: bh }, g);
    for (let m = 1; m < L - 1e-9; m += 1) I.line(g, x0 + m * k, y1, x0 + m * k, y1 + bh);
    // after loading (orange), every metre longer by the same amount, pulled at the right end
    I.el("rect", { x: x0, y: y2, width: a1, height: bh, class: "nov" }, g);
    for (let m = 1; m < L - 1e-9; m += 1) {
      const x = x0 + m * k * (1 + EX * EPS);
      I.line(g, x, y2, x, y2 + bh, "nov");
    }
    I.arrow(g, x0 + a1 + 2, y2 + bh / 2, x0 + a1 + 38, y2 + bh / 2, "nov");
    // the right end before loading
    I.line(g, x0 + a0, y1 + bh, x0 + a0, yd + 6, "siv thin dash");

    // L (grey) and ΔL (blue) side by side, as parts of the new length
    I.dist(g, x0, yd, x0 + a0, yd, "siv");
    I.dist(g, x0 + a0, yd, x0 + a1, yd, "acc");
    const tL = I.text(g, x0 + a0 / 2, yd + 21, `*L* = ${I.num(L, 3)} m`, { anchor: "middle", class: "siv" });
    const cx = x0 + (a0 + a1) / 2;
    const tD = I.text(g, cx, yd + 21, `Δ*L* = ${I.num(1000 * dL, 3)} mm`, { anchor: "middle", class: "acc" });
    // keep the ΔL label inside the figure and off the L label: a row lower if they would touch
    const bL = tL.getBBox(), bD = tD.getBBox();
    const W = +s.getAttribute("viewBox").split(" ")[2];
    let x = Math.min(cx, W - 4 - bD.width / 2);
    if (x - bD.width / 2 < bL.x + bL.width + 10) {
      tD.setAttribute("y", yd + 41);
      x = Math.max(x, 4 + bD.width / 2);
    }
    tD.setAttribute("x", x);

    const row = (label, value) => `<tr><td>${I.html(label)}</td><td>${I.html(value)}</td></tr>`;
    out.innerHTML = `<table><tbody>${
      row(T.len, `${I.num(L, 3)} m`)
      + row(T.dL, `${I.num(1000 * dL, 3)} mm`)
      + row(T.eps, `${I.num(dL, 3)} m / ${I.num(L, 3)} m = ${I.num(EPS, 2)}`)
      + row(T.per, `${I.num(1000 * EPS, 3)} mm`)
    }</tbody></table>`;
  }
  I.fit(root, s, 320, 560, () => H, (W) => {
    k = Math.min(100, (W - x0 - 50) / (LMAX * (1 + EX * EPS)));
    draw();
  });
});
