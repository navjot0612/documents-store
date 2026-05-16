(function () {
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() {
    return reduceMotionMq.matches;
  }

  var gapSection = document.getElementById("gaps");

  document.querySelectorAll(".ra-animate").forEach(function (el, i) {
    if (!reduced()) {
      el.style.setProperty("--ra-stagger", Math.min(i * 65, 420) + "ms");
    } else {
      el.classList.add("is-visible");
    }
  });

  function activateRings() {
    document.querySelectorAll("[data-ra-ring]").forEach(function (ring) {
      var p = parseFloat(ring.getAttribute("data-pct") || "0");
      if (!isFinite(p)) p = 0;
      ring.style.setProperty("--ra-pct", String(Math.min(100, Math.max(0, p))));
      if (reduced()) ring.classList.add("is-on");
      else requestAnimationFrame(function () {
        ring.classList.add("is-on");
      });
    });
  }

  function hydrateSkillGap(root) {
    root.querySelectorAll(".ra-meter-fill[data-target]").forEach(function (fill, i) {
      var pct = parseInt(fill.getAttribute("data-target") || "0", 10);
      if (!isFinite(pct)) pct = 0;
      pct = Math.min(100, Math.max(0, pct));
      var frac = pct / 100;
      fill.style.setProperty("--frac", String(frac));
      fill.style.transitionDelay = reduced() ? "0ms" : Math.min(i * 90, 360) + "ms";
      var row = fill.closest(".ra-skill-meter");
      var pctEl = row && row.querySelector(".ra-skill-pct");
      if (pctEl) pctEl.textContent = pct + "%";
      requestAnimationFrame(function () {
        fill.classList.add("is-on");
      });
    });
  }

  function hydrateRoadStep(step) {
    step.classList.add("is-lit");
    var bar = step.querySelector(".ra-micro-meter__fill");
    if (!bar) return;
    var w = parseInt(bar.getAttribute("data-wp") || "0", 10);
    if (!isFinite(w)) w = 0;
    w = Math.min(100, Math.max(0, w));
    bar.style.setProperty("--wp", w + "%");
    if (reduced()) bar.classList.add("is-on");
    else requestAnimationFrame(function () {
      bar.classList.add("is-on");
    });
  }

  if (reduced()) {
    activateRings();
    if (gapSection) hydrateSkillGap(gapSection);
  }

  if (!reduced() && "IntersectionObserver" in window) {
    var animIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (entry.target.classList.contains("ra-hero")) {
            activateRings();
          }
          animIo.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll(".ra-animate:not(.is-visible)").forEach(function (el) {
      animIo.observe(el);
    });
  } else if (!reduced()) {
    document.querySelectorAll(".ra-animate").forEach(function (el) {
      el.classList.add("is-visible");
    });
    activateRings();
    if (gapSection) hydrateSkillGap(gapSection);
  }

  /** Skill meters */
  if (gapSection && !reduced() && "IntersectionObserver" in window) {
    var gapIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          hydrateSkillGap(entry.target);
          gapIo.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    gapIo.observe(gapSection);
  }

  /** Roadmap */
  document.querySelectorAll("[data-ra-step]").forEach(function (step) {
    if (reduced()) {
      hydrateRoadStep(step);
      return;
    }
    if (!("IntersectionObserver" in window)) {
      hydrateRoadStep(step);
      return;
    }
    var sio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          hydrateRoadStep(entry.target);
          sio.unobserve(entry.target);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -5% 0px" }
    );
    sio.observe(step);
  });

  /** Chart.js — radar + horizontal bar */
  if (!window.Chart) return;

  Chart.defaults.font.family =
    '"Outfit", system-ui, -apple-system, sans-serif';
  Chart.defaults.color = "rgba(226,232,255,0.55)";
  Chart.defaults.borderColor = "rgba(255,255,255,0.08)";

  var anim = reduced() ? false : { duration: 1080 };

  var radarEl = document.getElementById("raRadarChart");
  if (radarEl) {
    new Chart(radarEl.getContext("2d"), {
      type: "radar",
      data: {
        labels: [
          "Lexical fit",
          "Structure",
          "Quantified impact",
          "Leadership cues",
          "Technical depth",
          "Narrative arc",
        ],
        datasets: [
          {
            label: "Your resume",
            data: [88, 84, 71, 79, 66, 82],
            backgroundColor: "rgba(124,92,255,0.35)",
            borderColor: "#6ea8ff",
            borderWidth: 2.2,
            pointBackgroundColor: "#f4f6ff",
            pointRadius: reduced() ? 2 : 4,
          },
          {
            label: "Hire bar",
            data: [92, 90, 86, 88, 82, 90],
            backgroundColor: "transparent",
            borderColor: "rgba(226,232,255,0.36)",
            borderWidth: 1.5,
            borderDash: [6, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: anim,
        scales: {
          r: {
            angleLines: { color: "rgba(255,255,255,0.06)" },
            grid: { color: "rgba(255,255,255,0.08)" },
            pointLabels: {
              font: { size: 11, weight: "500" },
              color: "rgba(226,232,255,0.52)",
            },
            ticks: { display: false },
            suggestedMin: 0,
            suggestedMax: 100,
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, boxWidth: 10, padding: 14 },
          },
          tooltip: {
            backgroundColor: "rgba(7,10,18,0.94)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
          },
        },
      },
    });
  }

  var barEl = document.getElementById("raBarChart");
  if (barEl) {
    new Chart(barEl.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Keywords", "Formatting", "Chronology", "Metrics", "Portability"],
        datasets: [
          {
            label: "ATS contribution",
            data: [91, 86, 88, 72, 80],
            backgroundColor: [
              "rgba(110,168,255,0.72)",
              "rgba(183,148,246,0.72)",
              "rgba(124,92,255,0.72)",
              "rgba(110,168,255,0.5)",
              "rgba(183,148,246,0.55)",
            ],
            borderWidth: 0,
            borderRadius: 10,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: anim,
        scales: {
          x: {
            suggestedMax: 100,
            grid: { color: "rgba(255,255,255,0.06)" },
            ticks: {
              color: "rgba(226,232,255,0.45)",
              font: { family: Chart.defaults.font.family, size: 10 },
              callback: function (v) {
                return v + "%";
              },
            },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11, weight: "500" } },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(7,10,18,0.94)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
          },
        },
      },
    });
  }
})();
