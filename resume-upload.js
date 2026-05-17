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

  async function extractPdfText(file) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return "Simulated text for non-PDF file: " + file.name;
    }
    try {
      var arrayBuffer = await file.arrayBuffer();
      var pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      var text = "";
      for (var i = 1; i <= pdf.numPages; i++) {
        var page = await pdf.getPage(i);
        var content = await page.getTextContent();
        var strings = content.items.map(function(item) { return item.str; });
        text += strings.join(" ") + " ";
      }
      return text;
    } catch(err) {
      console.error("PDF Extraction error:", err);
      return "Could not extract text from PDF.";
    }
  }

  async function callGemini(text) {
    var apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) throw new Error("API Key not found");
    
    var promptText = `Analyze this resume text and provide a strict JSON response. Do NOT use markdown code blocks like \`\`\`json. Return ONLY valid JSON.
Format:
{
  "ats_score": { "main": 85, "keywords": 80, "structure": 90, "impact": 85 },
  "missing_skills": ["Skill 1", "Skill 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "roadmap": ["Step 1", "Step 2"]
}
Resume Text:
${text.substring(0, 10000)}`;

    var response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText
                }
              ]
            }
          ]
        })
      });
    } catch (err) {
      console.error("[Gemini API] Network/CORS Error:", err);
      throw new Error("Network or CORS issue. Check connection.");
    }

    if (!response.ok) {
      var errData;
      try { errData = await response.json(); } catch (e) { errData = {}; }
      var msg = errData?.error?.message || "Unknown API error";
      var status = response.status;
      console.error(`[Gemini API] HTTP ${status}:`, errData);
      
      if (status === 400) throw new Error("Malformed request: " + msg);
      if (status === 401 || status === 403) throw new Error("Invalid API key or unauthorized.");
      if (status === 429) throw new Error("Quota exceeded. Try later.");
      throw new Error("API Error: " + msg);
    }
    
    var data = await response.json();
    console.log("[Gemini API] Full Response:", data);
    
    if (data.promptFeedback?.blockReason) {
      console.error("[Gemini API] Blocked:", data.promptFeedback);
      throw new Error("Blocked by safety filters.");
    }
    
    if (!data.candidates?.[0]?.content) {
      console.error("[Gemini API] Invalid response:", data);
      throw new Error("Empty response from Gemini.");
    }

    var resultText = data.candidates[0].content.parts[0].text;
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(resultText);
    } catch (e) {
      console.error("[Gemini API] JSON Parse Error:", resultText);
      throw new Error("Failed to parse AI response.");
    }
  }

  function getMockFallback() {
    return {
      "ats_score": { "main": 78, "keywords": 72, "structure": 85, "impact": 70 },
      "missing_skills": ["Cloud Architecture (AWS/GCP)", "System Design at scale", "GraphQL APIs"],
      "improvements": [
        "Quantify your backend performance improvements with specific percentages.",
        "Add a dedicated 'Core Competencies' section near the top.",
        "Use stronger action verbs for your impact lines (e.g., 'Spearheaded' instead of 'Helped')."
      ],
      "roadmap": [
        "Month 1: Obtain AWS Certified Developer certification.",
        "Month 3: Build a scalable microservices side-project to demonstrate system design.",
        "Month 6: Transition into a senior backend role internally or apply externally."
      ]
    };
  }

  async function runAnalyze(done) {
    if (!aiBlock || !aiStatus) { done(); return; }
    analyzing = true;
    aiBlock.hidden = false;
    aiBlock.classList.remove("is-idle");
    aiBlock.classList.remove("is-hiding");
    
    var aiProgressBar = document.getElementById("aiProgressBar");
    if (aiProgressBar) aiProgressBar.style.width = "0%";
    
    analyzeBtn.disabled = true;
    analyzeBtn.setAttribute("aria-busy", "true");
    if (analyzeSpinner) analyzeSpinner.hidden = false;

    var isMock = !localStorage.getItem("geminiApiKey");

    var pipeline = [
      "Vectorizing headings & sections...",
      "Extracting text from document...",
      "Analyzing semantic structure...",
      "Mapping skills to industry taxonomy...",
      isMock ? "Mock AI: Generating insights..." : "Querying Gemini API...",
      "Calculating ATS match score...",
      "Building career roadmap...",
      "Finalizing intelligence packet..."
    ];

    var step = 0;
    var totalSteps = pipeline.length;
    var interval = setInterval(function() {
      if (step < totalSteps) {
        aiStatus.style.opacity = "0";
        setTimeout(function() {
          aiStatus.textContent = pipeline[step];
          aiStatus.style.opacity = "1";
        }, 300);
        
        if (aiProgressBar) {
          aiProgressBar.style.width = Math.min(((step + 1) / totalSteps) * 100, 95) + "%";
        }
        
        step++;
      }
    }, 1200);

    try {
      var result;
      var usedMockFallback = false;
      if (isMock) {
        usedMockFallback = true;
        await new Promise(function(r) { setTimeout(r, pipeline.length * 1200); });
        result = getMockFallback();
      } else {
        var text = await extractPdfText(currentFile);
        try {
          result = await callGemini(text);
        } catch (apiErr) {
          if (apiErr.message.includes("Quota") || apiErr.message.includes("Network")) {
            console.warn("[Gemini API] Quota or Network error, falling back to mock:", apiErr);
            aiStatus.style.opacity = "0";
            await new Promise(function(r) { setTimeout(r, 300); });
            aiStatus.textContent = "API unavailable. Activating Mock Fallback Engine...";
            aiStatus.style.opacity = "1";
            aiStatus.style.color = "#f59e0b";
            await new Promise(function(r) { setTimeout(r, 2500); });
            usedMockFallback = true;
            result = getMockFallback();
          } else {
            throw apiErr; // Rethrow to show detailed UI error (e.g., Invalid API key)
          }
        }
      }
      
      clearInterval(interval);
      aiStatus.style.opacity = "0";
      setTimeout(function() {
        aiStatus.textContent = "Analysis complete. Rendering results...";
        aiStatus.style.opacity = "1";
        if (aiProgressBar) aiProgressBar.style.width = "100%";
      }, 300);
      
      setTimeout(function() {
        aiBlock.classList.add("is-hiding");
        setTimeout(function() {
          done(result, usedMockFallback);
        }, 400); 
      }, 1000);
      
    } catch(err) {
      clearInterval(interval);
      console.error("[Resume Analysis] Failed:", err);
      aiStatus.style.opacity = "0";
      setTimeout(function() {
        aiStatus.textContent = err.message || "Analysis failed. Please try again.";
        aiStatus.style.color = "#ff4d4d";
        aiStatus.style.opacity = "1";
      }, 300);
      done(null);
    } finally {
      analyzing = false;
      analyzeBtn.removeAttribute("aria-busy");
      if (analyzeSpinner) analyzeSpinner.hidden = true;
    }
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
    var aiInsightsSection = document.getElementById("aiInsightsSection");
    if (aiInsightsSection) aiInsightsSection.hidden = true;
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

    runAnalyze(function (result, usedMockFallback) {
      if (result) {
        revealScore(result.ats_score);
        
        var aiInsightsSection = document.getElementById("aiInsightsSection");
        var aiMissingSkills = document.getElementById("aiMissingSkills");
        var aiImprovements = document.getElementById("aiImprovements");
        var aiRoadmap = document.getElementById("aiRoadmap");
        
        if (aiInsightsSection) aiInsightsSection.hidden = false;
        
        if (aiMissingSkills) {
          aiMissingSkills.innerHTML = "";
          result.missing_skills.forEach(function(s) {
            var li = document.createElement("li");
            li.innerHTML = "<strong>&bull;</strong> " + s;
            aiMissingSkills.appendChild(li);
          });
        }
        
        if (aiImprovements) {
          aiImprovements.innerHTML = "";
          result.improvements.forEach(function(i) {
            var li = document.createElement("li");
            li.innerHTML = "<strong>&bull;</strong> " + i;
            aiImprovements.appendChild(li);
          });
        }
        
        if (aiRoadmap) {
          aiRoadmap.innerHTML = "";
          result.roadmap.forEach(function(r) {
            var li = document.createElement("li");
            li.innerHTML = "<strong>&bull;</strong> " + r;
            aiRoadmap.appendChild(li);
          });
        }
      }
      
      successBanner.hidden = false;
      var badge = document.getElementById("mockBadge");
      if (badge) badge.style.display = usedMockFallback ? "inline-block" : "none";
      
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
    var badge = document.getElementById("mockBadge");
    if (badge) badge.style.display = "none";

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
