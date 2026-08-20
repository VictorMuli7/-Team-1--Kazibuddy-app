const session = jkRequireRole(["artisan"]);

function getCurrentUser() {
  return jkGetUsers().find(u => u.id === session.id);
}

function renderStats(jobs) {
  const pending = jobs.filter(j => j.status === "pending").length;
  const upcoming = jobs.filter(j => j.status === "upcoming").length;
  const completed = jobs.filter(j => j.status === "completed");
  const earnings = completed.reduce((sum, j) => {
    const n = parseInt(String(j.price).replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-upcoming").textContent = upcoming;
  document.getElementById("stat-completed").textContent = completed.length;
  document.getElementById("stat-earnings").textContent = "KES " + earnings.toLocaleString();
}

function renderJobs() {
  const jobs = jkGetBookings().filter(b => b.artisanId === session.id);
  renderStats(jobs);

  const tbody = document.getElementById("jobs-body");
  const table = document.getElementById("jobs-table");
  const emptyMsg = document.getElementById("jobs-empty");
  tbody.innerHTML = "";

  if (jobs.length === 0) {
    table.hidden = true;
    emptyMsg.hidden = false;
    return;
  }
  table.hidden = false;
  emptyMsg.hidden = true;

  const sorted = [...jobs].sort((a, b) => a.date < b.date ? 1 : -1);

  sorted.forEach(job => {
    const row = document.createElement("tr");
    let actionHtml = "";
    if (job.status === "pending") {
      actionHtml = `
        <button class="btn-sm btn-accept" data-id="${job.id}" data-action="accept">Accept</button>
        <button class="btn-sm btn-decline" data-id="${job.id}" data-action="decline">Decline</button>
      `;
    } else if (job.status === "upcoming") {
      actionHtml = `<button class="btn-sm btn-complete" data-id="${job.id}" data-action="complete">Mark complete</button>`;
    } else {
      actionHtml = "—";
    }

    row.innerHTML = `
      <td>${job.customerName}</td>
      <td>${job.service}</td>
      <td>${job.date}</td>
      <td>${job.price}</td>
      <td><span class="badge badge-${job.status}">${job.status}</span></td>
      <td><div class="dashboard-actions-cell">${actionHtml}</div></td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const bookings = jkGetBookings();
      const booking = bookings.find(b => b.id === id);
      if (!booking) return;

      if (action === "accept") booking.status = "upcoming";
      if (action === "decline") booking.status = "declined";
      if (action === "complete") booking.status = "completed";

      jkSaveBookings(bookings);
      renderJobs();
    });
  });
}

if (session) {
  const user = getCurrentUser();

  document.getElementById("welcome-heading").textContent = `Welcome back, ${session.fullname.split(" ")[0]}`;
  document.getElementById("welcome-skill").textContent = `Your listing: ${user.skill || "No skill set"}`;

  const verifBadge = document.getElementById("verification-badge");
  if (user.verified) {
    verifBadge.textContent = "Verified artisan";
    verifBadge.classList.add("badge-verified");
  } else {
    verifBadge.textContent = "Pending verification";
    verifBadge.classList.add("badge-unverified");
    document.getElementById("pending-verification-note").hidden = false;
  }

  renderJobs();

  // Listing form
  document.getElementById("listing-skill").value = user.skill || "";
  document.getElementById("listing-rate").value = user.rate || "";
  document.getElementById("listing-bio").value = user.bio || "";

  document.getElementById("listing-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const users = jkGetUsers();
    const target = users.find(u => u.id === session.id);
    target.rate = document.getElementById("listing-rate").value.trim();
    target.bio = document.getElementById("listing-bio").value.trim();
    jkSaveUsers(users);

    const msg = document.getElementById("listing-msg");
    msg.style.color = "#1a6e3c";
    msg.textContent = "Listing saved.";
    setTimeout(() => { msg.textContent = ""; }, 2500);
  });
}
