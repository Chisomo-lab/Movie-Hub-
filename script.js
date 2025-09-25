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

async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    const collection = collectionLinks[category] || '';
    const searchQuery = query
      ? `${query} AND mediatype:movies`
      : (collection ? `collection:(${collection})` : 'mediatype:movies');

    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=title&fl[]=identifier&fl[]=mediatype&fl[]=year&fl[]=description&sort[]=downloads desc&rows=20&page=${page}&output=json`;
    const response = await fetch(url);
    const data = await response.json();

    let newMovies = data.response.docs.map(item => ({
      title: item.title,
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: parseInt(item.year) || 0,
      description: item.description ? item.description.substring(0, 80) + "..." : "No description available."
    }));

    // Sort sports by year descending
    if(category === 'sports') newMovies.sort((a,b)=>b.year - a.year);

    movies = page === 1 ? newMovies : [...movies, ...newMovies];
    displayMovies(movies, allMoviesDiv);
    displayMovies(movies.slice(0,6), trendingMoviesDiv);

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
      <h3>${movie.title}</h3>
      <p>${movie.description}</p>
      <button onclick="window.open('${movie.link}', '_blank')">Stream</button>
      <button class="favorite-btn ${isFav}" onclick="toggleFavorite('${movie.link}', this)">❤</button>
    `;
    container.appendChild(div);
  });
}

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

function filterCategory(cat) { 
  currentPage = 1; 
  fetchMovies(cat, currentPage); 
}

searchInput.addEventListener("keydown", e => { 
  if(e.key === "Enter"){ 
    currentPage = 1; 
    fetchMovies('', currentPage, searchInput.value); 
  } 
});

window.addEventListener('scroll', () => {
  if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500){
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

fetchMovies();
