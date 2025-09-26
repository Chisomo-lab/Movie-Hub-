const LINKS = {
  movies: "https://archive.org/advancedsearch.php?q=collection:moviesandfilms AND mediatype:movies&output=json&rows=20",
  cartoons: "https://archive.org/advancedsearch.php?q=collection:animationandcartoons AND mediatype:movies&output=json&rows=20",
  sports: "https://archive.org/advancedsearch.php?q=collection:sports AND mediatype:movies&output=json&rows=20",
  anime: "https://archive.org/advancedsearch.php?q=collection:anime AND mediatype:movies&output=json&rows=20",
  anime_misc: "https://archive.org/advancedsearch.php?q=collection:anime_miscellaneous AND mediatype:movies&output=json&rows=20",
  television: "https://archive.org/advancedsearch.php?q=collection:television AND mediatype:movies&output=json&rows=20",
  popcorn: "https://archive.org/advancedsearch.php?q=collection:popcornproject AND mediatype:movies&output=json&rows=20"
};

let currentCategory = "movies";
let currentPage = 0;
let isLoading = false;

async function fetchVideos(url, page = 0) {
  const start = page * 20;
  const fullUrl = `${url}&start=${start}`;
  const res = await fetch(fullUrl);
  const data = await res.json();
  return data.response.docs || [];
}

function renderGrid(items, containerId, append = false) {
  const container = document.getElementById(containerId);
  if (!append) container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = "<p style='color:#aaa;text-align:center;'>No videos found.</p>";
    return;
  }
  items.forEach(item => {
    if (!item.identifier) return;
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

function scrollLeft(id) { document.getElementById(id).scrollBy({ left: -400, behavior: "smooth" }); }
function scrollRight(id) { document.getElementById(id).scrollBy({ left: 400, behavior: "smooth" }); }

async function loadHomeTrending() {
  const trendingContainer = document.getElementById("trendingContainer");
  trendingContainer.innerHTML = "";
  for (let cat in LINKS) {
    const videos = await fetchVideos(LINKS[cat], 0);
    if (videos.length > 0) {
      videos.slice(0, 5).forEach(item => {
        if (!item.identifier) return;
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
          <h3>${item.title}</h3>
          <div class="buttons">
            <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
            <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
          </div>
        `;
        trendingContainer.appendChild(div);
      });
    }
  }
}

async function loadCategory(cat, append = false) {
  const grid = document.getElementById("movieGrid");
  if (!append) grid.innerHTML = "";
  currentCategory = cat;

  let items = [];
  if (cat === "sports") {
    const all = await fetchVideos(LINKS.sports, currentPage);
    const football = all.filter(v => v.title.toLowerCase().includes("football"))
                        .sort((a,b) => (b.year || 0) - (a.year || 0));
    const others = all.filter(v => !v.title.toLowerCase().includes("football"))
                      .sort((a,b) => (b.year || 0) - (a.year || 0));
    items = football.concat(others);
  } else if (cat === "anime") {
    const a1 = await fetchVideos(LINKS.anime, currentPage);
    const a2 = await fetchVideos(LINKS.anime_misc, currentPage);
    items = a1.concat(a2);
  } else {
    const linkKey = LINKS[cat] || LINKS.movies;
    items = await fetchVideos(linkKey, currentPage);
  }

  renderGrid(items, "movieGrid", append);
  document.getElementById("categoryTitle").innerText = cat === "popcorn" ? "Popcorn Picks" : cat.toUpperCase();
}

window.addEventListener("scroll", async () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading) {
    isLoading = true;
    currentPage++;
    await loadCategory(currentCategory, true);
    isLoading = false;
  }
});

async function searchMovies() {
  const term = document.getElementById("searchInput").value;
  if (!term) return;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)} AND mediatype:movies&output=json&rows=20`;
  const results = await fetchVideos(url, 0);
  document.getElementById("movieGrid").innerHTML = "";
  renderGrid(results, "movieGrid");
  document.getElementById("categoryTitle").innerText = `Results: "${term}"`;
}

// Initialize
loadHomeTrending();
loadCategory("movies");
