const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads";

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Fetch data with sorting by year desc
async function fetchData(query, page = 0) {
  const start = page * 20;
  const url = `${API_BASE}${query}&sort[]=year desc&sort[]=downloads desc${OUTPUT}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

// Render items in grid
function renderGrid(items, containerId, append = false) {
  const container = document.getElementById(containerId);
  if (!append) container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator || "Unknown"} (${item.year || "N/A"})</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Load homepage trending
async function loadHomeTrending() {
  renderGrid(await fetchData("collection:moviesandfilms"), "trendingMovies");
  renderGrid(await fetchData("collection:animationandcartoons"), "trendingCartoons");
  renderGrid(await fetchData("collection:sports"), "trendingSports");
  renderGrid(await fetchData("collection:anime"), "trendingAnime");
  renderGrid(await fetchData("collection:television"), "trendingTV");
}

// Category loader
async function loadCategory(cat) {
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;

  let query = "";
  if (cat === "movies") query = "collection:moviesandfilms";
  if (cat === "cartoons") query = "collection:animationandcartoons";
  if (cat === "sports") query = "collection:sports";
  if (cat === "anime") query = "collection:anime";
  if (cat === "television") query = "collection:television";

  currentQuery = query;
  const items = await fetchData(query, currentPage);
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  renderGrid(items, "movieGrid");
  document.getElementById("loading").style.display = "none";
}

// Auto load more on scroll
window.addEventListener("scroll", async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading && currentQuery) {
    isLoading = true;
    currentPage++;
    document.getElementById("loading").style.display = "block";
    const more = await fetchData(currentQuery, currentPage);
    renderGrid(more, "movieGrid", true);
    document.getElementById("loading").style.display = "none";
    isLoading = false;
  }
});

// Search
async function searchMovies() {
  const term = document.getElementById("searchInput").value;
  if (!term) return;
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentQuery = term;
  currentPage = 0;
  const results = await fetchData(term, currentPage);
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  renderGrid(results, "movieGrid");
  document.getElementById("loading").style.display = "none";
}

// Load homepage trending first
loadHomeTrending();
