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
  
  // Close details on clicking the background (outside the content card)
  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay || e.target.classList.contains('detail-immersive-container')) {
      closeDetail();
    }
  });
  
  // Close details on ESC key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailOverlay && detailOverlay.classList.contains('active')) {
      closeDetail();
    }
  });

  // 5. Image Zoom and Pan (transform-origin centered on cursor)
  setupImageZoom();
}

/**
 * Helper to compute stable chronological archive numbers based on date order
 * Returns just the padded string (e.g. "021") to allow flexible formatting in layout templates
 */
export function getArchiveNumber(art, allList) {
  const sorted = [...allList].sort((a, b) => new Date(a.date) - new Date(b.date));
  const index = sorted.findIndex(a => a.id === art.id) + 1;
  return String(index).padStart(3, '0');
}

/**
 * Render the Hero Section with the Featured Artwork
 */
// function renderHero() {
//   const featured = allArtworks.find(art => art.featured) || allArtworks[0];
//   const heroSection = document.getElementById('heroSection');
  
//   if (!featured) {
//     if (heroSection) heroSection.style.display = 'none';
//     return;
//   }

//   if (heroSection) heroSection.style.display = '';

//   const heroArchiveNum = document.getElementById('heroArchiveNum');
//   const heroMedium = document.getElementById('heroMedium');
//   const heroYear = document.getElementById('heroYear');
//   const heroDate = document.getElementById('heroDate');
//   const btnHeroDetail = document.getElementById('btnHeroDetail');

//   if (heroArchiveNum) heroArchiveNum.textContent = getArchiveNumber(featured, allArtworks);
//   if (heroMedium) heroMedium.textContent = featured.medium.toUpperCase();
//   if (heroYear) heroYear.textContent = featured.year;

//   // Format date (e.g. JULY 2026)
//   if (heroDate) {
//     const dateObj = new Date(featured.date);
//     const formattedDate = dateObj.toLocaleDateString('en-US', {
//       month: 'long',
//       year: 'numeric',
//       timeZone: 'UTC'
//     }).toUpperCase();
//     heroDate.textContent = formattedDate;
//   }

//   heroTitle.textContent = featured.title;
  
//   heroImageFrame.innerHTML = `
//     <img src="${featured.image_url}" alt="${featured.title}" style="opacity: 0; transition: opacity 0.8s ease;" onload="this.style.opacity=1;">
//   `;
  
//   // Clicking the hero image or the explore button opens its details
//   heroImageFrame.onclick = () => {
//     openDetail(featured.id);
//   };

//   if (btnHeroDetail) {
//     btnHeroDetail.onclick = () => {
//       openDetail(featured.id);
//     };
//   }
// }

function renderHero() {
  const heroSection = document.getElementById('heroSection');
  const heroDeck = document.getElementById('heroDeck');

  if (!allArtworks.length) {
    if (heroSection) heroSection.style.display = 'none';
    return;
  }

  if (heroSection) heroSection.style.display = '';

  // Take up to 5 pieces — featured first, then most recent
  const featured = allArtworks.find(art => art.featured);
  const rest = allArtworks.filter(art => art.id !== featured?.id);
  const deckPieces = [featured, ...rest].filter(Boolean).slice(0, 5);

  heroDeck.innerHTML = deckPieces.map((art, i) => `
    <div class="hero-deck-card" style="--i: ${i};" data-id="${art.id}">
      <img src="${art.image_url}" alt="${art.title}" loading="lazy">
    </div>
  `).join('');

  // Clicking any card opens that artwork's detail view
  heroDeck.querySelectorAll('.hero-deck-card').forEach(card => {
    card.addEventListener('click', () => {
      openDetail(card.dataset.id);
    });
  });
}

/**
 * Render Artworks in Concept B 5-column Editorial Grid
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

  filteredArtworks.forEach((art, index) => {
    const item = document.createElement('div');
    
    // Assign 5-column Concept B rhythm: first of every 7 is large (2x2), others small (1x1)
    const isLarge = index % 7 === 0;
    item.className = `gallery-item ${isLarge ? 'layout-large' : 'layout-small'}`;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `View details for ${art.title}`);
    item.onclick = () => openDetail(art.id);

    const archiveNum = `NO. ${getArchiveNumber(art, allArtworks)}`;

    item.innerHTML = `
      <div class="artwork-card">
        <div class="artwork-plate">
          <span class="artwork-plate-number">${archiveNum}</span>
          <div class="artwork-image-wrapper">
            <img src="${art.image_url}" alt="${art.title}" loading="lazy" style="opacity: 0; transition: opacity 0.5s ease;" onload="this.style.opacity=1;">
          </div>
        </div>
        <div class="artwork-meta-editorial">
          <h3 class="artwork-card-title">${art.title}</h3>
          <span class="artwork-card-medium">${art.medium}</span>
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
  const indexStr = `${sortedIndex} / ${totalCount}`;

  // Populate data safely, preventing console errors if elements are missing from HTML template
  if (detailPositionIndex) {
    detailPositionIndex.textContent = indexStr;
  }
  
  const detailPlateNumber = document.getElementById('detailPlateNumber');
  if (detailPlateNumber) {
    detailPlateNumber.textContent = `NO. ${getArchiveNumber(art, allArtworks)}`;
  }

  if (detailImage) {
    detailImage.src = art.image_url;
    detailImage.alt = art.title;
  }
  if (modalArtworkTitle) {
    modalArtworkTitle.textContent = art.title;
  }
  if (detailMedium) {
    detailMedium.textContent = art.medium.toUpperCase();
  }
  if (detailYear) {
    detailYear.textContent = art.year;
  }
  
  if (detailDate) {
    const dateObj = new Date(art.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).toUpperCase();
    detailDate.textContent = formattedDate;
  }
  
  if (detailDescription) {
    detailDescription.textContent = art.description || 'No notes written for this study.';
  }

  // Show overlay and prevent main body scrolling
  if (detailOverlay) {
    detailOverlay.classList.add('active');
  }
  document.body.style.overflow = 'hidden';

  // Update hash route so url represents deep link
  window.location.hash = `#/artwork/${id}`;
}

/**
 * Close detail view
 */
export function closeDetail() {
  if (detailOverlay) {
    detailOverlay.classList.remove('active');
  }
  document.body.style.overflow = '';
  
  // Reset zoom state
  if (detailImageSection) {
    detailImageSection.classList.remove('zoomed');
  }
  if (detailImage) {
    detailImage.style.transform = '';
    detailImage.style.transformOrigin = '';
  }

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
