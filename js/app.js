// js/app.js
import { initGallery, openDetail, closeDetail } from './gallery.js';
import { initSketchbook } from './sketchbook.js';
import { isConfigured } from './supabase.js';

// DOM elements
const mainNav = document.getElementById('mainNav');
const mobileNavToggle = document.getElementById('mobileNavToggle');
const navLinks = document.querySelectorAll('.nav-link');
const viewSections = document.querySelectorAll('.view-section');

let activeView = 'home'; // Track current active background view

/**
 * Handle SPA view switching
 */
function switchView(viewName) {
  if (!['home', 'collection', 'sketchbook', 'about'].includes(viewName)) {
    viewName = 'home';
  }

  activeView = viewName;

  document.body.setAttribute('data-active-view', viewName);

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

  // Scroll to top on every view change for a clean page-load feel
  window.scrollTo(0, 0);
}

/**
 * Routing dispatcher based on window location hash
 */
function handleRouting() {
  const hash = window.location.hash;

  if (hash.startsWith('#/artwork/')) {
    const artworkId = hash.replace('#/artwork/', '');
    openDetail(artworkId);
  } else {
    const detailOverlay = document.getElementById('detailOverlay');
    if (detailOverlay && detailOverlay.classList.contains('active')) {
      detailOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (hash === '#/sketchbook' || hash.startsWith('#month-')) {
      switchView('sketchbook');
    } else if (hash === '#/about') {
      switchView('about');
    } else if (hash === '#/collection') {
      switchView('collection');
    } else {
      // Default landing route: '', '#/', '#/home'
      switchView('home');
    }
  }
}

/**
 * Main Application Entrance
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!isConfigured) {
    console.log("Offline Mode: Displaying local mock sketchbook data. Configure Supabase in js/config.js to link your database.");
  }

  initGallery();

  window.addEventListener('hashchange', handleRouting);
  handleRouting();

  mobileNavToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    mobileNavToggle.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !mobileNavToggle.contains(e.target) && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      mobileNavToggle.classList.remove('open');
    }
  });
});