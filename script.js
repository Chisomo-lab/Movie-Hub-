const collections = {
  anime: ['anime_miscellaneous', 'anime'],
  animation: ['more_animation', 'animation_unsorted', 'animationandcartoons'],
  sports: ['sports'],
  movies: ['moviesandfilms'],
  tv: ['television_inbox'],
  cartoons: ['animation_unsorted', 'animationandcartoons']
};

let videosData = {};
let loadedCount = {};
let currentCategory = 'home';
const batchSize = 8;
const homeContainer = document.getElementById('home');
const categoriesContainer = document.getElementById('categories');
const trendingContainer = document.getElementById('trending');

// Fetch videos for a category
async function fetchVideos(category){
  if(videosData[category]) return;
  videosData[category] = [];
  loadedCount[category] = 0;
  for(const col of collections[category]){
    try{
      const url = `https://archive.org/advancedsearch.php?q=collection:${col}&fl[]=identifier,title&sort[]=downloads desc&rows=50&page=1&output=json`;
      const resp = await fetch(url);
      const data = await resp.json();
      if(data.response && data.response.docs){
        videosData[category] = videosData[category].concat(data.response.docs);
      }
    } catch(e){
      console.warn('Failed to fetch', col, e);
    }
  }
  if(videosData[category].length === 0){
    videosData[category] = [{identifier:'placeholder', title:'No videos available'}];
  }

  // Sports filtering: football first, descending by year
  if(category === 'sports'){
    videosData[category].sort((a, b) => {
      const isFootballA = a.title.toLowerCase().includes('football') ? 0 : 1;
      const isFootballB = b.title.toLowerCase().includes('football') ? 0 : 1;
      if(isFootballA !== isFootballB) return isFootballA - isFootballB;

      const yearA = a.title.match(/\b(19|20)\d{2}\b/) ? parseInt(a.title.match(/\b(19|20)\d{2}\b/)[0]) : 0;
      const yearB = b.title.match(/\b(19|20)\d{2}\b/) ? parseInt(b.title.match(/\b(19|20)\d{2}\b/)[0]) : 0;
      return yearB - yearA;
    });
  }
}

// Create video card
function createVideoCard(video){
  const card = document.createElement('div');
  card.className = 'video-card';
  if(video.title.toLowerCase().includes('football')) card.classList.add('football');

  const img = document.createElement('img');
  img.src = video.identifier==='placeholder'? 'https://via.placeholder.com/200x150?text=No+Video' :
            `https://archive.org/services/img/${video.identifier}`;
  card.appendChild(img);

  const title = document.createElement('h3');
  title.textContent = video.title;
  card.appendChild(title);

  const streamBtn = document.createElement('button');
  streamBtn.textContent = 'Stream';
  streamBtn.onclick = () => video.identifier!=='placeholder' && window.open(`https://archive.org/details/${video.identifier}`, '_blank');
  card.appendChild(streamBtn);

  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download';
  downloadBtn.onclick = () => video.identifier!=='placeholder' && window.open(`https://archive.org/download/${video.identifier}`, '_blank');
  card.appendChild(downloadBtn);

  return card;
}

// Render videos in a category section
function renderVideos(category, container){
  const start = loadedCount[category];
  const end = Math.min(start + batchSize, videosData[category].length);
  
  let grid = container.querySelector('.category-grid');
  if(!grid){
    grid = document.createElement('div');
    grid.className = 'category-grid';
    container.appendChild(grid);
  }
  
  for(let i=start;i<end;i++){
    grid.appendChild(createVideoCard(videosData[category][i]));
  }
  loadedCount[category] = end;
}

// Show home page
async function showHome(){
  currentCategory = 'home';
  homeContainer.style.display = 'block';
  categoriesContainer.innerHTML = '';
  trendingContainer.innerHTML = '';
  for(const cat in collections){
    await fetchVideos(cat);
    videosData[cat].slice(0,2).forEach(v => trendingContainer.appendChild(createVideoCard(v)));
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = cat.toUpperCase();
    section.appendChild(h2);
    renderVideos(cat, section);
    homeContainer.appendChild(section);
  }
}

// Show category page
async function showCategory(cat){
  currentCategory = cat;
  homeContainer.style.display = 'none';
  categoriesContainer.innerHTML = '';
  trendingContainer.innerHTML = '';
  await fetchVideos(cat);
  
  const trendingSection = document.createElement('div');
  trendingSection.className = 'trending-horizontal';
  videosData[cat].slice(0,4).forEach(v => trendingSection.appendChild(createVideoCard(v)));
  categoriesContainer.appendChild(trendingSection);
  
  const section = document.createElement('section');
  const h2 = document.createElement('h2');
  h2.textContent = cat.toUpperCase();
  section.appendChild(h2);
  categoriesContainer.appendChild(section);
  renderVideos(cat, section);
}

// Infinite scroll for category pages
document.getElementById('content-container').onscroll = function(){
  if(currentCategory === 'home') return;
  const container = document.getElementById('content-container');
  const scrollThreshold = 100;

  if(container.scrollTop + container.clientHeight >= container.scrollHeight - scrollThreshold){
    const section = categoriesContainer.querySelector('section');
    const grid = section.querySelector('.category-grid');
    if(loadedCount[currentCategory] < videosData[currentCategory].length){
      const start = loadedCount[currentCategory];
      const end = Math.min(start + batchSize, videosData[currentCategory].length);
      for(let i=start;i<end;i++){
        grid.appendChild(createVideoCard(videosData[currentCategory][i]));
      }
      loadedCount[currentCategory] = end;
    }
  }
};

// Nav bar click events
document.querySelectorAll('#navBar li').forEach(li => {
  li.onclick = () => {
    if(li.dataset.cat === 'home') showHome();
    else showCategory(li.dataset.cat);
  };
});

// Search functionality
document.getElementById('searchBtn').onclick = async () => {
  const term = document.getElementById('searchInput').value.toLowerCase();
  currentCategory = 'home';
  homeContainer.style.display = 'none';
  categoriesContainer.innerHTML = '';
  trendingContainer.innerHTML = '';
  for(const cat in collections){
    await fetchVideos(cat);
    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = `Search results in ${cat.toUpperCase()}`;
    section.appendChild(h2);
    const grid = document.createElement('div');
    grid.className = 'category-grid';
    videosData[cat].filter(v => v.title.toLowerCase().includes(term)).forEach(v => grid.appendChild(createVideoCard(v)));
    section.appendChild(grid);
    categoriesContainer.appendChild(section);
  }
};

// Auto-scroll trending horizontal strip
function autoScrollTrending() {
  const trendingSections = document.querySelectorAll('.trending-horizontal');
  trendingSections.forEach(section => {
    let scrollStep = 1;
    let scrollDelay = 20;
    setInterval(() => {
      if(section.scrollWidth - section.scrollLeft <= section.clientWidth){
        section.scrollLeft = 0;
      } else {
        section.scrollLeft += scrollStep;
      }
    }, scrollDelay);
  });
}

// Observe changes in categories container to start trending auto-scroll
const observer = new MutationObserver(() => autoScrollTrending());
observer.observe(document.getElementById('categories'), { childList: true, subtree: true });

// Initialize home page
showHome();
