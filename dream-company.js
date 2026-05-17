(function () {
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() {
    return reduceMotionMq.matches;
  }

  // Animate elements on scroll
  document.querySelectorAll(".dc-animate").forEach(function (el, i) {
    if (!reduced()) {
      el.style.setProperty("--dc-stagger", Math.min(i * 80, 500) + "ms");
    } else {
      el.classList.add("is-visible");
    }
  });

  // Function to activate the readiness ring
  function activateRing() {
    document.querySelectorAll("[data-dc-ring]").forEach(function (ring) {
      var p = parseFloat(ring.getAttribute("data-pct") || "0");
      if (!isFinite(p)) p = 0;
      ring.style.setProperty("--dc-pct", String(Math.min(100, Math.max(0, p))));

      // Animate the number counting up
      var numEl = ring.querySelector('.dc-ring__num');
      if (numEl && !reduced()) {
        let current = 0;
        let increment = p / 60; // 60 frames approx
        let timer = setInterval(function () {
          current += increment;
          if (current >= p) {
            numEl.textContent = p;
            clearInterval(timer);
          } else {
            numEl.textContent = Math.floor(current);
          }
        }, 16);
      }

      if (reduced()) ring.classList.add("is-on");
      else requestAnimationFrame(function () {
        ring.classList.add("is-on");
      });
    });
  }

  // Function to activate skill gap meters
  function hydrateMeters(root) {
    root.querySelectorAll(".dc-meter-fill").forEach(function (fill, i) {
      fill.style.transitionDelay = reduced() ? "0ms" : Math.min(i * 150, 600) + "ms";
      requestAnimationFrame(function () {
        fill.classList.add("is-on");
      });
    });
  }

  // Intersection Observer for scroll animations
  if (!reduced() && "IntersectionObserver" in window) {
    var animIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");

          if (entry.target.classList.contains("dc-hero")) {
            activateRing();
          }
          if (entry.target.id === "skills") {
            hydrateMeters(entry.target);
            initChart();
          }

          animIo.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    document.querySelectorAll(".dc-animate:not(.is-visible)").forEach(function (el) {
      animIo.observe(el);
    });
  } else {
    document.querySelectorAll(".dc-animate").forEach(function (el) {
      el.classList.add("is-visible");
    });
    activateRing();
    hydrateMeters(document);
    setTimeout(initChart, 500);
  }

  // Simulate Button Logic (Mock interaction)
  var simulateBtn = document.getElementById("simulateBtn");
  if (simulateBtn) {
    simulateBtn.addEventListener("click", function () {
      var company = document.getElementById("companySelect").value;
      var role = document.getElementById("roleSelect").value;

      this.textContent = "Simulating...";
      this.style.opacity = "0.8";
      this.style.pointerEvents = "none";

      // Simulate network request/processing
      setTimeout(() => {
        this.textContent = "Run Simulation";
        this.style.opacity = "1";
        this.style.pointerEvents = "auto";

        // Slightly change the readiness score as a fake update
        var newScore = Math.floor(Math.random() * 30) + 35; // 35-65 range
        var ring = document.querySelector("[data-dc-ring]");
        if (ring) {
          ring.classList.remove("is-on");
          ring.setAttribute("data-pct", newScore);
          setTimeout(activateRing, 100);
        }
      }, 1200);
    });
  }

  // Chart.js Setup
  var chartInitialized = false;
  function initChart() {
    if (chartInitialized || !window.Chart) return;
    chartInitialized = true;

    Chart.defaults.font.family = '"Outfit", system-ui, -apple-system, sans-serif';
    Chart.defaults.color = "rgba(226,232,255,0.6)";
    Chart.defaults.borderColor = "rgba(255,255,255,0.08)";

    var ctx = document.getElementById("competencyChart");
    if (!ctx) return;

    new Chart(ctx.getContext("2d"), {
      type: "radar",
      data: {
        labels: [
          "Data Structures",
          "System Design",
          "Concurrency",
          "DB Internals",
          "API Design",
          "Cloud Native"
        ],
        datasets: [
          {
            label: "Your Profile",
            data: [65, 45, 55, 40, 80, 50],
            backgroundColor: "rgba(0, 242, 254, 0.25)",
            borderColor: "#00f2fe",
            borderWidth: 2,
            pointBackgroundColor: "#fff",
            pointBorderColor: "#00f2fe",
            pointRadius: reduced() ? 2 : 4,
          },
          {
            label: "Google L4 Bar",
            data: [85, 75, 80, 70, 85, 70],
            backgroundColor: "transparent",
            borderColor: "rgba(255, 77, 77, 0.6)",
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reduced() ? false : { duration: 1200, easing: 'easeOutQuart' },
        scales: {
          r: {
            angleLines: { color: "rgba(255,255,255,0.1)" },
            grid: { color: "rgba(255,255,255,0.1)" },
            pointLabels: {
              font: { size: 11, weight: "500" },
              color: "rgba(226,232,255,0.7)",
            },
            ticks: { display: false, min: 0, max: 100 },
          }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, boxWidth: 10, padding: 20 }
          },
          tooltip: {
            backgroundColor: "rgba(13,17,28,0.9)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#00f2fe",
            padding: 10
          }
        }
      }
    });
  }
})();
