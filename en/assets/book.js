// Knowls: a click on a cross-reference opens the target in place, below the
// paragraph that holds the link. A second click closes it. Ctrl or Cmd click
// follows the link instead. Knowl content comes from knowls.js.
(() => {
  const HOSTS = "p, li, .eq, td, th, figcaption, summary, h1, h2, h3, .blk-head";

  document.addEventListener("click", (ev) => {
    const a = ev.target.closest("a.xref[data-knowl]");
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
    const k = (window.KNOWLS || {})[a.dataset.knowl];
    if (!k) return;
    ev.preventDefault();

    if (a._knowl) {
      a._knowl.remove();
      a._knowl = null;
      a.classList.remove("open");
      return;
    }

    const box = document.createElement("div");
    box.className = "knowl";
    box.innerHTML = k.html;
    const foot = document.createElement("div");
    foot.className = "knowl-foot";
    const link = document.createElement("a");
    link.href = k.href;
    link.textContent = window.KNOWL_IN_CONTEXT || "→";
    foot.appendChild(link);
    box.appendChild(foot);

    // Several knowls opened from one paragraph stack in click order.
    const host = a.closest(HOSTS) || a.parentElement;
    let after = host;
    while (after.nextElementSibling && after.nextElementSibling._host === host) {
      after = after.nextElementSibling;
    }
    box._host = host;
    after.after(box);
    a._knowl = box;
    a.classList.add("open");
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]);
  });

  // Toolbar: open or close every born-hidden block on the page.
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-details]");
    if (!b) return;
    const open = b.dataset.details === "open";
    document.querySelectorAll("main details.hid").forEach((d) => { d.open = open; });
  });

  // Theme button: switch between light and dark. The choice is kept in localStorage and applied
  // before the page is drawn by a short script in the page head. Without a choice the system setting holds.
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest("button.theme-toggle")) return;
    const root = document.documentElement;
    const dark = root.dataset.theme ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* private mode: not kept */ }
  });
})();
