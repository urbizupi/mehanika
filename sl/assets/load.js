// Loading bar (#loadbar at the top of the window): shows how far the page has got. Typesetting the
// formulas takes most of the time, so MathJax does not typeset the page at once but in portions from
// the top. The text at the top is ready first and the bar grows with each portion. Runs after
// config.js and before MathJax.
(() => {
  const PORTION = 150; // formulas per portion, about
  let at = 0;
  const set = (f, end) => {
    const b = document.getElementById("loadbar");
    if (!b || f < at) return;
    at = f;
    b.style.transform = `scaleX(${f})`;
    if (end) b.classList.add("done");
  };

  window.MathJax = window.MathJax || {};
  MathJax.startup = {
    ...MathJax.startup,
    typeset: false,
    // MathJax.startup.promise resolves only after this, so knowls and the figure panel are typeset after the page.
    pageReady: async () => {
      await MathJax.startup.defaultPageReady();
      const main = document.querySelector("main");
      const groups = [];
      let cur = [];
      let n = 0;
      for (const el of main ? main.children : []) {
        cur.push(el);
        n += (el.textContent.match(/\\[([]/g) || []).length;
        if (n >= PORTION) {
          groups.push(cur);
          cur = [];
          n = 0;
        }
      }
      if (cur.length) groups.push(cur);
      for (let i = 0; i < groups.length; i++) {
        try {
          await MathJax.typesetPromise(groups[i]);
        } catch (e) {
          console.error(e);
        }
        set(0.2 + (0.8 * (i + 1)) / groups.length);
        await new Promise((r) => setTimeout(r)); // let the browser draw the typeset portion
      }
      set(1, true);
    },
  };

  document.addEventListener("DOMContentLoaded", () => set(0.2));
  // Without MathJax (no connection to the CDN) the bar goes away when the page has loaded.
  addEventListener("load", () => { if (!MathJax.version) set(1, true); });
})();
