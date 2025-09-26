const LINKS = {
  movies: "https://archive.org/advancedsearch.php?q=collection:moviesandfilms AND mediatype:movies&output=json&rows=20",
  cartoons: "https://archive.org/advancedsearch.php?q=collection:animationandcartoons AND mediatype:movies&output=json&rows=20",
  sports: "https://archive.org/advancedsearch.php?q=collection:sports AND mediatype:movies&output=json&rows=20",
  anime: "https://archive.org/advancedsearch.php?q=collection:anime AND mediatype:movies&output=json&rows=20",
  television: "https://archive.org/advancedsearch.php?q=collection:television AND mediatype:movies&output=json&rows=20"
};

let currentQuery = "movies";
let currentPage = 0;
let isLoading = false;

// Fetch videos from archive.org
async function fetchVideos(url, page=0){
  const start = page*20;
  const fullUrl = `${url}&start=${start}`;
  const res = await fetch(fullUrl);
  const data = await res.json();
  return data.response.docs || [];
}

// Render videos in 2x2 grid
function renderGrid(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML = "";
  items.forEach(item=>{
    if(!item.identifier) return;
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3 style="font-size:0.8rem;">${item.title}</h3>
      <p style="font-size:0.7rem;">${item.creator || "Unknown"} (${item.year || "N/A"})</p>
      <p style="font-size:0.7rem;">${item.description ? item.description.substring(0,50)+"..." : ""}</p>
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
    videos.slice(0,10).forEach(item=>{
      if(!item.identifier) return;
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
        <h3 style="font-size:0.8rem;">${item.title}</h3>
        <div class="buttons">
          <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
          <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
        </div>
      `;
      trendingContainer.appendChild(div);
    });
  }
}

// Load movies category for main grid
async function loadCategory(cat){
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;
  currentQuery = cat;

  let items = [];
  if(cat === "sports"){
    const football = await fetchVideos(LINKS.sports);
    const footballSorted = football.filter(v=>v.title.toLowerCase().includes("football"))
                                  .sort((a,b)=>(b.year||0)-(a.year||0));
    const otherSports = football.filter(v=>!v.title.toLowerCase().includes("football"))
                                .sort((a,b)=>(b.year||0)-(a.year||0));
    items = footballSorted.concat(otherSports);
  } else {
    items = await fetchVideos(LINKS[cat]);
  }

  // Duplicate trending videos in movies section
  if(cat==="movies"){
    const trendingItems = await fetchVideos(LINKS.movies);
    items = trendingItems.slice(0,10).concat(items);
  }

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
    let items = [];
    if(currentQuery === "sports"){
      const football = await fetchVideos(LINKS.sports, currentPage);
      const footballSorted = football.filter(v=>v.title.toLowerCase().includes("football"))
                                    .sort((a,b)=>(b.year||0)-(a.year||0));
      const otherSports = football.filter(v=>!v.title.toLowerCase().includes("football"))
                                  .sort((a,b)=>(b.year||0)-(a.year||0));
      items = footballSorted.concat(otherSports);
    } else if(LINKS[currentQuery]){
      items = await fetchVideos(LINKS[currentQuery], currentPage);
    } else {
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(currentQuery)} AND mediatype:movies&output=json&rows=20&start=${currentPage*20}`;
      items = await fetchVideos(url);
    }
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
  document.get
