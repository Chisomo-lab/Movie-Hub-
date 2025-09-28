const categories = {
  home: [],
  sports: [],
  tv: [],
  movies: [],
  anime: [],
  animation: [],
  cartoons: []
};

const contentContainer = document.getElementById("content-container");
const homeContainer = document.getElementById("home");
const categoriesContainer = document.getElementById("categories");
const trendingContainer = document.getElementById("trending");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const navItems = document.querySelectorAll("#navBar li");

// Archive.org links for each category
const urls = {
  sports: "https://archive.org/details/sports",
  tv: "https://archive.org/details/television_inbox",
  movies: "https://archive.org/details/moviesandfilms",
  anime: "https://archive.org/details/anime_miscellaneous",
  animation: "https://archive.org/details/animation_unsorted",
  cartoons: "https://archive.org/details/animationandcartoons"
};

// Fetch and mirror videos
async function fetchVideos(category) {
  const response = await fetch(urls[category]);
  const htmlText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const items = Array.from(doc.querySelectorAll(".item-ia")).map(item => ({
    title: item.querySelector(".C234")?.textContent || item.querySelector("a")?.textContent || "No title",
    link: item.querySelector("a")?.href || "#"
  }));

  categories[category] = items;
}

// Render 2x2 grid
function renderVideos(container, videos) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "video-grid";

  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <h4>${video.title}</h4>
      <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
      <a href="${video.link}" target="_blank"><button class="download">Download</button></a>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// Infinite scrolling
function infiniteScroll(category, container) {
  let page = 0;
  const perPage = 4;
  const videos = categories[category];

  function loadMore() {
    const start = page * perPage;
    const end = start + perPage;
    if (start >= videos.length) return;

    const grid = container.querySelector(".video-grid") || document.createElement("div");
    grid.className = "video-grid";

    videos.slice(start, end).forEach(video => {
      const card = document.createElement("div");
      card.className = "video-card";
      card.innerHTML = `
        <h4>${video.title}</h4>
        <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
        <a href="${video.link}" target="_blank"><button class="download">Download</button></a>
      `;
      grid.appendChild(card);
    });

    container.appendChild(grid);
    page++;
  }

  container.addEventListener("scroll", () => {
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
      loadMore();
    }
  });

  loadMore();
}

// Nav clicks
navItems.forEach(item => {
  item.addEventListener("click", async () => {
    const cat = item.getAttribute("data-cat");
    if (!categories[cat].length) await fetchVideos(cat);
    categoriesContainer.innerHTML = "";
    renderVideos(categoriesContainer, categories[cat].slice(0, 4));
    infiniteScroll(cat, categoriesContainer);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// Search
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.toLowerCase();
  const allVideos = Object.values(categories).flat();
  const results = allVideos.filter(v => v.title.toLowerCase().includes(query));
  categoriesContainer.innerHTML = "";
  renderVideos(categoriesContainer, results);
});
