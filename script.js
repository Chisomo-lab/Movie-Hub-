const categoriesData = [
  {
    name: "Animation",
    links: ["more_animation","animation_unsorted","animationandcartoons","popcornproject"],
    page: 1
  },
  {
    name: "Anime",
    links: ["anime","anime_miscellaneous"],
    page: 1
  },
  {
    name: "Sports",
    links: ["sports"],
    footballFirst: true,
    showDownload: true,
    page: 1
  },
  {
    name: "Movies & TV",
    links: ["moviesandfilms","television_inbox"],
    page: 1
  }
];

// Fetch videos from archive.org
async function fetchVideos(categoryLink, page = 1, search = "") {
  let url = `https://archive.org/advancedsearch.php?q=collection:${encodeURIComponent(categoryLink)}${search ? ' AND ' + search : ''}&fl[]=identifier,title,description,mediatype,date&sort[]=date desc&rows=20&page=${page}&output=json`;
  try {
    let res = await fetch(url);
    let data = await res.json();
    return data.response.docs;
  } catch (e) {
    console.error("Fetch error:", e);
    return [];
  }
}

function createVideoCard(video, category) {
  let card = document.createElement("div");
  card.className = "video-card";

  let img = document.createElement("img");
  img.src = `https://archive.org/services/img/${video.identifier}`;
  card.appendChild(img);

  let title = document.createElement("h3");
  title.textContent = video.title;
  card.appendChild(title);

  if (category.showDownload) {
    let streamBtn = document.createElement("button");
    streamBtn.textContent = "Stream";
    streamBtn.onclick = () => window.open(`https://archive.org/details/${video.identifier}`, "_blank");
    card.appendChild(streamBtn);

    let downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.onclick = () => window.open(`https://archive.org/download/${video.identifier}`, "_blank");
    card.appendChild(downloadBtn);
  } else {
    let viewBtn = document.createElement("button");
    viewBtn.textContent = "Watch";
    viewBtn.onclick = () => window.open(`https://archive.org/details/${video.identifier}`, "_blank");
    card.appendChild(viewBtn);
  }

  return card;
}

// Render category grid with infinite scroll
async function renderCategoryGrid(cat) {
  const categoriesContainer = document.getElementById("categories");

  let section = document.createElement("section");
  section.className = "category";
  section.id = `cat-${cat.name}`;
  let h2 = document.createElement("h2");
  h2.textContent = cat.name;
  section.appendChild(h2);

  let grid = document.createElement("div");
  grid.className = "category-grid";
  section.appendChild(grid);

  async function loadMoreCategoryVideos() {
    let videos = [];
    for (let link of cat.links) {
      let fetched = await fetchVideos(link, cat.page);
      videos = videos.concat(fetched);
    }

    if (cat.footballFirst) {
      videos.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        if (aTitle.includes("football") && !bTitle.includes("football")) return -1;
        if (!aTitle.includes("football") && bTitle.includes("football")) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    }

    videos.forEach(video => grid.appendChild(createVideoCard(video, cat)));
    cat.page++;
  }

  // Load initial
  loadMoreCategoryVideos();

  // Infinite scroll
  window.addEventListener("scroll", async () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      loadMoreCategoryVideos();
    }
  });

  categoriesContainer.appendChild(section);
}

// Trending infinite scroll
const trendingContainer = document.getElementById("trendingContainer");
let trendingPage = 1;
let trendingLoadedIds = new Set();

async function loadTrending() {
  let allVideos = [];
  for (let cat of categoriesData) {
    for (let link of cat.links) {
      let fetched = await fetchVideos(link, trendingPage);
      allVideos = allVideos.concat(fetched);
    }
  }

  // Filter duplicates
  allVideos = allVideos.filter(video => !trendingLoadedIds.has(video.identifier));
  allVideos.slice(0,10).forEach(video => {
    trendingLoadedIds.add(video.identifier);
    let card = document.createElement("div");
    card.className = "video-card";
    let img = document.createElement("img");
    img.src = `https://archive.org/services/img/${video.identifier}`;
    card.appendChild(img);
    let title = document.createElement("h3");
    title.textContent = video.title;
    card.appendChild(title);
    card.onclick = () => window.open(`https://archive.org/details/${video.identifier}`, "_blank");
    trendingContainer.appendChild(card);
  });

  trendingPage++;
}

// Horizontal scroll listener for trending
trendingContainer.addEventListener("scroll", () => {
  if (trendingContainer.scrollLeft + trendingContainer.clientWidth >= trendingContainer.scrollWidth - 50) {
    loadTrending();
  }
});

// Search functionality
document.getElementById("searchBtn").addEventListener("click", async () => {
  let term = document.getElementById("searchInput").value.trim();
  if (!term) return;

  const categoriesContainer = document.getElementById("categories");
  categoriesContainer.innerHTML = "";

  for (let cat of categoriesData) {
    let section = document.createElement("section");
    section.className = "category";
    let h2 = document.createElement("h2");
    h2.textContent = `Search results in ${cat.name}`;
    section.appendChild(h2);

    let grid = document.createElement("div");
    grid.className = "category-grid";
    section.appendChild(grid);

    let videos = [];
    for (let link of cat.links) {
      let fetched = await fetchVideos(link, 1, term);
      videos = videos.concat(fetched);
    }

    videos.forEach(video => grid.appendChild(createVideoCard(video, cat)));
    categoriesContainer.appendChild(section);
  }
});

// Initialize
loadTrending();
categoriesData.forEach(cat => renderCategoryGrid(cat));
