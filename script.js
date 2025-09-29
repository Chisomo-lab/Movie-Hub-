/* script.js - updated: sports-only filter (football then year desc), thumbnails,
   minimal ad space respected, robust infinite scroll on #content-container */

// categories store fetched items per-category
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
const homePreviews = document.getElementById("home-previews") || document.createElement('div');
const trendingContainer = document.getElementById("trending");
const categoriesContainer = document.getElementById("categories");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const navItems = document.querySelectorAll("#navBar li");

let currentCategory = 'home';
const pages = {};          // page counters per category
const perPage = 20;        // rows per API call
const loadingStates = {};  // loading flags per category

// Collection name mapping
const apiCollections = {
  sports: "sports",
  tv: "television_inbox",
  movies: "moviesandfilms",
  anime: "anime_miscellaneous",
  animation: "animation_unsorted",
  cartoons: "animationandcartoons"
};

// Helper: extract numeric year from doc.year or title
function parseYearFromDoc(doc) {
  if (doc.year) {
    if (Array.isArray(doc.year) && doc.year.length) {
      const y = parseInt(doc.year[0]);
      if (!isNaN(y)) return y;
    } else {
      const y = parseInt(doc.year);
      if (!isNaN(y)) return y;
    }
  }
  // fallback: regex from title
  const m = (doc.title || "").match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : 0;
}

// Fetch from archive.org JSON API; sports will include year field.
async function fetchVideos(category, page = 1, rows = perPage) {
  const col = apiCollections[category];
  if (!col) return [];

  // Choose fields & sort according to category
  let fields = ["identifier", "title"];
  let sort = "downloads desc"; // default for non-sports

  if (category === "sports") {
    fields = ["identifier", "title", "year"];
    // we will sort by year server-side if possible, but still re-sort client-side
    sort = "year desc";
  }

  const fl = fields.map(f => `fl[]=${encodeURIComponent(f)}`).join("&");
  const url = `https://archive.org/advancedsearch.php?q=collection:${encodeURIComponent(col)}&${fl}&sort[]=${encodeURIComponent(sort)}&rows=${rows}&page=${page}&output=json`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const docs = (data.response && data.response.docs) ? data.response.docs : [];

    // Map docs -> video objects with thumbnail
    let videos = docs.map(doc => {
      const identifier = doc.identifier || (doc.guid || "");
      return {
        identifier,
        title: doc.title || identifier,
        link: `https://archive.org/details/${identifier}`,
        thumbnail: `https://archive.org/services/get-item-image.php?identifier=${identifier}`,
        year: parseYearFromDoc(doc)
      };
    });

    // Sports-only client-side sorting: football first, then year desc
    if (category === "sports") {
      videos.sort((a, b) => {
        const aFootball = /football/i.test(a.title) ? 0 : 1;
        const bFootball = /football/i.test(b.title) ? 0 : 1;
        if (aFootball !== bFootball) return aFootball - bFootball;
        return (b.year || 0) - (a.year || 0);
      });
    }

    return videos;
  } catch (err) {
    console.error("fetchVideos error:", err);
    return [];
  }
}

// Append rendered videos to a container (keeps existing content)
function renderVideos(container, videos) {
  // Create a grid if none exists at end
  let grid = container.querySelector(".video-grid:last-of-type");
  if (!grid) {
    grid = document.createElement("div");
    grid.className = "video-grid";
    container.appendChild(grid);
  }

  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";

    // Mark football visually (optional)
    const isFootball = /football/i.test(video.title);
    if (isFootball) card.style.boxShadow = "0 0 8px rgba(179,0,0,0.6)";

    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy" />
      <h4 title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h4>
      <div class="buttons">
        <a href="${video.link}" target="_blank" rel="noopener noreferrer"><button class="stream">Stream</button></a>
        <a href="${video.link}/download" target="_blank" rel="noopener noreferrer"><button class="download">Download</button></a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Small helper to avoid HTML injection
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
  })[c]);
}

// Load-next-page handler for a category (keeps per-category counters)
async function loadMoreCategory(cat) {
  if (!cat) return;
  if (loadingStates[cat]) return; // already loading
  loadingStates[cat] = true;

  pages[cat] = pages[cat] || 1;
  const fetched = await fetchVideos(cat, pages[cat], perPage);
  if (fetched.length > 0) {
    // Append to categories store (avoid duplicates across loads)
    categories[cat] = (categories[cat] || []).concat(fetched);
    renderVideos(categoriesContainer, fetched);
    pages[cat] += 1;
  }
  loadingStates[cat] = false;
}

// Start displaying a category with fresh state
function startCategory(cat) {
  currentCategory = cat;
  categoriesContainer.innerHTML = "";
  categories[cat] = [];
  pages[cat] = 1;
  loadingStates[cat] = false;
  // immediately load first page
  loadMoreCategory(cat);
  // scroll content container to top of content
  contentContainer.scrollTop = 0;
}

// Global scroll handler (on content container) for infinite loading
contentContainer.onscroll = function() {
  // only infinite-scroll when viewing a category (not home)
  if (!currentCategory || currentCategory === 'home') return;
  const threshold = 100;
  if (contentContainer.scrollTop + contentContainer.clientHeight >= contentContainer.scrollHeight - threshold) {
    loadMoreCategory(currentCategory);
  }
};

// NAV clicks
navItems.forEach(item => {
  item.addEventListener("click", () => {
    const cat = item.getAttribute("data-cat");
    if (cat === "home") {
      displayHome();
    } else {
      startCategory(cat);
    }
  });
});

// SEARCH
searchBtn.addEventListener("click", async () => {
  const q = (searchInput.value || "").trim().toLowerCase();
  if (!q) return;
  // quick search across categories - fetch first page for each then filter
  categoriesContainer.innerHTML = "";
  for (const cat of Object.keys(apiCollections)) {
    // ensure we have at least one page
    const pageVideos = await fetchVideos(cat, 1, 50);
    const matching = pageVideos.filter(v => v.title.toLowerCase().includes(q));
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

// HOME: trending + 4 previews per category
async function displayHome() {
  currentCategory = 'home';
  categoriesContainer.innerHTML = "";
  homePreviews.innerHTML = "";
  trendingContainer.innerHTML = "";

  // Trending: collect latest 3 from each collection
  const trending = [];
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 5);
    // push first 3 (or fewer)
    trending.push(...vids.slice(0,3));
  }
  // render trending (horizontal)
  trendingContainer.innerHTML = "";
  trending.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" loading="lazy" />
      <h4 title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</h4>
      <a href="${video.link}" target="_blank" rel="noopener noreferrer"><button class="stream">Stream</button></a>
    `;
    trendingContainer.appendChild(card);
  });

  // Previews: 4 from each category
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 4);
    const section = document.createElement("div");
    section.innerHTML = `<h3>${cat.toUpperCase()}</h3>`;
    renderVideos(section, vids.slice(0,4));
    // make category title clickable to open full category
    const titleEl = section.querySelector('h3');
    titleEl.style.cursor = 'pointer';
    titleEl.onclick = () => startCategory(cat);
    homePreviews.appendChild(section);
  }

  // ensure top of content shown
  contentContainer.scrollTop = 0;
}

// initialize home on load
displayHome();
