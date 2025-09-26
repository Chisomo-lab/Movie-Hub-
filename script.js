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
let allVideos = []; // holds all videos for infinite scroll
let trendingVideos = [];

// Fetch collection JSON to mirror
async function fetchCollection(coll){
  const url = `https://archive.org/metadata/${coll}`;
  const res = await fetch(url);
  const data = await res.json();
  // filter video files only
  const items = data.files.filter(f => f.format?.toLowerCase().includes("mpeg") || f.format?.toLowerCase().includes("mp4") || f.format?.toLowerCase().includes("h.264"));
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

// Load trending videos (top 5 of each collection)
async function loadTrending(){
  trendingVideos=[];
  const keys=["movies","cartoons","sports","anime","popcorn","television"];
  for(let k of keys){
    const vids = await fetchCollection(COLLECTIONS[k]);
    if(vids.length>0){
      const top = vids.slice(0,5);
      trendingVideos.push(...top);
      renderVideos(top,"trendingContainer",true);
    }
  }
}

// Load category
async function loadCategory(cat){
  currentCategory=cat;
  document.getElementById("categoryTitle").innerText = cat.toUpperCase();
  document.getElementById("videoGrid").innerHTML="";
  allVideos=[];
  if(cat==="movies"){
    allVideos=[...trendingVideos]; // duplicate trending videos in movies
  } else if(cat==="sports"){
    const vids = await fetchCollection(COLLECTIONS[cat]);
    const football = vids.filter(v=>v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    const others = vids.filter(v=>!v.title.toLowerCase().includes("football")).sort((a,b)=>(b.year||0)-(a.year||0));
    allVideos=[...football,...others];
  } else if(cat==="anime"){
    const a1 = await fetchCollection(COLLECTIONS.anime);
    const a2 = await fetchCollection(COLLECTIONS.anime_misc);
    allVideos=[...a1,...a2];
  } else {
    allVideos = await fetchCollection(COLLECTIONS[cat]);
  }
  renderNextBatch();
}

// Infinite scroll: render next batch of 4 videos at a time
function renderNextBatch(){
  if(allVideos.length===0) return;
  const batch = allVideos.splice(0,4);
  renderVideos(batch,"videoGrid",true);
}

// Scroll event
window.addEventListener("scroll",()=>{
  if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && !isLoading){
    isLoading=true;
    renderNextBatch();
    isLoading=false;
  }
});

// Search
async function searchVideos(){
  const term=document.getElementById("searchInput").value.trim();
  if(!term) return;
  const url=`https://archive.org/advancedsearch.php?q=${encodeURIComponent(term)}+AND+mediatype:movies&output=json&rows=20&fl[]=identifier,title,creator,year,description,downloads`;
  const res=await fetch(url);
  const data=await res.json();
  allVideos=data.response.docs;
  document.getElementById("categoryTitle").innerText=`Results for "${term}"`;
  renderNextBatch();
}

// Initial load
loadTrending();
loadCategory("movies");
