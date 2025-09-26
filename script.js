const COLLECTIONS = {
  movies: "moviesandfilms",
  cartoons: "animationandcartoons",
  sports: "sports",
  anime: "anime",
  anime_misc: "anime_miscellaneous",
  television: "television",
  popcorn: "popcornproject"
};

let currentCategory = "movies";
let allVideos = [];
let trendingVideos = [];
let isLoading = false;

// Helper: fetch and parse collection HTML
async function fetchCollectionHTML(url){
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text,"text/html");
  const items = Array.from(doc.querySelectorAll(".item-ia")).map(el=>{
    const identifier = el.getAttribute("data-identifier");
    const titleEl = el.querySelector(".ttl");
    const title = titleEl? titleEl.textContent.trim() : identifier;
    const creatorEl = el.querySelector(".creator");
    const creator = creatorEl? creatorEl.textContent.trim() : "Unknown";
    const yearEl = el.querySelector(".year");
    const year = yearEl? parseInt(yearEl.textContent.trim()) : "N/A";
    const descriptionEl = el.querySelector(".description");
    const description = descriptionEl? descriptionEl.textContent.trim() : "";
    return {identifier,title,creator,year,description};
  });
  return items;
}

function renderVideos(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML="";
  items.forEach(item=>{
    const div = document.createElement("div");
    div.className="card";
    div.innerHTML=`
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

// Load trending (top 5 per collection)
async function loadTrending(){
  trendingVideos=[];
  const keys=["movies","cartoons","sports","anime","popcorn","television"];
  for(let k of keys){
    const url = `https://archive.org/details/${COLLECTIONS[k]}`;
    const vids = await fetchCollectionHTML(url);
    const top = vids.slice(0,5);
    trendingVideos.push(...top);
    renderVideos(top,"trendingContainer",true);
  }
}

// Load category
async function loadCategory(cat){
  currentCategory = cat;
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  document.getElementById("videoGrid").innerHTML="";
  allVideos=[];
  if(cat==="movies"){
    allVideos=[...trendingVideos]; // duplicate trending
  } else if(cat==="sports"){
    const url = `https://archive.org/details/${COLLECTIONS[cat]}`;
    let vids = await fetchCollectionHTML(url);
    const football = vids.filter(v=>v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    const others = vids.filter(v=>!v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    allVideos=[...football,...others];
  } else if(cat==="anime"){
    const a1 = await fetchCollectionHTML(`https://archive.org/details/${COLLECTIONS.anime}`);
    const a2 = await fetchCollectionHTML(`https://archive.org/details/${COLLECTIONS.anime_misc}`);
    allVideos=[...a1,...a2];
  } else {
    const url = `https://archive.org/details/${COLLECTIONS[cat]}`;
    allVideos = await fetchCollectionHTML(url);
  }
  renderNextBatch();
}

// Infinite scroll: render next 4 videos
function renderNextBatch(){
  if(allVideos.length===0) return;
  const batch = allVideos.splice(0,4);
  renderVideos(batch,"videoGrid",true);
}

window.addEventListener("scroll",()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading){
    isLoading=true;
    renderNextBatch();
    isLoading=false;
  }
});

// Search (searches movies only)
async function searchVideos(){
  const term = document.getElementById("searchInput").value.trim();
  if(!term) return;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+AND+mediatype:movies&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads`;
  const res = await fetch(url);
  const data = await res.json();
  allVideos = data.response.docs.map(v=>({identifier:v.identifier,title:v.title,creator:v.creator,year:v.year,description:v.description}));
  document.getElementById("categoryTitle").innerText=`Results for "${term}"`;
  renderNextBatch();
}

// Initial load
loadTrending();
loadCategory("movies");
