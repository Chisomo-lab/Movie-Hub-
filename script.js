const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,description,downloads";

async function fetchData(query, sort="downloads desc") {
  const url = `${API_BASE}${query}&sort[]=${encodeURIComponent(sort)}${OUTPUT}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

function renderGrid(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
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

// Load Categories
async function loadCategory(cat) {
  let query = "";
  if (cat === "movies") query = "collection:movies";
  if (cat === "cartoons") query = "collection:cartoons";
  if (cat === "sports") query = "collection:sports OR collection:football";
  if (cat === "anime") query = "collection:anime";

  const items = await fetchData(query);
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  renderGrid(items, "movieGrid");
}

// Trending Section
async function loadTrending() {
  // First load football (sorted by downloads/views)
  const football = await fetchData("collection:sports OR collection:football", "downloads desc");
  renderGrid(football, "trendingContainer");
}

// Search
async function searchMovies() {
  const term = document.getElementById("searchInput").value;
  if (!term) return;
  const results = await fetchData(term, "downloads desc");
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  renderGrid(results, "movieGrid");
}

// Load default
loadCategory("movies");
loadTrending();
