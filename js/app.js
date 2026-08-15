// js/app.js
import { initGallery, openDetail, closeDetail } from './gallery.js';
import { initSketchbook } from './sketchbook.js';
import { isConfigured } from './supabase.js';

// DOM elements
const mainNav = document.getElementById('mainNav');
const mobileNavToggle = document.getElementById('mobileNavToggle');
const navLinks = document.querySelectorAll('.nav-link');
const viewSections = document.querySelectorAll('.view-section');
const offlineBanner = document.getElementById('offlineBanner');

let activeView = 'collection'; // Track current active background view

/**
 * Handle SPA view switching
 */
function switchView(viewName) {
  if (!['collection', 'sketchbook', 'about'].includes(viewName)) {
    viewName = 'collection';
  }

  activeView = viewName;

  // 1. Update navigation links active state
  navLinks.forEach(link => {
    if (link.getAttribute('data-view') === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Hide all view sections and show target
  viewSections.forEach(section => {
    section.classList.remove('active');
    // Ensure display none is toggled through CSS active class
  });

  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // 3. Load view specific data
  if (viewName === 'sketchbook') {
    initSketchbook();
  }

  // Close mobile nav if open
  mainNav.classList.remove('open');
  mobileNavToggle.classList.remove('open');
}

/**
 * Routing dispatcher based on window location hash
 */
function handleRouting() {
  const hash = window.location.hash;

  if (hash.startsWith('#/artwork/')) {
    const artworkId = hash.replace('#/artwork/', '');
    // Open detail overlay, keeping the background view intact
    openDetail(artworkId);
  } else {
    // If detail modal is open, ensure it closes
    const detailOverlay = document.getElementById('detailOverlay');
    if (detailOverlay && detailOverlay.classList.contains('active')) {
      // Direct close without modifying hash again (prevent loop)
      detailOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (hash === '#/sketchbook') {
      switchView('sketchbook');
    } else if (hash === '#/about') {
      switchView('about');
    } else {
      switchView('collection');
    }
  }
}

/**
 * Main Application Entrance
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Show banner if not connected to live Supabase database
  if (!isConfigured) {
    offlineBanner.style.display = 'flex';
  }

  // 2. Initialize public gallery components
  initGallery();

  // 3. Handle routing
  window.addEventListener('hashchange', handleRouting);
  // Trigger on initial load
  handleRouting();

  // 4. Mobile navigation toggle handler
  mobileNavToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    mobileNavToggle.classList.toggle('open');
  });

  // Close navigation menu if clicked outside on mobile
  document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !mobileNavToggle.contains(e.target) && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      mobileNavToggle.classList.remove('open');
    }
  });
});
