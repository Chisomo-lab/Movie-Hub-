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

// Fetch movies from Archive.org
async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    const collection = collectionLinks[category] || '';

    const searchQuery = query
        ? `${collection ? `collection:(${collection}) AND ` : ''}title:(${query})`
        : (collection ? `collection:(${collection})` : 'mediatype:movies');

    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}&fl[]=title&fl[]=identifier&fl[]=mediatype&fl[]=year&fl[]=description&sort[]=downloads desc&rows=20&page=${page}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    let newMovies = data.response.docs.map(item => ({
      title: item.title || "Untitled",
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: item.year || 0,
      description: item.description ? (Array.isArray(item.description) ? item.description[0] : item.description) : "No description available.",
      category: category
    }));

    if(category === 'sports') newMovies.sort((a,b)=>b.year - a.year);

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
      <div class="movie-thumb">
        <img src="${movie.thumbnail}" alt="${movie.title}" onclick="window.open('${movie.link}', '_blank')">
        <div class="movie-desc">
          <p>${movie.title} ${movie.year ? '(' + movie.year + ')' : ''}</p>
          <p>${movie.description}</p>
          <button onclick="window.open('${movie.link}', '_blank')">Stream</button>
          <button class="favorite-btn ${isFav}" onclick="toggleFavorite('${movie.link}', this)">❤</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Toggle favorite
function toggleFavorite
