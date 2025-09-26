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
let currentPage = 0;
let isLoading = false;
let trendingVideos = [];

async function fetchCollection(coll, page = 0) {
  const start = page * 20;
  const url = `https://archive.org/advancedsearch.php?q=collection:${coll}+AND+mediatype:movies&output=json&rows=20&start=${start}&fl[]=identifier,title,creator,year,description,downloads`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs || [];
}

function renderVideos(items, containerId, append=false) {
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML = "";
  items.forEach(item => {
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

async function loadTrending() {
  trendingVideos = [];
  const keys = ["movies","cartoons","sports","anime","popcorn","television"];
  for(let k of keys){
    const vids = await fetchCollection(COLLECTIONS[k],0);
    if(vids.length>0){
      const top = vids.slice(0,5);
      trendingVideos.push(...top);
      renderVideos(top,"trendingContainer",true);
    }
  }
}

async function loadCategory(cat, append=false){
  currentCategory = cat;
  const container = document.getElementById("videoGrid");
  if(!append) container.innerHTML="";
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  let items = [];
  if(cat==="movies" && !append) items = [...trendingVideos];
  currentPage = append ? currentPage+1 : 0;
  if(cat==="sports"){
    const all = await fetchCollection(COLLECTIONS[cat], currentPage);
    const football = all.filter(v=>v.title?.toLowerCase().includes("football")).sort((a,b)=> (b.year||0)-(a.year||0));
    const others = all.filter(v=>!v.title?.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    items.push(...football.concat(others));
  } else if(cat==="anime"){
    const a1 = await fetchCollection(COLLECTIONS.anime,currentPage);
    const a2 = await fetchCollection(COLLECTIONS.anime_misc,currentPage);
    items.push(...a1.concat(a2));
  } else {
    const fetched = await fetchCollection(COLLECTIONS[cat],currentPage);
    items.push(...fetched);
  }
  renderVideos(items,"videoGrid",append);
}

window.addEventListener("scroll", async ()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading){
    isLoading = true;
    await loadCategory(currentCategory,true);
    isLoading=false;
  }
});

async function searchVideos(){
  const term = document.getElementById("searchInput").value.trim();
  if(!term) return;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+AND+mediatype:movies&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads`;
  const res = await fetch(url);
  const data = await res.json();
  renderVideos(data.response.docs,"videoGrid");
  document.getElementById("categoryTitle").innerText = `Results for "${term}"`;
}

// Initial Load
loadTrending();
loadCategory("movies");
