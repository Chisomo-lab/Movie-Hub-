const LINKS = {
  movies: "https://archive.org/advancedsearch.php?q=collection:moviesandfilms AND mediatype:movies&output=json&rows=20",
  cartoons: "https://archive.org/advancedsearch.php?q=collection:animationandcartoons AND mediatype:movies AND (title:cartoon OR title:animated)&output=json&rows=20",
  sports: "https://archive.org/advancedsearch.php?q=collection:sports AND mediatype:movies&output=json&rows=20",
  anime: "https://archive.org/advancedsearch.php?q=collection:anime AND mediatype:movies&output=json&rows=20",
  anime_misc: "https://archive.org/advancedsearch.php?q=collection:anime_miscellaneous AND mediatype:movies&output=json&rows=20",
  television: "https://archive.org/advancedsearch.php?q=collection:television AND mediatype:movies&output=json&rows=20",
  popcorn: "https://archive.org/advancedsearch.php?q=collection:popcornproject AND mediatype:movies&output=json&rows=20"
};

let currentCategory = "movies";
let currentPage = 0;
let isLoading = false;
let trendingVideos = [];

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

async function loadHomeTrending() {
  const trendingContainer = document.getElementById("trendingContainer");
  trendingContainer.innerHTML = "";
  trendingVideos = [];
  for (let cat in LINKS) {
    const videos = await fetchVideos(LINKS[cat], 0);
    if (videos.length > 0) {
      const topVideos = videos.slice(0, 5);
      trendingVideos.push(...topVideos);
      topVideos.forEach(item => {
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
  if (!append && cat === "movies") {
    items = [...trendingVideos];
  }

  if (cat === "sports") {
    const all = await fetchVideos(LINKS.sports, currentPage);
    const football = all.filter(v => v.title?.toLowerCase().includes("football"))
                        .sort((a,b) => (b.year || 0) - (a.year || 0));
    const others = all.filter(v => !v.title?.toLowerCase().includes("football"))
                      .sort((a,b) => (b.year || 0) - (a.year || 0));
    items.push(...football.concat(others));
  } else if (cat === "anime") {
    const a1 = await fetchVideos(LINKS.anime, currentPage);
    const a2 = await fetchVideos(LINKS.anime_misc, currentPage);
    items.push(...a1.concat(a2));
  } else {
    const linkKey = LINKS[cat] || LINKS.movies;
    const fetched = await fetchVideos(linkKey, currentPage);
    items.push
