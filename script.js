const categoriesData = [
  { name:"Animation", links:["more_animation","animation_unsorted","animationandcartoons","popcornproject"], page:1 },
  { name:"Anime", links:["anime","anime_miscellaneous"], page:1 },
  { name:"Sports", links:["sports"], footballFirst:true, showDownload:true, page:1 },
  { name:"Movies & TV", links:["moviesandfilms","television_inbox"], page:1 }
];

const trendingContainer = document.getElementById("trendingContainer");
const categoriesContainer = document.getElementById("categories");
let trendingPage = 1;
let trendingLoadedIds = new Set();

// Fetch videos from archive.org
async function fetchVideos(categoryLink, page=1, search="") {
  let url = `https://archive.org/advancedsearch.php?q=collection:${encodeURIComponent(categoryLink)}${search ? ' AND ' + search : ''}&fl[]=identifier,title,description,mediatype,date&sort[]=date desc&rows=20&page=${page}&output=json`;
  try { let res=await fetch(url); let data=await res.json(); return data.response.docs; } catch(e){ console.error(e); return []; }
}

// Create Video Card
function createVideoCard(video, category) {
  let card=document.createElement("div"); card.className="video-card";
  let img=document.createElement("img"); img.src=`https://archive.org/services/img/${video.identifier}`; card.appendChild(img);
  let title=document.createElement("h3"); title.textContent=video.title; card.appendChild(title);

  if(category.showDownload){
    let streamBtn=document.createElement("button"); streamBtn.textContent="Stream"; streamBtn.onclick=()=>window.open(`https://archive.org/details/${video.identifier}`,"_blank"); card.appendChild(streamBtn);
    let downloadBtn=document.createElement("button"); downloadBtn.textContent="Download"; downloadBtn.onclick=()=>window.open(`https://archive.org/download/${video.identifier}`,"_blank"); card.appendChild(downloadBtn);
  } else {
    let viewBtn=document.createElement("button"); viewBtn.textContent="Watch"; viewBtn.onclick=()=>window.open(`https://archive.org/details/${video.identifier}`,"_blank"); card.appendChild(viewBtn);
  }
  return card;
}

// Load Trending
async function loadTrending(){
  let allVideos=[];
  for(let cat of categoriesData){ for(let link of cat.links){ let fetched=await fetchVideos(link,trendingPage); allVideos=allVideos.concat(fetched); } }
  allVideos=allVideos.filter(v=>!trendingLoadedIds.has(v.identifier));
  allVideos.slice(0,10).forEach(video=>{
    trendingLoadedIds.add(video.identifier);
    let card=createVideoCard(video,{});
    trendingContainer.appendChild(card);
  });
  trendingPage++;
}
trendingContainer.addEventListener("scroll",()=>{ if(trendingContainer.scrollLeft+trendingContainer.clientWidth>=trendingContainer.scrollWidth-50){ loadTrending(); } });
loadTrending();

// Render Categories
async function renderCategoryGrid(cat){
  let section=document.createElement("section"); section.className="category"; section.id=`cat-${cat.name}`;
  let h2=document.createElement("h2"); h2.textContent=cat.name; section.appendChild(h2);
  let grid=document.createElement("div"); grid.className="category-grid"; section.appendChild(grid);

  async function loadMoreCategoryVideos(){
    let videos=[];
    for(let link of cat.links){ let fetched=await fetchVideos(link,cat.page); videos=videos.concat(fetched); }
    if(cat.footballFirst){ videos.sort((a,b)=>{ const aT=a.title.toLowerCase(), bT=b.title.toLowerCase(); if(aT.includes("football")&&!bT.includes("football")) return -1; if(!aT.includes("football")&&bT.includes("football")) return 1; return new Date(b.date)-new Date(a.date); }); }
    videos.forEach(v=>grid.appendChild(createVideoCard(v,cat))); cat.page++;
  }
  loadMoreCategoryVideos();
  window.addEventListener("scroll",()=>{ if((window.innerHeight+window.scrollY)>=document.body.offsetHeight-100){ loadMoreCategoryVideos(); } });
  categoriesContainer.appendChild(section);
}

// Initialize all categories
categoriesData.forEach(cat=>renderCategoryGrid(cat));

// Navigation logic
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const target=btn.dataset.target;
    if(target==="home"){ document
