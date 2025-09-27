// ====== Static video data per category ======
const categoriesData = [
  {
    name: "Animation",
    videos: [
      { identifier: "more_animation_1", title: "Animation Video 1" },
      { identifier: "more_animation_2", title: "Animation Video 2" },
      { identifier: "more_animation_3", title: "Animation Video 3" },
      { identifier: "more_animation_4", title: "Animation Video 4" },
      { identifier: "more_animation_5", title: "Animation Video 5" }
    ],
    page: 0
  },
  {
    name: "Anime",
    videos: [
      { identifier: "anime_1", title: "Anime Video 1" },
      { identifier: "anime_2", title: "Anime Video 2" },
      { identifier: "anime_3", title: "Anime Video 3" },
      { identifier: "anime_4", title: "Anime Video 4" }
    ],
    page: 0
  },
  {
    name: "Sports",
    videos: [
      { identifier: "sports_football_1", title: "Football Match 1" },
      { identifier: "sports_basketball_1", title: "Basketball Match 1" },
      { identifier: "sports_football_2", title: "Football Match 2" },
      { identifier: "sports_basketball_2", title: "Basketball Match 2" }
    ],
    page: 0,
    footballFirst: true,
    showDownload: true
  },
  {
    name: "Movies & TV",
    videos: [
      { identifier: "movies_1", title: "Movie 1" },
      { identifier: "movies_2", title: "Movie 2" },
      { identifier: "tv_1", title: "TV Show 1" },
      { identifier: "tv_2", title: "TV Show 2" }
    ],
    page: 0
  }
];

// ====== Utility to create video cards ======
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

// ====== DOM Elements ======
const trendingContainer = document.getElementById("trendingContainer");
const homePreviews = document.getElementById("home-previews");
const categoriesContainer = document.getElementById("categories");

// ====== Trending Section (first 2 videos per category) ======
categoriesData.forEach(cat => {
  cat.videos.slice(0, 2).forEach(video => {
    trendingContainer.appendChild(createVideoCard(video, cat));
  });
});

// ====== Home Previews (2×2 grid of first 4 videos per category) ======
categoriesData.forEach(cat => {
  let section = document.createElement("section");
  section.className = "category";
  section.id = `home-preview-${cat.name}`;

  let h2 = document.createElement("h2");
  h2.textContent = cat.name;
  section.appendChild(h2);

  let grid = document.createElement("div");
  grid.className = "category-grid";
  section.appendChild(grid);

  cat.videos.slice(0, 4).forEach(video => {
    grid.appendChild(createVideoCard(video, cat));
  });

  homePreviews.appendChild(section);
});

// ====== Full category pages ======
categoriesData.forEach(cat => {
  let section = document.createElement("section");
  section.className = "category";
  section.id = `cat-${cat.name}`;

  let h2 = document.createElement("h2");
  h2.textContent = cat.name;
  section.appendChild(h2);

  let grid = document.createElement("div");
  grid.className = "category-grid";
  section.appendChild(grid);

  // initial 4 videos
  let initialCount = Math.min(4, cat.videos.length);
  for (let i = 0; i < initialCount; i++) {
    grid.appendChild(createVideoCard(cat.videos[i], cat));
  }

  // Infinite scroll simulation
  window.addEventListener("scroll", () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      let nextVideos = cat.videos.slice(cat.page * 4, (cat.page + 1) * 4);
      nextVideos.forEach(v => grid.appendChild(createVideoCard(v, cat)));
      cat.page++;
    }
  });

  categoriesContainer.appendChild(section);
});

// ====== Navigation Logic ======
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    document.getElementById("home").style.display = target === "home" ? "block" : "none";
    categoriesData.forEach(cat => {
      document.getElementById(`cat-${cat.name}`).style.display = (cat.name === target) ? "block" : "none";
    });
  });
});

// ====== Search ======
document.getElementById("searchBtn").addEventListener("click", () => {
  let term = document.getElementById("searchInput").value.trim().toLowerCase();
  if (!term) return;

  document.getElementById("home").style.display = "none";
  categoriesData.forEach(cat => document.getElementById(`cat-${cat.name}`).style.display = "none");

  categoriesContainer.innerHTML = "";

  categoriesData.forEach(cat => {
    let section = document.createElement("section");
    section.className = "category";
    section.id = `search-${cat.name}`;

    let h2 = document.createElement("h2");
    h2.textContent = `Search results in ${cat.name}`;
    section.appendChild(h2);

    let grid = document.createElement("div");
    grid.className = "category-grid";
    section.appendChild(grid);

    cat.videos
      .filter(v => v.title.toLowerCase().includes(term))
      .forEach(v => grid.appendChild(createVideoCard(v, cat)));

    categoriesContainer.appendChild(section);
  });
});
