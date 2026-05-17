(function () {
  var geminiKeyInput = document.getElementById("geminiKey");
  var toggleVisBtn = document.getElementById("toggleVisBtn");
  var connectBtn = document.getElementById("connectBtn");
  var disconnectBtn = document.getElementById("disconnectBtn");
  var apiStatus = document.getElementById("apiStatus");
  var statusText = apiStatus.querySelector(".st-status__text");
  var toastMsg = document.getElementById("toastMsg");
  var toastText = document.getElementById("toastText");

  var LOCAL_STORAGE_KEY = "geminiApiKey";

  function showToast(msg, isError) {
    toastText.textContent = msg;
    if (isError) {
      toastMsg.style.borderLeftColor = "#ff4d4d";
      toastMsg.querySelector("svg").innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
    } else {
      toastMsg.style.borderLeftColor = "#34d399";
      toastMsg.querySelector("svg").innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
    }
    toastMsg.classList.add("is-visible");
    setTimeout(function() {
      toastMsg.classList.remove("is-visible");
    }, 3000);
  }

  function updateStatusUI() {
    var key = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (key) {
      geminiKeyInput.value = key;
      apiStatus.classList.add("is-connected");
      statusText.textContent = "Connected";
      connectBtn.textContent = "Update Key";
      disconnectBtn.classList.remove("st-hidden");
    } else {
      geminiKeyInput.value = "";
      apiStatus.classList.remove("is-connected");
      statusText.textContent = "Disconnected";
      connectBtn.textContent = "Connect Gemini API";
      disconnectBtn.classList.add("st-hidden");
    }
  }

  // Toggle visibility
  if (toggleVisBtn && geminiKeyInput) {
    toggleVisBtn.addEventListener("click", function () {
      if (geminiKeyInput.type === "password") {
        geminiKeyInput.type = "text";
        toggleVisBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      } else {
        geminiKeyInput.type = "password";
        toggleVisBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    });
  }

  // Connect/Save
  if (connectBtn && geminiKeyInput) {
    connectBtn.addEventListener("click", function () {
      var val = geminiKeyInput.value.trim();
      if (!val) {
        geminiKeyInput.classList.add("is-error");
        showToast("Please enter a valid API key.", true);
        return;
      }
      geminiKeyInput.classList.remove("is-error");
      
      // Basic validation: Gemini keys usually start with AIzaSy
      if (!val.startsWith("AIzaSy") && val.length < 20) {
        geminiKeyInput.classList.add("is-error");
        showToast("Key appears invalid. Must be a Gemini API key.", true);
        return;
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, val);
      updateStatusUI();
      showToast("Gemini API Key saved successfully.", false);
    });
  }

  // Disconnect/Remove
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", function () {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      geminiKeyInput.classList.remove("is-error");
      updateStatusUI();
      showToast("API Key removed from local storage.", false);
    });
  }

  // Remove error state on typing
  if (geminiKeyInput) {
    geminiKeyInput.addEventListener("input", function() {
      geminiKeyInput.classList.remove("is-error");
    });
  }

  // Initialize
  updateStatusUI();
})();
