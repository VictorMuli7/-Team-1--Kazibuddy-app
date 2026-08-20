const session = jkRequireRole(["admin"]);

let currentFilter = "all";

function renderStats() {
  const users = jkGetUsers();
  const bookings = jkGetBookings();

  document.getElementById("stat-total-users").textContent = users.length;
  document.getElementById("stat-pending-verification").textContent =
    users.filter(u => u.role === "artisan" && !u.verified).length;
  document.getElementById("stat-total-bookings").textContent = bookings.length;
  document.getElementById("stat-suspended").textContent =
    users.filter(u => u.status === "suspended").length;
}

function renderUsers() {
  const users = jkGetUsers();
  const filtered = currentFilter === "all" ? users : users.filter(u => u.role === currentFilter);
  const tbody = document.getElementById("users-body");
  tbody.innerHTML = "";

  filtered.forEach(u => {
    const row = document.createElement("tr");

    let actions = "";
    if (u.role === "artisan" && !u.verified && u.status !== "suspended") {
      actions += `<button class="btn-sm btn-verify" data-id="${u.id}" data-action="verify">Verify</button>`;
    }
    if (u.status === "suspended") {
      actions += `<button class="btn-sm btn-activate" data-id="${u.id}" data-action="activate">Reactivate</button>`;
    } else if (u.role !== "admin") {
      actions += `<button class="btn-sm btn-suspend" data-id="${u.id}" data-action="suspend">Suspend</button>`;
    }
    if (!actions) actions = "—";

    let statusBadge = `<span class="badge badge-${u.status}">${u.status}</span>`;
    if (u.role === "artisan") {
      statusBadge += ` <span class="badge badge-${u.verified ? "verified" : "unverified"}">${u.verified ? "verified" : "unverified"}</span>`;
    }

    row.innerHTML = `
      <td>${u.fullname}<br><span style="color:#888; font-size:0.78rem;">${u.email}</span></td>
      <td style="text-transform:capitalize;">${u.role}</td>
      <td>${u.skill || "—"}</td>
      <td>${u.joined}</td>
      <td>${statusBadge}</td>
      <td><div class="dashboard-actions-cell">${actions}</div></td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const users = jkGetUsers();
      const target = users.find(u => u.id === id);
      if (!target) return;

      if (action === "verify") target.verified = true;
      if (action === "suspend") target.status = "suspended";
      if (action === "activate") target.status = "active";

      jkSaveUsers(users);
      renderStats();
      renderUsers();
    });
  });
}

function renderBookings() {
  const bookings = [...jkGetBookings()].sort((a, b) => a.date < b.date ? 1 : -1);
  const tbody = document.getElementById("bookings-body");
  tbody.innerHTML = "";

  bookings.forEach(b => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.customerName}</td>
      <td>${b.artisanName}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.price}</td>
      <td><span class="badge badge-${b.status}">${b.status}</span></td>
    `;
    tbody.appendChild(row);
  });
}

if (session) {
  document.getElementById("welcome-heading").textContent = `Welcome back, ${session.fullname.split(" ")[0]}`;

  renderStats();
  renderUsers();
  renderBookings();

  document.getElementById("role-filter").addEventListener("change", (e) => {
    currentFilter = e.target.value;
    renderUsers();
  });
}
