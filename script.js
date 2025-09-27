// Define categories and their corresponding collection identifiers
const categories = {
  animation: 'animation',
  anime: 'anime',
  sports: 'sports',
  movies: 'movies',
};

// Define the number of videos to display per category
const videosPerCategory = 4;

// Function to fetch videos from a specific collection
async function fetchVideos(collection) {
  const url = `https://archive.org/advancedsearch.php?q=collection:${collection}&fl[]=identifier,title,creator,description,subject,mediatype,publicdate&rows=100&output=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.response.docs;
}

// Function to create a video card element
function createVideoCard(video) {
  const card = document.createElement('div');
  card.classList.add('video-card');

  const thumbnail = document.createElement('img');
  thumbnail.src = `https://archive.org/services/img/${video.identifier}`;
  thumbnail.alt = video.title;
  card.appendChild(thumbnail);

  const title = document.createElement('h3');
  title.textContent = video.title;
  card.appendChild(title);

  const creator = document.createElement('p');
  creator.textContent = `Creator: ${video.creator || 'Unknown'}`;
  card.appendChild(creator);

  const description = document.createElement('p');
  description.textContent = video.description || 'No description available.';
  card.appendChild(description);

  const link = document.createElement('a');
  link.href = `https://archive.org/details/${video.identifier}`;
  link.textContent = 'Watch on Archive.org';
  card.appendChild(link);

  return card;
}

// Function to display videos for a specific category
async function displayCategoryVideos(category) {
  const videos = await fetchVideos(categories[category]);
  const container = document.getElementById(`${category}-videos`);
  container.innerHTML = '';

  // Display top 4 videos
  videos.slice(0, videosPerCategory).forEach(video => {
    const videoCard = createVideoCard(video);
    container.appendChild(videoCard);
  });
}

// Function to initialize the app
async function init() {
  // Display videos for each category
  for (const category in categories) {
    await displayCategoryVideos(category);
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
