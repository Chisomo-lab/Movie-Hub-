const links = {
  movies:"https://archive.org/details/moviesandfilms",
  cartoons:"https://archive.org/details/animationandcartoons",
  sports:"https://archive.org/details/sports",
  anime:"https://archive.org/details/anime",
  popcorn:"https://archive.org/details/popcornproject",
  television:"https://archive.org/details/television"
};

const pages = {movies:0, cartoons:0, sports:0, anime:0, popcorn:0, television:0};

async function fetchCategory(cat, page=0){
  const url = links[cat];
  const res = await fetch(url);
  const text = await res.text();
  const parser = new DOMParser();
  const html = parser.parseFromString(text, 'text/html');
  const items = [];
  html.querySelectorAll('.C234').forEach((el,i)=>{
    if(i>=page*20 && i< (page+1)*20){
      const titleEl = el.querySelector('.C234 a');
      if(titleEl){
        const identifier = titleEl.getAttribute('href').replace('/details/','');
        const title = titleEl.innerText;
        items.push({identifier,title});
      }
    }
  });
  return items;
}

function renderVideos(items, containerId){
  const container = document.getElementById(containerId);
  items.forEach(item=>{
    const div = document.createElement('div');
    div.className="card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Open full category page
function openCategory(cat){
  document.getElementById('homePage').style.display='none';
  document.getElementById('categoryPage').style.display='block';
  document.getElementById('categoryTitle').innerText=cat.toUpperCase();
  document.getElementById('categoryGrid').innerHTML='';
  pages[cat]=0;
  loadCategoryFull(cat);
}

function backToHome(){
  document.getElementById('homePage').style.display='block';
  document.getElementById('categoryPage').style.display='none';
}

// Load full category
async function loadCategoryFull(cat){
  const items = await fetchCategory(cat, pages[cat]);
  renderVideos(items,'categoryGrid');
}

// Infinite scroll for category
window.addEventListener('scroll', async ()=>{
  const catPageVisible = document.getElementById('categoryPage').style.display==='block';
  if(catPageVisible && window.innerHeight + window.scrollY >= document.body.offsetHeight - 200){
    const cat = document.getElementById('categoryTitle').innerText.toLowerCase();
    pages[cat]++;
    const more = await fetchCategory(cat,pages[cat]);
    renderVideos(more,'categoryGrid');
  }
});

// Search
async function searchItems(){
  const term = document.getElementById('searchInput').value;
  if(!term) return alert("Enter a search term");
  for(let cat in links){
    const items = await fetchCategory(cat);
    const results = items.filter(i=>i.title.toLowerCase().includes(term.toLowerCase()));
    if(results.length>0){
      openCategory(cat);
      document.getElementById('categoryGrid').innerHTML='';
      renderVideos(results,'categoryGrid');
      break;
    }
  }
}

// Load previews for home page
async function loadPreviews(){
  for(let cat in links){
    const items = await fetchCategory(cat);
    renderVideos(items.slice(0,6), cat+'Preview');
  }
}
loadPreviews();
