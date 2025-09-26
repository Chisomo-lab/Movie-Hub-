const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads";

let currentQuery = "";
let currentPage = 0;
let isLoading = false;

// Fetch data from Archive.org
async function fetchData(query, page=0, sort="downloads desc") {
  const start = page*20;
  const url = `${API_BASE}${encodeURIComponent(query)}&sort[]=${encodeURIComponent(sort)}${OUTPUT}&start=${start}`;
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
    if(!item.identifier) return; // skip invalid items
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
function scrollLeft(id){ document.getElementById(id).scrollBy({left:-400, behavior:"smooth"}); }
function scrollRight(id){ document.getElementById(id).scrollBy({left:400, behavior:"smooth"}); }

// Load trending for homepage only
async function loadHomeTrending(){
  const trendingContainer = document.getElementById("trendingContainer");
  trendingContainer.innerHTML = "";

  const movies = await fetchData("collection:moviesandfilms");
  const cartoons = await fetchData("collection:animationandcartoons");
  const sports = await fetchSports();
  const anime = await fetchData("collection:anime",0,"downloads desc"); // no year sort
  const tv = await fetchData("collection:television");

  const allCollections = [movies, cartoons, sports, anime, tv];

  allCollections.forEach(col=>{
    if(col && col.length>0){
      col.forEach(item=>{
        if(!item.identifier) return;
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
        trendingContainer.appendChild(div);
      });
    }
  });
}

// Load category
async function loadCategory(cat){
  document.getElementById("movieGrid").innerHTML = "";
  document.getElementById("loading").style.display = "block";
  currentPage = 0;
  let items;
  let query;
  switch(cat){
    case "movies": query = "collection:moviesandfilms"; items = await fetchData
