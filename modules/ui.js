import { categorizeLinks, createEnhancedLinkList, setupLinkInfoToggles } from './links.js';
import { getAllImages, createImageDisplay, setupImageFeatures } from './images.js';
import { getAllVideos, createVideoDisplay, setupVideoFeatures } from './videos.js';
import { getAllTables, showTablesInModal, loadTablesContent } from './tables.js';

/**
 * Show the link box with all the categorized links
 */
export function showLinkBox() {
  try {
    // First check if the box already exists and remove it if so
    const existing = document.getElementById("link-box");
    if (existing) {
      existing.remove();
      return;
    }

    // Create the box
    const linkBox = document.createElement("div");
    linkBox.id = "link-box";

    // Get all links and categorize them
    const allLinks = Array.from(document.querySelectorAll("a[href]"))
      .map(a => a.href)
      .filter(Boolean);
    const uniqueLinks = [...new Set(allLinks)];
    const categorized = categorizeLinks(uniqueLinks);

    // Create HTML for the linkbox with tab structure
    linkBox.innerHTML = `
      <button id="close-link-box">❌</button>
      <div class="link-box-tabs">
        <button id="tab-links" class="tab-btn active">🔗 Links</button>
        <button id="tab-media" class="tab-btn">🎬 Media</button>
        <button id="tab-tables" class="tab-btn">📊 Tables</button>
      </div>
      
      <div id="tab-content-links" class="tab-content active">
        <h2>🔗 Categorized Links</h2>
        <div class="links-container">
          ${Object.keys(categorized).length === 0 ? '<div class="no-links">No links found on this page</div>' : ''}
          ${createEnhancedLinkList('PDFs', categorized.pdfs)}
          ${createEnhancedLinkList('Documents', categorized.docs)}
          ${createEnhancedLinkList('Social Media', categorized.socials)}
          ${createEnhancedLinkList('Media Files', categorized.media)}
          ${createEnhancedLinkList('External Links', categorized.external)}
          ${createEnhancedLinkList('Internal Links', categorized.internal)}
        </div>
      </div>
      
      <div id="tab-content-media" class="tab-content">
        <h2>🎬 Media Files</h2>
        
        <div class="media-subtabs">
          <button class="media-subtab active" data-media-type="images">🖼️ Images</button>
          <button class="media-subtab" data-media-type="videos">🎬 Videos</button>
        </div>
        
        <div class="media-subcontent active" id="media-subcontent-images">
          <div id="images-loading">Loading images...</div>
        </div>
        
        <div class="media-subcontent" id="media-subcontent-videos">
          <div id="videos-loading">Loading videos...</div>
        </div>
      </div>
      
      <div id="tab-content-tables" class="tab-content">
        <h2>📊 Tables</h2>
        <div class="tables-header">
          <h3>Tables on This Page</h3>
          <button class="refresh-tables-btn">Refresh</button>
        </div>
        <div class="tables-summary">
          <div class="tables-loading">Detecting tables...</div>
        </div>
        <div class="tables-list"></div>
      </div>
    `;

    document.body.appendChild(linkBox);

    // Setup event listeners
    document.getElementById("close-link-box").onclick = () => linkBox.remove();
    
    // Main tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.id.replace('tab-', '');
        switchMainTab(tabName);
      });
    });

    // Setup media subtabs
    document.querySelectorAll('.media-subtab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mediaType = tab.getAttribute('data-media-type');
        
        // Update tab states
        document.querySelectorAll('.media-subtab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content states
        document.querySelectorAll('.media-subcontent').forEach(c => c.classList.remove('active'));
        document.getElementById(`media-subcontent-${mediaType}`).classList.add('active');
        
        // Load content if needed
        if (mediaType === 'images' && !document.getElementById('media-subcontent-images').dataset.loaded) {
          setTimeout(() => {
            const allImages = getAllImages();
            document.getElementById('media-subcontent-images').innerHTML = createImageDisplay(allImages);
            document.getElementById('media-subcontent-images').dataset.loaded = true;
            setupImageFeatures();
          }, 100);
        } else if (mediaType === 'videos' && !document.getElementById('media-subcontent-videos').dataset.loaded) {
          setTimeout(() => {
            const allVideos = getAllVideos();
            document.getElementById('media-subcontent-videos').innerHTML = createVideoDisplay(allVideos);
            document.getElementById('media-subcontent-videos').dataset.loaded = true;
            setupVideoFeatures(document.getElementById('media-subcontent-videos'));
          }, 100);
        }
      });
    });

    // Initially setup link info toggles for the active tab
    setupLinkInfoToggles();
    
    // Main tab switching
    function switchMainTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      const activeContent = document.getElementById(`tab-content-${tabName}`);
      activeContent.classList.add('active');
      
      // For media tab, load images by default if not already loaded
      if (tabName === 'media') {
        const imagesContent = document.getElementById('media-subcontent-images');
        if (!imagesContent.dataset.loaded) {
          setTimeout(() => {
            try {
              const allImages = getAllImages();
              imagesContent.innerHTML = createImageDisplay(allImages);
              imagesContent.dataset.loaded = true;
              setupImageFeatures();
            } catch (err) {
              imagesContent.innerHTML = '<div class="error-message">Error loading images: ' + err.message + '</div>';
              console.error('Error loading images:', err);
            }
          }, 100);
        }
      }
      
      // For tables tab, load tables if not already loaded
      if (tabName === 'tables') {
        const tablesContent = document.getElementById('tab-content-tables');
        if (!tablesContent.dataset.loaded) {
          setTimeout(() => {
            try {
              loadTablesContent(tablesContent);
              tablesContent.dataset.loaded = true;
            } catch (err) {
              tablesContent.querySelector('.tables-summary').innerHTML = 
                '<div class="error-message">Error loading tables: ' + err.message + '</div>';
              console.error('Error loading tables:', err);
            }
          }, 100);
        }
      }
    }
    
    // Add table refresh event listener
    const refreshTablesBtn = document.querySelector('.refresh-tables-btn');
    if (refreshTablesBtn) {
      refreshTablesBtn.addEventListener('click', () => {
        const tablesContent = document.getElementById('tab-content-tables');
        if (tablesContent) {
          const summary = tablesContent.querySelector('.tables-summary');
          const list = tablesContent.querySelector('.tables-list');
          if (summary) summary.innerHTML = '<div class="tables-loading">Detecting tables...</div>';
          if (list) list.innerHTML = '';
          
          setTimeout(() => {
            try {
              loadTablesContent(tablesContent);
            } catch (err) {
              if (summary) summary.innerHTML = 
                '<div class="error-message">Error loading tables: ' + err.message + '</div>';
              console.error('Error refreshing tables:', err);
            }
          }, 100);
        }
      });
    }
    
  } catch (err) {
    console.error('Error showing link box:', err);
  }
}