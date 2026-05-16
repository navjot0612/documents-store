(function () {
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.getElementById("mobile-drawer");
  var yearEl = document.getElementById("year");
  var demoBtn = document.querySelector(".js-demo");
  var toast = document.getElementById("demo-toast");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function setHeaderScrolled() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  setHeaderScrolled();
  window.addEventListener("scroll", setHeaderScrolled, { passive: true });

  function closeDrawer() {
    if (!toggle || !drawer) return;
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    drawer.classList.remove("is-open");
    drawer.hidden = true;
  }

  function openDrawer() {
    if (!toggle || !drawer) return;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
    });
    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeDrawer);
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 860px)").matches) {
        closeDrawer();
      }
    });
  }

  // IntersectionObserver for reveal animations
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var animated = document.querySelectorAll("[data-animate]");

  if (!reduceMotion && "IntersectionObserver" in window) {
    animated.forEach(function (el) {
      var delay = el.getAttribute("data-delay");
      if (delay) {
        el.style.setProperty("--delay", delay + "ms");
      }
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    animated.forEach(function (el) {
      io.observe(el);
    });
  } else {
    animated.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Demo button → toast
  if (demoBtn && toast) {
    var toastTimer;
    demoBtn.addEventListener("click", function () {
      toast.hidden = false;
      requestAnimationFrame(function () {
        toast.classList.add("is-visible");
      });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        toast.classList.remove("is-visible");
        setTimeout(function () {
          toast.hidden = true;
        }, 400);
      }, 2600);
    });
  }
})();
