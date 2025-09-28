const categories = {
  "Movies & Films": "collection:moviesandfilms",
  "Sports": "collection:sports",
  "Television": "collection:television OR mediatype:movies",
  "Animation & Cartoons": "collection:animationandcartoons OR collection:animation_unsorted",
  "Anime": "collection:anime OR collection:anime_miscellaneous"
};

let categoryOffset = 0;
let categoryQuery = '';
let loadingMore = false;

async function fetchVideos(query, rows = 10, start = 0) {
  const url = `https://archive.org/advancedsearch.php?q=${query}&fl[]=identifier,title,year,subject&sort[]=downloads desc&output=json&rows=${rows}&start=${start}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.response.docs;
}

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

async function loadTrending() {
  const container = document.createElement('section');
  container.classList.add('trending-section');
  const title = document.createElement('h2');
  title.textContent = 'Trending Now';
  container.appendChild(title);
  const row = document.createElement('div');
  row.classList.add('trending-row');

  const trendingVideos = await fetchVideos('collection:moviesandfilms OR collection:sports OR collection:anime OR collection:animationandcartoons', 10);
  trendingVideos.forEach(v => row.appendChild(createVideoCard(v)));
  container.appendChild(row);
  document.getElementById('content').appendChild(container);
}

async function loadHome() {
  const content = document.getElementById('content');
  content.innerHTML = '';
  loadTrending();

  for (const [name, query] of Object.entries(categories)) {
    const section = document.createElement('section');
    section.classList.add('category');

    const title = document.createElement('h2');
    title.textContent = name;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.classList.add('grid');

    const videos = await fetchVideos(query, 4);
    videos.forEach(v => grid.appendChild(createVideoCard(v)));
    section.appendChild(grid);
    content.appendChild(section);
  }
}

async function loadCategory(name) {
  const content = document.getElementById('content');
  content.innerHTML = '';

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

  await loadMoreVideos(grid, name);

  window.onscroll = async () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && !loadingMore) {
      await loadMoreVideos(grid, name);
    }
  };
}

async function loadMoreVideos(grid, name) {
  loadingMore = true;
  let videos = await fetchVideos(categoryQuery, 10, categoryOffset);

  if (name === 'Sports') {
    const football = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('football')))
                            .sort((a,b)=> b.year - a.year);
    const wrestling = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('wrestling')));
    const f1 = videos.filter(v => v.subject && v.subject.some(s => s.toLowerCase().includes('f1')));
    videos = [...football, ...wrestling, ...f1];
  }

  videos.forEach(v => grid.appendChild(createVideoCard(v)));
  categoryOffset += 10;
  loadingMore = false;
}

document.getElementById('searchBtn').addEventListener('click', async () => {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  const content = document.getElementById('content');
  content.innerHTML = '';

  const section = document.createElement('section');
  section.classList.add('category');
  const title = document.createElement('h2');
  title.textContent = `Results for "${query}"`;
  section.appendChild(title);

  const grid = document.createElement('div');
  grid.classList.add('grid');
  section.appendChild(grid);
  content.appendChild(section);

  const results = await fetchVideos(query, 20);
  results.forEach(v => grid.appendChild(createVideoCard(v)));
});

loadHome();
