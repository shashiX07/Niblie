function countVisibleWords() {
  try {
    let visibleText = '';
    // Only process visible elements (optimization)
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Process in chunks to avoid blocking the main thread
    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    // Quick visibility check - only check parent element positions first
    for (const node of textNodes) {
      if (!node.parentElement) continue;
      
      const rect = node.parentElement.getBoundingClientRect();
      // Skip elements clearly out of view
      if (rect.bottom < 0 || rect.top > viewportHeight || 
          rect.right < 0 || rect.left > viewportWidth) {
        continue;
      }
      
      visibleText += ' ' + node.textContent;
    }
    
    return visibleText.trim().split(/\s+/).filter(Boolean).length;
  } catch (err) {
    console.error('Error counting visible words:', err);
    return 0;
  }
}

// Debounce function to limit how often a function can run
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Create debounced versions of our functions
const debouncedUpdateWordCount = debounce(function() {
  const count = countVisibleWords();
  const box = document.getElementById("live-word-count-box");
  if (box) box.innerText = `👀 Words in View: ${count}`;
}, 300);

function updateWordCount() {
  // Use the debounced version
  debouncedUpdateWordCount();
}

function categorizeLinks(urls) {
  const categories = {
    pdfs: [],
    docs: [],
    socials: [],
    media: [],
    external: [],
    internal: [],
    unwanted: []
  };

  const socialDomains = ['twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com'];
  const mediaExtensions = ['.mp4', '.webm', '.jpg', '.png', '.gif'];
  const unwantedPatterns = ['adservice', 'doubleclick', 'tracking'];

  const baseHost = window.location.hostname;

  for (const url of urls) {
    if (!url) continue;

    try {
      if (unwantedPatterns.some(p => url.includes(p))) {
        categories.unwanted.push(url);
      } else if (url.endsWith('.pdf')) {
        categories.pdfs.push(url);
      } else if (url.endsWith('.doc') || url.endsWith('.docx') || url.endsWith('.xls') || url.endsWith('.ppt')) {
        categories.docs.push(url);
      } else if (socialDomains.some(domain => url.includes(domain))) {
        categories.socials.push(url);
      } else if (mediaExtensions.some(ext => url.toLowerCase().includes(ext))) {
        categories.media.push(url);
      } else if (url.includes(baseHost)) {
        categories.internal.push(url);
      } else {
        categories.external.push(url);
      }
    } catch (err) {
      console.error('Error processing URL:', url, err);
    }
  }
  return categories;
}

function createLinkList(title, list) {
  if (list.length === 0) return '';
  return `
    <div class="link-group">
      <h4>${title} (${list.length})</h4>
      <ul>${list.map(url => `<li><a href="${url}" target="_blank">${url}</a></li>`).join('')}</ul>
    </div>
  `;
}

// Enhanced link list function
function createEnhancedLinkList(title, list) {
  if (list.length === 0) return '';
  
  return `
    <div class="link-group">
      <h4>${title} (${list.length})</h4>
      <ul class="enhanced-link-list">
        ${list.map(url => `
          <li class="enhanced-link-item">
            <div class="link-main">
              <a href="${url}" target="_blank" class="link-url">${url}</a>
              <button class="link-info-toggle" data-url="${url}">ℹ️</button>
            </div>
            <div class="link-details" id="details-${btoa(url).replace(/=/g, '')}" style="display: none;">
              <div class="link-loading">Loading details...</div>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// Improved function to find all images
function getAllImages() {
  const images = {
    standard: [],  // From <img> tags
    background: [], // CSS background images
    svg: [],       // SVG images
    canvas: [],    // Canvas elements
    other: []      // Other sources
  };
  
  // Track all URLs to prevent duplicates across categories
  const processedUrls = new Set();
  
  // Helper to convert relative to absolute URLs
  function toAbsoluteUrl(url) {
    if (!url) return '';
    // Skip data URLs and blob URLs - they're already complete
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    try {
      return new URL(url, document.baseURI).href;
    } catch (e) {
      return url; // Return original if parsing fails
    }
  }
  
  // Helper to add image if not already processed
  function addImageIfUnique(collection, imageData) {
    const absoluteUrl = toAbsoluteUrl(imageData.src);
    if (!absoluteUrl) return false;
    
    // Skip tracking pixels and tiny images
    if (imageData.naturalWidth === 1 && imageData.naturalHeight === 1) return false;
    
    // Skip duplicates
    if (processedUrls.has(absoluteUrl)) return false;
    
    // Add to tracking
    processedUrls.add(absoluteUrl);
    
    // Update the source to absolute URL
    imageData.src = absoluteUrl;
    collection.push(imageData);
    return true;
  }
  
  try {
    // 1. Get all standard <img> elements and <picture> sources
    const imgElements = document.querySelectorAll('img, picture source');
    imgElements.forEach(img => {
      const src = img.src || img.srcset?.split(' ')[0] || img.currentSrc;
      if (src && src.trim() !== '') {
        addImageIfUnique(images.standard, {
          src: src,
          alt: img.alt || '',
          width: img.width || 0,
          height: img.height || 0,
          naturalWidth: img.naturalWidth || 0,
          naturalHeight: img.naturalHeight || 0,
          type: 'standard'
        });
      }
    });
    
    // 2. Get CSS background images (optimized to process fewer elements)
    // Only check elements that are likely to have background images
    const potentialBgElements = document.querySelectorAll('div, section, header, footer, aside, article, main, nav, button, a');
    const processed = new Set();
    
    // Process in chunks to avoid blocking the UI
    const processBackgroundImages = (elements, startIdx, chunkSize) => {
      const endIdx = Math.min(startIdx + chunkSize, elements.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const el = elements[i];
        if (processed.has(el)) continue;
        processed.add(el);
        
        try {
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;
          
          if (bgImage && bgImage !== 'none') {
            // Extract URL from the "url('...')" format
            const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/g);
            if (matches) {
              matches.forEach(match => {
                const url = match.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1');
                addImageIfUnique(images.background, {
                  src: url,
                  width: el.offsetWidth || 0,
                  height: el.offsetHeight || 0,
                  type: 'background'
                });
              });
            }
          }
        } catch (err) {
          // Skip problematic elements
        }
      }
      
      // Continue with next chunk if there are more elements
      if (endIdx < elements.length) {
        setTimeout(() => processBackgroundImages(elements, endIdx, chunkSize), 0);
      }
    };
    
    // Start processing background images in chunks of 50
    processBackgroundImages(potentialBgElements, 0, 50);
    
    // 3. Get SVG images
    const svgElements = document.querySelectorAll('svg');
    svgElements.forEach((svg, index) => {
      try {
        // Skip tiny SVG icons
        const svgWidth = svg.width?.baseVal?.value || svg.viewBox?.baseVal?.width || 0;
        const svgHeight = svg.height?.baseVal?.value || svg.viewBox?.baseVal?.height || 0;
        
        // Skip very small SVGs that are likely icons
        if ((svgWidth > 0 && svgWidth < 24) && (svgHeight > 0 && svgHeight < 24)) {
          return;
        }
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
        const url = URL.createObjectURL(svgBlob);
        
        addImageIfUnique(images.svg, {
          src: url,
          width: svgWidth,
          height: svgHeight,
          type: 'svg',
          index: index
        });
      } catch (e) {
        // Skip problematic SVGs
      }
    });
    
    // 4. Get Canvas images (with cross-origin handling)
    const canvasElements = document.querySelectorAll('canvas');
    canvasElements.forEach((canvas, index) => {
      try {
        // Skip tiny canvases used for tracking or rendering
        if (canvas.width < 50 || canvas.height < 50) return;
        
        // Try to get data URL, but this may fail for cross-origin content
        const dataUrl = canvas.toDataURL('image/png');
        addImageIfUnique(images.canvas, {
          src: dataUrl,
          width: canvas.width || 0,
          height: canvas.height || 0,
          type: 'canvas',
          index: index
        });
      } catch (e) {
        // This is likely a tainted canvas due to cross-origin content
        // We can still show it's there even if we can't extract its data
        images.other.push({
          src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">Canvas (Protected)</text></svg>'),
          width: canvas.width || 0,
          height: canvas.height || 0,
          type: 'protected-canvas',
          index: index
        });
      }
    });
    
  } catch (err) {
    console.error('Error getting images:', err);
  }
  
  return images;
}

// Direct image download helper
function downloadImage(imgSrc, suggestedFilename) {
  // Create a temporary link element
  const downloadLink = document.createElement('a');
  downloadLink.href = imgSrc;
  downloadLink.download = suggestedFilename || 'image';
  
  // Append to body, click and remove
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Function to determine filename with extension
function getFilenameFromUrl(url, category, index) {
  try {
    // Try to get filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    // Extract extension if possible
    let extension = '';
    if (filename && filename.includes('.')) {
      extension = filename.split('.').pop();
      // Validate extension
      if (extension && extension.length <= 5) {
        return `image-${category}-${index}.${extension}`;
      }
    }
    
    // Guess extension from data URL
    if (url.startsWith('data:image/')) {
      extension = url.substring(11, url.indexOf(';'));
      return `image-${category}-${index}.${extension}`;
    }
    
    // Fallback with category type
    return `image-${category}-${index}.png`;
  } catch (e) {
    return `image-${category}-${index}.png`;
  }
}

// Modified function to create HTML for image display with improved hover and download
function createImageDisplay(imagesObj) {
  let html = '';
  let totalImages = 0;
  
  // Process each category of images
  for (const [category, images] of Object.entries(imagesObj)) {
    if (images.length === 0) continue;
    
    totalImages += images.length;
    html += `<div class="image-group"><h4>${category.charAt(0).toUpperCase() + category.slice(1)} Images (${images.length})</h4><div class="image-grid">`;
    
    images.forEach((img, index) => {
      const imgId = `img-${category}-${index}`;
      const imgSrc = img.src;
      const imgDimensions = img.width && img.height ? 
        `${img.width}×${img.height}px` : 
        'Unknown';
      const filename = getFilenameFromUrl(imgSrc, category, index);
      
      // Generate a unique ID for the preview container
      const previewId = `preview-${category}-${index}`;
      
      // Add an error handler for broken images
      const errorHandler = `onerror="this.onerror=null; this.src='data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#f8f8f8"/><text x="50%" y="50%" font-family="Arial" font-size="12" fill="#999" text-anchor="middle">Image Error</text></svg>')}'; this.style.padding='8px'; this.parentNode.classList.add('image-error');"`;
      
      html += `
        <div class="image-item" data-preview-id="${previewId}">
          <div class="image-container hover-trigger">
            <img src="${imgSrc}" alt="${img.alt || ''}" loading="lazy" ${errorHandler} />
          </div>
          <div class="image-info">
            <div class="image-dimensions">${imgDimensions}</div>
            <div class="image-actions">
              <button class="download-btn" data-src="${imgSrc}" data-filename="${filename}">⬇️ Download</button>
              <button class="info-btn" data-img-id="${imgId}">ℹ️ Info</button>
            </div>
          </div>
          <div id="${imgId}" class="image-details" style="display: none;">
            <div><strong>Type:</strong> ${img.type}</div>
            <div><strong>URL:</strong> <span class="img-url">${imgSrc.substring(0, 50)}${imgSrc.length > 50 ? '...' : ''}</span></div>
            ${img.naturalWidth ? `<div><strong>Natural:</strong> ${img.naturalWidth}×${img.naturalHeight}px</div>` : ''}
            ${img.alt ? `<div><strong>Alt Text:</strong> ${img.alt}</div>` : ''}
          </div>
          <div id="${previewId}" class="image-preview-overlay">
            <div class="image-preview-container">
              <img src="${imgSrc}" alt="${img.alt || ''}" loading="lazy" />
              <div class="preview-details">
                <span>${imgDimensions}</span>
                <span class="preview-filename">${filename.split('.').pop().toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
  }
  
  if (totalImages === 0) {
    return '<div class="no-images">No images found on this page</div>';
  }
  
  return html;
}

// Add this function to set up event handlers for image-related features
function setupImageFeatures() {
  // Direct download buttons
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const imgSrc = btn.getAttribute('data-src');
      const filename = btn.getAttribute('data-filename');
      downloadImage(imgSrc, filename);
    };
  });
  
  // Image preview functionality
  document.querySelectorAll('.image-item').forEach(item => {
    const previewId = item.getAttribute('data-preview-id');
    const preview = document.getElementById(previewId);
    
    // Show preview on hover
    item.addEventListener('mouseenter', () => {
      preview.classList.add('active');
      
      // Position the preview properly
      const rect = item.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate best position (above, below, left or right)
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;
      
      // Reset all positioning classes
      preview.classList.remove('position-above', 'position-below', 'position-left', 'position-right');
      
      // Position where there's most space
      const maxSpace = Math.max(spaceAbove, spaceBelow, spaceLeft, spaceRight);
      
      if (maxSpace === spaceBelow && spaceBelow > 200) {
        preview.classList.add('position-below');
      } else if (maxSpace === spaceAbove && spaceAbove > 200) {
        preview.classList.add('position-above');
      } else if (maxSpace === spaceRight && spaceRight > 300) {
        preview.classList.add('position-right');
      } else if (maxSpace === spaceLeft && spaceLeft > 300) {
        preview.classList.add('position-left');
      } else {
        // Default positioning if no good option
        preview.classList.add('position-center');
      }
    });
    
    // Hide preview when mouse leaves
    item.addEventListener('mouseleave', () => {
      preview.classList.remove('active');
    });
  });
  
  // Image info buttons
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.onclick = () => {
      const detailsId = btn.getAttribute('data-img-id');
      const detailsEl = document.getElementById(detailsId);
      if (detailsEl) {
        detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
      }
    };
  });
}

// In your showLinkBox function, modify the switchMainTab function:

function switchMainTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tabName}`).classList.add('active');
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-content-${tabName}`).classList.add('active');
  
  // Load images when switching to images tab
  if (tabName === 'images' && !document.getElementById('tab-content-images').dataset.loaded) {
    setTimeout(() => {
      const allImages = getAllImages();
      document.getElementById('tab-content-images').innerHTML = `
        <h2>📷 Page Images</h2>
        ${createImageDisplay(allImages)}
      `;
      document.getElementById('tab-content-images').dataset.loaded = true;
      
      // Set up all image-related features
      setupImageFeatures();
    }, 100);
  }
}

// Modify the showLinkBox function to fix the info buttons across subtabs

function showLinkBox() {
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
        <button id="tab-images" class="tab-btn">📷 Images</button>
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
      
      <div id="tab-content-images" class="tab-content">
        <h2>📷 Page Images</h2>
        <div id="images-loading">Loading images...</div>
      </div>
    `;

    // Append the box to the DOM
    document.body.appendChild(linkBox);
    console.log("Link box added to DOM"); // Debugging

    // Setup event listeners
    document.getElementById("close-link-box").onclick = () => {
      linkBox.remove();
    };
    
    // Main tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.id.replace('tab-', '');
        switchMainTab(tabName);
      });
    });
    
    // Subtab switching
    document.querySelectorAll('.link-subtab').forEach(tab => {
      tab.onclick = () => {
        const category = tab.dataset.category;
        switchSubtab(category);
      };
    });
    
    // Initially setup link info toggles for the active tab
    setupLinkInfoToggles();
    
    // Functions defined inside showLinkBox for proper scope
    function loadUrlDetails(url, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return; // Safety check
      
      container.innerHTML = '<div class="link-loading">Loading details...</div>';
      
      analyzeUrl(url).then(info => {
        // Ensure container still exists (user might have closed the box)
        if (document.getElementById(containerId)) {
          container.innerHTML = `
            <div class="url-details">
              <div class="url-detail-item"><span>Status:</span> <span class="status-indicator ${info.status}">${info.status}</span></div>
              <div class="url-detail-item"><span>Domain:</span> ${info.domain || 'Unknown'}</div>
              <div class="url-detail-item"><span>Path:</span> ${info.path || 'Unknown'}</div>
              <div class="url-detail-item"><span>Protocol:</span> ${info.protocol || 'Unknown'}</div>
              ${info.isRedirecting ? `
                <div class="url-detail-item"><span>Redirects To:</span> <span class="redirect-url">${info.finalUrl}</span></div>
              ` : ''}
              ${Object.keys(info.queryParams).length > 0 ? `
                <div class="url-detail-item">
                  <span>Query Parameters:</span>
                  <ul class="query-params">
                    ${Object.entries(info.queryParams).map(([key, value]) => 
                      `<li><strong>${key}:</strong> ${value || ''}</li>`
                    ).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `;
        }
      }).catch(err => {
        if (document.getElementById(containerId)) {
          container.innerHTML = `<div class="url-error">Error: ${err.message || 'Could not load details'}</div>`;
        }
      });
    }
    
    function setupLinkInfoToggles() {
      document.querySelectorAll('.link-info-toggle').forEach(btn => {
        // Remove existing event listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
          const url = this.dataset.url;
          const containerId = `details-${btoa(url).replace(/=/g, '')}`;
          const detailsContainer = document.getElementById(containerId);
          
          if (detailsContainer) {
            if (detailsContainer.style.display === 'none') {
              detailsContainer.style.display = 'block';
              loadUrlDetails(url, containerId);
            } else {
              detailsContainer.style.display = 'none';
            }
          }
        });
      });
    }
    
    function switchMainTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-content-${tabName}`).classList.add('active');
      
      // Load images when switching to images tab
      if (tabName === 'images' && !document.getElementById('tab-content-images').dataset.loaded) {
        setTimeout(() => {
          const allImages = getAllImages();
          document.getElementById('tab-content-images').innerHTML = `
            <h2>📷 Page Images</h2>
            ${createImageDisplay(allImages)}
          `;
          document.getElementById('tab-content-images').dataset.loaded = true;
          
          // Set up all image-related features
          setupImageFeatures();
        }, 100);
      }
    }
    
    function switchSubtab(category) {
      document.querySelectorAll('.link-subtab').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelector(`.link-subtab[data-category="${category}"]`).classList.add('active');
      
      document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`subtab-${category}`).classList.add('active');
      
      // Reattach event handlers for the newly visible tab
      setupLinkInfoToggles();
    }
    
  } catch (err) {
    console.error('Error showing link box:', err);
  }
}

// Fixed URL analyzer function - adds better error handling
function analyzeUrl(url) {
  return new Promise(async (resolve) => {
    const urlInfo = {
      url: url,
      status: 'unknown',
      statusCode: null,
      contentType: null,
      redirects: [],
      isRedirecting: false,
      finalUrl: url,
      domain: extractDomain(url),
      protocol: url.split('://')[0] || 'unknown',
      path: extractPath(url),
      queryParams: extractQueryParams(url),
      isExternal: !url.includes(window.location.hostname),
      timestamp: new Date().toISOString()
    };
    
    try {
      // Using a timeout to avoid blocking the UI for too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Try HEAD request first (lightweight)
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors', // Attempt no-cors to avoid CORS issues
          redirect: 'follow',
          signal: controller.signal,
          credentials: 'omit' // Don't send cookies
        });
        
        clearTimeout(timeoutId);
        
        if (response) {
          urlInfo.status = 'active';
          if (response.url !== url) {
            urlInfo.isRedirecting = true;
            urlInfo.finalUrl = response.url;
            urlInfo.redirects.push(response.url);
          }
        }
      } catch (err) {
        // Failed with HEAD, try with GET as fallback
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            redirect: 'follow',
            signal: controller.signal,
            credentials: 'omit'
          });
          
          if (response) {
            urlInfo.status = 'active';
            if (response.url !== url) {
              urlInfo.isRedirecting = true;
              urlInfo.finalUrl = response.url;
              urlInfo.redirects.push(response.url);
            }
          }
        } catch (innerErr) {
          // Both methods failed, keep status as unknown
        }
      }
    } catch (err) {
      // Don't update status on error - keep as unknown
      console.log(`Error checking URL ${url}: ${err.message}`);
    }
    
    resolve(urlInfo);
  });
}

// Helper functions for URL parsing with improved error handling
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url.split('/')[2] || '';
  }
}

function extractPath(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch (e) {
    const parts = url.split('/');
    return '/' + parts.slice(3).join('/');
  }
}

function extractQueryParams(url) {
  try {
    const urlObj = new URL(url);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (e) {
    // Fallback parsing for invalid URLs
    const queryString = url.split('?')[1];
    if (!queryString) return {};
    
    const params = {};
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = value || '';
    });
    return params;
  }
}

// 1. First, let's add the missing createEnhancedLinkList function
function createEnhancedLinkList(title, list) {
  if (list.length === 0) return '';
  
  return `
    <div class="link-group">
      <h4>${title} (${list.length})</h4>
      <ul class="enhanced-link-list">
        ${list.map(url => `
          <li class="enhanced-link-item">
            <div class="link-main">
              <a href="${url}" target="_blank" class="link-url">${url}</a>
              <button class="link-info-toggle" data-url="${url}">ℹ️</button>
            </div>
            <div class="link-details" id="details-${btoa(url).replace(/=/g, '')}" style="display: none;">
              <div class="link-loading">Loading details...</div>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// 2. Fix the initExtension function to properly show the box
function initExtension() {
  try {
    // Delay initialization to avoid interfering with page load
    setTimeout(() => {
      // Floating draggable box
      const box = document.createElement("div");
      box.id = "live-word-count-box";
      box.innerText = "👀 Words in View: ...";
      document.body.appendChild(box);
      
      // Track if we're dragging vs clicking
      let isDragging = false, offsetX = 0, offsetY = 0;
      let hasMovedDuringDrag = false;
      
      box.addEventListener("mousedown", function (e) {
        isDragging = true;
        hasMovedDuringDrag = false;
        offsetX = e.clientX - box.getBoundingClientRect().left;
        offsetY = e.clientY - box.getBoundingClientRect().top;
        box.style.transition = "none";
        e.preventDefault(); // Prevent text selection
      });
      
      document.addEventListener("mousemove", function (e) {
        if (isDragging) {
          hasMovedDuringDrag = true;
          box.style.left = (e.clientX - offsetX) + "px";
          box.style.top = (e.clientY - offsetY) + "px";
          box.style.right = "auto"; 
          box.style.bottom = "auto";
        }
      });
      
      document.addEventListener("mouseup", function() {
        if (isDragging && !hasMovedDuringDrag) {
          showLinkBox(); // This calls our fixed showLinkBox function
        }
        isDragging = false;
      });
      
      // Set up observers
      window.addEventListener("scroll", updateWordCount);
      window.addEventListener("resize", updateWordCount);
      
      // Watch for dynamic content changes
      const observer = new MutationObserver(updateWordCount);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true
      });
      
      // Initial word count
      setTimeout(updateWordCount, 500);
    }, 1000); // Delay extension start by 1 second
  } catch (err) {
    console.error('Error initializing extension:', err);
  }
}

// 3. Remove the standalone switchMainTab function and use the one inside showLinkBox

// 4. Clean up and fix the showLinkBox function
function showLinkBox() {
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
        <button id="tab-images" class="tab-btn">📷 Images</button>
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
      
      <div id="tab-content-images" class="tab-content">
        <h2>📷 Page Images</h2>
        <div id="images-loading">Loading images...</div>
      </div>
    `;

    // Append the box to the DOM
    document.body.appendChild(linkBox);
    console.log("Link box added to DOM"); // Debugging

    // Setup event listeners
    document.getElementById("close-link-box").onclick = () => {
      linkBox.remove();
    };
    
    // Main tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.id.replace('tab-', '');
        switchMainTab(tabName);
      });
    });
    
    // Subtab switching
    document.querySelectorAll('.link-subtab').forEach(tab => {
      tab.onclick = () => {
        const category = tab.dataset.category;
        switchSubtab(category);
      };
    });
    
    // Initially setup link info toggles for the active tab
    setupLinkInfoToggles();
    
    // Functions defined inside showLinkBox for proper scope
    function loadUrlDetails(url, containerId) {
      const container = document.getElementById(containerId);
      if (!container) return; // Safety check
      
      container.innerHTML = '<div class="link-loading">Loading details...</div>';
      
      analyzeUrl(url).then(info => {
        // Ensure container still exists (user might have closed the box)
        if (document.getElementById(containerId)) {
          container.innerHTML = `
            <div class="url-details">
              <div class="url-detail-item"><span>Status:</span> <span class="status-indicator ${info.status}">${info.status}</span></div>
              <div class="url-detail-item"><span>Domain:</span> ${info.domain || 'Unknown'}</div>
              <div class="url-detail-item"><span>Path:</span> ${info.path || 'Unknown'}</div>
              <div class="url-detail-item"><span>Protocol:</span> ${info.protocol || 'Unknown'}</div>
              ${info.isRedirecting ? `
                <div class="url-detail-item"><span>Redirects To:</span> <span class="redirect-url">${info.finalUrl}</span></div>
              ` : ''}
              ${Object.keys(info.queryParams).length > 0 ? `
                <div class="url-detail-item">
                  <span>Query Parameters:</span>
                  <ul class="query-params">
                    ${Object.entries(info.queryParams).map(([key, value]) => 
                      `<li><strong>${key}:</strong> ${value || ''}</li>`
                    ).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `;
        }
      }).catch(err => {
        if (document.getElementById(containerId)) {
          container.innerHTML = `<div class="url-error">Error: ${err.message || 'Could not load details'}</div>`;
        }
      });
    }
    
    function setupLinkInfoToggles() {
      document.querySelectorAll('.link-info-toggle').forEach(btn => {
        // Remove existing event listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', function() {
          const url = this.dataset.url;
          const containerId = `details-${btoa(url).replace(/=/g, '')}`;
          const detailsContainer = document.getElementById(containerId);
          
          if (detailsContainer) {
            if (detailsContainer.style.display === 'none') {
              detailsContainer.style.display = 'block';
              loadUrlDetails(url, containerId);
            } else {
              detailsContainer.style.display = 'none';
            }
          }
        });
      });
    }
    
    function switchMainTab(tabName) {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-content-${tabName}`).classList.add('active');
      
      // Load images when switching to images tab
      if (tabName === 'images' && !document.getElementById('tab-content-images').dataset.loaded) {
        setTimeout(() => {
          const allImages = getAllImages();
          document.getElementById('tab-content-images').innerHTML = `
            <h2>📷 Page Images</h2>
            ${createImageDisplay(allImages)}
          `;
          document.getElementById('tab-content-images').dataset.loaded = true;
          
          // Set up all image-related features
          setupImageFeatures();
        }, 100);
      }
    }
    
    function switchSubtab(category) {
      document.querySelectorAll('.link-subtab').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelector(`.link-subtab[data-category="${category}"]`).classList.add('active');
      
      document.querySelectorAll('.subtab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`subtab-${category}`).classList.add('active');
      
      // Reattach event handlers for the newly visible tab
      setupLinkInfoToggles();
    }
    
  } catch (err) {
    console.error('Error showing link box:', err);
  }
}

// 5. Remove the duplicate showLinkBox function declaration

// 6. Fix initialization logic to run when the page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}
