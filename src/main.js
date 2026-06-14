// =============================================================================
//  main.js  —  scrolling walks the figure through every stage. Story stages
//  (intro/approach/contact) show a bottom-left panel; section stops
//  (Capabilities/Work/Experience/FAQ) are platforms you CLICK to open a modal,
//  then close to keep walking.
// =============================================================================
import "./style.css";
import Lenis from "lenis";
import { World } from "./world.js";
import { PROFILE, APPROACH, CAPABILITIES, PROJECTS, EXPERIENCE, FAQ, ALL_REPOS } from "./data.js";

const $ = (s, r = document) => r.querySelector(s);
let REPOS = ALL_REPOS;

const ICONS = {
  agent: '<path d="M12 3v3M5 8h14v9H5zM9 12h.01M15 12h.01M9 21h6"/>',
  rag: '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"/>',
  eval: '<path d="M4 18l5-6 4 4 7-9M3 21h18"/>',
  arch: '<path d="M3 21h18M5 21V9l7-5 7 5v12M10 21v-6h4v6"/>',
  spark: '<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',
};

async function loadRepos() {
  try {
    const res = await fetch("https://api.github.com/users/arkapatra31/repos?per_page=100&sort=updated", { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const live = data.filter((r) => !r.fork && r.name !== "arkapatra31")
      .map((r) => ({ name: r.name, url: r.html_url, stars: r.stargazers_count }))
      .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
    if (live.length) REPOS = live;
  } catch { /* fallback */ }
}

// ---- the stops ----
// story stops render a bottom-left panel; modal stops render into the modal.
function stops() {
  const stage = (s) => `<span class="p-num">${s.n}</span><h2>${s.title}</h2><p>${s.body}</p>`;
  return [
    { id: "intro", label: "Intro", html: () => `<div class="kicker">${PROFILE.eyebrow}</div><h1 class="p-big">ARKA<br>PATRA</h1><p>${PROFILE.title} — ${PROFILE.heroSub}</p>` },
    { id: "understand", label: "Understand", html: () => stage(APPROACH[0]) },
    { id: "architect", label: "Architect", html: () => stage(APPROACH[1]) },
    { id: "build", label: "Build", html: () => stage(APPROACH[2]) },
    { id: "ship", label: "Ship", html: () => stage(APPROACH[3]) },
    {
      id: "capabilities", label: "Capabilities", modal: true, modalHtml: () => `
        <div class="kicker">/ Capabilities</div><h2>What I bring to a build.</h2>
        <ul class="cap-list">${CAPABILITIES.map((c) => `<li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[c.icon] || ""}</svg>
          <div><b>${c.title}</b><span>${c.body}</span></div></li>`).join("")}</ul>` },
    {
      id: "work", label: "Work", modal: true, modalHtml: () => `
        <div class="kicker">/ Selected work · ${REPOS.length} repos</div><h2>Things I've shipped &amp; built.</h2>
        <div class="mini-cards">${PROJECTS.map((p) => `<a class="mini-card" href="${p.url}" target="_blank" rel="noopener"><b>${p.name} ↗</b><span>${p.tag}</span><em>${p.desc}</em></a>`).join("")}</div>
        <a class="all-link" href="${PROFILE.links.github}" target="_blank" rel="noopener">All ${REPOS.length} repositories on GitHub ↗</a>` },
    {
      id: "experience", label: "Experience", modal: true, modalHtml: () => `
        <div class="kicker">/ Experience · 7+ years</div><h2>Seven years, three stops.</h2>
        <div class="xp-list">${EXPERIENCE.map((e) => `<div class="xp-row"><div class="xp-top"><b>${e.company}</b><span>${e.period}</span></div><div class="xp-role">${e.role}</div><p>${e.line}</p></div>`).join("")}</div>` },
    {
      id: "faq", label: "FAQ", modal: true, modalHtml: () => `
        <div class="kicker">/ FAQ</div><h2>The usual questions.</h2>
        <div class="faq">${FAQ.map((f) => `<div class="faq-item"><button class="faq-q" aria-expanded="false"><span>${f.q}</span><svg viewBox="0 0 24 24" class="faq-chev" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9l6 6 6-6"/></svg></button><div class="faq-a"><p>${f.a}</p></div></div>`).join("")}</div>` },
    {
      id: "contact", label: "Contact", html: () => `
        <div class="kicker">/ Let's build</div>
        <a class="p-mail" href="mailto:${PROFILE.links.email}">${PROFILE.links.email}</a>
        <div class="p-links"><a href="${PROFILE.links.github}" target="_blank" rel="noopener">GitHub ↗</a><a href="${PROFILE.links.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a></div>
        <p class="p-quote">“${PROFILE.philosophy}”</p>` },
  ];
}

const STOPS = stops();
let activeStop = -1;
let modalOpen = false;
let lenis;

function buildPanels() {
  const wrap = $("#panels");
  STOPS.forEach((s, i) => {
    if (s.modal) return; // modal stops have no bottom-left panel
    const el = document.createElement("div");
    el.className = `j-panel ${s.id}`;
    el.dataset.i = i;
    el.innerHTML = s.html();
    wrap.appendChild(el);
  });
}

function buildDots(runway) {
  const dots = $("#dots");
  STOPS.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "dot"; b.title = s.label; b.dataset.i = i;
    b.addEventListener("click", () => lenis.scrollTo((i / (STOPS.length - 1)) * runway()));
    dots.appendChild(b);
  });
}

function renderStop(i) {
  if (i === activeStop) return;
  if (modalOpen) closeModal();
  activeStop = i;
  document.querySelectorAll(".j-panel").forEach((p) => p.classList.toggle("active", +p.dataset.i === i));
  document.querySelectorAll(".dot").forEach((d, k) => d.classList.toggle("on", k === i));
}

// ---- modal ----
function openModal(i) {
  const s = STOPS[i];
  if (!s || !s.modal) return;
  const body = $(".modal-body");
  body.innerHTML = s.modalHtml();
  body.querySelectorAll(".faq-q").forEach((btn) => btn.addEventListener("click", () => {
    const item = btn.parentElement, open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    const panel = item.querySelector(".faq-a");
    panel.style.maxHeight = open ? `${panel.scrollHeight + 8}px` : "0px";
  }));
  $("#modal").classList.add("show");
  modalOpen = true;
  lenis.stop(); // can't move forward until the modal is closed
}
function closeModal() {
  $("#modal").classList.remove("show");
  modalOpen = false;
  lenis.start();
}

// "Get in touch" — a small modal of contact options (not tied to a stop)
function openContactModal() {
  const L = PROFILE.links;
  $(".modal-body").innerHTML = `
    <div class="kicker">/ Get in touch</div><h2>Let's build something.</h2>
    <div class="contact-options">
      <a class="contact-option" href="${L.github}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.6 5.6.6 11.9c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 5 18.3 5.3 18.3 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.5-1.5 7.8-5.8 7.8-10.8C23.4 5.6 18.3.5 12 .5z"/></svg>
        <div><b>GitHub</b><span>github.com/arkapatra31</span></div></a>
      <a class="contact-option" href="${L.linkedin}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6h.1c.5-.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.4H3.5V9h3.6v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>
        <div><b>LinkedIn</b><span>in/arkapatra31</span></div></a>
      <a class="contact-option" href="mailto:${L.email}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
        <div><b>Email</b><span>${L.email}</span></div></a>
    </div>`;
  $("#modal").classList.add("show");
  modalOpen = true;
  lenis.stop();
}

async function boot() {
  $("#year").textContent = "2026";
  await loadRepos();
  buildPanels();

  const world = new World($("#world"));
  const space = $("#journey-space");
  space.style.height = `${world.stopCount * 100}vh`;
  const runway = () => Math.max(1, space.offsetHeight - innerHeight);

  lenis = new Lenis({ smoothWheel: true, lerp: 0.085, wheelMultiplier: 0.9 });
  buildDots(runway);

  const navMap = { capabilities: 5, work: 6, experience: 7, faq: 8 };
  document.querySelectorAll("[data-nav]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const id = a.dataset.nav;
    lenis.scrollTo(id === "top" ? 0 : (navMap[id] / (STOPS.length - 1)) * runway());
  }));

  // open the modal by clicking the chip, the platform (canvas), or the dot label
  $("#get-in-touch").addEventListener("click", openContactModal);
  const chip = $("#open-chip");
  chip.addEventListener("click", () => openModal(activeStop));
  $("#world").addEventListener("click", () => { if (STOPS[activeStop]?.modal && !modalOpen) openModal(activeStop); });
  $(".modal-close").addEventListener("click", closeModal);
  $(".modal-backdrop").addEventListener("click", closeModal);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && modalOpen) closeModal(); });

  const nav = $("#nav");
  function frame(time) {
    lenis.raf(time);
    world.setProgress(Math.min(1, scrollY / runway()));
    world.update();
    renderStop(world.activeStop());
    nav.classList.toggle("scrolled", scrollY > 40);

    // float the "click to open" chip over the active platform
    const s = STOPS[activeStop];
    if (s?.modal && !modalOpen && world.platformAnchors[activeStop]) {
      const pr = world.project(world.platformAnchors[activeStop]);
      if (pr.visible) {
        chip.style.display = "flex";
        chip.style.left = `${pr.x}px`;
        chip.style.top = `${pr.y}px`;
        chip.innerHTML = `<span>${s.label}</span><em>click to open</em>`;
      } else chip.style.display = "none";
    } else chip.style.display = "none";

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  renderStop(0);
}

boot();
