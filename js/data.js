// js/data.js
import { supabase, isConfigured } from './supabase.js';
import { mockArtworks } from './mock-data.js';

const LOCAL_STORAGE_KEY = 'sketchbook_artworks';

// Initialize localStorage if it's empty
function getLocalArtworks() {
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);

  let needsReset = !localData;
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      const deadUrls = [
        'photo-1579783928621-7a13d66a6211',
        'photo-1549887534-1541e9326642',
        'photo-1576016770956-debb63d900ad'
      ];
      // Check if any artwork has a dead URL, if number of items is different, or if old titles exist
      const hasDeadUrl = parsed.some(art =>
        deadUrls.some(deadId => art.image_url.includes(deadId))
      );
      const hasOldTitle = parsed.some(art => art.title === 'Portrait Study No. 03');
      if (hasDeadUrl || hasOldTitle || parsed.length !== mockArtworks.length) {
        needsReset = true;
      }
    } catch (e) {
      needsReset = true;
    }
  }

  if (needsReset) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockArtworks));
    return mockArtworks;
  }

  try {
    return JSON.parse(localData);
  } catch (e) {
    console.error("Failed to parse local artworks, resetting storage", e);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockArtworks));
    return mockArtworks;
  }
}

function saveLocalArtworks(artworks) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(artworks));
}

/**
 * Fetch all artworks, sorted by date (newest first)
 */
export async function getArtworks() {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Database fetch failed, falling back to local storage:", err);
      // Fallback if network fails
      return getLocalArtworks().sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  } else {
    // Offline/Mock mode
    return getLocalArtworks().sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

/**
 * Fetch a single artwork by ID
 */
export async function getArtworkById(id) {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error(`Database single fetch failed for id ${id}, check local storage:`, err);
      return getLocalArtworks().find(art => art.id === id);
    }
  } else {
    return getLocalArtworks().find(art => art.id === id);
  }
}

/**
 * Upload an image file to Supabase Storage or convert to Base64 in offline mode
 */
export async function uploadImage(file) {
  if (!file) return null;

  if (isConfigured && supabase) {
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to bucket 'artworks'
      const { data, error } = await supabase.storage
        .from('artworks')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error("Image upload failed, falling back to Base64:", err);
      return convertFileToBase64(file);
    }
  } else {
    // Convert to Base64 for offline/mock database storage
    return convertFileToBase64(file);
  }
}

// Utility: convert file input into Base64 string for offline storage
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Create a new artwork record
 */
export async function createArtwork(artworkData) {
  // If featured is true, we should unfeature other pieces first
  if (artworkData.featured) {
    await clearFeaturedFlag();
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .insert([artworkData])
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Database insert failed, using local storage fallback:", err);
      return createLocalArtwork(artworkData);
    }
  } else {
    return createLocalArtwork(artworkData);
  }
}

function createLocalArtwork(artworkData) {
  const localList = getLocalArtworks();
  const newArtwork = {
    ...artworkData,
    id: Date.now().toString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  localList.push(newArtwork);
  saveLocalArtworks(localList);
  return newArtwork;
}

/**
 * Update an existing artwork record
 */
export async function updateArtwork(id, updatedFields) {
  if (updatedFields.featured) {
    await clearFeaturedFlag(id);
  }

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .update(updatedFields)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error("Database update failed, using local storage fallback:", err);
      return updateLocalArtwork(id, updatedFields);
    }
  } else {
    return updateLocalArtwork(id, updatedFields);
  }
}

function updateLocalArtwork(id, updatedFields) {
  const localList = getLocalArtworks();
  const index = localList.findIndex(art => art.id === id);
  if (index === -1) throw new Error("Artwork not found locally.");

  const updatedArtwork = {
    ...localList[index],
    ...updatedFields,
    updated_at: new Date().toISOString()
  };

  localList[index] = updatedArtwork;
  saveLocalArtworks(localList);
  return updatedArtwork;
}

/**
 * Delete an artwork record
 */
export async function deleteArtwork(id) {
  if (isConfigured && supabase) {
    try {
      // First fetch the artwork to get image_url (for storage deletion if needed)
      const { data: art } = await supabase
        .from('artworks')
        .select('image_url')
        .eq('id', id)
        .single();

      // Delete from DB
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Attempt to delete image from Storage if it belongs to storage
      if (art && art.image_url.includes('/storage/v1/object/public/artworks/')) {
        const path = art.image_url.split('/artworks/')[1];
        if (path) {
          await supabase.storage.from('artworks').remove([path]);
        }
      }
      return true;
    } catch (err) {
      console.error("Database deletion failed, using local storage fallback:", err);
      return deleteLocalArtwork(id);
    }
  } else {
    return deleteLocalArtwork(id);
  }
}

function deleteLocalArtwork(id) {
  const localList = getLocalArtworks();
  const filtered = localList.filter(art => art.id !== id);
  saveLocalArtworks(filtered);
  return true;
}

/**
 * Utility: Clear featured flag from all artworks except the one specified (optional id)
 */
async function clearFeaturedFlag(excludeId = null) {
  if (isConfigured && supabase) {
    try {
      let query = supabase.from('artworks').update({ featured: false }).eq('featured', true);
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      await query;
    } catch (err) {
      console.error("Database clear featured failed:", err);
      clearLocalFeaturedFlag(excludeId);
    }
  } else {
    clearLocalFeaturedFlag(excludeId);
  }
}

function clearLocalFeaturedFlag(excludeId = null) {
  const localList = getLocalArtworks();
  const updated = localList.map(art => {
    if (art.id === excludeId) return art;
    return { ...art, featured: false };
  });
  saveLocalArtworks(updated);
}
