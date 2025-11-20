/**
 * Video finder module for finding all videos on a webpage
 */

const VideoFinder = {
  // Cache for video data to avoid rescanning
  videoCache: null,
  
  /**
   * Find all videos on the current page
   * @param {boolean} forceRefresh - Whether to force refresh the cache
   * @returns {Promise<Object>} Object containing categorized videos
   */
  findVideos: function(forceRefresh = false) {
    // Use cached results if available and not forcing refresh
    if (this.videoCache && !forceRefresh) {
      return Promise.resolve(this.videoCache);
    }
    
    return new Promise((resolve) => {
      console.log('VideoFinder: Scanning page for videos...');
      
      // Create result object with video categories
      const results = {
        html5Videos: [],
        youtubeVideos: [],
        vimeoVideos: [],
        instagramReels: [],
        embedVideos: [],
        backgroundVideos: []
      };
      
      // Find HTML5 video elements
      this._findHTML5Videos(results.html5Videos);
      
      // Find YouTube embedded videos (enhanced detection)
      this._findYouTubeVideos(results.youtubeVideos);
      
      // Find Instagram reels (NEW)
      this._findInstagramReels(results.instagramReels);
      
      // Find Vimeo embedded videos
      this._findVimeoVideos(results.vimeoVideos);
      
      // Find other embedded videos
      this._findEmbeddedVideos(results.embedVideos);
      
      // Find background videos
      this._findBackgroundVideos(results.backgroundVideos);
      
      // Count total videos
      const totalVideos = this._countTotalVideos(results);
      console.log(`VideoFinder: Found ${totalVideos} videos`);
      
      // Store in cache
      this.videoCache = results;
      
      resolve(results);
    });
  },
  
  /**
   * Find HTML5 video elements
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findHTML5Videos: function(targetArray) {
    const videoElements = document.querySelectorAll('video');
    
    videoElements.forEach((video, index) => {
      // Skip invisible videos
      if (!this._isElementVisible(video)) return;
      
      // Extract video info
      const videoInfo = {
        element: video,
        type: 'html5',
        width: video.videoWidth || video.clientWidth || 'unknown',
        height: video.videoHeight || video.clientHeight || 'unknown',
        duration: video.duration || 'unknown',
        poster: video.poster || '',
        sources: []
      };
      
      // Get all source elements
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src) {
          videoInfo.sources.push({
            src: source.src,
            type: source.type || 'unknown'
          });
        }
      });
      
      // If no sources found but video has src attribute
      if (videoInfo.sources.length === 0 && video.src) {
        videoInfo.sources.push({
          src: video.src,
          type: 'video/mp4' // Assume MP4 as default
        });
      }
      
      // Skip if no valid sources
      if (videoInfo.sources.length === 0) return;
      
      // Generate thumbnail from video or poster
      if (videoInfo.poster) {
        videoInfo.thumbnail = videoInfo.poster;
      } else {
        try {
          // Try to generate thumbnail from first frame
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(videoInfo.width === 'unknown' ? 320 : videoInfo.width, 320);
          canvas.height = Math.min(videoInfo.height === 'unknown' ? 180 : videoInfo.height, 180);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          videoInfo.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        } catch (e) {
          // Fallback thumbnail
          videoInfo.thumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23cccccc"/%3E%3Cpath fill="%23666666" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15h10v10h10v10h-10v10h-10v-10h-10v-10h10V85z"/%3E%3C/svg%3E';
        }
      }
      
      targetArray.push(videoInfo);
    });
  },
  
  /**
   * Find YouTube embedded videos (Enhanced detection)
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findYouTubeVideos: function(targetArray) {
    // Find YouTube iframes
    const youtubeIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      if (!this._isElementVisible(iframe)) return false;
      
      const src = iframe.src || '';
      return src.includes('youtube.com/embed/') || src.includes('youtube-nocookie.com/embed/');
    });
    
    youtubeIframes.forEach((iframe, index) => {
      // Extract YouTube ID from URL
      const src = iframe.src;
      let videoId = '';
      
      if (src.includes('/embed/')) {
        const match = src.match(/\/embed\/([^/?]+)/);
        if (match && match[1]) videoId = match[1];
      }
      
      if (!videoId) return;
      
      const videoInfo = {
        element: iframe,
        type: 'youtube',
        width: iframe.width || iframe.clientWidth || 'unknown',
        height: iframe.height || iframe.clientHeight || 'unknown',
        videoId: videoId,
        embedUrl: src,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        isStreaming: true
      };
      
      targetArray.push(videoInfo);
    });
    
    // Also check for YouTube video links in the page (not just embeds)
    const ytLinks = document.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"]');
    ytLinks.forEach(link => {
      const href = link.href;
      let videoId = '';
      
      // Extract from youtube.com/watch?v=ID
      if (href.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(href.split('?')[1]);
        videoId = urlParams.get('v');
      }
      // Extract from youtu.be/ID
      else if (href.includes('youtu.be/')) {
        const match = href.match(/youtu\.be\/([^/?]+)/);
        if (match && match[1]) videoId = match[1];
      }
      
      if (videoId && !targetArray.some(v => v.videoId === videoId)) {
        targetArray.push({
          element: link,
          type: 'youtube',
          width: 'unknown',
          height: 'unknown',
          videoId: videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          isStreaming: true,
          isLink: true
        });
      }
    });
  },
  
  /**
   * Find Instagram reels (NEW)
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findInstagramReels: function(targetArray) {
    // Method 1: Find Instagram embed iframes
    const instagramIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      if (!this._isElementVisible(iframe)) return false;
      const src = iframe.src || '';
      return src.includes('instagram.com/') && (src.includes('/embed') || src.includes('/reel/'));
    });
    
    instagramIframes.forEach(iframe => {
      const src = iframe.src;
      let reelId = '';
      
      // Extract reel ID from URL
      const match = src.match(/\/(?:reel|p)\/([^/?]+)/);
      if (match && match[1]) reelId = match[1];
      
      if (reelId) {
        targetArray.push({
          element: iframe,
          type: 'instagram',
          width: iframe.width || iframe.clientWidth || 'unknown',
          height: iframe.height || iframe.clientHeight || 'unknown',
          reelId: reelId,
          embedUrl: src,
          url: `https://www.instagram.com/reel/${reelId}/`,
          isStreaming: true
        });
      }
    });
    
    // Method 2: Find video elements on Instagram pages
    if (window.location.hostname.includes('instagram.com')) {
      const videos = document.querySelectorAll('video');
      
      videos.forEach((video, index) => {
        if (!this._isElementVisible(video)) return;
        
        // Check if it's a reel by looking at the URL or parent elements
        const isReel = window.location.pathname.includes('/reel/') || 
                      video.closest('[role="dialog"]') || 
                      video.closest('article');
        
        if (isReel && video.src) {
          // Try to extract reel ID from current URL
          let reelId = '';
          const urlMatch = window.location.pathname.match(/\/(?:reel|p)\/([^/?]+)/);
          if (urlMatch && urlMatch[1]) reelId = urlMatch[1];
          
          targetArray.push({
            element: video,
            type: 'instagram',
            width: video.videoWidth || video.clientWidth || 'unknown',
            height: video.videoHeight || video.clientHeight || 'unknown',
            reelId: reelId || `reel_${index}`,
            url: reelId ? `https://www.instagram.com/reel/${reelId}/` : window.location.href,
            videoSrc: video.src,
            isStreaming: true,
            isDirect: true
          });
        }
      });
    }
    
    // Method 3: Find Instagram links
    const igLinks = document.querySelectorAll('a[href*="instagram.com/reel/"], a[href*="instagram.com/p/"]');
    igLinks.forEach(link => {
      const href = link.href;
      const match = href.match(/\/(?:reel|p)\/([^/?]+)/);
      
      if (match && match[1]) {
        const reelId = match[1];
        
        if (!targetArray.some(v => v.reelId === reelId)) {
          targetArray.push({
            element: link,
            type: 'instagram',
            width: 'unknown',
            height: 'unknown',
            reelId: reelId,
            url: `https://www.instagram.com/reel/${reelId}/`,
            isStreaming: true,
            isLink: true
          });
        }
      }
    });
  },
  
  /**
   * Find Vimeo embedded videos
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findVimeoVideos: function(targetArray) {
    // Find Vimeo iframes
    const vimeoIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      if (!this._isElementVisible(iframe)) return false;
      
      const src = iframe.src || '';
      return src.includes('player.vimeo.com/video/');
    });
    
    vimeoIframes.forEach((iframe, index) => {
      // Extract Vimeo ID from URL
      const src = iframe.src;
      let videoId = '';
      
      if (src.includes('/video/')) {
        const match = src.match(/\/video\/([^/?]+)/);
        if (match && match[1]) videoId = match[1];
      }
      
      if (!videoId) return;
      
      const videoInfo = {
        element: iframe,
        type: 'vimeo',
        width: iframe.width || iframe.clientWidth || 'unknown',
        height: iframe.height || iframe.clientHeight || 'unknown',
        videoId: videoId,
        embedUrl: src,
        // Vimeo doesn't provide direct thumbnail URLs, using placeholder
        thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23178cdf"/%3E%3Cpath fill="%23ffffff" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15l20 10l-20 10v-20z"/%3E%3C/svg%3E'
      };
      
      targetArray.push(videoInfo);
    });
  },
  
  /**
   * Find other embedded videos
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findEmbeddedVideos: function(targetArray) {
    // Find other video iframes that aren't YouTube or Vimeo
    const otherIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => {
      if (!this._isElementVisible(iframe)) return false;
      
      const src = iframe.src || '';
      // Check for common video hosts but exclude YouTube and Vimeo which have dedicated methods
      return (src.includes('video') || src.includes('player') || src.includes('embed')) &&
        !src.includes('youtube') && !src.includes('youtube-nocookie') && !src.includes('vimeo');
    });
    
    otherIframes.forEach((iframe, index) => {
      const videoInfo = {
        element: iframe,
        type: 'embed',
        width: iframe.width || iframe.clientWidth || 'unknown',
        height: iframe.height || iframe.clientHeight || 'unknown',
        embedUrl: iframe.src,
        thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23444444"/%3E%3Cpath fill="%23ffffff" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15l20 10l-20 10v-20z"/%3E%3C/svg%3E'
      };
      
      targetArray.push(videoInfo);
    });
  },
  
  /**
   * Find background videos (CSS)
   * @param {Array} targetArray - Array to add found videos to
   * @private
   */
  _findBackgroundVideos: function(targetArray) {
    // No reliable way to find background videos, but we can check common patterns
    // Look for elements with css background videos
    const elements = document.querySelectorAll('*');
    const videoExtensions = ['mp4', 'webm', 'ogg'];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      if (!this._isElementVisible(element)) continue;
      
      // Check for background video in CSS
      const computedStyle = window.getComputedStyle(element);
      const bgImage = computedStyle.backgroundImage || '';
      
      if (bgImage && videoExtensions.some(ext => bgImage.includes(`.${ext}`))) {
        const matches = bgImage.match(/url\(['"]?([^'")]+\.(?:mp4|webm|ogg))['"]?\)/i);
        if (matches && matches[1]) {
          const videoSource = matches[1];
          const videoInfo = {
            element: element,
            type: 'background',
            width: element.clientWidth || 'unknown',
            height: element.clientHeight || 'unknown',
            source: videoSource,
            thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23888888"/%3E%3Cpath fill="%23ffffff" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15l20 10l-20 10v-20z"/%3E%3C/svg%3E'
          };
          
          targetArray.push(videoInfo);
        }
      }
      
      // Check for data-background-video attribute (common in some frameworks)
      const bgVideoAttribute = element.getAttribute('data-background-video');
      if (bgVideoAttribute) {
        const videoInfo = {
          element: element,
          type: 'background',
          width: element.clientWidth || 'unknown',
          height: element.clientHeight || 'unknown',
          source: bgVideoAttribute,
          thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23888888"/%3E%3Cpath fill="%23ffffff" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15l20 10l-20 10v-20z"/%3E%3C/svg%3E'
        };
        
        targetArray.push(videoInfo);
      }
    }
  },
  
  /**
   * Check if an element is visible
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether element is visible
   * @private
   */
  _isElementVisible: function(element) {
    if (!element) return false;
    
    try {
      // Check if we should ignore viewport constraints
      if (this.scanEntirePage) {
        // When scanning the entire page, only check if the element is present in DOM
        // and has non-zero dimensions
        const style = window.getComputedStyle(element);
        
        // Skip hidden elements regardless
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0') {
          return false;
        }
        
        // Return true if the element exists and isn't explicitly hidden
        return true;
      }
      
      // Standard viewport-based visibility check
      const style = window.getComputedStyle(element);
      
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0') {
        return false;
      }
      
      // Check if element is in viewport or near it
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      
      // Consider elements that might be just outside the viewport
      const extendedViewport = {
        top: -viewportHeight,
        left: -viewportWidth,
        bottom: viewportHeight * 2,
        right: viewportWidth * 2
      };
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= extendedViewport.top &&
        rect.right >= extendedViewport.left &&
        rect.top <= extendedViewport.bottom &&
        rect.left <= extendedViewport.right
      );
    } catch (error) {
      console.warn('Error checking element visibility:', error);
      return false;
    }
  },
  
  /**
   * Count total number of videos in results
   * @param {Object} videoData - Video data object
   * @returns {number} Total number of videos
   * @private
   */
  _countTotalVideos: function(videoData) {
    let count = 0;
    for (const category in videoData) {
      if (videoData.hasOwnProperty(category)) {
        count += videoData[category].length;
      }
    }
    return count;
  },
  
  /**
   * Clear the video cache
   */
  clearCache: function() {
    this.videoCache = null;
  }
};

/**
 * Video UI component for managing video display
 */
const VideoUI = {
  /**
   * Create videos content for the modal
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {HTMLElement} Videos content container
   */
  createVideosContent: function(forceRefresh = false) {
    // Create videos container
    const container = document.createElement('div');
    container.className = 'niblie-videos-content';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'niblie-loading';
    loadingIndicator.innerHTML = `
      <div class="niblie-spinner"></div>
      <p>Searching for videos...</p>
    `;
    loadingIndicator.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    `;
    
    const spinner = loadingIndicator.querySelector('.niblie-spinner');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid rgba(66, 133, 244, 0.2);
      border-radius: 50%;
      border-top-color: #4285f4;
      animation: niblie-spin 1s linear infinite;
      margin-bottom: 15px;
    `;
    
    container.appendChild(loadingIndicator);
    
    // Find videos
    VideoFinder.findVideos(forceRefresh).then(videoData => {
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Process video data
      this._processVideoData(container, videoData);
    }).catch(error => {
      console.error('Error finding videos:', error);
      loadingIndicator.remove();
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'niblie-error';
      errorMessage.textContent = 'An error occurred while searching for videos.';
      errorMessage.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #d93025;
      `;
      container.appendChild(errorMessage);
    });
    
    return container;
  },
  
  /**
   * Process video data and create UI elements
   * @param {HTMLElement} container - Container element
   * @param {Object} videoData - Video data object
   * @private
   */
  _processVideoData: function(container, videoData) {
    // Check if any videos were found
    const totalVideos = VideoFinder._countTotalVideos(videoData);
    
    if (totalVideos === 0) {
      const noVideos = document.createElement('div');
      noVideos.className = 'niblie-no-videos';
      noVideos.textContent = 'No videos found on this page.';
      noVideos.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #5f6368;
        font-style: italic;
      `;
      container.appendChild(noVideos);
      return;
    }
    
    // Create tabs for video categories
    const tabs = this._createVideoTabs(videoData);
    container.appendChild(tabs);
    
    // Create videos grid container
    const videosGrid = document.createElement('div');
    videosGrid.className = 'niblie-videos-grid';
    videosGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      padding: 10px 0;
    `;
    container.appendChild(videosGrid);
    
    // Show all videos initially
    this._showVideoCategory(videosGrid, 'all', videoData);
  },
  
  /**
   * Create tabs for video categories
   * @param {Object} videoData - Video data object
   * @returns {HTMLElement} Tabs container
   * @private
   */
  _createVideoTabs: function(videoData) {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'niblie-video-tabs';
    tabsContainer.style.cssText = `
      display: flex;
      overflow-x: auto;
      scrollbar-width: thin;
      margin-bottom: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e4e8ed;
      padding: 4px;
    `;
    
    // Define categories
    const categories = [
      { id: 'all', label: 'All Videos' },
      { id: 'html5Videos', label: 'HTML5' },
      { id: 'youtubeVideos', label: 'YouTube' },
      { id: 'instagramReels', label: 'Instagram' },
      { id: 'vimeoVideos', label: 'Vimeo' },
      { id: 'embedVideos', label: 'Embedded' },
      { id: 'backgroundVideos', label: 'Background' }
    ];
    
    // Only show tabs for categories with videos
    const filteredCategories = categories.filter(cat => {
      if (cat.id === 'all') return true;
      return videoData[cat.id] && videoData[cat.id].length > 0;
    });
    
    // Create tab for each category
    filteredCategories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `niblie-tab ${cat.id === 'all' ? 'active' : ''}`;
      tab.dataset.category = cat.id;
      tab.textContent = cat.label;
      tab.style.cssText = `
        padding: 10px 16px;
        border: none;
        background-color: ${cat.id === 'all' ? '#e8f0fe' : 'transparent'};
        color: ${cat.id === 'all' ? '#1a73e8' : '#5f6368'};
        font-weight: ${cat.id === 'all' ? '500' : 'normal'};
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        margin: 0 2px;
        font-size: 14px;
      `;
      
      // Handle tab click
      tab.addEventListener('click', () => {
        // Update active tab
        tabsContainer.querySelectorAll('.niblie-tab').forEach(t => {
          t.style.backgroundColor = 'transparent';
          t.style.color = '#5f6368';
          t.style.fontWeight = 'normal';
          t.classList.remove('active');
        });
        
        tab.style.backgroundColor = '#e8f0fe';
        tab.style.color = '#1a73e8';
        tab.style.fontWeight = '500';
        tab.classList.add('active');
        
        // Show videos for selected category
        const videosGrid = document.querySelector('.niblie-videos-grid');
        if (videosGrid) {
          this._showVideoCategory(videosGrid, cat.id, videoData);
        }
      });
      
      tabsContainer.appendChild(tab);
    });
    
    return tabsContainer;
  },
  
  /**
   * Show videos for a specific category
   * @param {HTMLElement} container - Container element
   * @param {string} category - Category ID
   * @param {Object} videoData - Video data object
   * @private
   */
  _showVideoCategory: function(container, category, videoData) {
    // Clear existing content
    container.innerHTML = '';
    
    // Collect videos to show
    let videos = [];
    
    if (category === 'all') {
      // Combine all videos
      Object.keys(videoData).forEach(cat => {
        videos = videos.concat(videoData[cat]);
      });
    } else if (videoData[category]) {
      videos = videoData[category];
    }
    
    if (videos.length === 0) {
      const noVideos = document.createElement('div');
      noVideos.className = 'niblie-no-category-videos';
      noVideos.textContent = `No ${category === 'all' ? '' : this._formatCategoryName(category)} videos found.`;
      noVideos.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #5f6368;
        font-style: italic;
        grid-column: 1 / -1;
      `;
      container.appendChild(noVideos);
      return;
    }
    
    // Create card for each video
    videos.forEach((video, index) => {
      const card = this._createVideoCard(video, index);
      container.appendChild(card);
    });
  },
  
  /**
   * Create a card for a video
   * @param {Object} video - Video data object
   * @param {number} index - Video index
   * @returns {HTMLElement} Video card element
   * @private
   */
  _createVideoCard: function(video, index) {
    const card = document.createElement('div');
    card.className = 'niblie-video-card';
    card.dataset.index = index;
    card.style.cssText = `
      background-color: #f8f9fa;
      border: 1px solid #e4e8ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;
    
    // Video thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'niblie-video-thumbnail';
    thumbnailContainer.style.cssText = `
      height: 160px;
      background-color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    `;
    
    // Play button overlay
    const playButton = document.createElement('div');
    playButton.className = 'niblie-play-button';
    playButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.5)"/>
        <path d="M32 24L20 32L20 16L32 24Z" fill="white"/>
      </svg>
    `;
    playButton.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    
    // Thumbnail image
    const thumbnail = document.createElement('img');
    thumbnail.className = 'niblie-thumbnail';
    thumbnail.alt = 'Video thumbnail';
    thumbnail.src = video.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"%3E%3Crect width="320" height="180" fill="%23444444"/%3E%3Cpath fill="%23ffffff" d="M160 70a20 20 0 0 0-20 20v20a20 20 0 0 0 20 20 20 20 0 0 0 20-20V90a20 20 0 0 0-20-20zm-5 15l20 10l-20 10v-20z"/%3E%3C/svg%3E';
    thumbnail.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    `;
    
    // Video type badge
    const typeBadge = document.createElement('div');
    typeBadge.className = 'niblie-video-type';
    typeBadge.textContent = this._formatVideoType(video.type);
    typeBadge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0,0,0,0.7);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    `;
    
    // Add hover effects
    thumbnailContainer.addEventListener('mouseenter', () => {
      thumbnail.style.transform = 'scale(1.05)';
      playButton.style.opacity = '1';
    });
    
    thumbnailContainer.addEventListener('mouseleave', () => {
      thumbnail.style.transform = 'scale(1)';
      playButton.style.opacity = '0.8';
    });
    
    // Add click handler for video preview
    thumbnailContainer.addEventListener('click', () => {
      this.showVideoPreview(video);
    });
    
    thumbnailContainer.appendChild(thumbnail);
    thumbnailContainer.appendChild(playButton);
    thumbnailContainer.appendChild(typeBadge);
    
    // Video info section
    const infoSection = document.createElement('div');
    infoSection.className = 'niblie-video-info';
    infoSection.style.cssText = `
      padding: 12px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    `;
    
    // Video dimensions
    const dimensions = document.createElement('div');
    dimensions.className = 'niblie-video-dimensions';
    dimensions.textContent = video.width !== 'unknown' && video.height !== 'unknown' 
      ? `${video.width} × ${video.height}` 
      : 'Dimensions unknown';
    dimensions.style.cssText = `
      font-size: 13px;
      color: #5f6368;
      margin-bottom: 4px;
    `;
    
    // Video duration (if available)
    if (video.duration && video.duration !== 'unknown') {
      const duration = document.createElement('div');
      duration.className = 'niblie-video-duration';
      duration.textContent = this._formatDuration(video.duration);
      duration.style.cssText = `
        font-size: 12px;
        color: #80868b;
        margin-bottom: 10px;
      `;
      infoSection.appendChild(duration);
    }
    
    // Source info
    let sourceInfo;
    if (video.type === 'youtube') {
      sourceInfo = document.createElement('a');
      sourceInfo.href = `https://www.youtube.com/watch?v=${video.videoId}`;
      sourceInfo.target = '_blank';
      sourceInfo.rel = 'noopener noreferrer';
      sourceInfo.textContent = 'Watch on YouTube';
    } else if (video.type === 'vimeo') {
      sourceInfo = document.createElement('a');
      sourceInfo.href = `https://vimeo.com/${video.videoId}`;
      sourceInfo.target = '_blank';
      sourceInfo.rel = 'noopener noreferrer';
      sourceInfo.textContent = 'Watch on Vimeo';
    } else if (video.sources && video.sources.length) {
      sourceInfo = document.createElement('div');
      sourceInfo.textContent = this._extractFilename(video.sources[0].src);
    } else {
      sourceInfo = document.createElement('div');
      sourceInfo.textContent = 'Embedded video';
    }
    
    sourceInfo.className = 'niblie-video-source';
    sourceInfo.style.cssText = `
      font-size: 13px;
      color: ${sourceInfo.tagName === 'A' ? '#1a73e8' : '#202124'};
      text-decoration: ${sourceInfo.tagName === 'A' ? 'underline' : 'none'};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    
    infoSection.appendChild(dimensions);
    infoSection.appendChild(sourceInfo);
    
    // Assemble card
    card.appendChild(thumbnailContainer);
    card.appendChild(infoSection);
    
    return card;
  },
  
  /**
   * Show video preview
   * @param {Object} video - Video data object
   */
  showVideoPreview: function(video) {
    // Create or get overlay
    let overlay = document.getElementById('niblie-video-preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'niblie-video-preview-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'niblie-preview-close';
      closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      `;
      closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background-color: rgba(255, 255, 255, 0.2);
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        cursor: pointer;
        transition: background-color 0.2s;
        z-index: 2;
      `;
      
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      });
      
      closeBtn.onclick = () => this.hideVideoPreview();
      
      // Content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'niblie-video-preview-content';
      contentContainer.style.cssText = `
        width: 80%;
        max-width: 960px;
        height: 80%;
        max-height: 540px;
        position: relative;
      `;
      
      // Close on click outside
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideVideoPreview();
        }
      });
      
      overlay.appendChild(closeBtn);
      overlay.appendChild(contentContainer);
      document.body.appendChild(overlay);
    }
    
    // Clear previous content
    const contentContainer = overlay.querySelector('.niblie-video-preview-content');
    contentContainer.innerHTML = '';
    
    // Create appropriate player based on video type
    if (video.type === 'html5') {
      this._createHTML5Player(contentContainer, video);
    } else if (video.type === 'youtube') {
      this._createYouTubePlayer(contentContainer, video);
    } else if (video.type === 'vimeo') {
      this._createVimeoPlayer(contentContainer, video);
    } else if (video.type === 'embed') {
      this._createEmbedPlayer(contentContainer, video);
    } else {
      // Fallback to showing thumbnail
      const img = document.createElement('img');
      img.src = video.thumbnail || '';
      img.alt = 'Video preview';
      img.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        margin: 0 auto;
      `;
      contentContainer.appendChild(img);
      
      // Info text
      const info = document.createElement('div');
      info.textContent = 'This video cannot be previewed directly.';
      info.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 0;
        width: 100%;
        text-align: center;
        color: white;
        background-color: rgba(0, 0, 0, 0.7);
        padding: 10px;
      `;
      contentContainer.appendChild(info);
    }
    
    // Show overlay
    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
  },
  
  /**
   * Hide video preview
   */
  hideVideoPreview: function() {
    const overlay = document.getElementById('niblie-video-preview-overlay');
    if (overlay) {
      // Pause any playing videos
      const videoElement = overlay.querySelector('video');
      if (videoElement) {
        videoElement.pause();
      }
      
      // Close iframe players
      const iframes = overlay.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.src = '';
      });
      
      // Hide overlay
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  },
  
  /**
   * Create HTML5 video player
   * @param {HTMLElement} container - Container element
   * @param {Object} video - Video data
   * @private
   */
  _createHTML5Player: function(container, video) {
    if (!video.sources || video.sources.length === 0) {
      container.innerHTML = '<div style="color:white;text-align:center;padding:20px;">No video source available</div>';
      return;
    }
    
    const player = document.createElement('video');
    player.controls = true;
    player.autoplay = true;
    player.style.cssText = `
      width: 100%;
      height: 100%;
      background-color: black;
    `;
    
    // Add sources
    video.sources.forEach(source => {
      const sourceElement = document.createElement('source');
      sourceElement.src = source.src;
      sourceElement.type = source.type;
      player.appendChild(sourceElement);
    });
    
    // Error message
    player.innerHTML += '<p style="color:white;text-align:center;padding:20px;">Your browser does not support the video tag.</p>';
    
    container.appendChild(player);
  },
  
  /**
   * Create YouTube player
   * @param {HTMLElement} container - Container element
   * @param {Object} video - Video data
   * @private
   */
  _createYouTubePlayer: function(container, video) {
    if (!video.videoId) {
      container.innerHTML = '<div style="color:white;text-align:center;padding:20px;">Video ID not available</div>';
      return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = `
      border: none;
      background-color: black;
    `;
    
    container.appendChild(iframe);
  },
  
  /**
   * Create Vimeo player
   * @param {HTMLElement} container - Container element
   * @param {Object} video - Video data
   * @private
   */
  _createVimeoPlayer: function(container, video) {
    if (!video.videoId) {
      container.innerHTML = '<div style="color:white;text-align:center;padding:20px;">Video ID not available</div>';
      return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = `https://player.vimeo.com/video/${video.videoId}?autoplay=1`;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    iframe.style.cssText = `
      border: none;
      background-color: black;
    `;
    
    container.appendChild(iframe);
  },
  
  /**
   * Create embed player
   * @param {HTMLElement} container - Container element
   * @param {Object} video - Video data
   * @private
   */
  _createEmbedPlayer: function(container, video) {
    if (!video.embedUrl) {
      container.innerHTML = '<div style="color:white;text-align:center;padding:20px;">Embed URL not available</div>';
      return;
    }
    
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.src = video.embedUrl;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    iframe.style.cssText = `
      border: none;
      background-color: black;
    `;
    
    container.appendChild(iframe);
  },
  
  /**
   * Format video type for display
   * @param {string} type - Video type
   * @returns {string} Formatted type
   * @private
   */
  _formatVideoType: function(type) {
    switch (type) {
      case 'html5': return 'HTML5';
      case 'youtube': return 'YouTube';
      case 'vimeo': return 'Vimeo';
      case 'embed': return 'Embed';
      case 'background': return 'BG Video';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  },
  
  /**
   * Format duration in seconds to MM:SS format
   * @param {number} duration - Duration in seconds
   * @returns {string} Formatted duration
   * @private
   */
  _formatDuration: function(duration) {
    if (isNaN(duration) || duration === 'unknown') return 'Unknown duration';
    
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },
  
  /**
   * Extract filename from URL
   * @param {string} url - URL
   * @returns {string} Filename
   * @private
   */
  _extractFilename: function(url) {
    if (!url) return 'Unknown source';
    
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      const filename = pathname.split('/').pop();
      return filename || 'Video file';
    } catch (e) {
      return 'Video file';
    }
  },
  
  /**
   * Format category name for display
   * @param {string} category - Category name
   * @returns {string} Formatted category name
   * @private
   */
  _formatCategoryName: function(category) {
    // Remove "Videos" suffix if present
    let name = category.replace(/Videos$/, '');
    
    // Convert camelCase to space-separated words
    name = name.charAt(0).toUpperCase() + 
           name.slice(1).replace(/([A-Z])/g, ' $1');
    
    return name;
  },
  

  
  /**
   * Initialize UI
   */
  init: function() {
    // Add any initialization here if needed
  }
};

// Initialize VideoUI
VideoUI.init();

// Export the modules
window.VideoFinder = VideoFinder;
window.VideoUI = VideoUI;