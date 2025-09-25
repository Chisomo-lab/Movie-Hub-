const allMoviesDiv = document.getElementById("allMovies");
const trendingMoviesDiv = document.getElementById("trendingMovies");
const searchInput = document.getElementById("searchInput");

let movies = [];
let currentPage = 1;
let currentCategory = '';

// Favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Fetch movies from Archive.org API
async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    const searchQuery = query || (category ? category : 'mediatype:movies');
    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=title&fl[]=identifier&fl[]=mediatype&sort[]=downloads desc&rows=20&page=${page}&output=json`;
    const response = await fetch(url);
    const data = await response.json();
    const newMovies = data.response.docs.map(item => ({
      title: item.title,
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`
    }));
    if(page === 1) movies = newMovies; else movies = [...movies, ...newMovies];
    displayMovies(movies, allMoviesDiv);
    displayMovies(movies.slice(0,5), trendingMoviesDiv);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
  }
}

function displayMovies(list, container) {
  container.innerHTML = "";
  list.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie");
    const isFav = favorites.includes(movie.link) ? 'favorited' : '';
    div.innerHTML = `
      <img src="${movie.thumbnail}" alt="${movie.title}" onclick="window.open('${movie.link}', '_blank')">
      <p>${movie.title}</p>
      <button onclick="window.open('${movie.link}', '_blank')">Stream</button>
      <button class="favorite-btn ${isFav}" onclick="toggleFavorite('${movie.link}', this)">❤</button>
    `;
    container.appendChild(div);
  });
}

// Toggle favorite
function toggleFavorite(link, btn) {
  if(favorites.includes(link)) {
    favorites = favorites.filter(f => f !== link);
    btn.classList.remove('favorited');
  } else {
    favorites.push(link);
    btn.classList.add('favorited');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Category filter
function filterCategory(cat) {
  currentPage = 1;
  fetchMovies(cat, currentPage);
}

// Search
searchInput.addEventListener("input", () => {
  currentPage = 1;
  fetchMovies('', currentPage, searchInput.value);
});

// Infinite scroll
window.addEventListener('scroll', () => {
  if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

// Initial load
fetchMovies();