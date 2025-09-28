// Categories and collections
const categories = {
  "Movies & Films": ["collection:moviesandfilms"],
  "Sports": ["collection:sports"],
  "Television": ["collection:television OR mediatype:movies"],
  "Animation & Cartoons": ["collection:animationandcartoons","collection:animation_unsorted"],
  "Anime": ["collection:anime","collection:anime_miscellaneous"]
};

// Manual collection selection for trending-like section
const featuredCollections = {
  "Movies & Films": ["moviesandfilms"],
  "Sports": ["sports"],
  "Animation & Cartoons": ["animationandcartoons","animation_unsorted"],
  "Anime": ["anime","anime_miscellaneous"]
};

let categoryOffset = 0;
let categoryQuery = '';
let loadingMore = false;

// Fetch videos for given queries
async function fetchVideos(queryList, rows = 10, start = 0) {
  let videos = [];
  for (let q of queryList) {
    const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,year,subject&sort[]=downloads desc&output=json&rows=${rows}&start=${start}`;
    const res = await fetch(url);
    const data = await res.json();
    videos = videos.concat(data.response.docs);
  }
  return videos;
}

// Create video card
function createVideoCard(video) {
  const card = document.createElement("div");
  card.classList.add("video-card");

  const img = document.createElement("img");
  img.src = `https://archive.org/services/img/${video.identifier}`;
  img.alt = video.title;

  const title = document.createElement("h3");
  title.textContent = video.title;

  const btnContainer = document.createElement("div");
  btnContainer.classList.add("btn-container");

  const streamBtn = document.createElement("button");
  streamBtn.textContent = "Stream";
  streamBtn.onclick = () => window.open(`https://archive.org/details/${video.identifier}`, "_blank");

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download";
  downloadBtn.onclick = () => window.open(`https://archive.org/download/${video.identifier}`, "_blank");

  btnContainer.appendChild(streamBtn);
  btnContainer.appendChild(downloadBtn);

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(btnContainer);

  return card;
}

// Sports filter: football > wrestling > F1
function applySportsFilter(videos) {
  const football = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('football')))
                         .sort((a,b)=> b.year - a.year);
  const wrestling = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('wrestling')));
  const f1 = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('f1')));
  return [...football, ...wrestling, ...f1];
}

// Load featured collections like trending row
async function loadFeaturedCollections() {
  for(const [cat, collectionIds] of Object.entries(featuredCollections)){
    const container = document.createElement('section');
    container.classList.add('collections-section');
    const title = document.createElement('h2');
    title.textContent = `${cat} Collections`;
    container.appendChild(title);

    const row = document.createElement('div');
    row.classList.add('collections-row');

    let videos = [];
    for(let id of collectionIds){
      const colVideos = await fetchVideos([`collection:${id}`], 4);
      videos = videos.concat(colVideos);
    }

    if(cat === "Sports") videos = applySportsFilter(videos);

    videos.forEach(v=>row.appendChild(createVideoCard(v)));
    container.appendChild(row);
    document.getElementById('content').appendChild(container);
  }
}

// Load trending section
async function loadTrending() {
  const container = document.createElement('section');
  container.classList.add('trending-section');
  const title = document.createElement('h2');
  title.textContent = 'Trending Now';
  container.appendChild(title);

  const row = document.createElement('div');
  row.classList.add('trending-row');

  let trendingVideos = await fetchVideos(["collection:moviesandfilms","collection:sports","collection:anime","collection:animationandcartoons","collection:animation_unsorted"],10);
  trendingVideos = applySportsFilter(trendingVideos);

  trendingVideos.forEach(v=>row.appendChild(createVideoCard(v)));
  container.appendChild(row);
  document.getElementById('content').appendChild(container);
}

// Home page
async function loadHome(){
  const content = document.getElementById('content');
  content.innerHTML = '';
  await loadTrending();
  await loadFeaturedCollections();

  for(const [name, queryList] of Object.entries(categories)){
    const section = document.createElement('section');
    section.classList.add('category');

    const title = document.createElement('h2');
    title.textContent = name;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.classList.add('grid');

    let videos = await fetchVideos(queryList,4);
    if(name==="Sports") videos = applySportsFilter(videos);

    videos.forEach(v=>grid.appendChild(createVideoCard(v)));
    section.appendChild(grid);
    content.appendChild(section);
  }
}

// Category page with infinite scroll
async function loadCategory(name){
  const content = document.getElementById('content');
  content.innerHTML = '';

  // Collections row first
  const collectionIds = featuredCollections[name] || [];
  if(collectionIds.length>0){
    const collectionSection = document.createElement('section');
    collectionSection.classList.add('collections-section');
    const colTitle = document.createElement('h2');
    colTitle.textContent = `${name} Collections`;
    collectionSection.appendChild(colTitle);
    const row = document.createElement('div');
    row.classList.add('collections-row');

    for(let id of collectionIds){
      const colVideos = await fetchVideos([`collection:${id}`],4);
      let videos = colVideos;
      if(name==="Sports") videos = applySportsFilter(colVideos);
      videos.forEach(v=>row.appendChild(createVideoCard(v)));
    }

    collectionSection.appendChild(row);
    content.appendChild(collectionSection);
  }

  // Video grid with infinite scroll
  const section = document.createElement('section');
  section.classList.add('category');
  const title = document.createElement('h2');
  title.textContent = name;
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.classList.add('grid');
  section.appendChild(grid);
  content.appendChild(section);

  categoryQuery = categories[name];
  categoryOffset = 0;
  loadingMore = false;

  await loadMoreVideos(grid,name);

  window.onscroll = async () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && !loadingMore){
      await loadMoreVideos(grid,name);
    }
  };
}

// Load more videos for category infinite scroll
async function loadMoreVideos(grid,name){
  loadingMore=true;
  let videos = await fetchVideos(categoryQuery,10,categoryOffset);
  if(name==="Sports") videos = applySportsFilter(videos);
  videos.forEach(v=>grid.appendChild(createVideoCard(v)));
  categoryOffset+=10;
  loadingMore=false;
}

// Search
document.getElementById('searchBtn').addEventListener('click',async ()=>{
  const query = document.getElementById('searchInput').value.trim();
  if(!query) return;
  const content = document.getElementById('content');
  content.innerHTML='';

  const section = document.createElement('section');
  section.classList.add('category');
  const title = document.createElement('h2');
  title.textContent = `Results for "${query}"`;
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.classList.add('grid');
  section.appendChild(grid);
  content.appendChild(section);

  let results = await fetchVideos([query],20);
  results = applySportsFilter(results);
  results.forEach(v=>grid.appendChild(createVideoCard(v)));
});

// Initialize
loadHome();
