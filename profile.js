(function () {
  var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  function reduced() {
    return reduceMotionMq.matches;
  }

  // Animate elements on scroll
  document.querySelectorAll(".pf-animate").forEach(function (el, i) {
    if (!reduced()) {
      el.style.setProperty("--pf-stagger", Math.min(i * 70, 450) + "ms");
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

    document.querySelectorAll(".pf-animate:not(.is-visible)").forEach(function (el) {
      animIo.observe(el);
    });
  } else {
    document.querySelectorAll(".pf-animate").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Animate skill bars after section is visible
  if ("IntersectionObserver" in window) {
    var skillIo = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            var fills = entry.target.querySelectorAll(".pf-meter-fill");
            fills.forEach(function(fill) {
              // slight delay for visual effect
              setTimeout(function() {
                fill.classList.add("is-on");
              }, 200);
            });
            skillIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    var skillSec = document.getElementById("skills");
    if (skillSec) skillIo.observe(skillSec);
  } else {
    document.querySelectorAll(".pf-meter-fill").forEach(function(fill) {
      fill.classList.add("is-on");
    });
  }

  // Edit Mode Logic
  var isEditing = false;
  var editBtn = document.getElementById("globalEditBtn");
  var editables = document.querySelectorAll(".editable-text");

  if (editBtn) {
    editBtn.addEventListener("click", function () {
      isEditing = !isEditing;
      
      if (isEditing) {
        document.body.classList.add("is-editing");
        editBtn.textContent = "Save Profile";
        editBtn.classList.remove("btn--primary");
        editBtn.classList.add("btn--good"); // Assuming there's a green/good state or just visually change it
        editBtn.style.background = "#34d399";
        editBtn.style.color = "#000";
        
        editables.forEach(function (el) {
          el.setAttribute("contenteditable", "true");
        });
      } else {
        document.body.classList.remove("is-editing");
        editBtn.textContent = "Edit Profile";
        editBtn.classList.add("btn--primary");
        editBtn.classList.remove("btn--good");
        editBtn.style.background = "";
        editBtn.style.color = "";
        
        editables.forEach(function (el) {
          el.removeAttribute("contenteditable");
          // Here you would typically gather the updated text and send to a backend
        });
        
        // Mock save notification
        var origText = editBtn.textContent;
        editBtn.textContent = "Saved!";
        setTimeout(function() {
          editBtn.textContent = origText;
        }, 1500);
      }
    });
  }
})();
