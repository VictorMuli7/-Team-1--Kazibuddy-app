/* ============================================================
   Jua Kali — Mock Auth Module
   Front-end only. Uses localStorage as a fake database so the
   sign in / sign up / dashboards flow can be demoed without a
   real backend. Nothing here is secure — do not use as-is in
   production.
   ============================================================ */

const JK_USERS_KEY = "jk_users";
const JK_SESSION_KEY = "jk_session";
const JK_BOOKINGS_KEY = "jk_bookings";

/* ---------- Seed mock data (only runs once) ---------- */
function jkSeedIfNeeded() {
  if (!localStorage.getItem(JK_USERS_KEY)) {
    const users = [
      { id: "u-admin",    role: "admin",    fullname: "Grace Mwangi",    email: "admin@juakali.com",       phone: "+254 700 000 001", password: "admin123",    status: "active",   joined: "2024-01-10" },
      { id: "u-customer", role: "customer", fullname: "Brian Otieno",    email: "customer@juakali.com",    phone: "+254 700 000 002", password: "customer123", status: "active",   joined: "2024-03-02" },
      { id: "u-artisan",  role: "artisan",  fullname: "Faith Wanjiru",   email: "artisan@juakali.com",     phone: "+254 700 000 003", password: "artisan123",  status: "active",   skill: "Hair Styling", verified: true,  bio: "Braids, perms, treatments and cuts. 6 years experience, home visits available.", rate: "From KES 500/style", joined: "2024-02-14" },
      { id: "u-a2",       role: "artisan",  fullname: "Peter Kamau",     email: "peter.kamau@example.com", phone: "+254 711 000 004", password: "pass1234",    status: "pending",  skill: "Plumbing",     verified: false, bio: "Pipe installation, leak repairs and blockages.", rate: "From KES 700/hr", joined: "2025-06-20" },
      { id: "u-a3",       role: "artisan",  fullname: "Mercy Achieng",   email: "mercy.a@example.com",     phone: "+254 722 000 005", password: "pass1234",    status: "active",   skill: "Electrical",   verified: true,  bio: "Licensed electrician, wiring and fault-finding.", rate: "From KES 500/hr", joined: "2024-11-05" },
      { id: "u-c2",       role: "customer", fullname: "Samuel Njoroge",  email: "samuel.n@example.com",    phone: "+254 733 000 006", password: "pass1234",    status: "active",   joined: "2025-01-18" },
      { id: "u-c3",       role: "customer", fullname: "Lucy Wambui",     email: "lucy.w@example.com",      phone: "+254 744 000 007", password: "pass1234",    status: "suspended", joined: "2025-04-09" },
    ];
    localStorage.setItem(JK_USERS_KEY, JSON.stringify(users));
  }

  if (!localStorage.getItem(JK_BOOKINGS_KEY)) {
    const bookings = [
      { id: "b1", customerId: "u-customer", customerName: "Brian Otieno",   service: "Hair Styling", artisanId: "u-artisan", artisanName: "Faith Wanjiru", date: "2026-07-14", status: "upcoming",  price: "KES 500" },
      { id: "b2", customerId: "u-customer", customerName: "Brian Otieno",   service: "Plumbing",     artisanId: "u-a2",      artisanName: "Peter Kamau",   date: "2026-06-30", status: "completed", price: "KES 700" },
      { id: "b3", customerId: "u-c2",       customerName: "Samuel Njoroge", service: "Hair Styling", artisanId: "u-artisan", artisanName: "Faith Wanjiru", date: "2026-07-17", status: "pending",   price: "KES 500" },
      { id: "b4", customerId: "u-c2",       customerName: "Samuel Njoroge", service: "Electrical",   artisanId: "u-a3",      artisanName: "Mercy Achieng", date: "2026-06-20", status: "completed", price: "KES 1,500" },
      { id: "b5", customerId: "u-c3",       customerName: "Lucy Wambui",    service: "Hair Styling", artisanId: "u-artisan", artisanName: "Faith Wanjiru", date: "2026-07-20", status: "pending",   price: "KES 500" },
    ];
    localStorage.setItem(JK_BOOKINGS_KEY, JSON.stringify(bookings));
  }
}

/* ---------- Storage helpers ---------- */
function jkGetUsers() { return JSON.parse(localStorage.getItem(JK_USERS_KEY) || "[]"); }
function jkSaveUsers(users) { localStorage.setItem(JK_USERS_KEY, JSON.stringify(users)); }
function jkGetBookings() { return JSON.parse(localStorage.getItem(JK_BOOKINGS_KEY) || "[]"); }
function jkSaveBookings(bookings) { localStorage.setItem(JK_BOOKINGS_KEY, JSON.stringify(bookings)); }

function jkFindUserByEmail(email) {
  return jkGetUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/* ---------- Session ---------- */
function jkSetSession(user) {
  const session = { id: user.id, role: user.role, fullname: user.fullname, email: user.email };
  localStorage.setItem(JK_SESSION_KEY, JSON.stringify(session));
}

function jkGetSession() {
  try { return JSON.parse(localStorage.getItem(JK_SESSION_KEY)); }
  catch (e) { return null; }
}

function jkLogout() {
  localStorage.removeItem(JK_SESSION_KEY);
}

/* ---------- Auth actions ---------- */
function jkLogin(email, password) {
  const user = jkFindUserByEmail(email);
  if (!user) return { ok: false, error: "No account found with that email." };
  if (user.password !== password) return { ok: false, error: "Incorrect password." };
  if (user.status === "suspended") return { ok: false, error: "This account has been suspended. Contact support." };
  jkSetSession(user);
  return { ok: true, user };
}

function jkRegister({ role, fullname, email, phone, password, skill }) {
  if (jkFindUserByEmail(email)) {
    return { ok: false, error: "An account with that email already exists." };
  }
  const users = jkGetUsers();
  const id = "u-" + Date.now();
  const newUser = {
    id, role, fullname, email, phone, password,
    status: role === "artisan" ? "pending" : "active",
    joined: new Date().toISOString().slice(0, 10),
  };
  if (role === "artisan") {
    newUser.skill = skill;
    newUser.verified = false;
    newUser.bio = "";
    newUser.rate = "Not set yet";
  }
  users.push(newUser);
  jkSaveUsers(users);
  jkSetSession(newUser);
  return { ok: true, user: newUser };
}

/* ---------- Booking creation ---------- */
/* Finds an artisan to assign a new booking to: prefers a verified, active
   artisan whose skill matches the service title; falls back to any
   verified/active artisan so every booking always lands on someone's
   dashboard for this demo. */
function jkFindArtisanForService(serviceTitle) {
  const artisans = jkGetUsers().filter(u => u.role === "artisan" && u.status === "active" && u.verified);
  const norm = s => (s || "").toLowerCase();
  const direct = artisans.find(a => norm(a.skill) === norm(serviceTitle));
  if (direct) return direct;
  const partial = artisans.find(a => norm(a.skill).includes(norm(serviceTitle)) || norm(serviceTitle).includes(norm(a.skill)));
  if (partial) return partial;
  return artisans[0] || null;
}

/* Creates a booking for the currently signed-in customer. */
function jkCreateBooking({ serviceTitle, price, date }) {
  const session = jkGetSession();
  if (!session || session.role !== "customer") {
    return { ok: false, error: "You need to be signed in as a customer to book a service." };
  }
  const artisan = jkFindArtisanForService(serviceTitle);
  if (!artisan) {
    return { ok: false, error: "No artisan is currently available for this service. Please try again later." };
  }
  const booking = {
    id: "b-" + Date.now(),
    customerId: session.id,
    customerName: session.fullname,
    service: serviceTitle,
    artisanId: artisan.id,
    artisanName: artisan.fullname,
    date,
    status: "pending",
    price,
  };
  const bookings = jkGetBookings();
  bookings.push(booking);
  jkSaveBookings(bookings);
  return { ok: true, booking };
}

function jkDashboardFor(role) {
  if (role === "admin") return "dashboard-admin.html";
  if (role === "artisan") return "dashboard-artisan.html";
  return "dashboard-customer.html";
}

/* Redirects to login if not signed in / wrong role. Returns the session or null. */
function jkRequireRole(roles) {
  const session = jkGetSession();
  if (!session || !roles.includes(session.role)) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

/* ---------- Shared header rendering ---------- */
function jkRenderNavAuth() {
  const slot = document.getElementById("nav-auth-slot");
  if (!slot) return;
  const session = jkGetSession();
  if (session) {
    const firstName = session.fullname.split(" ")[0];
    slot.innerHTML = `
      <div class="nav-item"><a href="${jkDashboardFor(session.role)}">Dashboard</a></div>
      <div class="nav-item"><a href="#" id="nav-logout-link">Logout (${firstName})</a></div>
    `;
    document.getElementById("nav-logout-link").addEventListener("click", (e) => {
      e.preventDefault();
      jkLogout();
      window.location.href = "index.html";
    });
  } else {
    slot.innerHTML = `
      <div class="nav-item"><a href="login.html">Sign In</a></div>
      <div class="nav-item"><a href="signup.html">Sign Up</a></div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  jkSeedIfNeeded();
  jkRenderNavAuth();
});
