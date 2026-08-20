// Seed reviews data
const seedReviews = [
  { name: "Amina W.", category: "Laundry", stars: 5, date: "2025-06-20", text: "Absolutely fantastic! My clothes came back perfectly clean and ironed. The pickup and delivery was on time. I'll definitely use this service again." },
  { name: "Brian O.", category: "Plumbing", stars: 5, date: "2025-06-18", text: "Fixed a stubborn leak under my sink in under an hour. Very professional and the price was fair. Highly recommend!" },
  { name: "Grace M.", category: "Hair Styling", stars: 4, date: "2025-06-15", text: "Lovely braiding work. Took a bit longer than expected but the result was beautiful. Will book again." },
  { name: "David K.", category: "Electrical", stars: 5, date: "2025-06-12", text: "Sorted out my faulty wiring safely and quickly. The electrician explained everything clearly. Very satisfied." },
  { name: "Fatuma A.", category: "Cleaning", stars: 5, date: "2025-06-10", text: "My office has never looked this spotless. The team was thorough and professional. Booking regularly from now on." },
  { name: "James N.", category: "Barber", stars: 5, date: "2025-06-08", text: "Best fade I've had in years. The barber came to my house which was super convenient. 10/10!" },
  { name: "Wanjiru P.", category: "Cooking", stars: 4, date: "2025-06-05", text: "Prepared a lovely three-course dinner for a family gathering. Everyone loved the food. Will use again for our next event." },
  { name: "Samuel L.", category: "Gardening", stars: 5, date: "2025-06-02", text: "Transformed my overgrown yard into a beautiful garden. Hardworking and creative. Could not be happier!" },
  { name: "Celestine R.", category: "Laundry", stars: 5, date: "2025-05-30", text: "Used the service three times now. Consistent quality every time. My go-to laundry solution." },
  { name: "Michael A.", category: "Electrical", stars: 3, date: "2025-05-27", text: "Work was done correctly but took longer than quoted. Would appreciate better time estimates upfront." },
  { name: "Halima S.", category: "Hair Styling", stars: 5, date: "2025-05-25", text: "Incredible box braids done at home! Saved me the trip to the salon and the stylist was so gentle and skilled." },
  { name: "Peter M.", category: "Plumbing", stars: 4, date: "2025-05-22", text: "Good work replacing bathroom fixtures. The plumber was polite and cleaned up after. Minor delay but overall great." },
  { name: "Nancy G.", category: "Cleaning", stars: 5, date: "2025-05-19", text: "Deep cleaned my entire apartment before moving in. Every corner was spotless. Worth every shilling!" },
  { name: "Tom O.", category: "Barber", stars: 5, date: "2025-05-17", text: "Precise cut, great conversation. This is convenience at its finest. I've told all my friends about Jua Kali." },
  { name: "Aisha K.", category: "Cooking", stars: 5, date: "2025-05-14", text: "Hired a chef for my parents' anniversary dinner. The food was restaurant-quality and the presentation was amazing." },
  { name: "Collins O.", category: "Gardening", stars: 4, date: "2025-05-10", text: "Reliable gardener who maintains my lawn every two weeks. Always leaves it looking neat and tidy." },
];

// Load user-submitted reviews from localStorage and merge
function loadAllReviews() {
  const stored = JSON.parse(localStorage.getItem("jk_reviews") || "[]");
  return [...stored, ...seedReviews];
}

let allReviews = loadAllReviews();
let selectedStars = 0;

// Render reviews
function renderReviews(reviews) {
  const list = document.getElementById("reviews-list");
  const noMsg = document.getElementById("no-reviews-msg");
  list.innerHTML = "";

  if (reviews.length === 0) {
    noMsg.hidden = false;
    return;
  }
  noMsg.hidden = true;

  reviews.forEach(r => {
    const stars = "★".repeat(r.stars) + "☆".repeat(5 - r.stars);
    const div = document.createElement("div");
    div.className = "review-card";
    div.innerHTML = `
      <div class="review-header">
        <span class="review-name">${escHtml(r.name)}</span>
        <span class="review-category">${escHtml(r.category)}</span>
        <span class="review-stars">${stars}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <p class="review-text">${escHtml(r.text)}</p>
    `;
    list.appendChild(div);
  });
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function filterReviews() {
  const cat = document.getElementById("filter-category").value;
  const stars = document.getElementById("filter-stars").value;
  let filtered = allReviews;
  if (cat !== "all") filtered = filtered.filter(r => r.category === cat);
  if (stars !== "all") filtered = filtered.filter(r => r.stars === parseInt(stars));
  renderReviews(filtered);
}

// Star picker
const starEls = document.querySelectorAll(".star");
starEls.forEach(s => {
  s.addEventListener("click", () => {
    selectedStars = parseInt(s.dataset.val);
    document.getElementById("rev-rating").value = selectedStars;
    starEls.forEach(st => {
      st.classList.toggle("star-active", parseInt(st.dataset.val) <= selectedStars);
    });
  });
  s.addEventListener("mouseover", () => {
    starEls.forEach(st => {
      st.classList.toggle("star-hover", parseInt(st.dataset.val) <= parseInt(s.dataset.val));
    });
  });
  s.addEventListener("mouseout", () => {
    starEls.forEach(st => st.classList.remove("star-hover"));
  });
});

function submitReview() {
  const name = document.getElementById("rev-name").value.trim();
  const category = document.getElementById("rev-category").value;
  const rating = parseInt(document.getElementById("rev-rating").value);
  const text = document.getElementById("rev-text").value.trim();
  const errEl = document.getElementById("rev-error");
  const successEl = document.getElementById("rev-success");

  errEl.textContent = "";
  successEl.hidden = true;

  if (!name) { errEl.textContent = "Please enter your name."; return; }
  if (!category) { errEl.textContent = "Please select a service."; return; }
  if (!rating) { errEl.textContent = "Please select a star rating."; return; }
  if (text.length < 10) { errEl.textContent = "Please write at least 10 characters in your review."; return; }

  const newReview = {
    name, category, stars: rating, text,
    date: new Date().toISOString().split("T")[0]
  };

  const stored = JSON.parse(localStorage.getItem("jk_reviews") || "[]");
  stored.unshift(newReview);
  localStorage.setItem("jk_reviews", JSON.stringify(stored));
  allReviews = loadAllReviews();

  // Reset form
  document.getElementById("rev-name").value = "";
  document.getElementById("rev-category").value = "";
  document.getElementById("rev-text").value = "";
  document.getElementById("rev-rating").value = "0";
  selectedStars = 0;
  starEls.forEach(s => s.classList.remove("star-active"));

  successEl.hidden = false;
  filterReviews();
  renderCategoryRatings();
}

// Category ratings summary
const categoryData = [
  { name: "Laundry", rating: 4.9, count: 312 },
  { name: "Cleaning", rating: 4.8, count: 275 },
  { name: "Electrical", rating: 4.7, count: 189 },
  { name: "Gardening", rating: 4.9, count: 143 },
  { name: "Hair Styling", rating: 4.8, count: 230 },
  { name: "Barber", rating: 4.9, count: 298 },
  { name: "Plumbing", rating: 4.7, count: 167 },
  { name: "Cooking", rating: 4.8, count: 212 },
];

function renderCategoryRatings() {
  const el = document.getElementById("category-ratings");
  el.innerHTML = categoryData.map(c => `
    <div class="cat-rating-item">
      <span class="cat-rating-name">${c.name}</span>
      <div class="cat-rating-bar-wrap">
        <div class="cat-rating-bar" style="width:${(c.rating/5)*100}%"></div>
      </div>
      <span class="cat-rating-val">${c.rating} ⭐ (${c.count})</span>
    </div>
  `).join("");
}

// Init
renderReviews(allReviews);
renderCategoryRatings();
