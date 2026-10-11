// Interactive figure int-limita (ch-deformacija, end of sec-limita): the condition of the definition of
// the limit, def-limita, for g(h) = 5 - h at the point 0, the example worked in sec-limita. The reader
// sets the allowed error η, the band δ and the number d (5, the limit, or 5,01 or 5,001). Points of the
// graph with 0 < |h| < δ are blue dots when |g(h) - d| < η and orange crosses when not.
// The band works exactly when |d - 5| + δ ≤ η: the values (5 - h) - d with 0 < |h| < δ come arbitrarily
// close to |d - 5| + δ in size but never reach it. So for d = 5 the widest band is δ = η (step 4 of the
// example), and for d ≠ 5 no band works once η ≤ |d - 5| (lem-enolicnost-limite).
// The window reaches R = max(2η, 1,5δ) below and above d, and at d = 5 both axes have the same scale,
// so at d = 5 and δ = η the picture is the same for every η. For d ≠ 5 the vertical axis is squeezed so
// that the window also shows the values near 5.
BookInt.define("limita", (root, I) => {
  const T = I.pick({
    sl: {
      aria: "Graf funkcije g(h) = 5 − h z dovoljeno napako okoli d in pasom okoli nič",
      eta: "dovoljena napaka *η*", delta: "pas *δ*", proof: "*δ* = *η*",
      ok: "Pas ustreza: za vsak *h* z 0 < |*h*| < *δ* je vrednost *g*(*h*) znotraj dovoljene napake (modre pike).",
      bad: "Pas ne ustreza: nekatere točke z 0 < |*h*| < *δ* so zunaj dovoljene napake (oranžni križci).",
    },
    en: {
      aria: "The graph of g(h) = 5 − h with the allowed error around d and the band around zero",
      eta: "allowed error *η*", delta: "band *δ*", proof: "*δ* = *η*",
      ok: "The band works: for every *h* with 0 < |*h*| < *δ* the value *g*(*h*) is within the allowed error (blue dots).",
      bad: "The band fails: some points with 0 < |*h*| < *δ* are outside the allowed error (orange crosses).",
    },
  });
  // off = d - 5, so that g(h) - d = -h - off is computed without the 5 that would only cancel
  const st = { eta: 0.1, delta: 0.15, off: 0 };

  // ---------- drawing ----------
  const H = 262;
  const s = I.svg(root, 560, H, T.aria);
  const px0 = 54, py0 = 14, py1 = 234; // plot area, its right edge px1 follows the width
  let px1 = 545;
  const clip = I.uid("limita-clip");
  const clipRect = I.el("rect", { x: px0, y: py0, height: py1 - py0 }, I.el("clipPath", { id: clip }, I.el("defs", {}, s)));
  const plot = I.el("g", { "clip-path": `url(#${clip})` }, s);
  const marks = I.el("g", {}, s);

  // ---------- controls and verdict ----------
  // η in steps 1, 2, 5 times a power of ten, δ with two significant digits
  const snapEta = (v) => {
    const e = Math.floor(Math.log10(v) + 1e-9);
    const m = v / 10 ** e;
    const k = [1, 2, 5, 10].reduce((b, c) => (Math.abs(Math.log10(c / m)) < Math.abs(Math.log10(b / m)) ? c : b));
    return +(k * 10 ** e).toPrecision(1);
  };
  const ctl = I.div(root, "int-ctls");
  const etaS = I.slider(ctl, { label: T.eta, min: 1e-6, max: 1, log: true, value: st.eta, snap: snapEta,
    fmt: (v) => I.num(v, 2), input: (v) => { st.eta = v; draw(); } });
  const delS = I.slider(I.div(root, "int-ctls"), { label: T.delta, min: 1e-7, max: 2, log: true, value: st.delta,
    snap: (v) => +v.toPrecision(2), fmt: (v) => I.num(v, 2), input: (v) => { st.delta = v; draw(); } });
  const ctl2 = I.div(root, "int-ctls");
  I.button(ctl2, "*η* · 0,1", () => etaS.set(snapEta(st.eta / 10)));
  I.button(ctl2, "*η* · 10", () => etaS.set(snapEta(st.eta * 10)));
  I.button(ctl2, T.proof, () => delS.set(st.eta));
  I.choice(ctl2, [{ v: "0", label: "*d* = 5" }, { v: "0.01", label: "*d* = 5,01" }, { v: "0.001", label: "*d* = 5,001" }],
    "0", (v) => { st.off = +v; draw(); });
  const out = I.div(root, "int-out");

  function draw() {
    const { eta, delta, off } = st;
    // The window, in values v = g - 5. It reaches R = max(2η, 1,5δ) below and above d, and to the left
    // and right of zero as far as the same scale gives. For d ≠ 5 it also reaches down to 5, and the
    // vertical axis is squeezed (with a margin of 0,15 |d - 5|, so that d and 5 stay off the edges).
    const R = Math.max(2 * eta, 1.5 * delta), M = Math.max(R, 0.15 * Math.abs(off));
    const v0 = Math.min(0, off) - M, v1 = Math.max(0, off) + M;
    const kx = (py1 - py0) / (2 * R), ky = (py1 - py0) / (v1 - v0); // equal when d = 5
    const cx = (px0 + px1) / 2;
    const X = (h) => cx + kx * h, Y = (v) => py1 - ky * (v - v0);
    const hr = (px1 - px0) / (2 * kx);

    plot.replaceChildren();
    // the allowed error: values between d - η and d + η, at least 2 units tall so that it stays visible
    const yt = Y(off + eta), yb = Y(off - eta), ym = (yt + yb) / 2, hb = Math.max(2, yb - yt);
    I.el("rect", { x: px0, y: ym - hb / 2, width: px1 - px0, height: hb, class: "acc band" }, plot);
    I.line(plot, px0, ym - hb / 2, px1, ym - hb / 2, "acc dash thin");
    I.line(plot, px0, ym + hb / 2, px1, ym + hb / 2, "acc dash thin");
    I.line(plot, px0, Y(off), px1, Y(off), "siv dash thin");
    // the band around zero, -δ < h < δ, at least 2 units wide
    const wb = Math.max(1, kx * delta);
    I.el("rect", { x: cx - wb, y: py0, width: 2 * wb, height: py1 - py0, class: "siv band" }, plot);
    if (wb >= 3) {
      I.line(plot, cx - wb, py0, cx - wb, py1, "siv thin");
      I.line(plot, cx + wb, py0, cx + wb, py1, "siv thin");
    }
    // axes: h along the bottom, g through h = 0
    I.line(plot, cx, py0, cx, py1, "siv");
    // the graph g(h) = 5 - h, that is v = -h, across the window
    I.line(plot, X(-hr), Y(hr), X(hr), Y(-hr), "");

    marks.replaceChildren();
    I.line(marks, px0, py1, px1, py1, "siv");
    I.text(marks, px1, py1 + 19, "*h*", { anchor: "end", class: "siv" });
    I.text(marks, cx + 6, py0 + 13, "*g*", { class: "siv" });
    // the value at h = 0 does not count: an empty circle. Drawn before the checked points, which cover
    // it only when the band is narrower than the circle.
    I.el("circle", { cx, cy: Y(0), r: 4, class: "bg" }, marks);
    // checked points with 0 < |h| < δ: about one per 16 units, the last one at the edge of the band
    const n = Math.max(1, Math.min(10, Math.round(wb / 16)));
    for (const sg of [-1, 1]) {
      for (let j = 1; j <= n; j += 1) {
        const h = sg * delta * (j < n ? j / n : 1 - 1e-4);
        const x = X(h), y = Y(-h);
        if (y < py0 - 4 || y > py1 + 4) continue;
        if (Math.abs(h + off) < eta) I.el("circle", { cx: x, cy: y, r: 3.5, class: "acc fill" }, marks);
        else I.path(marks, `M${x - 4.5},${y - 4.5}L${x + 4.5},${y + 4.5}M${x - 4.5},${y + 4.5}L${x + 4.5},${y - 4.5}`, "nov")
          .setAttribute("stroke-width", 2.2);
      }
    }

    // labels: d ± η on the left, -δ, 0, δ under the axis
    const lab = (y, str) => I.text(marks, px0 - 7, y + 5, str, { anchor: "end", "font-size": 14 });
    const both = hb >= 36;
    if (both) { lab(yt, "*d* + *η*"); lab(yb, "*d* − *η*"); }
    lab(Y(off), "*d*");
    if (off !== 0 && Math.abs(Y(0) - Y(off)) >= 18 && (!both || Math.min(Math.abs(Y(0) - yt), Math.abs(Y(0) - yb)) >= 16)) lab(Y(0), "5");
    const blab = (x, str) => I.text(marks, x, py1 + 19, str, { anchor: "middle", "font-size": 14 });
    blab(cx, "0");
    if (wb >= 20) { blab(cx - wb, "−*δ*"); blab(cx + wb, "*δ*"); }

    const works = Math.abs(off) + delta <= eta * (1 + 1e-9);
    out.innerHTML = works ? `<p>${I.html(T.ok)}</p>` : `<p class="bad">${I.html(T.bad)}</p>`;
  }
  I.fit(root, s, 320, 560, () => H, (W) => {
    px1 = W - 12;
    clipRect.setAttribute("width", px1 - px0);
    draw();
  });
});
