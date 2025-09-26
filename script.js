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

// Fetch metadata directly from collection
async function fetchCollectionMetadata(coll){
  const url = `https://archive.org/metadata/${coll}`;
  const res = await fetch(url);
  const data = await res.json();
  // Filter files that are video
  const items = data.files.filter(f => f.format?.toLowerCase().includes("mpeg") || f.format?.toLowerCase().includes("mp4") || f.format?.toLowerCase().includes("h.264"));
  // Map to simplified object
  return items.map(f=>({
    identifier: data.metadata.identifier,
    title: f.title || data.metadata.title,
    creator: data.metadata.creator || "Unknown",
    year: parseInt(data.metadata.year) || "N/A",
    description: data.metadata.description || "",
    format: f.format
  }));
}

function renderVideos(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML="";
  items.forEach(item=>{
    const div = document.createElement("div");
    div.className="card";
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

// Load trending videos
async function loadTrending(){
  trendingVideos = [];
  const keys = ["movies","cartoons","sports","anime","popcorn","television"];
  for(let k of keys){
    const vids = await fetchCollectionMetadata(COLLECTIONS[k]);
    if(vids.length>0){
      const top = vids.slice(0,5);
      trendingVideos.push(...top);
      renderVideos(top,"trendingContainer",true);
    }
  }
}

// Load category
async function loadCategory(cat){
  currentCategory = cat;
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  document.getElementById("videoGrid").innerHTML="";
  let items = [];
  if(cat==="movies"){
    items = [...trendingVideos];
  } else if(cat==="sports"){
    const all = await fetchCollectionMetadata(COLLECTIONS[cat]);
    const football = all.filter(v=>v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    const others = all.filter(v=>!v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    items = [...football,...others];
  } else if(cat==="anime"){
    const a1 = await fetchCollectionMetadata(COLLECTIONS.anime);
    const a2 = await fetchCollectionMetadata(COLLECTIONS.anime_misc);
    items = [...a1,...a2];
  } else {
    items = await fetchCollectionMetadata(COLLECTIONS[cat]);
  }
  renderVideos(items,"videoGrid");
}

// Infinite scroll
window.addEventListener("scroll", async ()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading){
    isLoading=true;
    await loadCategory(currentCategory);
    isLoading=false;
  }
});

// Search
async function searchVideos(){
  const term = document.getElementById("searchInput").value.trim();
  if(!term) return;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+AND+mediatype:movies&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads`;
  const res = await fetch(url);
  const data = await res.json();
  renderVideos(data.response.docs,"videoGrid");
  document.getElementById("categoryTitle").innerText=`Results for "${term}"`;
}

// Initial load
loadTrending();
loadCategory("movies");
