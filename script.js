const allMoviesDiv = document.getElementById("allMovies");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

let movies = [];
let currentPage = 1;
let currentCategory = '';

const collectionLinks = {
  sports: 'sports',
  moviesandfilms: 'moviesandfilms',
  television: 'television',
  animationandcartoons: 'animationandcartoons',
  anime: 'anime'
};

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Fetch Movies
async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    let searchQuery;

    if (query) {
      searchQuery = `title:"${query}"`;
    } else {
      const collection = collectionLinks[category] || '';
      searchQuery = collection ? `collection:(${collection})` : 'mediatype:movies';
    }

    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=title&fl[]=identifier&fl[]=year&sort[]=year desc&rows=20&page=${page}&output=json`;
    const response = await fetch(url);
    const data = await response.json();

    let newMovies = data.response.docs.map(item => ({
      title: item.title,
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: item.year || 0
    }));

    // Sports sorted by year descending
    if (category === 'sports') newMovies.sort((a, b) => b.year - a.year);

    movies = page === 1 ? newMovies : [...movies, ...newMovies];
    displayMovies(movies, allMoviesDiv);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
  }
}

// Display Movies
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

// Toggle Favorite
function toggleFavorite(link, btn) {
  if (favorites.includes(link)) {
    favorites = favorites.filter(f => f !== link);
    btn.classList.remove('favorited');
  } else {
    favorites.push(link);
    btn.classList.add('favorited');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Filter by category
function filterCategory(cat) {
  currentPage = 1;
  fetchMovies(cat, currentPage);
}

// Search Button
searchBtn.addEventListener("click", () => {
  currentPage = 1;
  fetchMovies('', currentPage, searchInput.value);
});

// Auto-load more
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

// Fetch Trending for each category
async function fetchTrending(category, containerId) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=collection:(${collectionLinks[category]})&fl[]=title&fl[]=identifier&fl[]=year&sort[]=downloads desc&rows=10&page=1&output=json`;
    const response = await fetch(url);
    const data = await response.json();

    const trendingList = document.getElementById(containerId);
    trendingList.innerHTML = "";

    data.response.docs.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("movie");
      div.innerHTML = `
        <img src="https://archive.org/services/img/${item.identifier}" alt="${item.title}" onclick="window.open('https://archive.org/details/${item.identifier}', '_blank')">
        <p>${item.title}</p>
      `;
      trendingList.appendChild(div);
    });
  } catch (err) {
    console.error("Failed to fetch trending:", err);
  }
}

// Init
fetchMovies();
fetchTrending("moviesandfilms", "trendingMovies");
fetchTrending("sports", "trendingSports");
fetchTrending("animationandcartoons", "trendingCartoons");
fetchTrending("anime", "trendingAnime");
fetchTrending("television", "trendingTelevision");
