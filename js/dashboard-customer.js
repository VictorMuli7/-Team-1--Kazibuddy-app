const session = jkRequireRole(["customer"]);

if (session) {
  document.getElementById("welcome-heading").textContent = `Welcome back, ${session.fullname.split(" ")[0]}`;

  const bookings = jkGetBookings().filter(b => b.customerId === session.id);

  const upcoming = bookings.filter(b => b.status === "upcoming").length;
  const pending = bookings.filter(b => b.status === "pending").length;
  const completed = bookings.filter(b => b.status === "completed");
  const totalSpent = completed.reduce((sum, b) => {
    const n = parseInt(String(b.price).replace(/[^0-9]/g, ""), 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  document.getElementById("stat-upcoming").textContent = upcoming;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-completed").textContent = completed.length;
  document.getElementById("stat-spent").textContent = "KES " + totalSpent.toLocaleString();

  const tbody = document.getElementById("bookings-body");
  const emptyMsg = document.getElementById("bookings-empty");
  const table = document.getElementById("bookings-table");

  if (bookings.length === 0) {
    table.hidden = true;
    emptyMsg.hidden = false;
  } else {
    const sorted = [...bookings].sort((a, b) => a.date < b.date ? 1 : -1);
    sorted.forEach(b => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${b.service}</td>
        <td>${b.artisanName}</td>
        <td>${b.date}</td>
        <td>${b.price}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
}
