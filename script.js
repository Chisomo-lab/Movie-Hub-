const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads";

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Fetch items descending by year then downloads
async function fetchData(query, page = 0) {
  const start = page * 20;
  const url = `${API_BASE}${query}&sort[]=year desc&sort[]=downloads desc${OUTPUT}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

// Render cards in container
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

// Load homepage trending & sub-categories
async function loadHomeTrending() {
  // Movies
  renderGrid(await fetchData("collection:moviesandfilms"), "trendingMovies");
  renderGrid(await fetchData("collection:moviesandfilms AND subject:colorized"), "trendingMoviesColorized");
  renderGrid(await fetchData("collection:moviesandfilms AND subject:science-fiction"), "trendingMoviesSciFi");
  renderGrid
