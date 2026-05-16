/**
 * Stub handlers — wire login/signup to your auth provider.
 */
document.querySelectorAll("form[data-auth-form]").forEach((form) => {
  const confirm = form.querySelector("#password-confirm");
  if (confirm) {
    const pw = form.querySelector("#password");
    confirm.addEventListener("input", () => confirm.setCustomValidity(""));
    pw?.addEventListener("input", () => confirm.setCustomValidity(""));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const pw = form.querySelector("#password");
    const confirm = form.querySelector("#password-confirm");
    if (pw && confirm && pw.value !== confirm.value) {
      confirm.setCustomValidity("Passwords must match.");
      confirm.reportValidity();
      return;
    }
    confirm?.setCustomValidity("");
  });
});

document.querySelectorAll("[data-google-auth]").forEach((btn) => {
  btn.addEventListener("click", () => {
    console.info("[CareerOS] Connect Google OAuth here.");
  });
});
