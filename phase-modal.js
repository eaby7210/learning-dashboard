// Click anything with data-subject + data-phase → modal with that phase's full syllabus
// section (syllabus.json, written by scripts/syllabus_json.py via refresh_dashboard.py).
(function () {
  let data = null, el = null, cur = null;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,;:]|$)/g, "$1<i>$2</i>")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => `<u>${b || a}</u>`)
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Minimal markdown: bullets nested by indent, paragraphs, ### headings, blockquotes.
  function md(src) {
    const out = [], stack = []; // stack of indents of open <ul>
    const closeTo = (ind) => { while (stack.length && stack[stack.length - 1] >= ind) { out.push("</li></ul>"); stack.pop(); } };
    for (const raw of src.split("\n")) {
      const li = raw.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (li) {
        const ind = li[1].length;
        if (!stack.length || ind > stack[stack.length - 1]) { out.push("<ul>"); stack.push(ind); }
        else { closeTo(ind + 1); out.push("</li>"); }
        out.push("<li>" + inline(li[3]));
      } else if (!raw.trim()) { closeTo(0); }
      else if (stack.length && /^\s+/.test(raw)) { out.push(" " + inline(raw.trim())); }
      else {
        closeTo(0);
        const h = raw.match(/^#{3,6}\s+(.*)/);
        out.push(h ? `<h4>${inline(h[1])}</h4>` : raw.startsWith(">") ? `<blockquote>${inline(raw.slice(1).trim())}</blockquote>` : `<p>${inline(raw)}</p>`);
      }
    }
    closeTo(0);
    return out.join("");
  }

  function build() {
    el = document.createElement("div");
    el.className = "pm-overlay";
    el.hidden = true;
    el.innerHTML = `<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pm-title">
      <div class="pm-head"><h2 id="pm-title"></h2><button class="pm-x" aria-label="Close">×</button></div>
      <div class="pm-body"></div>
      <div class="pm-foot"><button class="pm-prev">‹ Prev phase</button><span class="pm-pos"></span><button class="pm-next">Next phase ›</button></div>
    </div>`;
    document.body.appendChild(el);
    el.addEventListener("click", (e) => { if (e.target === el || e.target.closest(".pm-x")) close(); });
    el.querySelector(".pm-prev").onclick = () => step(-1);
    el.querySelector(".pm-next").onclick = () => step(1);
    document.addEventListener("keydown", (e) => {
      if (el.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  function close() { el.hidden = true; document.body.style.overflow = ""; if (cur && cur.opener) cur.opener.focus(); }

  function nums(subject) { return Object.keys(data[subject] || {}).map(Number).sort((a, b) => a - b); }
  function step(d) {
    const n = nums(cur.subject), i = n.indexOf(+cur.phase) + d;
    if (i >= 0 && i < n.length) render(cur.subject, n[i]);
  }

  function render(subject, phase, end) {
    const ph = (data[subject] || {})[phase];
    cur = { subject, phase, opener: cur && cur.opener };
    const n = nums(subject), i = n.indexOf(+phase);
    const range = +end > +phase ? n.filter((p) => p >= +phase && p <= +end) : null; // group node on the map
    el.querySelector(".pm").style.setProperty("--pm-color", (typeof SUBJECT_COLOR !== "undefined" && SUBJECT_COLOR[subject]) || "var(--accent)");
    el.querySelector(".pm-foot").hidden = !!range;
    if (range) {
      el.querySelector("#pm-title").textContent = `${subject} · Phases ${phase}–${end}`;
      el.querySelector(".pm-body").innerHTML = range.length
        ? range.map((p) => `<h3>Phase ${p} — ${esc(data[subject][p].title)}</h3>` + md(data[subject][p].md)).join("")
        : `<p class="muted">No syllabus section found for these phases.</p>`;
      el.querySelector(".pm-body").scrollTop = 0;
      return;
    }
    el.querySelector("#pm-title").textContent = `${subject} · Phase ${phase}` + (ph ? ` — ${ph.title}` : "");
    el.querySelector(".pm-body").innerHTML = ph ? md(ph.md) : `<p class="muted">No syllabus section found for this phase.</p>`;
    el.querySelector(".pm-body").scrollTop = 0;
    el.querySelector(".pm-prev").disabled = i <= 0;
    el.querySelector(".pm-next").disabled = i < 0 || i >= n.length - 1;
    el.querySelector(".pm-pos").textContent = i >= 0 ? `${i + 1} / ${n.length}` : "";
  }

  function open(subject, phase, opener, end) {
    if (!el) build();
    const go = () => { cur = { opener }; render(subject, phase, end); el.hidden = false; document.body.style.overflow = "hidden"; el.querySelector(".pm-x").focus(); };
    if (data) return go();
    fetch("syllabus.json").then((r) => r.json()).then((d) => { data = d; go(); })
      .catch(() => { data = {}; go(); });
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-subject][data-phase]");
    if (!t || e.target.closest("a")) return;
    e.stopPropagation();
    open(t.dataset.subject, t.dataset.phase, t, t.dataset.phaseEnd);
  }, true);
  document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-subject][data-phase][tabindex]")) { e.preventDefault(); e.target.click(); }
  });
  window.openPhaseModal = open;
})();
