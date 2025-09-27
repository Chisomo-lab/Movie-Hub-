const allMoviesDiv = document.getElementById("allMovies");
const trendingMoviesDiv = document.getElementById("trendingMovies");
const searchInput = document.getElementById("searchInput");

let movies = [];
let currentPage = 1;
let currentCategory = '';

const collectionLinks = {
  sports: 'sports',
  movies: 'moviesandfilms',
  tv: 'television',
  cartoons: 'animationandcartoons'
};

async function fetchMovies(category = '', page = 1, query = '') {
  try {
    currentCategory = category;
    let collection = category ? collectionLinks[category] : '';
    const searchQuery = collection ? `collection:(${collection})` : 'mediatype:movies';
    const url = `https://archive.org/advancedsearch.php?q=${searchQuery}&fl[]=title&fl[]=identifier&fl[]=year&sort[]=downloads desc&rows=20&page=${page}&output=json`;
    const response = await fetch(url);
    const data = await response.json();
    let newMovies = data.response.docs.map(item => ({
      title: item.title,
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`,
      year: item.year || 0
    }));
    if(query) newMovies = newMovies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
    if(category === 'sports') newMovies.sort((a,b)=>b.year - a.year);
    movies = page === 1 ? newMovies : [...movies, ...newMovies];
    displayMovies(movies, allMoviesDiv);
    displayMovies(movies.slice(0, 5), trendingMoviesDiv);
  } catch (err) { console.error("Failed to fetch movies:", err); }
}

function displayMovies(list, container) {
  container.innerHTML = "";
  list.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie");
    div.innerHTML = `
      <img src="${movie.thumbnail}" alt="${movie.title}" onclick="window.open('${movie.link}', '_blank')">
      <p>${movie.title}</p>
      <button onclick="window.open('${movie.link}', '_blank')">Stream</button>
    `;
    container.appendChild(div);
  });
}

function searchMovies() {
  fetchMovies('', 1, searchInput.value);
}

window.addEventListener('scroll', () => {
  if((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500){
    currentPage++;
    fetchMovies(currentCategory, currentPage, searchInput.value);
  }
});

fetchMovies();
