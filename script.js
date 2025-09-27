const API_BASE = "https://archive.org/advancedsearch.php?q=";
const OUTPUT = "&output=json&rows=20&fl[]=identifier,title,creator,description,downloads,date";

// Category queries
const categories = {
  movies:"collection:(moviesandfilms)",
  cartoons:"collection:(animationandcartoons)",
  sports:"collection:(sports) AND subject:(football OR sport)",
  anime:"collection:(anime)",
  popcorn:"collection:(popcornproject)",
  television:"collection:(television)"
};

let currentCategory = "";
let currentPage = 0;
let isLoading = false;

// Fetch data from API
async function fetchData(query, page=0, sort="downloads desc") {
  const start = page*20;
  const url = `${API_BASE}${query}&sort[]=${encodeURIComponent(sort)}${OUTPUT}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

// Render grid
function renderGrid(items, containerId, append=false){
  const container = document.getElementById(containerId);
  if(!append) container.innerHTML="";
  items.forEach(item=>{
    const div = document.createElement('div');
    div.className="card";
    div.innerHTML = `
      <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.creator||"Unknown"}</p>
      <div class="buttons">
        <a href="https://archive.org/details/${item.identifier}" target="_blank">▶ Stream</a>
        <a href="https://archive.org/download/${item.identifier}" target="_blank">⬇ Download</a>
      </div>
    `;
    container.appendChild(div);
  });
}

// Load home trending
async function loadHomeTrending(){
  const sportsData = await fetchData(categories.sports,0,"date desc");
  renderGrid(sportsData.slice(0,6),"trendingSection");
}

// Load home featured (mixed)
async function loadHomeFeatured(){
  for(let cat in categories){
    const data = await fetchData(categories[cat],0,"date desc");
    renderGrid(data.slice(0,6),"homeGrid",true);
  }
}

// Open category
async function openCategory(cat){
  document.getElementById('homePage').style.display='none';
  document.getElementById('categoryPage').style.display='block';
  document.getElementById('categoryTitle').innerText = cat.toUpperCase();
  document.getElementById('categoryGrid').innerHTML='';
  currentCategory=cat;
  currentPage=0;
  const data = await fetchData(categories[cat],currentPage, cat==='sports'?"date desc":"downloads desc");
  renderGrid(data,"categoryGrid");
}

// Back to home
function backToHome(){
  document.getElementById('homePage').style.display='block';
  document.getElementById('categoryPage').style.display='none';
}

// Infinite scroll
window.addEventListener('scroll', async ()=>{
  if(document.getElementById('categoryPage').style.display==='block' &&
     window.innerHeight + window.scrollY >= document.body.offsetHeight-200 && !isLoading){
    isLoading=true;
    currentPage++;
    const data = await fetchData(categories[currentCategory],currentPage, currentCategory==='sports'?"date desc":"downloads desc");
    renderGrid(data,"categoryGrid",true);
    isLoading=false;
  }
});

// Search
async function searchItems(){
  const term = document.getElementById('searchInput').value;
  if(!term) return alert("Enter search term");
  document.getElementById('homePage').style.display='none';
  document.getElementById('categoryPage').style.display='block';
  document.getElementById('categoryTitle').innerText=`Search: ${term}`;
  const data = await fetchData(term,0,"downloads desc");
  renderGrid(data,"categoryGrid");
}

// Initial load
loadHomeTrending();
loadHomeFeatured();
