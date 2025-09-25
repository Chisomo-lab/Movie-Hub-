const allMoviesDiv = document.getElementById("allMovies");
const trendingMoviesDiv = document.getElementById("trendingMovies");
const searchInput = document.getElementById("searchInput");

let movies = [];
let currentPage = 1;
let currentCategory = '';

const collectionLinks = {
  sports: 'sports',
  moviesandfilms: 'moviesandfilms',
  television: 'television',
  animationandcartoons: 'animationandcartoons'
};

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Fetch movies
async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    const collection = collectionLinks[category] || '';
    const searchQuery = collection ? `collection:${collection}` : 'mediatype:movies';
    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=title&fl[]=identifier&fl[]=mediatype&fl[]=year&sort[]=downloads desc&rows=20&page=${page}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    let newMovies = data.response.docs.map(item => ({
      title: item.title || "Untitled",
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: item.year || 0,
      category: category
    }));

    if(query) newMovies = newMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));

    if(category === 'sports') newMovies.sort((a,b) => b.year - a.year);

    movies = page === 1 ? newMovies : [...movies, ...newMovies];

    displayMovies(movies, allMoviesDiv);
    const trendingList = movies.slice(0,5);
    displayMovies(trendingList, trendingMoviesDiv, false);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
  }
}

// Display movies
function displayMovies(list, container, append=false) {
  if(!append) container.innerHTML = "";
  list.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie");
    const isFav = favorites.includes(movie.link) ? 'favorited' : '';
    div.innerHTML = `
      <img src="${movie.thumbnail}" alt="${movie.title}" onclick="window.open('${movie.link}', '_blank')">
      <p>${movie.title} ${movie.year ? '(' + movie.year + ')' : ''}</p>
      <button onclick="window.open('${movie.link}', '_blank')">Stream</button>
      <button class="favorite-btn ${isFav}" onclick="toggleFavorite('${movie.link}', this)">❤</button>
    `;
    container.appendChild(div);
  });
}

// Toggle favorite
function toggleFavorite(link, btn) {
  if(favorites.includes(link)){
    favorites = favorites.filter(f => f !== link);
    btn.classList.remove('favorited');
  } else {
    favorites.push(link);
    btn.classList.add('favorited');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Filter category
function filterCategory(cat){
  currentPage = 1;
  fetchMovies(cat, currentPage);
}

// Search
searchInput.addEventListener("input", () => {
  currentPage = 1;
  fetchMovies(currentCategory, currentPage, searchInput.value);
});

// Infinite scroll
window.addEventListener('scroll', () => {
  if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500){
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

// Trending scroll arrows
function scrollTrending(distance) {
  trendingMoviesDiv.scrollBy({ left: distance, behavior: 'smooth' });
}

// Initial load
fetchMovies();
