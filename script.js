const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,description,downloads,year";

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Trending configuration
const trendingConfig = {
  movies: { query: "collection:movies", sort: "year desc", container: "trendingMovies" },
  cartoons: { query: "collection:cartoons", sort: "year desc", container: "trendingCartoons" },
  sports: { 
    query: "collection:football OR collection:sports", 
    sort: "year desc", 
    container: "trendingSports",
    prioritize: "collection:football" // Football first
  },
  anime: { query: "collection:anime", sort: "year desc", container: "trendingAnime" }
};

// Fetch data from Archive.org
async function fetchData(query, page = 0, sort = "year desc") {
  try {
    const start = page * 20;
    const url = `${API_BASE}${query}&sort[]=${encodeURIComponent(sort)}${OUTPUT}&start=${start}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    return data.response.docs;
  } catch (err) {
    console.error("Fetch Error:", err);
    return [];
  }
}

// Render grid items
function renderGrid(items, containerId, append = false) {
  const container = document.getElementById(containerId);
  if (!append) container.innerHTML = "";

  if (items.length === 0 && !append) {
    container.innerHTML = "<p style='text-align:center;'>😔 No results found.</p>";
    return;
  }

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

// Load home trending rows
async function loadHomeTrending() {
  for (const cat in trendingConfig) {
    const config = trendingConfig[cat];
    let items = [];

    // Prioritize special collection if defined (e.g., Football first)
    if (config.prioritize) {
      const prioritized = await fetchData(config.prioritize, 0, config.sort);
      const others = await fetchData(`${config.query} NOT ${config.prioritize}`, 0, config.sort);
      items = [...prioritized, ...others];
    } else {
      items = await fetchData(config.query, 0, config.sort);
    }

    renderGrid(items, config.container);
  }
}

// Load category into main grid (“See All”)
async function loadCategory(cat) {
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;

  let query = "";
  let sortOrder = "year desc"; // descending for all

  if (trendingConfig[cat]) {
    query = trendingConfig[cat].query;
    sortOrder = trendingConfig[cat].sort;
  } else {
    query = cat; // fallback for search term
  }

  currentQuery = query;
  const items = await fetchData(query, currentPage, sortOrder);
  document.getElementById("categoryTitle").innerText = `See All ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
  renderGrid(items, "movieGrid");
  document.getElementById("loading").style.display = "none";

  // Highlight active category
  document.querySelectorAll(".categories button").forEach(btn => btn.classList.remove("active"));
  const activeBtn = Array.from(document.querySelectorAll(".categories button")).find(
    b => b.getAttribute("onclick") === `loadCategory('${cat}')`
  );
  if (activeBtn) activeBtn.classList.add("active");
}

// Infinite scroll for main grid
window.addEventListener("scroll", async () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
    !isLoading &&
    currentQuery
  ) {
    isLoading = true;
    currentPage++;
    document.getElementById("loading").style.display = "block";

    let moreItems = [];

    const cat = Object.keys(trendingConfig).find(c => trendingConfig[c].query === currentQuery);
    if (cat && trendingConfig[cat].prioritize) {
      if (currentPage === 1) {
        const prioritized = await fetchData(trendingConfig[cat].prioritize, 0, trendingConfig[cat].sort);
        const others = await fetchData(`${trendingConfig[cat].query} NOT ${trendingConfig[cat].prioritize}`, currentPage, trendingConfig[cat].sort);
        moreItems = [...prioritized, ...others];
      } else {
        moreItems = await fetchData(`${trendingConfig[cat].query} NOT ${trendingConfig[cat].prioritize}`, currentPage, trendingConfig[cat].sort);
      }
    } else {
      moreItems = await fetchData(currentQuery, currentPage, "year desc");
    }

    if (moreItems.length > 0) renderGrid(moreItems, "movieGrid", true);
    document.getElementById("loading").style.display = "none";
    isLoading = false;
  }
});

// Search functionality
async function searchMovies() {
  const term = document.getElementById("searchInput").value.trim();
  if (!term) return;

  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentQuery = `title:${term} OR description:${term}`;
  currentPage = 0;

  const results = await fetchData(currentQuery, currentPage);
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  renderGrid(results, "movieGrid");
  document.getElementById("loading").style.display = "none";
}

// Initial load
loadHomeTrending();
