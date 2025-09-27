const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,description,year,downloads";

// Category mappings for archive.org links
const CATEGORY_LINKS = {
  movies: "moviesandfilms",
  cartoons: "animationandcartoons",
  sports: "sports",
  anime: "anime",
  popcorn: "popcornproject"
};

let currentCategory = "movies";
let currentPage = 0;
let isLoading = false;

// Fetch data from archive.org
async function fetchData(category, page = 0, sort = "downloads desc") {
  const start = page * 20;
  let query = "";
  if (category === "sports") {
    // Filter football first
    query = `collection:${CATEGORY_LINKS[category]} AND title:football`;
  } else {
    query = `collection:${CATEGORY_LINKS[category]}`;
  }
  const url = `${API_BASE}${encodeURIComponent(query)}&sort[]=${encodeURIComponent(sort)}${OUTPUT}&start=${start}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.response.docs;
  } catch (err) {
    console.error("Error fetching data:", err);
    return [];
  }
}

// Render 2x2 window style grid
function renderGrid(items, containerId, append = false) {
  const container = document.getElementById(containerId);
  if (!append) container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator || "Unknown"}</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Load category content
async function loadCategory(category) {
  currentCategory = category;
  currentPage = 0;
  const items = await fetchData(category, currentPage);
  document.getElementById("video-grid").innerHTML = "";
  renderGrid(items, "video-grid");
}

// Infinite scroll for more content
window.addEventListener("scroll", async () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300 && !isLoading) {
    isLoading = true;
    currentPage++;
    const more = await fetchData(currentCategory, currentPage);
    renderGrid(more, "video-grid", true);
    isLoading = false;
  }
});

// Load trending videos only on the home page
async function loadTrending() {
  if (!document.getElementById("trending-grid")) return;
  const trendingItems = await fetchData("movies", 0, "downloads desc");
  renderGrid(trendingItems, "trending-grid");
}

// Search functionality
async function searchVideos() {
  const term = document.getElementById("searchInput")?.value;
  if (!term) return;
  document.getElementById("video-grid").innerHTML = "";
  const url = `${API_BASE}${encodeURIComponent(term)}&output=json&rows=20&fl[]=identifier,title,creator,description,year,downloads`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    renderGrid(data.response.docs, "video-grid");
  } catch (err) {
    console.error("Search error:", err);
  }
}

// Initial load for the home page
if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
  loadTrending();
}

// Expose loadCategory and search function for nav buttons
window.loadCategory = loadCategory;
window.searchVideos = searchVideos;
