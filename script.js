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

async function fetchVideos(category){
  if(videosData[category]) return;
  videosData[category] = [];
  loadedCount[category] = 0;
  for(const col of collections[category]){
    const url = `https://archive.org/advancedsearch.php?q=collection:${col}&fl[]=identifier,title&sort[]=downloads desc&rows=50&page=1&output=json`;
    const resp = await fetch(url);
    const data = await resp.json();
    if(data.response && data.response.docs){
      videosData[category] = videosData[category].concat(data.response.docs);
    }
  }
}

function createVideoCard(video){
  const card = document.createElement('div');
  card.className = 'video-card';
  const img = document.createElement('img');
  img.src = `https://archive.org/services/img/${video.identifier}`;
  card.appendChild(img);
  const title = document.createElement('h3');
  title.textContent = video.title;
  card.appendChild(title);
  const streamBtn = document.createElement('button');
  streamBtn.textContent = 'Stream';
  streamBtn.onclick = () => window.open(`https://archive.org/details/${video.identifier}`, '_blank');
  card.appendChild(streamBtn);
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download';
  downloadBtn.onclick = () => window.open(`https://archive.org/download/${video.identifier}`, '_blank');
  card.appendChild(downloadBtn);
  return card;
}

function renderVideos(category, container){
  const start = loadedCount[category];
  const end = Math.min(start + batchSize, videosData[category].length);
  const grid = document.createElement('div');
  grid.className = 'category-grid';
  for(let i=start;i<end;i++){
    grid.appendChild(createVideoCard(videosData[category][i]));
  }
  container.appendChild(grid);
  loadedCount[category] = end;
}

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

async function showCategory(cat){
  currentCategory = cat;
  homeContainer.style.display = 'none';
  categoriesContainer.innerHTML = '';
  trendingContainer.innerHTML = '';
  await fetchVideos(cat);
  videosData[cat].slice(0,2).forEach(v => trendingContainer.appendChild(createVideoCard(v)));
  const section = document.createElement('section');
  const h2 = document.createElement('h2');
  h2.textContent = cat.toUpperCase();
  section.appendChild(h2);
  categoriesContainer.appendChild(section);
  renderVideos(cat, section);
}

document.getElementById('content-container').onscroll = function(){
  const container = document.getElementById('content-container');
  if((container.scrollTop + container.clientHeight) >= container.scrollHeight - 50){
    if(currentCategory !== 'home' && loadedCount[currentCategory] < videosData[currentCategory].length){
      const section = categoriesContainer.querySelector('section');
      renderVideos(currentCategory, section);
    }
  }
};

document.querySelectorAll('#navBar li').forEach(li => {
  li.onclick = () => {
    if(li.dataset.cat === 'home') showHome();
    else showCategory(li.dataset.cat);
  };
});

document.getElementById('searchBtn').onclick = async () => {
  const term = document.getElementById('searchInput').value.toLowerCase();
  currentCategory = 'home';
  homeContainer.style.display = 'none';
  categoriesContainer.innerHTML = '';