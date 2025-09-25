
async function loadMovies() {
  const response = await fetch('movies.json');
  const data = await response.json();
  const categoriesDiv = document.getElementById('categories');
  categoriesDiv.innerHTML = '';
  data.categories.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';
    catDiv.innerHTML = `<h2>${cat.name}</h2>`;
    cat.movies.forEach(movie => {
      const movieDiv = document.createElement('div');
      movieDiv.className = 'movie';
      movieDiv.innerHTML = `
        <img src="${movie.thumbnail}" width="150"><br>
        <strong>${movie.title}</strong><br>
        <a href="${movie.stream_url}" target="_blank">Stream</a> | 
        <a href="${movie.download_url}" target="_blank">Download</a>
      `;
      catDiv.appendChild(movieDiv);
    });
    categoriesDiv.appendChild(catDiv);
  });
}

loadMovies();

document.getElementById('search').addEventListener('input', async function() {
  const query = this.value.toLowerCase();
  const response = await fetch('movies.json');
  const data = await response.json();
  const categoriesDiv = document.getElementById('categories');
  categoriesDiv.innerHTML = '';
  data.categories.forEach(cat => {
    const filteredMovies = cat.movies.filter(m => m.title.toLowerCase().includes(query));
    if(filteredMovies.length > 0){
      const catDiv = document.createElement('div');
      catDiv.className = 'category';
      catDiv.innerHTML = `<h2>${cat.name}</h2>`;
      filteredMovies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.className = 'movie';
        movieDiv.innerHTML = `
          <img src="${movie.thumbnail}" width="150"><br>
          <strong>${movie.title}</strong><br>
          <a href="${movie.stream_url}" target="_blank">Stream</a> | 
          <a href="${movie.download_url}" target="_blank">Download</a>
        `;
        catDiv.appendChild(movieDiv);
      });
      categoriesDiv.appendChild(catDiv);
    }
  });
});
