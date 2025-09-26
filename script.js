const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads";

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Fetch data from Archive.org
async function fetchData(query, page=0){
  const start = page*20;
  const url = `${API_BASE}${encodeURIComponent(query)}&sort[]=year desc&sort[]=downloads desc${OUTPUT}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs || [];
}

// Fetch sports with football first
async function fetchSports(page=0){
  const start = page*20;
  const footballUrl = `${API_BASE}collection:sports AND subject:football&sort[]=downloads desc&sort[]=year desc${OUTPUT}&start=${start}`;
  const footballRes = await fetch(footballUrl);
  const footballItems = (await footballRes.json()).response.docs || [];

  const otherUrl = `${API_BASE}collection:sports AND NOT subject:football&sort[]=downloads desc&sort[]=year desc${OUTPUT}&start=${start}`;
  const otherRes = await fetch(otherUrl);
  const otherItems = (await otherRes.json()).response.docs || [];

  return [...footballItems, ...otherItems];
}

// Render grid
function renderGrid(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML = "";
  if(!items || items.length === 0){
    container.innerHTML = "<p style='color:#aaa;text-align:center;'>No videos found.</p>";
    return;
  }

  items.forEach(item=>{
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator || "Unknown"} (${item.year || "N/A"})</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Scroll buttons
function scrollLeft(id){
  document.getElementById(id).scrollBy({left:-400, behavior:"smooth"});
}

function scrollRight(id){
  document.getElementById(id).scrollBy({left:400, behavior:"smooth"});
}

// Load trending for homepage
async function loadHomeTrending(){
  renderGrid(await fetchData("collection:moviesandfilms"), "trendingMovies");
  renderGrid(await fetchData("collection:animationandcartoons"), "trendingCartoons");
  renderGrid(await fetchSports(), "trendingSports");
  renderGrid(await fetchData("collection:anime"), "trendingAnime");
  renderGrid(await fetchData("collection:television"), "trendingTV");
}

// Load category
async function loadCategory(cat){
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;
  let items;
  let query;
  switch(cat){
    case "movies":
      query = "collection:moviesandfilms";
      items = await fetchData(query);
      break;
    case "cartoons":
      query = "collection:animationandcartoons";
      items = await fetchData(query);
      break;
    case "sports":
      query = "collection:sports";
      items = await fetchSports();
      break;
    case "anime":
      query = "collection:anime";
      items = await fetchData(query);
      break;
    case "television":
      query = "collection:television";
      items = await fetchData(query);
      break;
    default:
      query = "collection:moviesandfilms";
      items = await fetchData(query);
  }
  currentQuery = query;
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  renderGrid(items, "movieGrid");
  document.getElementById("loading").style.display = "none";
}

// Infinite scroll
window.addEventListener("scroll", async ()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading && currentQuery){
    isLoading = true;
    currentPage++;
    document.getElementById("loading").style.display = "block";
    let more;
    more = currentQuery === "collection:sports" ? await fetchSports(currentPage) : await fetchData(currentQuery, currentPage);
    renderGrid(more, "movieGrid", true);
    document.getElementById("loading").style.display = "none";
    isLoading = false;
  }
});

// Search
async function searchMovies(){
  const term = document.getElementById("searchInput").value;
  if(!term) return;
  currentQuery = term;
  currentPage = 0;
  document.getElementById("loading").style.display = "block";
  const results = await fetchData(term);
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  renderGrid(results, "movieGrid");
  document.getElementById("loading").style.display = "none";
}

// Initialize homepage
loadHomeTrending();
loadCategory("movies");
