const roleSelect = document.getElementById("role");
const skillGroup = document.getElementById("skill-group");
const skillSelect = document.getElementById("skill");
const form = document.getElementById("signup-form");
const errorBox = document.getElementById("form-error");


roleSelect.addEventListener("change", () => {
  const isArtisan = roleSelect.value === "artisan";
  skillGroup.hidden = !isArtisan;
  skillSelect.required = isArtisan;
  if (!isArtisan) {
    skillSelect.value = "";
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorBox.textContent = "";

  if (!form.checkValidity()) {
    errorBox.textContent = "Please fill in all required fields correctly.";
    form.reportValidity();
    return;
  }

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    errorBox.textContent = "Passwords do not match.";
    return;
  }

  const role = roleSelect.value;
  const fullname = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const skill = skillSelect.value;

  const result = jkRegister({ role, fullname, email, phone, password, skill });

  if (!result.ok) {
    errorBox.textContent = result.error;
    return;
  }

  const destination = jkDashboardFor(result.user.role);
  const message = role === "artisan"
    ? `Welcome to Jua Kali, ${fullname}! Your artisan account is created and pending verification — taking you to your dashboard...`
    : `Welcome to Jua Kali, ${fullname}! Taking you to your dashboard...`;

  errorBox.style.color = "#1a6e3c";
  errorBox.textContent = message;

  setTimeout(() => { window.location.href = destination; }, 900);
});
