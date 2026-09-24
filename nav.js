const SUBJECT_COLOR = {
  "C-Cpp": "var(--c-cpp)",
  "DSA": "var(--c-dsa)",
  "Python": "var(--c-python)",
  "JavaScript": "var(--c-javascript)",
  "Golang": "var(--c-golang)",
  "Odin": "var(--c-odin)",
  "PostgreSQL": "var(--c-postgresql)",
  "Docker-CICD": "var(--c-docker)",
  "SystemDesign": "var(--c-sysdesign)",
  "AWS": "var(--c-aws)",
};

function renderNav(active) {
  const pages = [
    ["index.html", "Overview"],
    ["map.html", "Map"],
    ["advancements.html", "Advancements"],
    ["timeline.html", "Timeline"],
  ];
  const nav = document.createElement("nav");
  nav.innerHTML = pages
    .map(([href, label]) => `<a href="${href}"${href === active ? ' class="active"' : ""}>${label}</a>`)
    .join("");
  document.body.prepend(nav);
}

function loadProgress() {
  return fetch("progress.json").then((r) => r.json());
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
