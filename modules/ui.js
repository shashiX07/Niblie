import { categorizeLinks, createEnhancedLinkList, setupLinkInfoToggles } from './links.js';
import { getAllImages, createImageDisplay, setupImageFeatures } from './images.js';
import { getAllVideos, createVideoDisplay, setupVideoFeatures } from './videos.js';

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

    linkBox.innerHTML = `
      <button id="close-link-box">❌</button>
      <div class="link-box-tabs">
        <button id="tab-links" class="tab-btn active">🔗 Links</button>
        <button id="tab-media" class="tab-btn">🎬 Media</button>
      </div>
      
      <div id="tab-content-links" class="tab-content active">
        <h2>🔗 Categorized Links</h2>
        
        <div class="link-subtabs">
          <button class="link-subtab active" data-category="all">All (${uniqueLinks.length})</button>
          <button class="link-subtab" data-category="external">External (${categorized.external.length})</button>
          <button class="link-subtab" data-category="internal">Internal (${categorized.internal.length})</button>
          <button class="link-subtab" data-category="socials">Social (${categorized.socials.length})</button>
          <button class="link-subtab" data-category="media">Media (${categorized.media.length})</button>
        </div>
        
        <div class="subtab-content active" id="subtab-all">
          ${createEnhancedLinkList("📄 PDFs", categorized.pdfs)}
          ${createEnhancedLinkList("📑 Docs/XLS/PPT", categorized.docs)}
          ${createEnhancedLinkList("🌐 External Links", categorized.external)}
          ${createEnhancedLinkList("🏠 Internal Links", categorized.internal)}
          ${createEnhancedLinkList("📱 Social Links", categorized.socials)}
          ${createEnhancedLinkList("🎥 Media Files", categorized.media)}
          ${createEnhancedLinkList("❌ Unwanted/Tracking", categorized.unwanted)}
        </div>
        
        <div class="subtab-content" id="subtab-external">
          ${createEnhancedLinkList("🌐 External Links", categorized.external)}
        </div>
        
        <div class="subtab-content" id="subtab-internal">
          ${createEnhancedLinkList("🏠 Internal Links", categorized.internal)}
        </div>
        
        <div class="subtab-content" id="subtab-socials">
          ${createEnhancedLinkList("📱 Social Links", categorized.socials)}
        </div>
        
        <div class="subtab-content" id="subtab-media">
          ${createEnhancedLinkList("🎥 Media Files", categorized.media)}
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
    
    // Link subtab switching
    document.querySelectorAll('.link-subtab').forEach(tab => {
      tab.onclick = () => {
        const category = tab.dataset.category;
        switchLinkSubtab(category);
      };
    });
    
    // Media subtab switching
    document.querySelectorAll('.media-subtab').forEach(tab => {
      tab.onclick = () => {
        const mediaType = tab.dataset.mediaType;
        switchMediaSubtab(mediaType);
      };
    });
    
    // Initially setup link info toggles for the active tab
    setupLinkInfoToggles();
    
    // Link subtab switching
    function switchLinkSubtab(category) {
      try {
        document.querySelectorAll('.link-subtab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.link-subtab[data-category="${category}"]`);
        if (activeTab) {
          activeTab.classList.add('active');
        }
        
        document.querySelectorAll('.subtab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`subtab-${category}`);
        if (activeContent) {
          activeContent.classList.add('active');
          setTimeout(() => {
            setupLinkInfoToggles();
          }, 100);
        }
      } catch (err) {
        console.error('Error switching link subtab:', err);
      }
    }
    
    // Media subtab switching
    function switchMediaSubtab(mediaType) {
      try {
        document.querySelectorAll('.media-subtab').forEach(tab => {
          tab.classList.remove('active');
        });
        
        document.querySelector(`.media-subtab[data-media-type="${mediaType}"]`).classList.add('active');
        
        document.querySelectorAll('.media-subcontent').forEach(content => {
          content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`media-subcontent-${mediaType}`);
        activeContent.classList.add('active');
        
        // Load content if not already loaded
        if (mediaType === 'images' && !activeContent.dataset.loaded) {
          setTimeout(() => {
            const allImages = getAllImages();
            activeContent.innerHTML = createImageDisplay(allImages);
            activeContent.dataset.loaded = true;
            setupImageFeatures();
          }, 100);
        }
        
        if (mediaType === 'videos' && !activeContent.dataset.loaded) {
          setTimeout(() => {
            const allVideos = getAllVideos();
            activeContent.innerHTML = createVideoDisplay(allVideos);
            activeContent.dataset.loaded = true;
            setupVideoFeatures();
          }, 100);
        }
      } catch (err) {
        console.error('Error switching media subtab:', err);
      }
    }
    
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
            const allImages = getAllImages();
            imagesContent.innerHTML = createImageDisplay(allImages);
            imagesContent.dataset.loaded = true;
            setupImageFeatures();
          }, 100);
        }
      }
    }
    
  } catch (err) {
    console.error('Error showing link box:', err);
  }
}