// Categories with archive.org queries
const categories = {
  "Movies & Films": "collection:moviesandfilms",
  "Sports": "collection:sports",
  "Television": "collection:television OR mediatype:movies",
  "Animation & Cartoons": "collection:animationandcartoons OR collection:animation_unsorted",
  "Anime": "collection:anime OR collection:anime_miscellaneous"
};

// Helper: fetch videos from Archive.org
async function fetchVideos(query, rows = 8) {
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,year&sort[]=downloads desc&output=json&rows=${rows}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

// Render video card
function createVideoCard(video) {
  const card = document.createElement("div");
  card.classList.add("video-card");

  const img = document.createElement("img");
  img.src = `https://archive.org/services/img/${video.identifier}`;
  img.alt = video.title;

  const title = document.createElement("h3");
  title.textContent = video.title;

  const btnContainer = document.createElement("div");
  btnContainer.classList.add("btn-container");

  const streamBtn = document.createElement("button");
  streamBtn.textContent = "Stream";
  streamBtn.onclick = () => {
    window.open(`https://archive.org/details/${video.identifier}`, "_blank");
  };

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download";
  downloadBtn.onclick = () => {
    window.open(`https://archive.org/download/${video.identifier}`, "_blank");
  };

  btnContainer.appendChild(streamBtn);
  btnContainer.appendChild(downloadBtn);

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(btnContainer);

  return card;
}

// Load Home Page
async function loadHome() {
  const container = document.getElementById("content");
  container.innerHTML = "";

  for (const [name, query] of Object.entries(categories)) {
    const section = document.createElement("section");
    section.classList.add("category");

    const title = document.createElement("h2");
    title.textContent = name;
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.classList.add("grid");

    const videos = await fetchVideos(query, 4); // only 4 previews
    videos.forEach(v => grid.appendChild(createVideoCard(v)));

    section.appendChild(grid);
    container.appendChild(section);
  }
}

// Load Full Category
async function loadCategory(name) {
  const container = document.getElementById("content");
  container.innerHTML = "";

  const section = document.createElement("section");
  section.classList.add("category");

  const title = document.createElement("h2");
  title.textContent = name;
  section.appendChild(title);

  const grid = document.createElement("div");
  grid.classList.add("grid");

  const videos = await fetchVideos(categories[name], 20); // load more
  videos.forEach(v => grid.appendChild(createVideoCard(v)));

  section.appendChild(grid);
  container.appendChild(section);
}

// Search
document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  const results = await fetchVideos(query, 12);
  const container = document.getElementById("content");
  container.innerHTML = "";

  const section = document.createElement("section");
  section.classList.add("category");

  const title = document.createElement("h2");
  title.textContent = `Results for "${query}"`;
  section.appendChild(title);

  const grid = document.createElement("div");
  grid.classList.add("grid");

  results.forEach(v => grid.appendChild(createVideoCard(v)));

  section.appendChild(grid);
  container.appendChild(section);
});

// Init Home Page
loadHome();
