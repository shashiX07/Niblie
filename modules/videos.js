/**
 * Enhanced video detection and handling for multiple platforms
 */
export function getAllVideos() {
  const videos = {
    standard: [],   // Regular video elements
    embedded: [],   // Iframe embedded videos
    hls: [],        // HLS streaming videos
    background: [], // Video backgrounds
    social: []      // Social media specific videos
  };
  
  // Track URLs to prevent duplicates
  const processedUrls = new Set();
  
  // Helper to convert relative URLs to absolute
  function toAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    try {
      return new URL(url, document.baseURI).href;
    } catch (e) {
      return url;
    }
  }
  
  // Helper to add video if unique
  function addVideoIfUnique(collection, videoData) {
    if (!videoData.src) return false;
    
    const absoluteUrl = toAbsoluteUrl(videoData.src);
    if (!absoluteUrl) return false;
    
    // Skip if we've seen this video
    if (processedUrls.has(absoluteUrl)) return false;
    
    // Add to tracking
    processedUrls.add(absoluteUrl);
    
    // Update src to absolute URL
    videoData.src = absoluteUrl;
    collection.push(videoData);
    return true;
  }

  try {
    // 1. STANDARD VIDEO ELEMENTS - Improved detection
    document.querySelectorAll('video').forEach((video, index) => {
      // Skip tiny, hidden videos (likely decorative)
      if (video.offsetWidth < 10 || video.offsetHeight < 10 || 
          (window.getComputedStyle(video).display === 'none')) {
        return;
      }
      
      // Get direct source
      if (video.src) {
        addVideoIfUnique(videos.standard, {
          src: video.src,
          width: video.videoWidth || video.clientWidth || 0,
          height: video.videoHeight || video.clientHeight || 0,
          duration: video.duration || 0,
          type: 'standard',
          index: index
        });
      }
      
      // Check for source elements
      const sources = video.querySelectorAll('source');
      if (sources.length > 0) {
        sources.forEach(source => {
          if (source.src) {
            addVideoIfUnique(videos.standard, {
              src: source.src,
              width: video.videoWidth || video.clientWidth || 0,
              height: video.videoHeight || video.clientHeight || 0,
              duration: video.duration || 0,
              type: source.type || 'standard',
              index: index
            });
          }
        });
      }
      
      // Check for poster as a hint for video
      if (video.poster && !video.src && sources.length === 0) {
        // Look for video URL in parent elements or data attributes
        const parent = video.parentElement;
        if (parent) {
          // Check data attributes on parent
          for (const attr in parent.dataset) {
            if (attr.includes('video') || attr.includes('src')) {
              const value = parent.dataset[attr];
              if (value && typeof value === 'string' && 
                  (value.match(/\.(mp4|webm|ogg)/) || value.includes('blob:'))) {
                addVideoIfUnique(videos.standard, {
                  src: value,
                  width: video.videoWidth || video.clientWidth || 0,
                  height: video.videoHeight || video.clientHeight || 0,
                  type: 'data-attribute-video',
                  index: index,
                  poster: video.poster
                });
              }
            }
          }
        }
      }
      
      // Check currentSrc as fallback
      if (video.currentSrc && !processedUrls.has(video.currentSrc)) {
        addVideoIfUnique(videos.standard, {
          src: video.currentSrc,
          width: video.videoWidth || video.clientWidth || 0,
          height: video.videoHeight || video.clientHeight || 0,
          duration: video.duration || 0,
          type: 'current-src',
          index: index
        });
      }
    });
    
    // 2. EMBEDDED VIDEOS (IFRAMES)
    document.querySelectorAll('iframe').forEach((iframe, index) => {
      const src = iframe.src;
      if (!src) return;
      
      // YouTube detection
      if (src.match(/youtube\.com\/embed|youtu\.be/)) {
        const videoId = src.includes('youtube.com/embed/') 
          ? src.split('youtube.com/embed/')[1].split('?')[0]
          : src.includes('youtu.be/')
            ? src.split('youtu.be/')[1].split('?')[0]
            : null;
            
        if (videoId) {
          addVideoIfUnique(videos.social, {
            src: src, // Keep iframe src for preview
            directSrc: `https://www.youtube.com/watch?v=${videoId}`,
            videoId: videoId,
            width: iframe.width || iframe.clientWidth || 0,
            height: iframe.height || iframe.clientHeight || 0,
            type: 'youtube',
            platform: 'YouTube',
            index: index,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
          });
        }
      }
      
      // Vimeo detection
      else if (src.match(/vimeo\.com\/video/)) {
        const videoId = src.split('vimeo.com/video/')[1]?.split('?')[0];
        if (videoId) {
          addVideoIfUnique(videos.social, {
            src: src,
            directSrc: `https://vimeo.com/${videoId}`,
            videoId: videoId,
            width: iframe.width || iframe.clientWidth || 0,
            height: iframe.height || iframe.clientHeight || 0,
            type: 'vimeo',
            platform: 'Vimeo',
            index: index
          });
        }
      }
      
      // Facebook detection
      else if (src.match(/facebook\.com\/plugins\/video/)) {
        addVideoIfUnique(videos.social, {
          src: src,
          directSrc: src.replace('/plugins/video.php?', '/watch/?'),
          width: iframe.width || iframe.clientWidth || 0,
          height: iframe.height || iframe.clientHeight || 0,
          type: 'facebook',
          platform: 'Facebook',
          index: index
        });
      }
      
      // Twitter detection
      else if (src.match(/twitter\.com\/.*\/videos|twitter\.com\/i\/videos/)) {
        addVideoIfUnique(videos.social, {
          src: src,
          directSrc: src,
          width: iframe.width || iframe.clientWidth || 0,
          height: iframe.height || iframe.clientHeight || 0,
          type: 'twitter',
          platform: 'Twitter',
          index: index
        });
      }
      
      // Direct video in iframe
      else if (src.match(/\.(mp4|webm|ogg)($|\?)/)) {
        addVideoIfUnique(videos.embedded, {
          src: src,
          width: iframe.width || iframe.clientWidth || 0,
          height: iframe.height || iframe.clientHeight || 0,
          type: 'iframe-direct-video',
          index: index
        });
      }
    });
    
    // 3. FIND HIDDEN VIDEOS IN SCRIPT TAGS
    try {
      document.querySelectorAll('script').forEach(script => {
        if (!script.textContent) return;
        
        // Look for video URL patterns in JSON or other script content
        const content = script.textContent;
        
        // Match MP4 URLs
        const mp4Matches = content.match(/["']https?:\/\/[^"']*\.mp4([?#][^"']*)?["']/g);
        if (mp4Matches) {
          mp4Matches.forEach(match => {
            const url = match.replace(/["']/g, '');
            addVideoIfUnique(videos.standard, {
              src: url,
              type: 'script-embedded',
              index: 0
            });
          });
        }
        
        // Match WebM URLs
        const webmMatches = content.match(/["']https?:\/\/[^"']*\.webm([?#][^"']*)?["']/g);
        if (webmMatches) {
          webmMatches.forEach(match => {
            const url = match.replace(/["']/g, '');
            addVideoIfUnique(videos.standard, {
              src: url,
              type: 'script-embedded',
              index: 0
            });
          });
        }
        
        // Check for video configs in JSON format
        try {
          if (content.includes('"video_url":') || 
              content.includes('"contentUrl":') || 
              content.includes('"videoUrl":')) {
            
            // Extract JSON objects that might contain video URLs
            const jsonMatches = content.match(/\{[^\{\}]*?(video_url|contentUrl|videoUrl)[^\{\}]*?\}/g);
            if (jsonMatches) {
              jsonMatches.forEach(jsonStr => {
                try {
                  // Try to parse as JSON with some cleanup
                  const cleanedStr = jsonStr.replace(/'/g, '"')
                                            .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');
                  const parsed = JSON.parse(cleanedStr);
                  
                  // Check various possible property names
                  const videoUrl = parsed.video_url || parsed.contentUrl || 
                                  parsed.videoUrl || parsed.media_url ||
                                  parsed.source || parsed.src;
                                  
                  if (videoUrl && typeof videoUrl === 'string' && 
                      videoUrl.match(/^https?:\/\//) &&
                      !processedUrls.has(videoUrl)) {
                    
                    addVideoIfUnique(videos.standard, {
                      src: videoUrl,
                      type: 'json-embedded',
                      index: 0
                    });
                  }
                } catch (e) {
                  // Invalid JSON, ignore
                }
              });
            }
          }
        } catch (e) {
          // JSON parsing failed
        }
      });
    } catch (err) {
      console.error('Error extracting videos from scripts:', err);
    }
    
    // 4. VIDEO-JS AND OTHER PLAYERS
    document.querySelectorAll('.video-js, .plyr, .jwplayer, [data-player], [data-setup], [data-video-id]').forEach((player, index) => {
      try {
        let src = null;
        
        // Check for data attributes containing source URL
        if (player.dataset) {
          for (const key in player.dataset) {
            if (key.includes('src') || key.includes('source') || key.includes('url') || key.includes('video')) {
              const value = player.dataset[key];
              if (value && typeof value === 'string' && 
                  (value.match(/\.(mp4|webm|ogg|mov)($|\?)/i) || value.startsWith('blob:'))) {
                src = value;
                break;
              }
            }
          }
        }
        
        // Check for nested source elements
        if (!src) {
          const source = player.querySelector('source');
          if (source && source.src) src = source.src;
        }
        
        // Check for video element
        if (!src) {
          const video = player.querySelector('video');
          if (video && video.src) src = video.src;
        }
        
        if (src) {
          addVideoIfUnique(videos.standard, {
            src: src,
            width: player.offsetWidth || 0,
            height: player.offsetHeight || 0,
            type: 'video-player',
            player: player.className || 'custom-player',
            index: index
          });
        }
      } catch (e) {
        // Skip problematic players
      }
    });
  } catch (err) {
    console.error('Error detecting videos:', err);
  }
  
  console.log('Found videos:', {
    standard: videos.standard.length,
    embedded: videos.embedded.length,
    social: videos.social.length,
    background: videos.background.length,
    hls: videos.hls.length,
    total: videos.standard.length + videos.embedded.length + videos.social.length + 
           videos.background.length + videos.hls.length
  });
  
  return videos;
}

/**
 * Helper to determine video platform
 */
export function getVideoPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('vimeo.com')) return 'Vimeo';
  if (url.includes('dailymotion.com')) return 'Dailymotion';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter';
  if (url.includes('tiktok.com')) return 'TikTok';
  return 'Unknown';
}

/**
 * The new global modal that needs to be created BEFORE 
 * any video actions are triggered
 */
let globalVideoModal = null;

/**
 * Initialize the video functionality - CALL THIS FIRST
 */
export function initVideoFeatures() {
  try {
    // Create the global video modal first
    globalVideoModal = createVideoModal();
    
    // Add the necessary CSS if not already present
    addVideoStyles();
    
    return true;
  } catch (err) {
    console.error('Failed to initialize video features:', err);
    return false;
  }
}

/**
 * Set up video feature handlers
 */
export function setupVideoFeatures(container) {
  if (!container) return;
  
  // Make sure we have a modal
  if (!globalVideoModal) {
    globalVideoModal = createVideoModal();
  }

  // Set up click handlers for video items
  container.querySelectorAll('.video-item').forEach(videoItem => {
    const previewBtn = videoItem.querySelector('.video-preview-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const videoSrc = previewBtn.getAttribute('data-src');
        const videoType = previewBtn.getAttribute('data-type');
        const videoPlatform = previewBtn.getAttribute('data-platform') || '';
        const videoDirectSrc = previewBtn.getAttribute('data-direct-src') || videoSrc;
        
        // Handle different types of videos
        if (videoPlatform === 'YouTube') {
          showYouTubePreview(videoSrc, globalVideoModal);
        } 
        else if (['Instagram', 'Twitter', 'Facebook', 'Vimeo', 'TikTok'].includes(videoPlatform)) {
          showSocialMediaPreview(videoSrc, videoDirectSrc, videoPlatform, globalVideoModal);
        } 
        else {
          showStandardVideoPreview(videoSrc, globalVideoModal);
        }
      });
    }
    
    const downloadBtn = videoItem.querySelector('.video-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const videoSrc = downloadBtn.getAttribute('data-src');
        const videoType = downloadBtn.getAttribute('data-type');
        const videoPlatform = downloadBtn.getAttribute('data-platform') || '';
        const videoDirectSrc = downloadBtn.getAttribute('data-direct-src') || videoSrc;
        const filename = downloadBtn.getAttribute('data-filename') || 'video';
        
        // Show loading state
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '⌛';
        downloadBtn.disabled = true;
        
        try {
          // Handle download based on video type
          if (['YouTube', 'Instagram', 'Twitter', 'Facebook', 'Vimeo', 'TikTok'].includes(videoPlatform)) {
            // For social media, open in new tab
            window.open(videoDirectSrc, '_blank');
            
            // Create a hint popup
            const hint = document.createElement('div');
            hint.className = 'download-hint';
            hint.textContent = `Opening ${videoPlatform} link. Use a service to download.`;
            videoItem.appendChild(hint);
            setTimeout(() => {
              if (hint.parentNode) hint.parentNode.removeChild(hint);
            }, 5000);
          } else {
            // For direct videos
            try {
              const utils = await import('./utils.js');
              await utils.downloadVideo(videoSrc, filename);
            } catch (err) {
              console.error('Download error:', err);
              // Fallback to opening in new tab
              window.open(videoSrc, '_blank');
            }
          }
        } catch (err) {
          console.error('Video download error:', err);
          window.open(videoSrc, '_blank');
        } finally {
          // Reset button
          downloadBtn.textContent = originalText;
          downloadBtn.disabled = false;
        }
      });
    }
    
    // Video info buttons
    const infoBtn = videoItem.querySelector('.video-info-btn');
    if (infoBtn) {
      infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const detailsId = infoBtn.getAttribute('data-video-id');
        const detailsEl = document.getElementById(detailsId);
        if (detailsEl) {
          detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
        }
      });
    }
  });

  // Return success
  return true;
}

/**
 * Create HTML for the video tab inside the media tab
 */
export function createMediaTabsContent(allMedia) {
  return `
    <div class="media-subtabs-content">
      <div class="media-subtabs">
        <button class="media-subtab active" data-target="images-content">Images</button>
        <button class="media-subtab" data-target="videos-content">Videos</button>
      </div>
      
      <div class="media-subtab-content active" id="images-content">
        <div class="images-container">${allMedia.imageContent || '<div class="no-content">No images found</div>'}</div>
      </div>
      
      <div class="media-subtab-content" id="videos-content">
        <div class="videos-container">${allMedia.videoContent || '<div class="no-content">No videos found</div>'}</div>
      </div>
    </div>
  `;
}

/**
 * Create HTML display for videos
 */
export function createVideoDisplay(videosObj) {
  let html = '';
  let totalVideos = 0;
  
  // Process each category of videos
  for (const [category, videos] of Object.entries(videosObj)) {
    if (videos.length === 0) continue;
    
    totalVideos += videos.length;
    
    // Format category name nicely
    let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    categoryName = categoryName.replace(/([A-Z])/g, ' $1').trim();
    
    html += `<div class="video-group" id="category-${category}">
      <h4>${categoryName} Videos (<span class="count">${videos.length}</span>)</h4>
      <div class="video-grid">`;
    
    videos.forEach((video, index) => {
      const videoId = `video-${category}-${index}`;
      const videoSrc = video.src;
      const videoDimensions = video.width && video.height ? 
        `${video.width}×${video.height}px` : 
        'Unknown';
        
      const videoType = video.type || 'standard';
      const videoPlatform = video.platform || '';
      const videoDirectSrc = video.directSrc || videoSrc;
      const videoDuration = video.duration ? formatDuration(video.duration) : '';
      const videoThumbnail = video.thumbnail || video.poster || '';
      const fileName = getFilenameFromVideoUrl(videoSrc, category, index);
      
      // Build video item with preview button and thumbnail if available
      html += `
        <div class="video-item ${videoType}">
          <div class="video-container">
            ${videoPlatform ? `<div class="video-platform-badge">${videoPlatform}</div>` : ''}
            ${videoThumbnail ? 
              `<div class="video-thumbnail" style="background-image: url('${videoThumbnail}')"></div>` : 
              `<div class="video-placeholder"><span class="video-icon">▶</span></div>`
            }
            <button class="video-preview-btn" data-src="${videoSrc}" data-type="${videoType}" data-platform="${videoPlatform}" data-direct-src="${videoDirectSrc}">
              Preview
            </button>
          </div>
          <div class="video-info">
            <div class="video-dimensions">
              ${videoDimensions}
              ${videoDuration ? `<span class="video-duration">${videoDuration}</span>` : ''}
            </div>
            <div class="video-actions">
              <button class="video-download-btn download-btn" data-src="${videoSrc}" data-type="${videoType}" data-platform="${videoPlatform}" data-direct-src="${videoDirectSrc}" data-filename="${fileName}">
                Download
              </button>
              <button class="video-info-btn info-btn" data-video-id="${videoId}">Info</button>
            </div>
          </div>
          <div id="${videoId}" class="video-details" style="display: none;">
            <div><strong>Type:</strong> ${videoType}</div>
            ${videoPlatform ? `<div><strong>Platform:</strong> ${videoPlatform}</div>` : ''}
            <div><strong>URL:</strong> <span class="video-url">${videoSrc.substring(0, 50)}${videoSrc.length > 50 ? '...' : ''}</span></div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
  }
  
  if (totalVideos === 0) {
    return '<div class="no-videos">No videos found on this page</div>';
  }
  
  return html;
}

/**
 * Create video modal
 */
function createVideoModal() {
  let videoModal = document.getElementById('global-video-preview-modal');
  
  if (!videoModal) {
    videoModal = document.createElement('div');
    videoModal.id = 'global-video-preview-modal';
    videoModal.className = 'global-preview-modal';
    videoModal.innerHTML = `
      <div class="niblie-modal-header">
        <div class="niblie-logo">
          <span class="niblie-logo-icon">🎬</span>
          <span>Video Preview</span>
        </div>
        <div class="niblie-modal-actions">
          <button class="dismiss-btn" title="Close (Esc)">✕</button>
        </div>
      </div>
      <div class="video-preview-container">
        <div class="preview-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">Loading video...</div>
        </div>
        
        <!-- Standard video player -->
        <div class="video-standard-container">
          <video controls autoplay>
            <source src="" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
        
        <!-- Iframe embed for social media -->
        <div class="video-embed-container">
          <iframe src="" frameborder="0" allowfullscreen></iframe>
        </div>
        
        <div class="preview-details">
          <span class="video-filename"></span>
          <span class="video-dimensions"></span>
        </div>
        
        <div class="video-fallback-container" style="display: none;">
          <div class="video-fallback-message">
            This video cannot be embedded directly.
            <div class="fallback-actions">
              <button class="fallback-open-btn">Open in New Tab</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(videoModal);
    
    // Close button functionality
    videoModal.querySelector('.dismiss-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeVideoModal(videoModal);
    });
    
    // Close on click outside
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoModal(videoModal);
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoModal.classList.contains('active')) {
        closeVideoModal(videoModal);
      }
    });
  }
  
  return videoModal;
}

/**
 * Close video modal and cleanup
 */
function closeVideoModal(modal) {
  if (!modal) return;
  
  modal.classList.remove('active');
  
  // Reset standard video player
  const videoEl = modal.querySelector('video');
  if (videoEl) {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
  }
  
  // Reset iframe
  const iframeEl = modal.querySelector('iframe');
  if (iframeEl) {
    iframeEl.src = 'about:blank';
  }
  
  // Reset containers
  modal.querySelector('.video-standard-container').style.display = 'none';
  modal.querySelector('.video-embed-container').style.display = 'none';
  modal.querySelector('.video-fallback-container').style.display = 'none';
  
  // Show loading indicator for next time
  modal.querySelector('.preview-loading').style.display = 'flex';
}

/**
 * Show standard video preview
 */
function showStandardVideoPreview(videoSrc, modal) {
  if (!modal) {
    console.error('Video modal not initialized');
    window.open(videoSrc, '_blank');
    return;
  }
  
  // Show the modal
  modal.classList.add('active');
  
  // Hide iframe container, show video container
  modal.querySelector('.video-standard-container').style.display = 'block';
  modal.querySelector('.video-embed-container').style.display = 'none';
  modal.querySelector('.video-fallback-container').style.display = 'none';
  
  // Update video source
  const video = modal.querySelector('video');
  const source = video.querySelector('source') || document.createElement('source');
  if (!source.parentNode) {
    video.appendChild(source);
  }
  
  source.src = videoSrc;
  video.load();
  
  // Update metadata
  const filename = videoSrc.split('/').pop().split('?')[0];
  modal.querySelector('.video-filename').textContent = filename;
  
  // Setup event handlers
  video.onloadeddata = () => {
    modal.querySelector('.preview-loading').style.display = 'none';
    modal.querySelector('.video-dimensions').textContent = 
      `${video.videoWidth || 0}×${video.videoHeight || 0}px`;
  };
  
  video.onerror = () => {
    modal.querySelector('.preview-loading').style.display = 'none';
    modal.querySelector('.video-standard-container').style.display = 'none';
    showVideoFallback(videoSrc, modal);
  };
}

/**
 * Show YouTube preview
 */
function showYouTubePreview(videoSrc, modal) {
  if (!modal) {
    console.error('Video modal not initialized');
    window.open(videoSrc, '_blank');
    return;
  }
  
  // Show the modal
  modal.classList.add('active');
  
  // Extract video ID if this is a YouTube URL
  let videoId = '';
  if (videoSrc.includes('youtube.com/embed/')) {
    videoId = videoSrc.split('youtube.com/embed/')[1].split('?')[0];
  } else if (videoSrc.includes('youtu.be/')) {
    videoId = videoSrc.split('youtu.be/')[1].split('?')[0];
  } else if (videoSrc.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(videoSrc);
      videoId = urlObj.searchParams.get('v');
    } catch (e) {
      console.error('Failed to parse YouTube URL:', e);
    }
  }
  
  if (videoId) {
    // Hide standard video, show iframe
    modal.querySelector('.video-standard-container').style.display = 'none';
    modal.querySelector('.video-embed-container').style.display = 'block';
    modal.querySelector('.video-fallback-container').style.display = 'none';
    
    // Set iframe src to YouTube embed
    const iframe = modal.querySelector('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    
    // Hide loading indicator after a short delay
    setTimeout(() => {
      modal.querySelector('.preview-loading').style.display = 'none';
    }, 1000);
    
    // Update metadata
    modal.querySelector('.video-filename').textContent = `YouTube Video (${videoId})`;
  } else {
    // If we couldn't extract a video ID, show fallback
    showVideoFallback(videoSrc, modal);
  }
}

/**
 * Show social media preview
 */
function showSocialMediaPreview(videoSrc, directSrc, platform, modal) {
  if (!modal) {
    console.error('Video modal not initialized');
    window.open(directSrc, '_blank');
    return;
  }
  
  // Show the modal
  modal.classList.add('active');
  
  if (platform === 'Instagram' && videoSrc.match(/\.(mp4|webm)($|\?)/)) {
    // Direct Instagram video - use standard player
    showStandardVideoPreview(videoSrc, modal);
    return;
  }
  
  // For most social platforms, we can't embed directly
  // so we'll just show the fallback to open in new tab
  modal.querySelector('.video-standard-container').style.display = 'none';
  modal.querySelector('.video-embed-container').style.display = 'none';
  showVideoFallback(directSrc, modal);
  
  // Update metadata
  modal.querySelector('.video-filename').textContent = `${platform} Video`;
  modal.querySelector('.preview-loading').style.display = 'none';
}

/**
 * Show fallback for videos that can't be embedded
 */
function showVideoFallback(videoSrc, modal) {
  if (!modal) return;
  
  // Show fallback container
  modal.querySelector('.video-fallback-container').style.display = 'flex';
  modal.querySelector('.preview-loading').style.display = 'none';
  
  // Setup fallback action
  const openBtn = modal.querySelector('.fallback-open-btn');
  openBtn.onclick = () => window.open(videoSrc, '_blank');
}

/**
 * Format video duration in MM:SS format
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Get filename from video URL
 */
function getFilenameFromVideoUrl(url, category, index) {
  try {
    // Try to extract filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      const extension = filename.split('.').pop();
      if (extension && extension.match(/^(mp4|webm|ogg|mov)$/i)) {
        return filename;
      }
    }
    
    // For YouTube, return ID if possible
    if (url.includes('youtube.com/embed/')) {
      const id = url.split('youtube.com/embed/')[1].split('?')[0];
      return `youtube-${id}.mp4`;
    } else if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0];
      return `youtube-${id}.mp4`;
    }
    
    // Default name
    return `video-${category}-${index}.mp4`;
  } catch (e) {
    return `video-${category}-${index}.mp4`;
  }
}

/**
 * Add necessary CSS styles
 */
function addVideoStyles() {
  const styleId = 'video-features-css';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Video grid */
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 15px;
      margin: 10px 0;
    }
    
    /* Video item */
    .video-item {
      border: 1px solid #eee;
      border-radius: 6px;
      overflow: hidden;
      background: white;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .video-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    }
    
    /* Video container */
    .video-container {
      position: relative;
      height: 130px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    /* Video placeholder */
    .video-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    
    .video-icon {
      font-size: 32px;
      color: #666;
    }
    
    /* Video thumbnail */
    .video-thumbnail {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    
    /* Preview button */
    .video-preview-btn {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      opacity: 0;
      transition: opacity 0.2s;
      cursor: pointer;
      font-weight: bold;
    }
    
    .video-container:hover .video-preview-btn {
      opacity: 1;
    }
    
    /* Platform badge */
    .video-platform-badge {
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,0,0,0.6);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      z-index: 1;
    }
    
    /* Video info */
    .video-info {
      padding: 8px;
    }
    
    .video-dimensions {
      font-size: 12px;
      color: #666;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    
    .video-duration {
      font-weight: bold;
    }
    
    /* Video actions */
    .video-actions {
      display: flex;
      justify-content: space-between;
      gap: 5px;
    }
    
    /* Video details */
    .video-details {
      background: #f9f9f9;
      padding: 8px;
      font-size: 11px;
      border-top: 1px solid #eee;
    }
    
    .video-url {
      font-size: 10px;
      color: #666;
      word-break: break-all;
    }
    
    /* Modal styles */
    .global-preview-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s;
    }
    
    .global-preview-modal.active {
      opacity: 1;
      visibility: visible;
    }
    
    .niblie-modal-header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 10px 15px;
      background: rgba(0,0,0,0.7);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .niblie-logo {
      display: flex;
      align-items: center;
      color: white;
      font-weight: bold;
    }
    
    .niblie-logo-icon {
      margin-right: 8px;
    }
    
    .niblie-modal-actions {
      display: flex;
      gap: 10px;
    }
    
    .dismiss-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
    }
    
    .video-preview-container {
      width: 90%;
      max-width: 1000px;
      height: 80%;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .preview-loading {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      background: rgba(0,0,0,0.5);
      z-index: 2;
    }
    
    .loading-spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-text {
      font-size: 14px;
    }
    
    /* Standard video container */
    .video-standard-container {
      flex: 1;
      display: none;
    }
    
    .video-standard-container video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    /* Embed container */
    .video-embed-container {
      flex: 1;
      display: none;
    }
    
    .video-embed-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    /* Preview details */
    .preview-details {
      display: flex;
      justify-content: space-between;
      padding: 12px 15px;
      background: rgba(0,0,0,0.7);
      color: white;
      font-size: 14px;
    }
    
    /* Fallback container */
    .video-fallback-container {
      flex: 1;
      display: none;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: white;
    }
    
    .video-fallback-message {
      background: rgba(0,0,0,0.5);
      padding: 20px;
      border-radius: 10px;
      max-width: 80%;
    }
    
    .fallback-actions {
      margin-top: 15px;
    }
    
    .fallback-open-btn {
      background: #0073e6;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    
    /* Download hint */
    .download-hint {
      position: absolute;
      bottom: 105%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 5px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 10;
      animation: fadeOut 5s forwards;
    }
    
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    /* Tab UI for Media section */
    .media-subtabs {
      display: flex;
      gap: 5px;
      margin-bottom: 15px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    
    .media-subtab {
      background: #f0f0f0;
      border: none;
      border-radius: 15px;
      padding: 5px 15px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .media-subtab.active {
      background: #0073e6;
      color: white;
    }
    
    .media-subtab-content {
      display: none;
    }
    
    .media-subtab-content.active {
      display: block;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Setup event handlers for media tabs 
 */
export function setupMediaTabsHandlers() {
  // Select all media subtabs
  document.querySelectorAll('.media-subtab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Get target content ID
      const targetId = tab.getAttribute('data-target');
      
      // Remove active class from all tabs and contents
      document.querySelectorAll('.media-subtab').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelectorAll('.media-subtab-content').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show target content
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}