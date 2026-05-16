(function () {
  var sidebar = document.getElementById("dash-sidebar");
  var backdrop = document.querySelector("[data-dash-backdrop]");
  var menuBtn = document.querySelector("[data-dash-sidebar-toggle]");
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduceMotionOn() {
    return reduceMotionMq.matches;
  }

  /** Sidebar (mobile drawer) */
  function closeSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.remove("is-open");
    backdrop.hidden = true;
    backdrop.classList.remove("is-open");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dash-sidebar-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }

  function openSidebar() {
    if (!sidebar || !backdrop) return;
    sidebar.classList.add("is-open");
    backdrop.hidden = false;
    backdrop.classList.add("is-open");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("dash-sidebar-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
  }

  if (menuBtn && sidebar && backdrop) {
    menuBtn.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) closeSidebar();
      else openSidebar();
    });
    backdrop.addEventListener("click", closeSidebar);
    sidebar.querySelectorAll("a.dash-nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (!window.matchMedia("(min-width: 1024px)").matches) closeSidebar();
      });
    });
    window.addEventListener(
      "resize",
      function () {
        if (window.matchMedia("(min-width: 1024px)").matches) closeSidebar();
      },
      { passive: true }
    );
  }

  /** Card hydrate: progress bars + radial ring */
  function hydrateInteractive(root) {
    if (!root || !root.classList.contains("is-dash-visible")) return;

    root.querySelectorAll("[data-meter-fill]").forEach(function (fill, i) {
      var raw = parseFloat(fill.getAttribute("data-meter-target") || "0");
      var scaled = Number.isFinite(raw) ? raw : 0;
      scaled = Math.min(Math.max(scaled, 0), 1);
      fill.style.setProperty("--meter-target", String(scaled));
      if (!reduceMotionOn()) {
        fill.style.transitionDelay = Math.min(i * 55, 380) + "ms";
      } else {
        fill.style.transitionDuration = "0.01ms";
      }
    });

    root.querySelectorAll(".dash-ring").forEach(function (ring) {
      var score = parseFloat(ring.getAttribute("data-pct") || "0");
      if (!Number.isFinite(score)) score = 0;
      score = Math.min(Math.max(score, 0), 100);
      ring.style.setProperty("--pct", String(score));

      function trigger() {
        ring.classList.add("is-dash-done");
      }

      if (reduceMotionOn()) trigger();
      else requestAnimationFrame(trigger);
    });
  }

  var animatedSelectors = "[data-dash-animate].dash-card, [data-dash-animate].dash-welcome";

  if (!reduceMotionOn() && "IntersectionObserver" in window) {
    document.querySelectorAll(animatedSelectors).forEach(function (el, idx) {
      el.style.setProperty("--dash-delay", Math.min(idx * 52, 360) + "ms");
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var card = entry.target;
          card.classList.add("is-dash-visible");
          hydrateInteractive(card);
          io.unobserve(card);
        });
      },
      { root: null, rootMargin: "-4% 0px -11% 0px", threshold: 0.1 }
    );

    document.querySelectorAll(animatedSelectors).forEach(function (card) {
      io.observe(card);
    });
  } else {
    document.querySelectorAll(animatedSelectors).forEach(function (card) {
      card.style.setProperty("--dash-delay", "0ms");
      card.classList.add("is-dash-visible");
      hydrateInteractive(card);
    });
  }

  /** Chart.js radar */
  var chartEl = document.getElementById("skillChart");
  if (!window.Chart || !chartEl) return;

  var ctx = chartEl.getContext("2d");
  Chart.defaults.color = "rgba(226,232,255,0.55)";
  Chart.defaults.borderColor = "rgba(255,255,255,0.08)";
  Chart.defaults.font.family = '"Outfit", system-ui, -apple-system, sans-serif';

  /* eslint-disable no-new */
  new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Strategy",
        "Execution",
        "Stakeholders",
        "Data literacy",
        "Technical depth",
        "Leadership",
      ],
      datasets: [
        {
          label: "Your proficiency",
          data: [92, 86, 78, 71, 64, 74],
          backgroundColor: "rgba(124,92,255,0.38)",
          borderColor: "#6ea8ff",
          borderWidth: 2.2,
          pointBackgroundColor: "#f4f6ff",
          pointRadius: reduceMotionOn() ? 2 : 4,
          pointHoverRadius: 6,
          fill: true,
        },
        {
          label: "Target arc",
          data: [94, 90, 86, 84, 80, 88],
          backgroundColor: "transparent",
          borderColor: "rgba(226,232,255,0.38)",
          borderWidth: 1.5,
          borderDash: [7, 5],
          pointRadius: reduceMotionOn() ? 0 : 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotionOn()
        ? false
        : {
            duration: 1150,
          },
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        r: {
          angleLines: { color: "rgba(255,255,255,0.06)" },
          grid: { color: "rgba(255,255,255,0.085)" },
          pointLabels: {
            font: { size: 11, weight: "500", family: Chart.defaults.font.family },
            color: "rgba(226,232,255,0.52)",
          },
          ticks: { display: false, backdropPadding: 0 },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          align: "end",
          labels: {
            boxWidth: 11,
            boxHeight: 11,
            padding: 14,
            usePointStyle: true,
            pointStyle: "circle",
            color: "rgba(226,232,255,0.65)",
          },
        },
        tooltip: {
          backgroundColor: "rgba(7,10,18,0.94)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
          titleColor: "#f4f6ff",
          bodyColor: "rgba(226,232,255,0.82)",
        },
      },
    },
  });
})();
