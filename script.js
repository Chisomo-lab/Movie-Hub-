const categoriesData = [
  { name:"Animation", links:["more_animation","animation_unsorted","animationandcartoons","popcornproject"], page:1 },
  { name:"Anime", links:["anime","anime_miscellaneous"], page:1 },
  { name:"Sports", links:["sports"], footballFirst:true, showDownload:true, page:1 },
  { name:"Movies & TV", links:["moviesandfilms","television_inbox"], page:1 }
];

const trendingContainer = document.getElementById("trendingContainer");
const homePreviews = document.getElementById("home-previews");
const categoriesContainer = document.getElementById("categories");
let trendingPage = 1;
let trendingLoadedIds = new Set();

async function fetchVideos(categoryLink, page=1, search="") {
  let url = `https://archive.org/advancedsearch.php?q=collection:${encodeURIComponent(categoryLink)}${search ? ' AND ' + search : ''}&fl[]=identifier,title,description,mediatype,date&sort[]=date desc&rows=20&page=${page}&output=json`;
  try { let res=await fetch(url); let data=await res.json(); return data.response.docs; } catch(e){ console.error(e); return []; }
}

function createVideoCard(video, category){
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

async function renderCategoryGrid(cat, targetContainer){
  let section=document.createElement("section"); section.className="category"; section.id=`cat-${cat.name}`;
  let h2=document.createElement("h2"); h2.textContent=cat.name; section.appendChild(h2);
  let grid=document.createElement("div"); grid.className="category-grid"; section.appendChild(grid);

  async function loadMoreCategoryVideos(){
    let videos=[];
    for(let link of cat.links){ let fetched=await fetchVideos(link,cat.page); videos=videos.concat(fetched); }
    if(cat.footballFirst){ videos.sort((a,b)=>{ const aT=a.title.toLowerCase(), bT=b.title.toLowerCase(); if(aT.includes("football")&&!bT.includes("football")) return -1; if(!aT.includes("football")&&bT.includes("football")) return 1; return new Date(b.date)-new Date(a.date); }); }
    videos.forEach(v=>grid.appendChild(createVideoCard(v,cat))); cat.page++;
  }

  await loadMoreCategoryVideos();
  window.addEventListener("scroll",()=>{ if((window.innerHeight+window.scrollY)>=document.body.offsetHeight-100){ loadMoreCategoryVideos(); } });
  targetContainer.appendChild(section);
}

categoriesData.forEach(cat=>{
  renderCategoryGrid(cat,categoriesContainer);
  renderCategoryGrid(cat,homePreviews);
});

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const target=btn.dataset.target;
    document.getElementById("home").style.display=target==="home"?"block":"none";
    categoriesData.forEach(cat=>{
      document.getElementById(`cat-${cat.name}`).style.display=(cat.name===target)?"block":"none";
    });
  });
});

document.getElementById("searchBtn").addEventListener("click", async ()=>{
  let term=document.getElementById("searchInput").value.trim();
  if(!term) return;
  document.getElementById("home").style.display="none";
  categoriesData.forEach(cat=>document.getElementById(`cat-${cat.name}`).style.display="none");

  categoriesContainer.innerHTML="";
  for(let cat of categoriesData){
    let section=document.createElement("section"); section.className="category"; section.id=`cat-${cat.name}`;
    let h2=document.createElement("h2"); h2.textContent=`Search results in ${cat.name}`; section.appendChild(h2);
    let grid=document.createElement("div"); grid.className="category-grid"; section.appendChild(grid);

    let videos=[];
    for(let link of cat.links){ let fetched=await fetchVideos(link,1,term); videos=videos.concat(fetched); }
    videos.forEach(v=>grid.appendChild(createVideoCard(v,cat)));
    categoriesContainer.appendChild(section);
  }
});
