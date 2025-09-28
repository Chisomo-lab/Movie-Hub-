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

const apiCollections = {
  sports: "sports",
  tv: "television_inbox",
  movies: "moviesandfilms",
  anime: "anime_miscellaneous",
  animation: "animation_unsorted",
  cartoons: "animationandcartoons"
};

// Fetch videos
async function fetchVideos(category, page = 1, rows = 20) {
  const col = apiCollections[category];
  const url = `https://archive.org/advancedsearch.php?q=collection:${col}&fl[]=identifier,title,year&sort[]=date+desc&rows=${rows}&page=${page}&output=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const docs = data.response.docs;

    let videos = docs.map(doc => ({
      title: doc.title || doc.identifier,
      link: `https://archive.org/details/${doc.identifier}`,
      thumbnail: `https://archive.org/services/get-item-image.php?identifier=${doc.identifier}`
    }));

    if (category === "sports") {
      const football = videos.filter(v => /football/i.test(v.title));
      const others = videos.filter(v => !/football/i.test(v.title));
      videos = [...football, ...others];
    }

    if (!categories[category]) categories[category] = [];
    categories[category] = categories[category].concat(videos);
    return videos;
  } catch (err) {
    console.error("Failed to fetch videos:", err);
    return [];
  }
}

// Render 2x2 grid
function renderVideos(container, videos) {
  const grid = document.createElement("div");
  grid.className = "video-grid";

  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" />
      <h4>${video.title}</h4>
      <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
      <a href="${video.link}" target="_blank"><button class="download">Download</button></a>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// Render horizontal scroll for trending
function renderTrending(container, videos) {
  container.innerHTML = "";
  videos.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <img src="${video.thumbnail}" alt="${video.title}" />
      <h4>${video.title}</h4>
      <a href="${video.link}" target="_blank"><button class="stream">Stream</button></a>
    `;
    container.appendChild(card);
  });
}

// Infinite scroll for categories
function infiniteScroll(category, container) {
  let page = 1;
  const perPage = 20;
  let loading = false;

  async function loadMore() {
    if (loading) return;
    loading = true;

    const newVideos = await fetchVideos(category, page, perPage);
    if (newVideos.length > 0) {
      renderVideos(container, newVideos);
      page++;
    }

    loading = false;
  }

  container.addEventListener("scroll", () => {
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
      loadMore();
    }
  });

  loadMore();
}

// Nav clicks
navItems.forEach(item => {
  item.addEventListener("click", async () => {
    const cat = item.getAttribute("data-cat");
    if (cat === "home") {
      displayHome();
    } else {
      categoriesContainer.innerHTML = "";
      categories[cat] = [];
      infiniteScroll(cat, categoriesContainer);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// Search
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.toLowerCase();
  const container = categoriesContainer;
  container.innerHTML = "";

  const allResults = [];
  for (const cat of Object.keys(apiCollections)) {
    const videos = await fetchVideos(cat, 1, 50);
    allResults.push(...videos.filter(v => v.title.toLowerCase().includes(query)));
  }

  renderVideos(container, allResults);
});

// Display home page
async function displayHome() {
  homePreviews.innerHTML = "";
  trendingContainer.innerHTML = "";

  // Trending: pick 3 from each category
  const trendingVideos = [];
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 5);
    trendingVideos.push(...vids);
  }
  renderTrending(trendingContainer, trendingVideos);

  // Previews: 4 per category
  for (const cat of Object.keys(apiCollections)) {
    const vids = await fetchVideos(cat, 1, 4);
    const section = document.createElement("div");
    section.innerHTML = `<h3>${cat.toUpperCase()}</h3>`;
    renderVideos(section, vids);
    homePreviews.appendChild(section);
  }
}

// Initial load
displayHome();
