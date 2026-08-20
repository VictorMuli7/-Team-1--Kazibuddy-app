const form = document.getElementById("login-form");
const errorBox = document.getElementById("form-error");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

function attemptLogin(email, password) {
  errorBox.style.color = "#b00020";
  errorBox.textContent = "";

  const result = jkLogin(email, password);

  if (!result.ok) {
    errorBox.textContent = result.error;
    return;
  }

  errorBox.style.color = "#1a6e3c";
  errorBox.textContent = `Welcome back, ${result.user.fullname.split(" ")[0]}! Redirecting...`;

  setTimeout(() => {
    window.location.href = jkDashboardFor(result.user.role);
  }, 500);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    errorBox.style.color = "#b00020";
    errorBox.textContent = "Please enter a valid email and password.";
    form.reportValidity();
    return;
  }

  attemptLogin(emailInput.value.trim(), passwordInput.value);
});

document.querySelectorAll(".demo-login-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const email = btn.dataset.email;
    const password = btn.dataset.password;
    emailInput.value = email;
    passwordInput.value = password;
    attemptLogin(email, password);
  });
});
