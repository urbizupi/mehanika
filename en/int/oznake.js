// Interactive figure int-oznake (ch-deformacija, sec-neenakomerni-raztezek): marks every metre on a
// steel bar of L = 10 m, before loading and after, either pulled by a force at its lower end (its weight
// left out, as in fig-oznake-palice) or hanging under its own weight. One piece between two marks is
// cut out with its forces to scale. Forces in units of W, the weight of the steel bar.
// Own weight W: u(x) = a (2 L x - x^2), a = 1,952e-7 1/m, u(L) = 1,952e-5 m (the book's numbers).
// Force f W at the end (0 to W): f = 1/2 gives the same total elongation, so u(x) = f 2 a L x.
// Pulls on piece k (1 at the top): hanging (11 - k)/10 W from above, (10 - k)/10 W from below, its
// weight W/10. Elongations drawn EX = 200 000 times larger (as in the static figure).
BookInt.define("oznake", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Palica z oznakami pred obremenitvijo in po njej ter izrezan košček s silami nanj",
      modeF: "sila na koncu", modeW: "lastna teža",
      force: "sila na koncu", piece: "košček", nth: (k) => `${k}. od vrha`,
      above: "vlek od zgoraj", below: "vlek od spodaj", own: "teža",
      dL: "raztezek palice Δ*L*", avg: "povprečje Δ*L* / *L*", eps: "deformacija izbranega koščka",
      ownP: "teža koščka",
    },
    en: {
      aria: "A bar with marks before and after loading, and a piece cut out with the forces on it",
      modeF: "force at the end", modeW: "own weight",
      force: "force at the end", piece: "piece",
      nth: (k) => `${k}${k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"} from the top`,
      above: "pull from above", below: "pull from below", own: "weight",
      dL: "elongation of the bar Δ*L*", avg: "average Δ*L* / *L*", eps: "strain of the chosen piece",
      ownP: "weight of the piece",
    },
  });
  const L = 10, N = 10; // m, pieces of 1 m
  const a = 1.952e-7; // 1/m
  const EX = 2e5; // elongations drawn 200 000 times larger
  const st = { mode: "F", f: 0.5, k: 3 };
  // the displacement of the mark at distance x from the ceiling, in m
  const u = (x) => (st.mode === "W" ? a * (2 * L * x - x * x) : st.f * 2 * a * L * x);
  // pulls on piece k from above and from below, and its weight, in units of W
  const pulls = (k) => (st.mode === "W"
    ? [(N + 1 - k) / N, (N - k) / N, 1 / N]
    : [st.f, st.f, 0]);

  // ---------- drawing ----------
  const H = 376;
  const y0 = 34, H0 = 150, bw = 18; // ceiling, the bar before loading, bar width
  const S = 66; // pixels per W
  const s = I.svg(root, 560, H, T.aria);
  const g = I.el("g", {}, s);
  let W = 560;
  const geo = {};
  const yb = (x) => y0 + (x + EX * u(x)) * (H0 / L); // the mark at x after loading

  // ---------- controls and readout ----------
  const ctl = I.div(root, "int-ctls");
  I.choice(ctl, [{ v: "F", label: T.modeF }, { v: "W", label: T.modeW }], st.mode, (v) => { st.mode = v; show(); draw(); });
  const ctl2 = I.div(root, "int-ctls");
  const fs = I.slider(ctl2, { label: T.force, min: 0, max: 1, step: 0.05, value: st.f,
    fmt: (v) => `${I.fix(v, 2)} *W*`, input: (v) => { st.f = v; draw(); } });
  const ks = I.slider(I.div(root, "int-ctls"), { label: T.piece, min: 1, max: N, step: 1, value: st.k,
    fmt: (v) => T.nth(v), input: (v) => { st.k = v; draw(); } });
  const out = I.div(root, "int-out");
  // the hanging bar always has its own weight W, so only the force has a slider
  function show() {
    fs.el.style.display = st.mode === "F" ? "" : "none";
  }
  show();

  // pick a piece by clicking, tapping or dragging along either bar
  const hitA = I.el("rect", { class: "hit" }, s);
  const hitB = I.el("rect", { class: "hit" }, s);
  const pickA = (p) => ks.set(Math.min(N, Math.max(1, Math.ceil(((p.y - y0) / H0) * N))));
  const pickB = (p) => {
    let k = 1;
    while (k < N && p.y > yb(k)) k += 1;
    ks.set(k);
  };
  I.drag(s, hitA, pickA);
  I.drag(s, hitB, pickB);

  function draw() {
    const { xa, xb, xc } = geo;
    const k = st.k;
    const yEnd = yb(L), dLpx = yEnd - (y0 + H0);
    g.replaceChildren();

    // the ceiling
    I.line(g, xa - 12, y0, xb + bw + 16, y0, "thick");
    for (let x = xa - 10; x <= xb + bw + 16; x += 7) I.line(g, x, y0 - 1, x + 7, y0 - 8, "thin");

    // before loading: marks at equal distances, the chosen piece shaded grey
    I.el("rect", { x: xa, y: y0 + ((k - 1) * H0) / N, width: bw, height: H0 / N, class: "siv band", style: "fill-opacity: .3" }, g);
    I.el("rect", { x: xa, y: y0, width: bw, height: H0 }, g);
    for (let m = 1; m < N; m += 1) I.line(g, xa, y0 + (m * H0) / N, xa + bw, y0 + (m * H0) / N);

    // after loading (orange), the chosen piece shaded orange
    I.el("rect", { x: xb, y: yb(k - 1), width: bw, height: yb(k) - yb(k - 1), class: "nov band", style: "fill-opacity: .3" }, g);
    I.el("rect", { x: xb, y: y0, width: bw, height: yEnd - y0, class: "nov" }, g);
    for (let m = 1; m < N; m += 1) I.line(g, xb, yb(m), xb + bw, yb(m), "nov");

    // the loads: the force at the lower end, or the equal weights of the pieces (to scale)
    if (st.mode === "F") {
      const len = st.f * S;
      if (len > 1) I.arrow(g, xb + bw / 2, yEnd, xb + bw / 2, yEnd + len, "nov", Math.min(9, 0.7 * len));
    } else {
      const wl = S / N;
      if (wl > 1) {
        for (let m = 1; m <= N; m += 1) {
          const yc = (yb(m - 1) + yb(m)) / 2;
          I.arrow(g, xb + bw + 9, yc - wl / 2, xb + bw + 9, yc + wl / 2, "nov thin", Math.min(5, 0.6 * wl));
        }
      }
    }

    // the lower end before loading and the elongation of the bar
    I.line(g, xa + bw, y0 + H0, xb, y0 + H0, "siv thin dash");
    if (dLpx > 2) {
      I.dist(g, xb - 12, y0 + H0, xb - 12, yEnd, "acc", 4);
      I.text(g, xb - 18, y0 + H0 + dLpx / 2 + 5, "Δ*L*", { anchor: "end", class: "acc" });
    }

    // the cut-out piece, at the height of the piece unless its arrows would leave the figure
    const [up, down, own] = pulls(k).map((v) => v * S);
    const hp = yb(k) - yb(k - 1);
    const yt = Math.max(14 + up, Math.min(yb(k - 1), H - 14 - hp - down));
    const cx = xc + bw / 2;
    I.line(g, xb + bw + 17, yb(k - 1), xc - 3, yt, "siv thin");
    I.line(g, xb + bw + 17, yb(k), xc - 3, yt + hp, "siv thin");
    I.el("rect", { x: xc, y: yt, width: bw, height: hp, class: "nov band", style: "fill-opacity: .3" }, g);
    I.el("rect", { x: xc, y: yt, width: bw, height: hp, class: "nov" }, g);
    const lx = xc + bw + 8;
    if (up > 1) {
      I.arrow(g, cx, yt, cx, yt - up, "nov", Math.min(9, 0.7 * up));
      I.text(g, lx, yt - Math.max(up / 2, 9) + 4, T.above, { class: "nov", "font-size": 13 });
    }
    if (down > 1) {
      I.arrow(g, cx, yt + hp, cx, yt + hp + down, "nov", Math.min(9, 0.7 * down));
      I.text(g, lx, yt + hp + Math.max(down / 2, 9) + 4, T.below, { class: "nov", "font-size": 13 });
    }
    if (own > 1) {
      I.arrow(g, cx, yt + hp / 2 - own / 2, cx, yt + hp / 2 + own / 2, "nov thin", Math.min(5, 0.6 * own));
      I.text(g, lx, yt + hp / 2 + 4, T.own, { class: "nov", "font-size": 13 });
    }

    // click targets over either bar (after g in the svg, so on top)
    const set = (r, x, y, w, h) => { r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", w); r.setAttribute("height", h); };
    set(hitA, xa - 10, y0, bw + 20, H0);
    set(hitB, xb - 6, y0, bw + 22, yEnd - y0);

    const [pa, pb, pw] = pulls(k);
    const dL = u(L);
    const row = (label, value) => `<tr><td>${I.html(label)}</td><td>${I.html(value)}</td></tr>`;
    const F = (v) => `${I.fix(v, 2)} *W*`;
    out.innerHTML = `<table><tbody>${
      row(T.dL, `${I.sci(dL, 4)} m`)
      + row(T.avg, I.sci(dL / L, 4))
      + row(T.eps, I.sci(u(k) - u(k - 1), 4))
      + row(T.above, F(pa))
      + row(T.below, F(pb))
      + (st.mode === "W" ? row(T.ownP, F(pw)) : "")
    }</tbody></table>`;
  }
  I.fit(root, s, 320, 560, () => H, (w) => {
    W = w;
    const off = Math.max(0, (W - 360) / 2); // centre the drawing in a wide figure
    geo.xa = off + 34;
    geo.xb = off + 114;
    geo.xc = off + Math.min(230, W - 2 * off - 128);
    draw();
  });
});
