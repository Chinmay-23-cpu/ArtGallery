// js/gallery.js
import { getArtworks } from './data.js';

let allArtworks = [];
let filteredArtworks = [];
let currentCategory = 'all';

// DOM elements
const heroTitle = document.getElementById('heroTitle');
const heroMediumYear = document.getElementById('heroMediumYear');
const heroImageFrame = document.getElementById('heroImageFrame');
const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.filter-btn');

// Detail Overlay DOM elements
const detailOverlay = document.getElementById('detailOverlay');
const btnCloseDetail = document.getElementById('btnCloseDetail');
const detailPositionIndex = document.getElementById('detailPositionIndex');
const detailImageSection = document.getElementById('detailImageSection');
const detailImage = document.getElementById('detailImage');
const modalArtworkTitle = document.getElementById('modalArtworkTitle');
const detailMedium = document.getElementById('detailMedium');
const detailCategory = document.getElementById('detailCategory');
const detailYear = document.getElementById('detailYear');
const detailDate = document.getElementById('detailDate');
const detailDescription = document.getElementById('detailDescription');

/**
 * Initialize the Public Gallery
 */
export async function initGallery() {
  allArtworks = await getArtworks();
  filteredArtworks = [...allArtworks];

  // 1. Render Featured Hero
  renderHero();

  // 2. Render Grid
  renderGrid();

  // 3. Set up filter event listeners
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentCategory = btn.getAttribute('data-filter');
      applyFilter();
    });
  });

  // 4. Set up Detail overlay closing
  btnCloseDetail.addEventListener('click', closeDetail);
  
  // Close details on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailOverlay.classList.contains('active')) {
      closeDetail();
    }
  });

  // 5. Image Zoom and Pan (transform-origin centered on cursor)
  setupImageZoom();
}

/**
 * Render the Hero Section with the Featured Artwork
 */
function renderHero() {
  const featured = allArtworks.find(art => art.featured) || allArtworks[0];
  
  if (!featured) {
    if (heroSection) heroSection.style.display = 'none';
    return;
  }

  heroTitle.textContent = featured.title;
  heroMediumYear.textContent = `${featured.medium} · ${featured.year}`;
  
  heroImageFrame.innerHTML = `
    <img src="${featured.image_url}" alt="${featured.title}" style="opacity: 0; transition: opacity 0.8s ease;" onload="this.style.opacity=1;">
  `;
  
  // Clicking the hero image opens its details
  heroImageFrame.onclick = () => {
    openDetail(featured.id);
  };
}

/**
 * Render Artworks in Masonry Grid
 */
function renderGrid() {
  galleryGrid.innerHTML = '';
  
  if (filteredArtworks.length === 0) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        No studies here yet.
      </div>
    `;
    return;
  }

  filteredArtworks.forEach((art) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View details for ${art.title}`);
    item.onclick = () => openDetail(art.id);

    // Simple layout card markup without excessive borders/decorations
    item.innerHTML = `
      <div class="artwork-card">
        <div class="artwork-image-wrapper">
          <img src="${art.image_url}" alt="${art.title}" loading="lazy" style="opacity: 0; transition: opacity 0.5s ease;" onload="this.style.opacity=1;">
        </div>
        <div class="artwork-info">
          <div>
            <h3 class="artwork-card-title">${art.title}</h3>
            <p class="artwork-card-medium">${art.medium}</p>
          </div>
          <span class="artwork-card-year">${art.year}</span>
        </div>
      </div>
    `;
    
    galleryGrid.appendChild(item);
  });
}

/**
 * Apply active category filtering
 */
function applyFilter() {
  if (currentCategory === 'all') {
    filteredArtworks = [...allArtworks];
  } else {
    filteredArtworks = allArtworks.filter(art => art.category.toLowerCase() === currentCategory.toLowerCase());
  }
  renderGrid();
}

/**
 * Open detail view
 */
export function openDetail(id) {
  const art = allArtworks.find(a => a.id === id);
  if (!art) return;

  // Find index relative to current active sorting
  const totalCount = allArtworks.length;
  const sortedIndex = allArtworks.findIndex(a => a.id === id) + 1;
  const indexStr = `${String(sortedIndex).padStart(2, '0')} / ${String(totalCount).padStart(2, '0')}`;

  // Populate data
  detailPositionIndex.textContent = indexStr;
  detailImage.src = art.image_url;
  detailImage.alt = art.title;
  modalArtworkTitle.textContent = art.title;
  detailMedium.textContent = art.medium;
  detailCategory.textContent = art.category;
  detailYear.textContent = art.year;
  
  // Format creation date beautifully
  const dateObj = new Date(art.date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
  detailDate.textContent = formattedDate;
  
  detailDescription.textContent = art.description || 'No notes written for this study.';

  // Show overlay and prevent main body scrolling
  detailOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Update hash route so url represents deep link
  window.location.hash = `#/artwork/${id}`;
}

/**
 * Close detail view
 */
export function closeDetail() {
  detailOverlay.classList.remove('active');
  document.body.style.overflow = '';
  
  // Reset zoom state
  detailImageSection.classList.remove('zoomed');
  detailImage.style.transform = '';
  detailImage.style.transformOrigin = '';

  // Return hash to collection or sketchbook, whichever was active before
  const prevView = window.location.hash.includes('sketchbook') ? 'sketchbook' : 'collection';
  window.location.hash = `#/${prevView}`;
}

/**
 * Setup zoom / pan physics with transform-origin tracking the cursor position
 */
function setupImageZoom() {
  detailImageSection.addEventListener('click', () => {
    detailImageSection.classList.toggle('zoomed');
    if (!detailImageSection.classList.contains('zoomed')) {
      detailImage.style.transform = '';
      detailImage.style.transformOrigin = '';
    }
  });

  detailImageSection.addEventListener('mousemove', (e) => {
    if (!detailImageSection.classList.contains('zoomed')) return;
    
    const rect = detailImageSection.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Smooth origin centering
    detailImage.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  });

  detailImageSection.addEventListener('mouseleave', () => {
    if (detailImageSection.classList.contains('zoomed')) {
      detailImageSection.classList.remove('zoomed');
      detailImage.style.transform = '';
      detailImage.style.transformOrigin = '';
    }
  });
}
