
/* ===== Voz de Potrero — script.js ===== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hero = document.querySelector("[data-hero], .hero");
  var header = document.getElementById("site-header") ||
               document.getElementById("header");

  /* ---------- Header: fondo sólido al desplazarse ---------- */
  function onScroll() {
    if (header) {
      header.classList.toggle("is-solid", window.scrollY > 40);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil accesible ---------- */
  var btn = document.getElementById("menu-btn");
  var nav = document.getElementById("main-nav") ||
            document.getElementById("nav");
  var mobile = window.matchMedia("(max-width: 700px)");

  function setMenu(open, returnFocus) {
    if (!btn || !nav) return;

    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);

    if (open) {
      var first = nav.querySelector("a");
      if (first) first.focus();
    } else if (returnFocus) {
      btn.focus();
    }
  }

  if (btn && nav) {
    btn.addEventListener("click", function () {
      setMenu(btn.getAttribute("aria-expanded") !== "true", true);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && mobile.matches) {
        setMenu(false, false);
      }
    });

    document.addEventListener("keydown", function (e) {
      var open = btn.getAttribute("aria-expanded") === "true";
      if (!open) return;

      if (e.key === "Escape") {
        setMenu(false, true);
        return;
      }

      if (e.key === "Tab") {
        var items = [btn].concat(
          [].slice.call(nav.querySelectorAll("a"))
        );

        var i = items.indexOf(document.activeElement);

        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    });

    mobile.addEventListener("change", function () {
      if (!mobile.matches) setMenu(false, false);
    });
  }

  /* ---------- Paralaje de profundidad ---------- */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var tx = 0, ty = 0, cx = 0, cy = 0;
  var raf = null, visible = true;

  function frame() {
    if (!hero) return;

    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;

    hero.style.setProperty("--mx", cx.toFixed(3));
    hero.style.setProperty("--my", cy.toFixed(3));

    raf = (visible &&
      (Math.abs(tx - cx) > 0.001 ||
       Math.abs(ty - cy) > 0.001))
      ? requestAnimationFrame(frame)
      : null;
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  if (hero) {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) kick();
      }).observe(hero);
    }

    hero.addEventListener("pointermove", function (e) {
      if (reduceMotion.matches || !fine.matches) return;

      var r = hero.getBoundingClientRect();

      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;

      kick();
    }, { passive: true });

    hero.addEventListener("pointerleave", function () {
      tx = 0;
      ty = 0;
      kick();
    });
  }

  /* ---------- Configuración general ---------- */
  var cfg = window.VP_CONFIG || {};

  /* ---------- Lista de contenidos anteriores ---------- */
  var list = document.getElementById("media-list");
  var media = cfg.MEDIA || cfg.media || [];

  if (list && Array.isArray(media)) {
    list.innerHTML = "";

    var platformNames = {
      youtube: "YouTube",
      instagram: "Instagram",
      tiktok: "TikTok"
    };

    media.forEach(function (m) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      var small = document.createElement("small");

      a.href = m.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = m.label;

      small.textContent =
        (platformNames[m.platform] || "Contenido") + " ↗";

      a.appendChild(small);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  /* ---------- Audiovisual: protagonistas y entrevistas ---------- */
  var audiovisual = [
    {
      name: "Elu Glaria",
      driveId: "1-gmV8h5x3QRqoqOKlTBxX-etXmlEcENY",
      instagram: "https://www.instagram.com/reel/DfGHZWJMOQf/?dlrf=N29yaWJ1ZHZ4MXBi"
    },
    {
      name: "Claudio Giglioni",
      driveId: "1FmCi1mT5STJ3LVGF7g7jMijZ4g34VzsP",
      instagram: "https://www.instagram.com/reel/DQnJzePAQBT/?dlrf=emUwaHhpZ3luMWxi"
    },
    {
      name: "Julián Bricco",
      driveId: "1n44hlFbm1MJqfftCHgZOTVkrWUcOeu0O",
      instagram: "https://www.instagram.com/reel/DRGL6jWAfE_/?mdxt=MXNpbXFzeHRzb3l0cQ=="
    },
    {
      name: "Agostina Hein",
      driveId: "1lbvn0PHRE1VeflLeXgfj8Kl1BkvaAg1J",
      instagram: "https://www.instagram.com/reel/DdW05JEsx7A/?srtk=enlhbXNtZDRxam54"
    },
    {
      name: "Horacio «Petaco» Carbonari",
      driveId: "1dQPg_n3XeK-qnOnhMhVkDqTokdB8dyGC",
      instagram: "https://www.instagram.com/reel/Dc2M_8QxC59/?xtok=MnVzN2x6bGI2dHlj"
    },
    {
      name: "Pablo Javkin",
      driveId: "12Obn5h2VhIpLbj4BP2vN01ZouNp6S2X9",
      instagram: "https://www.instagram.com/reel/DcHe-sWM6gt/?cplk=NTJyeDE5cHFzd2cw"
    },
    {
      name: "Maxi Ariza",
      driveId: "1pBlx6PtrI70J1HHqkD5lGC7-to9mqmr8",
      instagram: "https://www.instagram.com/reel/DafosDAs8H1/?rpxt=MTZteHVwcmhuc2V0"
    }
  ];
  
  /* ---------- Render de tarjetas audiovisuales en Noticias y coberturas ---------- */
  var newsSection = document.querySelector(
    '[data-view="noticias"]'
  );

  if (newsSection) {
    var wrap = newsSection.querySelector(".wrap");

    if (wrap) {
      var oldGrid = wrap.querySelector(".media-grid");

      if (oldGrid) oldGrid.remove();

      var oldHeading = wrap.querySelector(".media-group-heading");

      if (oldHeading) oldHeading.remove();

      var heading = document.createElement("div");
      heading.className = "section-head media-group-heading";

      var headingContent = document.createElement("div");
      var eyebrow = document.createElement("p");
      var title = document.createElement("h2");

      eyebrow.className = "eyebrow";
      eyebrow.textContent = "ENTREVISTAS Y PROTAGONISTAS";

      title.textContent = "Las voces del deporte.";

      headingContent.appendChild(eyebrow);
      headingContent.appendChild(title);
      heading.appendChild(headingContent);

      var index = document.createElement("span");
      index.className = "index";
      index.textContent = "AUDIOVISUAL";
      heading.appendChild(index);

      var grid = document.createElement("div");
      grid.className = "media-grid";

      audiovisual.forEach(function (person) {
        var card = document.createElement("article");
        card.className = "media-card";

        var stage = document.createElement("div");
        stage.className = "media-stage";

        var iframe = document.createElement("iframe");
        iframe.src =
          "https://drive.google.com/file/d/" +
          person.driveId +
          "/preview";

        iframe.title = "Video de " + person.name;
        iframe.loading = "lazy";
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";

        stage.appendChild(iframe);

        var description = document.createElement("div");
        description.className = "media-description";

        var category = document.createElement("p");
        category.className = "tag";
        category.textContent = "ENTREVISTA / VOZ DE POTRERO";

        var personName = document.createElement("h3");
        personName.textContent = person.name;

        var original = document.createElement("a");
        original.className = "media-original";
        original.href = person.instagram;
        original.target = "_blank";
        original.rel = "noopener noreferrer";
        original.textContent = "Ver Reel original en Instagram ↗";

        description.appendChild(category);
        description.appendChild(personName);
        description.appendChild(original);

        card.appendChild(stage);
        card.appendChild(description);

        grid.appendChild(card);
      });

      wrap.appendChild(heading);
      wrap.appendChild(grid);
    }
  }

  /* ---------- Año automático del pie ---------- */
  var year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

})();
