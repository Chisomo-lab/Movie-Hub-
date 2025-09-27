// Categories
const categories = {
  "Movies & Films": "https://archive.org/details/moviesandfilms",
  "Sports": "https://archive.org/details/sports",
  "Television": "https://archive.org/details/television",
  "Animation & Cartoons": "https://archive.org/details/animationandcartoons",
  "Animation (Unsorted)": "https://archive.org/details/animation_unsorted",
  "Anime": "https://archive.org/details/anime",
  "Anime Miscellaneous": "https://archive.org/details/anime_miscellaneous"
};

// Merge anime categories
const animeLink = "https://archive.org/details/anime"; // will use this for both

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("categories");

  // Render categories
  Object.entries(categories).forEach(([name, url]) => {
    if (name.includes("Anime")) return; // skip individual anime

    const section = document.createElement("section");
    section.classList.add("category");

    const title = document.createElement("h2");
    title.textContent = name;
    section.appendChild(title);

    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.loading = "lazy";
    iframe.classList.add("mirror-frame");

    section.appendChild(iframe);
    container.appendChild(section);
  });

  // Add merged anime section
  const animeSection = document.createElement("section");
  animeSection.classList.add("category");

  const animeTitle = document.createElement("h2");
  animeTitle.textContent = "Anime";
  animeSection.appendChild(animeTitle);

  const animeFrame = document.createElement("iframe");
  animeFrame.src = animeLink;
  animeFrame.loading = "lazy";
  animeFrame.classList.add("mirror-frame");
  animeSection.appendChild(animeFrame);

  container.appendChild(animeSection);

  // Trending row (sample from Movies)
  const trendingRow = document.getElementById("trendingRow");
  for (let i = 0; i < 10; i++) {
    let frame = document.createElement("iframe");
    frame.src = "https://archive.org/embed/moviesandfilms"; 
    frame.loading = "lazy";
    trendingRow.appendChild(frame);
  }
});

// Search functionality
document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim();
  if (query) {
    window.open(`https://archive.org/details/moviesandfilms?query=${encodeURIComponent(query)}`, "_blank");
  }
});

// Infinite scroll for iframes
window.addEventListener("scroll", () => {
  document.querySelectorAll(".mirror-frame").forEach(frame => {
    const rect = frame.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom >= 0) {
      frame.style.height = parseInt(frame.style.height || 600) + 400 + "px";
    }
  });
});