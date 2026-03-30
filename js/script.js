// ─── API Configuration ───────────────────────────────────────────────────────
// Replace 'DEMO_KEY' with your personal key from https://api.nasa.gov/
// DEMO_KEY works but is rate-limited (30 requests/hour, 50/day).
const API_KEY = 'QadH3HrSkzRZ1S3p3aFxd9wiSFZGm7AdWGUoy9fr';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// ─── DOM References ──────────────────────────────────────────────────────────
const startInput = document.getElementById('startDate');
const endInput   = document.getElementById('endDate');
const fetchBtn   = document.getElementById('fetchBtn');
const gallery    = document.getElementById('gallery');

const modal            = document.getElementById('modal');
const modalClose       = document.getElementById('modalClose');
const modalBackdrop    = modal.querySelector('.modal-backdrop');
const modalMedia       = document.getElementById('modalMedia');
const modalTitle       = document.getElementById('modal-title');
const modalDate        = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

// ─── Random Space Fact ───────────────────────────────────────────────────────
const spaceFacts = [
  "A day on Venus is longer than a year on Venus — it takes 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.",
  "Neutron stars are so dense that a teaspoon of their material would weigh about 10 million tons on Earth.",
  "The Milky Way galaxy is estimated to contain between 100 and 400 billion stars.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "There are more stars in the observable universe than grains of sand on all of Earth's beaches.",
  "The footprints left by Apollo astronauts on the Moon will likely remain for millions of years — there's no wind or rain to erode them.",
  "Saturn's rings are incredibly thin relative to their width — they stretch up to 282,000 km across but are less than 1 km thick.",
  "One million Earths could fit inside the Sun.",
  "The largest known star, UY Scuti, is about 1,700 times wider than the Sun.",
  "Space is completely silent — sound waves need a medium to travel through, and the vacuum of space has none.",
  "The Voyager 1 spacecraft, launched in 1977, is the most distant human-made object ever, now over 23 billion km from Earth.",
  "A year on Mercury is just 88 Earth days long.",
  "Jupiter's Great Red Spot is a storm that has been raging for over 350 years.",
  "The Andromeda Galaxy is on a collision course with the Milky Way — but the merger won't happen for about 4.5 billion years.",
  "Olympus Mons on Mars is the tallest volcano in the solar system at nearly 22 km high — almost three times the height of Everest.",
];

const factEl = document.getElementById('spaceFact');
factEl.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

// ─── Date Picker Setup ───────────────────────────────────────────────────────
setupDateInputs(startInput, endInput);

// ─── Fetch & Render ──────────────────────────────────────────────────────────
fetchBtn.addEventListener('click', fetchImages);

async function fetchImages() {
  const start = startInput.value;
  const end   = endInput.value;

  if (!start || !end) {
    showError('Please select both a start and end date.');
    return;
  }

  factEl.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

  showLoading();
  fetchBtn.disabled = true;

  try {
    const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${start}&end_date=${end}`;
    const response = await fetch(url);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.msg || `Request failed (${response.status})`);
    }

    const data = await response.json();

    // API returns a single object when only one date matches — normalise to array
    const items = Array.isArray(data) ? data : [data];
    renderGallery(items);
  } catch (error) {
    showError(`Could not load images: ${error.message}`);
  } finally {
    fetchBtn.disabled = false;
  }
}

// ─── Gallery Rendering ───────────────────────────────────────────────────────
function renderGallery(items) {
  gallery.innerHTML = '';

  if (items.length === 0) {
    showError('No images found for this date range.');
    return;
  }

  items.forEach(item => {
    const card = createCard(item);
    gallery.appendChild(card);
  });
}

function createCard(item) {
  const isVideo = item.media_type === 'video';

  const card = document.createElement('div');
  card.className = 'gallery-item';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${item.title}`);

  // Thumbnail
  if (isVideo) {
    const videoId = getYouTubeId(item.url);
    const wrapper = document.createElement('div');
    wrapper.className = 'card-video-thumb';

    if (videoId) {
      const thumb = document.createElement('img');
      thumb.className = 'card-thumb';
      thumb.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      thumb.alt = item.title;
      thumb.loading = 'lazy';
      wrapper.appendChild(thumb);
    }

    const playBtn = document.createElement('div');
    playBtn.className = 'play-btn';
    playBtn.setAttribute('aria-hidden', 'true');
    playBtn.innerHTML = '&#9654;';
    wrapper.appendChild(playBtn);

    card.appendChild(wrapper);
  } else {
    const img = document.createElement('img');
    img.className = 'card-thumb';
    img.src = item.url;
    img.alt = item.title;
    img.loading = 'lazy';
    card.appendChild(img);
  }

  // Info strip
  const info = document.createElement('div');
  info.className = 'card-info';

  const title = document.createElement('p');
  title.className = 'card-title';
  title.textContent = item.title;

  const date = document.createElement('p');
  date.className = 'card-date';
  date.textContent = formatDate(item.date);

  info.appendChild(title);
  info.appendChild(date);
  card.appendChild(info);

  // Open modal on click or Enter/Space
  card.addEventListener('click', () => openModal(item));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(item);
    }
  });

  return card;
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function openModal(item) {
  const isVideo = item.media_type === 'video';

  modalMedia.innerHTML = '';

  if (isVideo) {
    const videoId = getYouTubeId(item.url);
    if (videoId) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.title = item.title;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      modalMedia.appendChild(iframe);
    } else {
      // Non-YouTube video — provide a direct link
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'video-fallback-link';
      link.textContent = 'Watch Video';
      modalMedia.appendChild(link);
    }
  } else {
    const img = document.createElement('img');
    // Use hdurl when available for the larger modal view
    img.src = item.hdurl || item.url;
    img.alt = item.title;
    modalMedia.appendChild(img);
  }

  modalTitle.textContent = item.title;
  modalDate.textContent  = formatDate(item.date);
  modalExplanation.textContent = item.explanation;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Clear iframe src to stop video playback
  modalMedia.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});

// ─── State Helpers ───────────────────────────────────────────────────────────
function showLoading() {
  gallery.innerHTML = '<p class="loading-message">🔄 Loading space photos…</p>';
}

function showError(message) {
  gallery.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

// Extract a YouTube video ID from watch or embed URLs, returns null for others
function getYouTubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || parsed.pathname.split('/').pop() || null;
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
  } catch (_) {}
  return null;
}

function formatDate(isoDate) {
  // e.g. "2025-03-20" → "March 20, 2025"
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
