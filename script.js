const apiBase = "https://archive.org/advancedsearch.php?q=collection:";

// Categories & their Archive.org collections
const categories = {
  sports: "sports",
  anime: "anime",
  animation: "animationandcartoons",
  movies: "movies"
};

// Fetch & render videos
async function fetchVideos(category, sort = "") {
  let query = `${apiBase}${categories[category]}&fl[]=identifier&fl[]=title&fl[]=year&sort[]=${sort}&rows=20&page=1&output=json`;
  const res = await fetch(query);
  const data = await res.json();
  return data.response.docs;
}

// Render videos
function renderVideos(videos, container) {
  container.innerHTML = "";
  videos.forEach(v => {
    let thumb = `https://archive.org/services/img/${v.identifier}`;
    container.innerHTML += `
      <div class="video">
        <a href="https://archive.org/details/${v.identifier}" target="_blank">
          <img src="${thumb}" alt="${v.title}">
          <p>${v.title} ${v.year ? `(${v.year})` : ""}</p>
        </a>
      </div>`;
  });
}

// Trending (Home)
async function loadTrending() {
  const sports = await fetchVideos("sports", "downloads desc");
  const container = document.getElementById("trending-grid");
  renderVideos(sports.slice(0, 6), container);
}

// Load categories
async function loadCategories() {
  const container = document.getElementById("categories");
  container.innerHTML = "";

  for (let cat in categories) {
    const section = document.createElement("section");
    section.classList.add("category");
    section.innerHTML = `
      <h2>${cat.charAt(0).toUpperCase() + cat.slice(1)}</h2>
      <div class="video-grid hidden" id="${cat}-grid"></div>
    `;
    container.appendChild(section);

    // Show 4 preview videos initially
    const videos = await fetchVideos(cat, cat === "sports" ? "year desc" : "downloads desc");
    renderVideos(videos.slice(0, 4), section.querySelector(".video-grid"));

    // Expand toggle
    section.querySelector("h2").addEventListener("click", async () => {
      document.querySelectorAll(".video-grid").forEach(g => g.classList.add("hidden"));
      const grid = document.getElementById(`${cat}-grid`);
      grid.classList.remove("hidden");
      renderVideos(videos, grid); // expand full
    });
  }
}

// Init
loadTrending();
loadCategories();
