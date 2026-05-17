(function () {
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() {
    return reduceMotionMq.matches;
  }

  // Animate elements on scroll
  document.querySelectorAll(".rm-animate").forEach(function (el, i) {
    if (!reduced()) {
      el.style.setProperty("--rm-stagger", Math.min(i * 70, 450) + "ms");
    } else {
      el.classList.add("is-visible");
    }
  });

  if (!reduced() && "IntersectionObserver" in window) {
    var animIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          animIo.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );

    document.querySelectorAll(".rm-animate:not(.is-visible)").forEach(function (el) {
      animIo.observe(el);
    });
  } else {
    document.querySelectorAll(".rm-animate").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Dismiss alerts logic
  document.querySelectorAll(".rm-alert__close").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var alertCard = e.target.closest(".rm-alert");
      if (alertCard) {
        alertCard.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        alertCard.style.opacity = "0";
        alertCard.style.transform = "translateX(20px)";
        
        setTimeout(function() {
          alertCard.style.display = "none";
          // Update the counter as a mock interaction
          var statVal = document.querySelector(".rm-stat-val");
          if (statVal) {
            var current = parseInt(statVal.textContent, 10);
            if (!isNaN(current) && current > 0) {
              statVal.textContent = current - 1;
            }
          }
        }, 300);
      }
    });
  });

  // Filter logic
  var filters = document.querySelectorAll(".rm-filter-btn");
  var alerts = document.querySelectorAll(".rm-alert");

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Toggle active class
      filters.forEach(function (f) { f.classList.remove("is-active"); });
      this.classList.add("is-active");

      var filterType = this.textContent.trim().toLowerCase();

      // Simple mock filtering based on section IDs or content
      alerts.forEach(function (alert) {
        if (filterType === "all") {
          alert.style.display = "flex";
        } else {
          // If the alert ID matches the filter type, or the title contains the keyword
          var isMatch = (alert.id && alert.id.toLowerCase() === filterType) || 
                        alert.querySelector(".rm-alert__title").textContent.toLowerCase().includes(filterType.replace(/s$/, ''));
          
          alert.style.display = isMatch ? "flex" : "none";
        }
      });
    });
  });
})();
