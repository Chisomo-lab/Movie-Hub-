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

    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}&fl[]=title&fl[]=identifier&fl[]=year&fl[]=description&sort[]=downloads desc&rows=20&page=${page}&output=json`;

    const response = await fetch(url);
    const data = await response.json();

    let newMovies = data.response.docs.map(item => ({
      title: item.title || "Untitled",
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: item.year ? item.year : "Unknown",
      description: item.description 
          ? (Array.isArray(item.description) ? item.description[0] : item.description) 
          : "No description available."
    }));

    if(category === 'sports') {
      newMovies.sort((a,b)=> (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    }

    movies = page === 1 ? newMovies : [...movies, ...newMovies];

    displayMovies(movies, allMoviesDiv);
    displayMovies(movies.slice(0,5), trendingMoviesDiv);
  } catch (err) {
    console.error("Failed to fetch movies:", err);
    allMoviesDiv.innerHTML = `<p style="color:red; text-align:center;">⚠ Failed to load movies. Please refresh.</p>`;
  }
}

// Display movies
function displayMovies(list, container) {
  container.innerHTML = "";
  list.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie");
    const isFav = favorites.includes(movie.link) ? 'favorited' : '';
    div.innerHTML = `
      <div class="movie-thumb">
        <img src="${movie.thumbnail}" alt="${movie.title}" onclick="window.open('${movie.link}', '_blank')">
        <div class="movie-desc">
          <p><strong>${movie.title}</strong> ${movie.year !== "Unknown" ? '('+movie.year+')' : ''}</p>
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

// Category filter
function filterCategory(cat) { 
  currentPage = 1; 
  fetchMovies(cat, currentPage); 
}

// Search
searchInput.addEventListener("change", () => { 
  currentPage = 1; 
  fetchMovies('', currentPage, searchInput.value); 
});

// Infinite scroll
window.addEventListener('scroll', () => {
  if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500){
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

// Trending scroll
function scrollTrending(offset) {
  trendingMoviesDiv.scrollBy({ left: offset, behavior: 'smooth' });
}

// Load first batch
fetchMovies();
