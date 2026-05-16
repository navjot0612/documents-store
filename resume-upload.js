(function () {
  var dropZone = document.getElementById("dropZone");
  var input = document.getElementById("fileInput");
  var errEl = document.getElementById("fileError");
  var progWrap = document.getElementById("uploadProgress");
  var progPct = document.getElementById("uploadPercent");
  var progBar = document.getElementById("uploadBar");
  var progTrack = progWrap ? progWrap.querySelector('[role="progressbar"]') : null;
  var analyzeBtn = document.getElementById("analyzeBtn");
  var analyzeSpinner = document.getElementById("analyzeSpinner");
  var resetBtn = document.getElementById("resetBtn");
  var aiBlock = document.getElementById("aiBlock");
  var aiStatus = document.getElementById("aiStatus");
  var aiHints = document.getElementById("aiHints");
  var successBanner = document.getElementById("successBanner");

  var previewSection = document.getElementById("previewSection");
  var previewKind = document.getElementById("previewKind");
  var previewName = document.getElementById("previewName");
  var previewSize = document.getElementById("previewSize");

  var scoreWrap = document.querySelector(".resume-score");
  var scoreEmpty = scoreWrap ? scoreWrap.querySelector("[data-score-empty]") : null;
  var scoreResult = scoreWrap ? scoreWrap.querySelector("[data-score-result]") : null;
  var scoreRing = document.querySelector(".resume-score__ring");
  var scoreFill = document.getElementById("scoreRingFill");

  var barKw = document.getElementById("barKw");
  var barStruct = document.getElementById("barStruct");
  var barImpact = document.getElementById("barImpact");
  var meterKw = document.getElementById("meterKw");
  var meterStruct = document.getElementById("meterStruct");
  var meterImpact = document.getElementById("meterImpact");
  var scoreNum = document.getElementById("scoreNum");

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var currentFile = null;
  var uploadDone = false;
  var analyzing = false;

  var ALLOWED_EXT = /\.(pdf|docx?)$/i;
  var MAX_BYTES = 15 * 1024 * 1024;

  function reduceMotion() {
    return mqReduce.matches;
  }

  function fmtBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function setError(msg) {
    if (!errEl) return;
    if (!msg) {
      errEl.hidden = true;
      errEl.textContent = "";
      return;
    }
    errEl.hidden = false;
    errEl.textContent = msg;
  }

  function docKind(fileName) {
    var n = fileName.toLowerCase();
    if (n.endsWith(".pdf")) return "PDF";
    if (n.endsWith(".docx")) return "DOCX";
    return "DOC";
  }

  function validateFile(file) {
    if (!file) return "No file selected.";
    if (!ALLOWED_EXT.test(file.name)) return "Please upload a PDF or Word file (.pdf, .doc, .docx).";
    if (file.size > MAX_BYTES) return "File exceeds 15 MB limit.";
    return "";
  }

  function scoreFingerprint(file) {
    var seed = file.name.length * 997 + file.size % 7919;
    var main = 78 + (seed % 15);
    var kw = Math.min(99, Math.max(71, main + ((seed >> 3) % 13) - 6));
    var st = Math.min(96, Math.max(68, main + ((seed >> 5) % 11) - 8));
    var im = Math.min(94, Math.max(60, main + ((seed >> 7) % 17) - 12));
    return { main: main, keywords: kw, structure: st, impact: im };
  }

  function simulateUpload(done) {
    if (!progWrap || !progBar || !progPct || !progTrack) {
      done();
      return;
    }
    progWrap.hidden = false;
    var pct = 0;
    progBar.style.width = "0%";
    progPct.textContent = "0%";
    progTrack.setAttribute("aria-valuenow", "0");

    if (reduceMotion()) {
      pct = 100;
      progBar.style.width = "100%";
      progPct.textContent = "100%";
      progTrack.setAttribute("aria-valuenow", "100");
      done();
      return;
    }

    var dur = 1800 + Math.random() * 400;
    var t0 = performance.now();

    function tick(now) {
      var t = Math.min(1, (now - t0) / dur);
      pct = Math.floor(t * 100);
      progBar.style.width = pct + "%";
      progPct.textContent = pct + "%";
      progTrack.setAttribute("aria-valuenow", String(pct));
      if (t < 1) requestAnimationFrame(tick);
      else done();
    }

    requestAnimationFrame(tick);
  }

  function runAnalyze(done) {
    if (!aiBlock || !aiStatus) {
      done();
      return;
    }
    analyzing = true;
    aiBlock.hidden = false;
    aiBlock.classList.remove("is-idle");
    if (aiHints) aiHints.innerHTML = "";

    var pipeline = [
      "Vectorizing headings & sections…",
      "Aligning taxonomy to staffing archetypes…",
      "Measuring lexical density vs. benchmarks…",
      "Mapping evidence lines to KPI templates…",
      "Generating composite score…",
      "Publishing intelligence packet…",
    ];

    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute("aria-busy", "true");
    if (analyzeSpinner) analyzeSpinner.hidden = reduceMotion();

    function finishAnalyze() {
      analyzing = false;
      analyzeBtn.removeAttribute("aria-busy");
      if (analyzeSpinner) analyzeSpinner.hidden = true;
      aiBlock.classList.add("is-idle");
      aiStatus.textContent = "Signals locked · ready for review";
      done();
    }

    var detailSteps = pipeline.length - 2;

    if (reduceMotion()) {
      aiStatus.textContent = pipeline[pipeline.length - 1];
      pipeline.slice(0, detailSteps).forEach(function (t) {
        if (aiHints) {
          var li = document.createElement("li");
          li.textContent = t;
          aiHints.prepend(li);
        }
      });
      finishAnalyze();
      return;
    }

    if (analyzeSpinner) analyzeSpinner.hidden = false;

    var i = 0;
    function tick() {
      aiStatus.textContent = pipeline[i];
      if (i < detailSteps && aiHints) {
        var li = document.createElement("li");
        li.textContent = pipeline[i];
        aiHints.prepend(li);
      }
      i++;
      if (i >= pipeline.length) {
        finishAnalyze();
      } else {
        setTimeout(tick, 420);
      }
    }

    tick();
  }

  function revealScore(metrics) {
    if (!scoreEmpty || !scoreResult || !scoreWrap) return;

    scoreEmpty.hidden = true;
    scoreResult.hidden = false;

    if (scoreNum) scoreNum.textContent = String(metrics.main);

    barKw.textContent = metrics.keywords + "%";
    barStruct.textContent = metrics.structure + "%";
    barImpact.textContent = metrics.impact + "%";

    meterKw.style.setProperty("--m", (metrics.keywords / 100).toFixed(4));
    meterStruct.style.setProperty("--m", (metrics.structure / 100).toFixed(4));
    meterImpact.style.setProperty("--m", (metrics.impact / 100).toFixed(4));

    if (scoreRing) {
      scoreRing.style.setProperty("--score-pct", String(metrics.main));
    }

    requestAnimationFrame(function () {
      if (scoreFill) scoreFill.classList.add("is-on");
      meterKw.classList.add("is-on");
      meterStruct.classList.add("is-on");
      meterImpact.classList.add("is-on");
    });
  }

  function resetScorePanels() {
    successBanner.hidden = true;
    analyzeBtn.disabled = true;
    var lbl = analyzeBtn.querySelector(".resume-btn__label");
    if (lbl) lbl.textContent = "Analyze resume";
    analyzeBtn.removeAttribute("aria-busy");
    if (analyzeSpinner) analyzeSpinner.hidden = true;

    if (scoreEmpty) scoreEmpty.hidden = false;
    if (scoreResult) scoreResult.hidden = true;
    if (scoreNum) scoreNum.textContent = "—";
    barKw.textContent = barStruct.textContent = barImpact.textContent = "—";
    meterKw.classList.remove("is-on");
    meterStruct.classList.remove("is-on");
    meterImpact.classList.remove("is-on");
    if (scoreFill) scoreFill.classList.remove("is-on");
    meterKw.style.setProperty("--m", "0");
    meterStruct.style.setProperty("--m", "0");
    meterImpact.style.setProperty("--m", "0");
    if (scoreRing) scoreRing.style.removeProperty("--score-pct");
  }

  function onPickFile(file) {
    setError("");
    var msg = validateFile(file);
    if (msg) {
      setError(msg);
      return;
    }

    currentFile = file;
    uploadDone = false;

    resetScorePanels();

    aiBlock.hidden = true;
    aiBlock.classList.remove("is-idle");

    previewName.textContent = file.name;
    previewSize.textContent = fmtBytes(file.size);
    previewKind.textContent = docKind(file.name);
    previewSection.hidden = false;

    dropZone.classList.add("is-busy");
    dropZone.classList.remove("is-done");
    analyzeBtn.disabled = true;
    resetBtn.hidden = true;
    simulateUpload(function () {
      uploadDone = true;
      dropZone.classList.remove("is-busy");
      dropZone.classList.add("is-done");
      analyzeBtn.disabled = false;
      resetBtn.hidden = false;
    });
  }

  function onAnalyzeClick() {
    if (!currentFile || !uploadDone || analyzing) return;

    analyzeBtn.disabled = true;

    runAnalyze(function () {
      var m = scoreFingerprint(currentFile);
      revealScore(m);
      successBanner.hidden = false;
      analyzeBtn.disabled = true;
      var doneLbl = analyzeBtn.querySelector(".resume-btn__label");
      if (doneLbl) doneLbl.textContent = "Analysis complete";

      var act = analyzeBtn.closest(".resume-actions");
      if (act && act.scrollIntoView) {
        act.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
      }
    });
  }

  function hardReset() {
    currentFile = null;
    uploadDone = false;
    analyzing = false;
    input.value = "";
    setError("");

    previewSection.hidden = true;
    dropZone.classList.remove("is-busy", "is-done");

    if (progWrap) progWrap.hidden = true;
    if (progBar) progBar.style.width = "0%";
    if (progPct) progPct.textContent = "0%";

    aiBlock.hidden = true;
    aiBlock.classList.remove("is-idle");
    aiStatus.textContent = "Initializing models…";
    resetBtn.hidden = true;
    resetScorePanels();

    previewName.textContent = "—";
    previewSize.textContent = "—";
    previewKind.textContent = "PDF";
    if (aiHints) aiHints.innerHTML = "";
  }

  if (dropZone && input) {
    dropZone.addEventListener("click", function () {
      if (!dropZone.classList.contains("is-busy")) input.click();
    });

    dropZone.addEventListener("keydown", function (e) {
      if (!dropZone.classList.contains("is-busy") && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        input.click();
      }
    });

    ["dragenter", "dragover"].forEach(function (ev) {
      dropZone.addEventListener(ev, function (e) {
        e.preventDefault();
        dropZone.classList.add("is-drag");
      });
    });

    ["dragleave", "dragend"].forEach(function (ev) {
      dropZone.addEventListener(ev, function () {
        dropZone.classList.remove("is-drag");
      });
    });

    dropZone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropZone.classList.remove("is-drag");
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      onPickFile(f);
    });

    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      onPickFile(f);
    });
  }

  analyzeBtn.addEventListener("click", onAnalyzeClick);
  resetBtn.addEventListener("click", hardReset);
})();
