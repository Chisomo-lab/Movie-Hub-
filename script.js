const LINKS = {
  movies: "https://archive.org/advancedsearch.php?q=collection:moviesandfilms AND mediatype:movies&output=json&rows=20",
  cartoons: "https://archive.org/advancedsearch.php?q=collection:animationandcartoons AND mediatype:movies&output=json&rows=20",
  sports: "https://archive.org/advancedsearch.php?q=collection:sports AND mediatype:movies&output=json&rows=20",
  anime: "https://archive.org/advancedsearch.php?q=collection:anime AND mediatype:movies&output=json&rows=20",
  television: "https://archive.org/advancedsearch.php?q=collection:television AND mediatype:movies&output=json&rows=20"
};

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Fetch videos from Archive.org
async function fetchVideos(url, page=0){
  const start = page*20;
  const fullUrl = `${url}&start=${start}`;
  const res = await fetch(fullUrl);
  const data = await res.json();
  return data.response.docs || [];
}

// Render videos
function renderGrid(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML = "";
  if(!items || items.length === 0){
    container.innerHTML = "<p style='color:#aaa;text-align:center;'>No videos found.</p>";
    return;
  }
  items.forEach(item=>{
    if(!item.identifier) return;
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator || "Unknown"} (${item.year || "N/A"})</p>
      <p>${item.description ? item.description.substring(0,50)+"..." : ""}</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Scroll buttons
function scrollLeft(id){ document.getElementById(id).scrollBy({left:-400, behavior:"smooth"});}
function scrollRight(id){ document.getElementById(id).scrollBy({left:400, behavior:"smooth"});}

// Load trending
async function loadHomeTrending(){
  const trendingContainer = document.getElementById("trendingContainer");
  trendingContainer.innerHTML = "";
  for(let cat in LINKS){
    const videos = await fetchVideos(LINKS[cat]);
    if(videos.length>0){
      videos.slice(0,10).forEach(item=>{
        if(!item.identifier) return;
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.creator || "Unknown"} (${item.year || "N/A"})</p>
          <p>${item.description ? item.description.substring(0,50)+"..." : ""}</p>
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

// Load home grid (some selected videos)
async function loadHomeGrid(){
  const homeGrid = document.getElementById("homeGrid");
  homeGrid.innerHTML = "";
  for(let cat in LINKS){
    const videos = await fetchVideos(LINKS[cat]);
    if(videos.length>0){
      videos.slice(0,4).forEach(item=>{
        if(!item.identifier) return;
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.creator || "Unknown"} (${item.year || "N/A"})</p>
          <p>${item.description ? item.description.substring(0,50)+"..." : ""}</p>
          <div class="buttons">
            <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
            <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
          </div>
        `;
        homeGrid.appendChild(div);
      });
    }
  }
}

// Load category
async function loadCategory(cat){
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;
  currentQuery = cat;
  const items = await fetchVideos(LINKS[cat], currentPage);
  renderGrid(items, "movieGrid");
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  document.getElementById("loading").style.display = "none";
}

// Infinite scroll
window.addEventListener("scroll", async () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading && currentQuery){
    isLoading = true;
    currentPage++;
    document.getElementById("loading").style.display = "block";
    const items = await fetchVideos(LINKS[currentQuery], currentPage);
    if(items.length>0) renderGrid(items, "movieGrid", true);
    document.getElementById("loading").style.display = "none";
    isLoading = false;
  }
});

// Search
async function searchMovies(){
  const term = document.getElementById("searchInput").value;
  if(!term) return;
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentQuery = term;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)} AND mediatype:movies&output=json&rows=20`;
  const results = await fetchVideos(url);
  renderGrid(results, "movieGrid");
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  document.getElementById("loading").style.display = "none";
}

// Initialize homepage
loadHomeTrending();
loadHomeGrid();
