/* ===== Voz de Potrero — script.js ===== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hero = document.querySelector("[data-hero], .hero");
  var header = document.getElementById("site-header");

  /* ---------- Header: fondo sólido al desplazarse ---------- */
  function onScroll() { header.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil accesible ---------- */
  var btn = document.getElementById("menu-btn");
  var nav = document.getElementById("main-nav");
  var mobile = window.matchMedia("(max-width: 700px)");

  function setMenu(open, returnFocus) {
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    else if (returnFocus) btn.focus();
  }
  btn.addEventListener("click", function () { setMenu(btn.getAttribute("aria-expanded") !== "true", true); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a") && mobile.matches) setMenu(false, false); });
  document.addEventListener("keydown", function (e) {
    var open = btn.getAttribute("aria-expanded") === "true";
    if (!open) return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key === "Tab") { /* trampa de foco dentro del menú modal */
      var items = [btn].concat([].slice.call(nav.querySelectorAll("a")));
      var i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  mobile.addEventListener("change", function () { if (!mobile.matches) setMenu(false, false); });

  /* ---------- Paralaje de profundidad (solo puntero fino, solo con el hero visible) ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = null, visible = true;

  function frame() {
    cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
    hero.style.setProperty("--mx", cx.toFixed(3));
    hero.style.setProperty("--my", cy.toFixed(3));
    raf = (visible && (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001)) ? requestAnimationFrame(frame) : null;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(hero);
  }
  hero.addEventListener("pointermove", function (e) {
    if (reduceMotion.matches || !fine.matches) return;
    var r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    kick();
  }, { passive: true });
  hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; kick(); });

  /* ---------- Lista provisoria de los diez contenidos (se reemplaza en la sección audiovisual) ---------- */
  var list = document.getElementById("media-list");
  var cfg = window.VP_CONFIG;
  if (list && cfg && Array.isArray(cfg.media)) {
    var names = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok" };
    cfg.media.forEach(function (m, i) {
      var li = document.createElement("li"), a = document.createElement("a"), s = document.createElement("small");
      a.href = m.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = m.label;
      s.textContent = names[m.platform] + " ↗";
      a.appendChild(s); li.appendChild(a); list.appendChild(li);
    });
  }
})();

window.VP_CONFIG = {
  LOGO: "",
  CONTACT_ENDPOINT: "/api/contact",

  MEDIA: [
    {
      id: "ig-1",
      platform: "instagram",
      label: "Reel de Instagram",
      url: "https://www.instagram.com/reel/DdkIQhohNw1/?dlrf=eHc4Ymt6cmFtZzEy"
    },
    {
      id: "ig-2",
      platform: "instagram",
      label: "Reel de Instagram",
      url: "https://www.instagram.com/reel/DdkCpFTTljL/?rpxt=MTBnejBoMTYxa2x6Yg=="
    },
    {
      id: "ig-3",
      platform: "instagram",
      label: "Reel de Instagram",
      url: "https://www.instagram.com/reel/DdSvAoHs2v6/?rpxt=ZzJ0N2E3cTEwM2Vq"
    },
    {
      id: "ig-4",
      platform: "instagram",
      label: "Reel de Instagram",
      url: "https://www.instagram.com/reel/DdNSLi0MUp_/?psln=MWM0N3duZHdkcnI3Zg=="
    },
    {
      id: "tt-1",
      platform: "tiktok",
      label: "Video de TikTok",
      url: "https://vt.tiktok.com/ZSbTep7fX/"
    },
    {
      id: "tt-2",
      platform: "tiktok",
      label: "Video de TikTok",
      url: "https://vt.tiktok.com/ZSbTddpu1/"
    },
    {
      id: "tt-3",
      platform: "tiktok",
      label: "Video de TikTok",
      url: "https://vt.tiktok.com/ZSbTdry59/"
    },
    {
      id: "yt-1",
      platform: "youtube",
      label: "Transmisión de YouTube",
      url: "https://www.youtube.com/live/OzjQSu3R8to?si=PTL1_hhU0pFF7eS6",
      youtubeId: "OzjQSu3R8to"
    },
    {
      id: "yt-2",
      platform: "youtube",
      label: "Transmisión de YouTube",
      url: "https://www.youtube.com/live/fkhBnB9v_eU?si=1VplZ9q84_DPQ0nb",
      youtubeId: "fkhBnB9v_eU"
    },
    {
      id: "yt-3",
      platform: "youtube",
      label: "Transmisión de YouTube",
      url: "https://www.youtube.com/live/uWWit2ONDlg?si=PboRKgdYI1gwh8Fy",
      youtubeId: "uWWit2ONDlg"
    }
  ],

  META: {
    "/": [
      "Voz de Potrero — El fútbol nace en el potrero",
      "Voz de Potrero, medio deportivo de Rosario. Historias, deporte y comunidad."
    ],
    "/nosotros": [
      "Nosotros — Voz de Potrero",
      "Identidad, historia y propuesta editorial de Voz de Potrero, medio deportivo de Rosario."
    ],
    "/comercial": [
      "Para marcas — Voz de Potrero",
      "Propuestas comerciales de Voz de Potrero: presencia de marca, contenido patrocinado y producción audiovisual deportiva en Rosario."
    ],
    "/contenidos": [
      "Contenidos — Voz de Potrero",
      "Transmisiones en vivo, reels y videos verticales de Voz de Potrero."
    ],
    "/contacto": [
      "Contacto — Voz de Potrero",
      "Escribinos: consultas institucionales, propuestas comerciales y colaboraciones."
    ],
    "/legal": [
      "Legal y privacidad — Voz de Potrero",
      "Política de privacidad y términos de uso de Voz de Potrero."
    ]
  }
};
