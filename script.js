const allMoviesDiv = document.getElementById("allMovies");
const trendingMoviesDiv = document.getElementById("trendingMovies");
const searchInput = document.getElementById("searchInput");

let movies = [];

// Fetch movies from Archive.org API
async function fetchMovies(query = "") {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${query ? query : 'mediatype:movies'}&fl[]=title&fl[]=identifier&fl[]=mediatype&fl[]=description&sort[]=downloads desc&rows=20&page=1&output=json`;
    const response = await fetch(url);
    const data = await response.json();
    movies = data.response.docs.map(item => ({
      title: item.title,
      link: `https://archive.org/details/${item.identifier}`,
      thumbnail: `https://archive.org/services/img/${item.identifier}`
    }));
    displayMovies(movies, allMoviesDiv);
    displayMovies(movies.slice(0, 5), trendingMoviesDiv); // top 5 trending
  } catch (err) {
    console.error("Failed to fetch movies:", err);
  }
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

// Category filter
function filterCategory(cat) {
  fetchMovies(cat);
}

// Search
searchInput.addEventListener("input", () => {
  const query = searchInput.value;
  fetchMovies(query);
});

// Initial load
fetchMovies();