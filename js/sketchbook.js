// js/sketchbook.js
import { getArtworks } from './data.js';
import { openDetail } from './gallery.js';

/**
 * Initialize the Chronological Sketchbook Timeline
 */
export async function initSketchbook() {
  const artworks = await getArtworks();
  
  // Sort artworks by date descending
  const sortedArtworks = [...artworks].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const timelineContainer = document.getElementById('sketchbookTimeline');
  timelineContainer.innerHTML = '';

  if (sortedArtworks.length === 0) {
    timelineContainer.innerHTML = `
      <div class="empty-state">
        No studies have been uploaded to the sketchbook yet.
      </div>
    `;
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

  // 3. Render the timeline structure
  sortedYears.forEach(year => {
    const yearGroup = document.createElement('div');
    yearGroup.className = 'timeline-year-group';

    // Year Header Sticky
    const yearHeader = document.createElement('h3');
    yearHeader.className = 'timeline-year-header';
    yearHeader.textContent = year;
    yearGroup.appendChild(yearHeader);

    // Sort months in descending order (December first)
    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    const sortedMonths = Object.keys(groupedData[year]).sort((a, b) => {
      return monthNames.indexOf(b) - monthNames.indexOf(a);
    });

    sortedMonths.forEach(month => {
      const monthGroup = document.createElement('div');
      monthGroup.className = 'timeline-month-group';

      // Month Header
      const monthHeader = document.createElement('h4');
      monthHeader.className = 'timeline-month-header';
      monthHeader.textContent = month;
      monthGroup.appendChild(monthHeader);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'timeline-items';

      groupedData[year][month].forEach(art => {
        const row = document.createElement('div');
        row.className = 'timeline-row';
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', `View details for ${art.title}`);
        row.onclick = () => openDetail(art.id);

        const dateObj = new Date(art.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });

        row.innerHTML = `
          <div class="timeline-media">
            <img src="${art.image_url}" alt="${art.title}" loading="lazy">
          </div>
          <div class="timeline-text">
            <h5 class="timeline-title">${art.title}</h5>
            <p class="timeline-meta">${art.medium} &middot; ${formattedDate}</p>
          </div>
        `;
        itemsContainer.appendChild(row);
      });

      monthGroup.appendChild(itemsContainer);
      yearGroup.appendChild(monthGroup);
    });

    timelineContainer.appendChild(yearGroup);
  });
}
