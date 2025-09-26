const COLLECTIONS = {
  movies: "moviesandfilms",
  cartoons: "animationandcartoons",
  sports: "sports",
  anime: "anime",
  popcorn: "popcornproject",
  television: "television"
};

let currentCategory = "movies";
let currentPage = 0;
let isLoading = false;

// Fetch videos from Archive.org JSON API
async function fetchVideos(collection, page = 0, sort = "downloads desc") {
  const start = page * 20;
  const url = `https://archive.org/advancedsearch.php?q=collection:${collection}&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads&sort[]=${encodeURIComponent(sort)}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs.map(v => ({
    identifier: v.identifier,
    title: v.title,
    creator: v.creator || "Unknown",
    year: v.year || "N/A",
    description: v.description || ""
  }));
}

// Render grid
function renderVideos(items, containerId, append = false) {
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator} (${item.year})</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Load trending top 5 from each collection
async function loadTrending() {
  const trendingContainer = document.getElementById("trendingContainer");
  trendingContainer.innerHTML="";
  const keys = ["movies","cartoons","sports","anime","popcorn","television"];
  for(let k of keys){
    const vids = await fetchVideos(COLLECTIONS[k],0,"downloads desc");
    const top = vids.slice(0,5);
    renderVideos(top,"trendingContainer",true);
  }
}

// Load category
async function loadCategory(cat) {
  currentCategory = cat;
  currentPage = 0;
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  document.getElementById("videoGrid").innerHTML="";

  const vids = await fetchCategoryPage(cat, currentPage);
  renderVideos(vids,"videoGrid",false);
}

// Fetch a single page of a category
async function fetchCategoryPage(cat,page){
  if(cat==="sports"){
    let vids = await fetchVideos(COLLECTIONS[cat], page, "year desc");
    const football = vids.filter(v=>v.title.toLowerCase().includes("football")).sort((a,b)=>b.year-a.year);
    const others = vids.filter(v=>!v.title.toLowerCase().includes("football")).sort((a,b)=>b.year-a.year);
    return [...football,...others];
  } else if(cat==="anime"){
    return await fetchVideos(COLLECTIONS[cat], page, "downloads desc");
  } else {
    return await fetchVideos(COLLECTIONS[cat], page, "downloads desc");
  }
}

// Infinite scroll
window.addEventListener("scroll", async () => {
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading){
    isLoading=true;
    currentPage++;
    const more = await fetchCategoryPage(currentCategory, currentPage);
    if(more.length>0){
      renderVideos(more,"videoGrid",true);
    }
    isLoading=false;
  }
});

// Search
async function searchVideos() {
  const term = document.getElementById("searchInput").value.trim();
  if(!term) return;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads`;
  const res = await fetch(url);
  const data = await res.json();
  const results = data.response.docs.map(v=>({
    identifier:v.identifier,
    title:v.title,
    creator:v.creator||"Unknown",
    year:v.year||"N/A",
    description:v.description||""
  }));
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
  document.getElementById("videoGrid").innerHTML="";
  renderVideos(results,"videoGrid",true);
}

// Initial load
loadTrending();
loadCategory("movies");
