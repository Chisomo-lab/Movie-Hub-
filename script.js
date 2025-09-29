/* script.js - no ads, fixed categories, sports-only filter, infinite scroll */

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
const homePreviews = document.getElementById("home-previews");
const trendingContainer = document.getElementById("trending");
const categoriesContainer = document.getElementById("categories");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const navItems = document.querySelectorAll("#navBar li");

let currentCategory = 'home';
const pages = {};
const perPage = 20;
const loadingStates = {};

const apiCollections = {
  sports: "sports",
  tv: "television_inbox",
  movies: "moviesandfilms",
  anime: "anime_miscellaneous",
  animation: "animation_unsorted",
  cartoons: "animationandcartoons"
};

function parseYearFromDoc(doc) {
  if (doc.year) {
    const y = Array.isArray(doc.year) ? parseInt(doc.year[0]) : parseInt(doc.year);
    if (!isNaN(y)) return y;
  }
  const m = (doc.title || "").match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : 0;
}

async function fetchVideos(category, page = 1, rows = perPage) {
  const col = apiCollections[category];
  if (!col) return [];

  let fields = ["identifier", "title"];
  let sort = "downloads desc";
  if (category === "sports") {
    fields.push("year");
    sort = "year desc";
  }

  const fl = fields.map(f => `fl[]=${encodeURIComponent(f)}`).join("&");
  const url = `https://archive.org/advancedsearch.php?q=collection:${encodeURIComponent(col)}&${fl}&sort[]=${encodeURIComponent(sort)}&rows=${rows}&page=${page}&output=json`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const docs = data.response?.docs || [];

    let videos = docs.map(doc => {
      const identifier = doc.identifier;
      return {
        identifier,
        title: doc.title || identifier,
        link: `https://archive.org/details/${identifier}`,
        thumbnail: `https://archive.org/services/get-item-image.php?identifier=${identifier}`,
        year: parseYearFromDoc(doc)
      };
    });

    if (category === "sports") {
      videos.sort((a, b) => {
        const af = /football/i.test(a.title) ? 0 : 1;
        const bf = /football/i.test(b.title) ? 0 : 1;
        if (af !== bf) return af - bf;
        return (b.year || 0) - (a.year || 0);
      });
    }
    return videos;
  } catch (err) {
    console.error("fetchVideos error:", err);
    return [];
  }
}

function renderVideos(container, videos) {
  let grid = container.querySelector(".video-grid:last-of-type");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "video-grid";
    container.appendChild(grid);
  }
  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    if (/football/i.test(video.title)) card.style.boxShadow = "0 0 8px rgba(179,0,0,0.6)";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
      <h4 title="${video.title}">${video.title}</h4>
      <div class="buttons">
        <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
        <a href="${video.link}/download" target="_blank"><button class="download">Download</button></a>
      </div>
    `;
    grid.appendChild(card);
  });
}

async function loadMoreCategory(cat) {
  if (loadingStates[cat]) return;
  loadingStates[cat] = true;
  pages[cat] = pages[cat] || 1;
  const vids = await fetchVideos(cat, pages[cat], perPage);
  if (vids.length) {
    categories[cat] = (categories[cat] || []).concat(vids);
    renderVideos(categoriesContainer, vids);
    pages[cat]++;
  }
  loadingStates[cat] = false;
}

function startCategory(cat) {
  currentCategory = cat;
  categoriesContainer.innerHTML = "";
  pages[cat] = 1;
  categories[cat] = [];
  loadMoreCategory(cat);
  contentContainer.scrollTop = 0;
}

contentContainer.onscroll = function() {
  if (currentCategory === 'home') return;
  const threshold = 100;
  if (contentContainer.scrollTop + contentContainer.clientHeight >= contentContainer.scrollHeight - threshold) {
    loadMoreCategory(currentCategory);
  }
};

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const cat = item.getAttribute("data-cat");
    if (cat === "home") displayHome();
    else startCategory(cat);
  });
});

searchBtn.addEventListener("click", async () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return;
  categoriesContainer.innerHTML = "";
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 50);
    const matching = vids.filter(v => v.title.toLowerCase().includes(q));
    if (matching.length) {
      const sec = document.createElement("div");
      sec.innerHTML = `<h3>${cat.toUpperCase()} — results</h3>`;
      renderVideos(sec, matching);
      categoriesContainer.appendChild(sec);
    }
  }
  currentCategory = 'home';
  contentContainer.scrollTop = 0;
});

async function displayHome() {
  currentCategory = 'home';
  categoriesContainer.innerHTML = "";
  homePreviews.innerHTML = "";
  trendingContainer.innerHTML = "";

  const trending = [];
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 5);
    trending.push(...vids.slice(0, 3));
  }
  trending.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" />
      <h4 title="${video.title}">${video.title}</h4>
      <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
    `;
    trendingContainer.appendChild(card);
  });

  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 4);
    const section = document.createElement("div");
    section.innerHTML = `<h3>${cat.toUpperCase()}</h3>`;
    renderVideos(section, vids.slice(0, 4));
    const titleEl = section.querySelector("h3");
    titleEl.style.cursor = "pointer";
    titleEl.onclick = () => startCategory(cat);
    homePreviews.appendChild(section);
  }
  contentContainer.scrollTop = 0;
}

displayHome();
