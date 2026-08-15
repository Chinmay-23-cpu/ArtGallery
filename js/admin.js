// js/admin.js
import { enforceAuth, signOut } from './auth.js';
import { getArtworks, createArtwork, updateArtwork, deleteArtwork, uploadImage } from './data.js';
import { isConfigured } from './supabase.js';

// Guard this page
enforceAuth();

// Local State
let artworks = [];
let activeArtworkId = null; // For editing
let deleteArtworkId = null; // For deletion

// DOM References
const adminOfflineBanner = document.getElementById('adminOfflineBanner');
const artworkCountLabel = document.getElementById('artworkCountLabel');
const adminArtworksList = document.getElementById('adminArtworksList');
const btnAddNew = document.getElementById('btnAddNew');
const btnLogout = document.getElementById('btnLogout');

// Modal Form DOM References
const artworkModal = document.getElementById('artworkModal');
const btnModalClose = document.getElementById('btnModalClose');
const artworkForm = document.getElementById('artworkForm');
const modalHeaderTitle = document.getElementById('modalHeaderTitle');
const artworkIdInput = document.getElementById('artworkId');
const artTitleInput = document.getElementById('artTitle');
const artCategoryInput = document.getElementById('artCategory');
const artMediumInput = document.getElementById('artMedium');
const artYearInput = document.getElementById('artYear');
const artDateInput = document.getElementById('artDate');
const artDescInput = document.getElementById('artDesc');
const artImageInput = document.getElementById('artImage');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const artExistingImageUrl = document.getElementById('artExistingImageUrl');
const artFeaturedInput = document.getElementById('artFeatured');
const btnFormCancel = document.getElementById('btnFormCancel');
const btnFormSubmit = document.getElementById('btnFormSubmit');

// Delete Modal DOM References
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteArtworkName = document.getElementById('deleteArtworkName');
const btnDeleteCancel = document.getElementById('btnDeleteCancel');
const btnDeleteConfirm = document.getElementById('btnDeleteConfirm');

// Toast DOM Reference
const toastMessage = document.getElementById('toastMessage');

/**
 * Show Toast Alert
 */
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  toastMessage.className = `toast ${type}`;
  toastMessage.style.display = 'block';
  
  setTimeout(() => {
    toastMessage.style.display = 'none';
  }, 4000);
}

/**
 * Format date string into YYYY-MM-DD for input elements
 */
function formatDateForInput(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateString);
    return d.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Load Artworks List and Render
 */
async function loadArtworksList() {
  try {
    artworks = await getArtworks();
    artworkCountLabel.textContent = `${artworks.length} Artworks`;
    renderTable();
  } catch (err) {
    console.error("Failed to load artworks:", err);
    showToast("Error loading artworks list.", "error");
  }
}

/**
 * Render Artworks Admin Rows
 */
function renderTable() {
  adminArtworksList.innerHTML = '';
  
  if (artworks.length === 0) {
    adminArtworksList.innerHTML = `
      <div style="text-align: center; padding: 4rem 0; color: var(--color-text-muted); font-family: var(--font-serif); font-size: 1.25rem;">
        No artwork pieces in the database yet. Click "+ Add Artwork" to begin.
      </div>
    `;
    return;
  }

  artworks.forEach(art => {
    const row = document.createElement('div');
    row.className = 'admin-row';
    
    // Format creation date for table row
    const formattedDate = new Date(art.date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });

    row.innerHTML = `
      <div class="admin-thumbnail">
        <img src="${art.image_url}" alt="${art.title}">
      </div>
      <div>
        <strong style="display:block; font-size: 0.95rem;">${art.title}</strong>
        <span class="text-muted" style="font-size: 0.8rem; text-transform: uppercase;">${art.category}</span>
      </div>
      <div class="admin-col-medium" style="font-size: 0.85rem; color: var(--color-text-muted);">
        ${art.medium}
      </div>
      <div style="font-size: 0.85rem;">
        ${formattedDate} ${art.featured ? '<span style="color: var(--color-accent); font-weight: bold; margin-left: 0.5rem; font-size: 0.8rem;">★ Featured</span>' : ''}
      </div>
      <div class="admin-col-actions admin-actions">
        <button class="admin-btn-action btn-edit" data-id="${art.id}">Edit</button>
        <button class="admin-btn-action btn-delete" data-id="${art.id}" style="color: var(--color-error);">Delete</button>
      </div>
    `;

    // Edit button click handler
    row.querySelector('.btn-edit').onclick = () => openEditModal(art);
    // Delete button click handler
    row.querySelector('.btn-delete').onclick = () => openDeleteModal(art);

    adminArtworksList.appendChild(row);
  });
}

/**
 * Add Form Modals Mechanics
 */
function openAddModal() {
  activeArtworkId = null;
  artworkForm.reset();
  
  // Clear file uploads & previews
  artworkIdInput.value = '';
  artExistingImageUrl.value = '';
  imagePreviewContainer.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.8rem;">No file selected (or URL placeholder active)</span>';
  
  // Default values
  artYearInput.value = new Date().getFullYear();
  artDateInput.value = new Date().toISOString().split('T')[0];
  
  modalHeaderTitle.textContent = "Add Artwork";
  btnFormSubmit.textContent = "Save Artwork";
  
  artworkModal.classList.add('active');
}

function openEditModal(artwork) {
  activeArtworkId = artwork.id;
  artworkForm.reset();
  
  artworkIdInput.value = artwork.id;
  artTitleInput.value = artwork.title;
  artCategoryInput.value = artwork.category;
  artMediumInput.value = artwork.medium;
  artYearInput.value = artwork.year;
  artDateInput.value = formatDateForInput(artwork.date);
  artDescInput.value = artwork.description || '';
  artExistingImageUrl.value = artwork.image_url;
  artFeaturedInput.checked = artwork.featured;

  // Show image preview
  imagePreviewContainer.innerHTML = `
    <img src="${artwork.image_url}" alt="${artwork.title}">
  `;

  modalHeaderTitle.textContent = "Edit Artwork";
  btnFormSubmit.textContent = "Save Changes";
  
  artworkModal.classList.add('active');
}

function closeArtworkModal() {
  artworkModal.classList.remove('active');
  artworkForm.reset();
  activeArtworkId = null;
}

/**
 * Handle image preview when user selects file
 */
artImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      imagePreviewContainer.innerHTML = `
        <img src="${event.target.result}" alt="Preview">
      `;
    };
    reader.readAsDataURL(file);
  } else {
    // If empty and existing image url exists, show existing
    const existingUrl = artExistingImageUrl.value;
    if (existingUrl) {
      imagePreviewContainer.innerHTML = `<img src="${existingUrl}" alt="Existing">`;
    } else {
      imagePreviewContainer.innerHTML = '<span style="color: var(--color-text-muted); font-size: 0.8rem;">No file selected</span>';
    }
  }
});

/**
 * Save / Update Form Submission
 */
artworkForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  btnFormSubmit.disabled = true;
  btnFormSubmit.textContent = "Processing...";

  const file = artImageInput.files[0];
  let finalImageUrl = artExistingImageUrl.value;

  try {
    // 1. If a new image file is chosen, upload it
    if (file) {
      finalImageUrl = await uploadImage(file);
    }
    
    // Fallback error check
    if (!finalImageUrl) {
      throw new Error("Artwork image is required. Please choose a drawing image file.");
    }

    const artworkData = {
      title: artTitleInput.value.trim(),
      category: artCategoryInput.value,
      medium: artMediumInput.value.trim(),
      year: artYearInput.value.trim(),
      date: artDateInput.value,
      description: artDescInput.value.trim(),
      image_url: finalImageUrl,
      featured: artFeaturedInput.checked
    };

    if (activeArtworkId) {
      // UPDATE
      await updateArtwork(activeArtworkId, artworkData);
      showToast("Artwork updated successfully.");
    } else {
      // CREATE
      await createArtwork(artworkData);
      showToast("New artwork added successfully.");
    }

    closeArtworkModal();
    loadArtworksList();
  } catch (err) {
    console.error("Save artwork operation failed:", err);
    showToast(err.message || "Failed to save artwork details.", "error");
  } finally {
    btnFormSubmit.disabled = false;
    btnFormSubmit.textContent = activeArtworkId ? "Save Changes" : "Save Artwork";
  }
});

/**
 * Delete Confirmation Mechanics
 */
function openDeleteModal(artwork) {
  deleteArtworkId = artwork.id;
  deleteArtworkName.textContent = `"${artwork.title}"`;
  deleteConfirmModal.classList.add('active');
}

function closeDeleteModal() {
  deleteConfirmModal.classList.remove('active');
  deleteArtworkId = null;
}

btnDeleteConfirm.addEventListener('click', async () => {
  if (!deleteArtworkId) return;
  
  btnDeleteConfirm.disabled = true;
  btnDeleteConfirm.textContent = "Deleting...";

  try {
    await deleteArtwork(deleteArtworkId);
    showToast("Artwork deleted successfully.");
    closeDeleteModal();
    loadArtworksList();
  } catch (err) {
    console.error("Delete operation failed:", err);
    showToast("Failed to delete artwork.", "error");
  } finally {
    btnDeleteConfirm.disabled = false;
    btnDeleteConfirm.textContent = "Delete";
  }
});

// Cancel Buttons
btnFormCancel.onclick = closeArtworkModal;
btnModalClose.onclick = closeArtworkModal;
btnDeleteCancel.onclick = closeDeleteModal;

// Main Trigger
btnAddNew.onclick = openAddModal;

// Logout Trigger
btnLogout.onclick = async () => {
  await signOut();
  window.location.href = 'login.html';
};

// Initial Page Load
document.addEventListener('DOMContentLoaded', () => {
  if (!isConfigured) {
    adminOfflineBanner.style.display = 'block';
  }
  loadArtworksList();
});
