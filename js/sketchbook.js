// js/sketchbook.js
import { getArtworks } from './data.js';
import { openDetail, getArchiveNumber } from './gallery.js';

/**
 * Initialize the Chronological Sketchbook Timeline
 */
export async function initSketchbook() {
  const artworks = await getArtworks();
  
  // Sort artworks by date descending
  const sortedArtworks = [...artworks].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const timelineContainer = document.getElementById('sketchbookTimeline');
  const chronologyNav = document.getElementById('chronologyNav');
  
  if (timelineContainer) timelineContainer.innerHTML = '';
  if (chronologyNav) chronologyNav.innerHTML = '';

  if (sortedArtworks.length === 0) {
    if (timelineContainer) {
      timelineContainer.innerHTML = `
        <div class="empty-state">
          No studies have been uploaded to the sketchbook yet.
        </div>
      `;
    }
    return;
  }

  // 1. Group artworks by Year and then by Month
  const groupedData = {};
  
  sortedArtworks.forEach(art => {
    const dateObj = new Date(art.date);
    const year = dateObj.getFullYear();
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
    
    if (!groupedData[year]) {
      groupedData[year] = {};
    }
    if (!groupedData[year][monthName]) {
      groupedData[year][monthName] = [];
    }
    groupedData[year][monthName].push(art);
  });

  // 2. Sort years in descending order
  const sortedYears = Object.keys(groupedData).sort((a, b) => b - a);

  // Month sorting weights helper
  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // 3. Render sticky chronology sidebar nav & right-hand timeline listings
  sortedYears.forEach(year => {
    // Generate Left Sidebar Year/Month links
    const yearNavGroup = document.createElement('div');
    yearNavGroup.className = 'chronology-year-group-nav';

    const yearLabel = document.createElement('div');
    yearLabel.className = 'chronology-year';
    yearLabel.textContent = year;
    yearNavGroup.appendChild(yearLabel);

    // Sort months in descending order (December first)
    const sortedMonths = Object.keys(groupedData[year]).sort((a, b) => {
      return monthNames.indexOf(b) - monthNames.indexOf(a);
    });

    sortedMonths.forEach(month => {
      const monthLink = document.createElement('a');
      monthLink.className = 'chronology-month-link';
      monthLink.href = `#month-${year}-${month}`;
      monthLink.textContent = month.toUpperCase(); // Full month name, e.g. "AUGUST", "JULY"
      yearNavGroup.appendChild(monthLink);
    });

    if (chronologyNav) {
      chronologyNav.appendChild(yearNavGroup);
    }

    // Generate Right timeline stream grouping by year
    const yearSection = document.createElement('div');
    yearSection.className = 'timeline-year-section';

    sortedMonths.forEach(month => {
      const monthSection = document.createElement('div');
      monthSection.className = 'timeline-month-section';
      monthSection.id = `month-${year}-${month}`;

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'timeline-items-v2';

      groupedData[year][month].forEach(art => {
        const row = document.createElement('div');
        row.className = 'timeline-row-v2';
        
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', `View details for ${art.title}`);
        row.onclick = () => openDetail(art.id);

        const dateObj = new Date(art.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        const archiveNum = `NO. ${getArchiveNumber(art, artworks)}`;

        row.innerHTML = `
          <div class="timeline-thumb">
            <img src="${art.image_url}" alt="${art.title}" loading="lazy">
          </div>
          <div class="timeline-info">
            <div class="timeline-title-row">
              <span class="timeline-number">${archiveNum}</span>
              <h3 class="timeline-title">${art.title}</h3>
            </div>
            <div class="timeline-details">${art.medium}</div>
          </div>
          <div class="timeline-date-col">
            ${formattedDate}
          </div>
        `;
        itemsContainer.appendChild(row);
      });

      monthSection.appendChild(itemsContainer);
      yearSection.appendChild(monthSection);
    });

    if (timelineContainer) {
      timelineContainer.appendChild(yearSection);
    }
  });
}
