/**
 * Find all images on the page with enhanced detection
 */
export function getAllImages() {
  const images = {
    standard: [],     // From <img> tags
    background: [],   // CSS background images
    svg: [],          // SVG images
    canvas: [],       // Canvas elements
    lazyLoaded: [],   // Images that use lazy loading
    cssGenerated: [], // Images from CSS pseudo-elements and properties
    other: []         // Other sources
  };
  
  // Track all URLs to prevent duplicates across categories
  const processedUrls = new Set();
  
  // Helper to convert relative to absolute URLs
  function toAbsoluteUrl(url) {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    try {
      return new URL(url, document.baseURI).href;
    } catch (e) {
      return url;
    }
  }
  
  // Helper to add image if not already processed
  function addImageIfUnique(collection, imageData) {
    if (!imageData.src) return false;
    
    const absoluteUrl = toAbsoluteUrl(imageData.src);
    if (!absoluteUrl) return false;
    
    // Skip tracking pixels and very tiny images unless they're important
    if (!imageData.important && 
        imageData.naturalWidth === 1 && 
        imageData.naturalHeight === 1) return false;
    
    // Skip common tracking pixels and spacers by URL pattern
    if (absoluteUrl.includes('pixel.gif') || 
        absoluteUrl.includes('spacer.gif') ||
        absoluteUrl.includes('tracking') ||
        absoluteUrl.includes('1x1.gif') ||
        absoluteUrl.includes('transparent.gif')) return false;
    
    // Skip data URLs that are too small (likely tiny placeholders)
    if (absoluteUrl.startsWith('data:') && 
        absoluteUrl.length < 100 &&
        !absoluteUrl.includes('svg+xml')) return false;
    
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
    // 1. Get all standard <img> elements
    document.querySelectorAll('img').forEach(img => {
      const src = img.currentSrc || img.src;
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
    
    // 2. Get all sources from <picture> elements
    document.querySelectorAll('picture source').forEach(source => {
      if (source.srcset) {
        // Get largest image from srcset
        const srcsetParts = source.srcset.split(',');
        let bestSrc = '';
        let bestWidth = 0;
        
        srcsetParts.forEach(part => {
          const [url, descriptor] = part.trim().split(/\s+/);
          // If descriptor contains 'w', it's a width descriptor
          if (descriptor && descriptor.includes('w')) {
            const width = parseInt(descriptor, 10);
            if (width > bestWidth) {
              bestWidth = width;
              bestSrc = url;
            }
          } else {
            // No width descriptor or just a pixel density, use the URL
            bestSrc = bestSrc || url;
          }
        });
        
        if (bestSrc) {
          addImageIfUnique(images.standard, {
            src: bestSrc,
            width: bestWidth || 0,
            height: 0,
            type: 'picture-source'
          });
        }
      } else if (source.src) {
        addImageIfUnique(images.standard, {
          src: source.src,
          type: 'picture-source'
        });
      }
    });
    
    // 3. Detect lazy-loaded images (common data attributes)
    const lazyAttributes = [
      'data-src',
      'data-original',
      'data-lazy',
      'data-srcset', 
      'data-url',
      'data-img',
      'data-image',
      'data-source',
      'data-hi-res-src',
      'data-zoom-src',
      'data-large-img',
      'lazy-src',
      'data-bg',
      'data-background',
      'data-full-src',
      'data-master'
    ];
    
    // Find elements with any of these lazy-load attributes
    const lazySelector = lazyAttributes.map(attr => `[${attr}]`).join(',');
    document.querySelectorAll(lazySelector).forEach(el => {
      for (const attr of lazyAttributes) {
        if (el.hasAttribute(attr)) {
          const value = el.getAttribute(attr);
          if (value && value.trim() !== '' && !value.startsWith('data:') && !value.startsWith('#')) {
            addImageIfUnique(images.lazyLoaded, {
              src: value,
              width: el.offsetWidth || 0,
              height: el.offsetHeight || 0,
              type: 'lazy-loaded',
              dataAttr: attr
            });
            break; // Only use the first valid attribute found
          }
        }
      }
    });
    
    // 4. Look for "blank" images that might be lazy-loaded via JavaScript
    document.querySelectorAll('img[src=""], img[src*="blank."], img[src*="placeholder."], img[src*="lazy."]').forEach(img => {
      // Check for inline CSS background
      const inlineBackground = img.style.backgroundImage;
      if (inlineBackground && inlineBackground !== 'none') {
        const match = inlineBackground.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match && match[1]) {
          addImageIfUnique(images.lazyLoaded, {
            src: match[1],
            width: img.offsetWidth || 0,
            height: img.offsetHeight || 0,
            type: 'lazy-placeholder'
          });
        }
      }
      
      // Check if there's a "real" image as a sibling or parent
      // This is a common pattern where a placeholder image is alongside the real one
      const parent = img.parentElement;
      if (parent) {
        // Check siblings first
        const siblings = Array.from(parent.children);
        for (const sibling of siblings) {
          if (sibling !== img && sibling.tagName === 'IMG' && sibling.src && !sibling.src.includes('blank.') && !sibling.src.includes('placeholder.')) {
            addImageIfUnique(images.lazyLoaded, {
              src: sibling.src,
              width: sibling.offsetWidth || 0,
              height: sibling.offsetHeight || 0,
              type: 'sibling-image'
            });
          }
        }
        
        // Check for background image on parent
        const parentStyle = window.getComputedStyle(parent);
        const parentBg = parentStyle.backgroundImage;
        if (parentBg && parentBg !== 'none') {
          const match = parentBg.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1]) {
            addImageIfUnique(images.lazyLoaded, {
              src: match[1],
              width: parent.offsetWidth || 0,
              height: parent.offsetHeight || 0,
              type: 'parent-background'
            });
          }
        }
      }
    });
    
    // 5. Get CSS background images (more thorough approach)
    // Function to process and extract background images from an element
    function processElementForBackgrounds(el) {
      try {
        if (!el || processed.has(el)) return;
        processed.add(el);
        
        // Get computed style
        const style = window.getComputedStyle(el);
        
        // Check element visibility - skip if it's invisible
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
          return;
        }
        
        // Check for background image
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          // Handle multiple background images (comma separated)
          const bgImages = style.backgroundImage.split(',');
          bgImages.forEach(bgImage => {
            const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (matches && matches[1]) {
              addImageIfUnique(images.background, {
                src: matches[1],
                width: el.offsetWidth || 0,
                height: el.offsetHeight || 0,
                type: 'background'
              });
            }
          });
        }
        
        // Check for other CSS image properties
        const imageProperties = [
          'borderImage', 'borderImageSource', 'listStyleImage', 
          'maskImage', 'webkitMaskImage'
        ];
        
        imageProperties.forEach(prop => {
          const value = style[prop];
          if (value && value !== 'none') {
            const matches = value.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (matches && matches[1]) {
              addImageIfUnique(images.cssGenerated, {
                src: matches[1],
                width: el.offsetWidth || 0,
                height: el.offsetHeight || 0,
                type: 'css-property',
                property: prop
              });
            }
          }
        });
        
        // Check pseudo-elements (::before, ::after)
        const pseudos = [':before', ':after', '::before', '::after'];
        pseudos.forEach(pseudo => {
          try {
            const pseudoStyle = window.getComputedStyle(el, pseudo);
            const bgImage = pseudoStyle.backgroundImage;
            
            if (bgImage && bgImage !== 'none') {
              const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
              if (matches && matches[1]) {
                addImageIfUnique(images.cssGenerated, {
                  src: matches[1],
                  width: parseInt(pseudoStyle.width) || 0,
                  height: parseInt(pseudoStyle.height) || 0,
                  type: 'pseudo-element',
                  pseudo: pseudo
                });
              }
            }
          } catch (err) {
            // Some browsers might throw errors when accessing pseudo-elements
          }
        });
        
        // Check inline style background
        if (el.style && el.style.backgroundImage && el.style.backgroundImage !== 'none') {
          const matches = el.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (matches && matches[1]) {
            addImageIfUnique(images.background, {
              src: matches[1],
              width: el.offsetWidth || 0,
              height: el.offsetHeight || 0,
              type: 'inline-background'
            });
          }
        }
      } catch (err) {
        // Skip problematic elements
      }
    }
    
    // Process all elements for backgrounds 
    const allElements = document.querySelectorAll('*');
    const processed = new Set();
    
    // Process in chunks to avoid blocking the UI
    const batchSize = 100;
    let currentIndex = 0;
    
    function processBatch() {
      const endIndex = Math.min(currentIndex + batchSize, allElements.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        processElementForBackgrounds(allElements[i]);
      }
      
      currentIndex = endIndex;
      
      // If more elements to process, schedule next batch
      if (currentIndex < allElements.length) {
        setTimeout(processBatch, 0);
      }
    }
    
    processBatch();
    
    // 6. Get SVG images with improved detection
    document.querySelectorAll('svg').forEach((svg, index) => {
      try {
        // Skip tiny SVG icons (more lenient size check)
        const svgWidth = svg.width?.baseVal?.value || svg.viewBox?.baseVal?.width || svg.clientWidth || 0;
        const svgHeight = svg.height?.baseVal?.value || svg.viewBox?.baseVal?.height || svg.clientHeight || 0;
        
        // Skip very small SVGs that are likely icons, unless they look important
        const hasImportantContent = svg.querySelector('image, pattern[href], use[href]');
        if ((svgWidth <= 24 && svgHeight <= 24) && !hasImportantContent) {
          return;
        }
        
        // First check for image elements inside SVG
        const svgImages = svg.querySelectorAll('image');
        if (svgImages.length > 0) {
          svgImages.forEach(image => {
            const href = image.getAttribute('href') || image.getAttribute('xlink:href');
            if (href) {
              addImageIfUnique(images.svg, {
                src: href,
                width: parseFloat(image.getAttribute('width')) || svgWidth || 0,
                height: parseFloat(image.getAttribute('height')) || svgHeight || 0,
                type: 'svg-image',
                index: index
              });
            }
          });
        } else {
          // If no image elements, convert the SVG itself
          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svg);
          const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
          const url = URL.createObjectURL(svgBlob);
          
          addImageIfUnique(images.svg, {
            src: url,
            width: svgWidth || 0,
            height: svgHeight || 0,
            type: 'svg',
            index: index
          });
        }
      } catch (e) {
        // Skip problematic SVGs
      }
    });
    
    // 7. Get Canvas images (with better cross-origin handling)
    document.querySelectorAll('canvas').forEach((canvas, index) => {
      try {
        // Skip tiny canvases used for tracking or rendering, but be more lenient
        if (canvas.width < 30 || canvas.height < 30) return;
        
        // Try to get data URL, but this may fail for cross-origin content
        try {
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
      } catch (e) {
        // Skip problematic canvas
      }
    });
    
    // 8. Try to access images in friendly iframes
    try {
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          // Only access same-origin iframes
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (iframeDoc) {
            // Find all images in the iframe
            const iframeImages = iframeDoc.querySelectorAll('img');
            iframeImages.forEach((img, idx) => {
              const src = img.currentSrc || img.src;
              if (src) {
                addImageIfUnique(images.other, {
                  src: src,
                  width: img.width || 0,
                  height: img.height || 0,
                  type: 'iframe-image',
                  index: idx
                });
              }
            });
            
            // Also check for backgrounds in the iframe
            const iframeElements = iframeDoc.querySelectorAll('*');
            iframeElements.forEach((el, idx) => {
              if (idx < 100) { // Limit to first 100 elements for performance
                try {
                  const style = iframeDoc.defaultView.getComputedStyle(el);
                  const bgImage = style.backgroundImage;
                  
                  if (bgImage && bgImage !== 'none') {
                    const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (matches && matches[1]) {
                      addImageIfUnique(images.other, {
                        src: matches[1],
                        width: el.offsetWidth || 0,
                        height: el.offsetHeight || 0,
                        type: 'iframe-background',
                        index: idx
                      });
                    }
                  }
                } catch (e) {
                  // Skip elements with issues
                }
              }
            });
          }
        } catch (e) {
          // Cross-origin iframe or other access error - ignore
        }
      });
    } catch (e) {
      // If iframe access fails completely, just continue
    }
    
    // 9. Look for images inside Shadow DOM (if accessible)
    try {
      const elementsWithShadow = document.querySelectorAll('*');
      elementsWithShadow.forEach(el => {
        try {
          const shadowRoot = el.shadowRoot;
          if (shadowRoot) {
            // Find images in shadow DOM
            shadowRoot.querySelectorAll('img').forEach((img, idx) => {
              const src = img.currentSrc || img.src;
              if (src) {
                addImageIfUnique(images.other, {
                  src: src,
                  width: img.width || 0,
                  height: img.height || 0,
                  type: 'shadow-dom-image',
                  index: idx
                });
              }
            });
            
            // Check backgrounds in shadow DOM
            shadowRoot.querySelectorAll('*').forEach((shadowEl, idx) => {
              try {
                const style = window.getComputedStyle(shadowEl);
                const bgImage = style.backgroundImage;
                
                if (bgImage && bgImage !== 'none') {
                  const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                  if (matches && matches[1]) {
                    addImageIfUnique(images.other, {
                      src: matches[1],
                      width: shadowEl.offsetWidth || 0,
                      height: shadowEl.offsetHeight || 0,
                      type: 'shadow-dom-background',
                      index: idx
                    });
                  }
                }
              } catch (e) {
                // Skip problematic shadow elements
              }
            });
          }
        } catch (e) {
          // Cannot access shadow DOM for this element
        }
      });
    } catch (e) {
      // Shadow DOM access completely failed
    }
    
    // 10. Look for common visual elements that might contain images by class/id patterns
    const visualContainers = document.querySelectorAll([
      '[class*="image"]', '[class*="img"]', '[class*="photo"]', '[class*="picture"]',
      '[class*="thumbnail"]', '[class*="avatar"]', '[class*="banner"]', '[class*="hero"]',
      '[class*="slide"]', '[class*="cover"]', '[id*="image"]', '[id*="img"]',
      '[id*="photo"]', '[id*="picture"]', '[id*="banner"]', '[id*="slide"]'
    ].join(','));
    
    visualContainers.forEach(container => {
      // Skip if we've already processed this container
      if (processed.has(container)) return;
      
      // Check if this has a background image we haven't captured yet
      const style = window.getComputedStyle(container);
      const bgImage = style.backgroundImage;
      
      if (bgImage && bgImage !== 'none') {
        const matches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (matches && matches[1] && !processedUrls.has(toAbsoluteUrl(matches[1]))) {
          addImageIfUnique(images.background, {
            src: matches[1],
            width: container.offsetWidth || 0,
            height: container.offsetHeight || 0,
            type: 'background-visual-element'
          });
        }
      }
      
      // Also check for inline styles
      if (container.style && container.style.backgroundImage && container.style.backgroundImage !== 'none') {
        const matches = container.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (matches && matches[1] && !processedUrls.has(toAbsoluteUrl(matches[1]))) {
          addImageIfUnique(images.background, {
            src: matches[1],
            width: container.offsetWidth || 0,
            height: container.offsetHeight || 0,
            type: 'inline-background-visual'
          });
        }
      }
    });
    
  } catch (err) {
    console.error('Error getting images:', err);
  }
  
  // Wait for any asynchronous processes to complete
  setTimeout(() => {
    console.log('Found images:', Object.keys(images).reduce((acc, key) => acc + images[key].length, 0));
  }, 1000);
  
  return images;
}

/**
 * Create HTML display for images
 */
export function createImageDisplay(imagesObj) {
  let html = '';
  let totalImages = 0;
  
  // Process each category of images
  for (const [category, images] of Object.entries(imagesObj)) {
    if (images.length === 0) continue;
    
    totalImages += images.length;
    html += `<div class="image-group" id="category-${category}"><h4>${category.charAt(0).toUpperCase() + category.slice(1)} Images (<span class="count">${images.length}</span>)</h4><div class="image-grid">`;
    
    images.forEach((img, index) => {
      const imgId = `img-${category}-${index}`;
      const imgSrc = img.src;
      const imgDimensions = img.width && img.height ? 
        `${img.width}×${img.height}px` : 
        'Unknown';
      const filename = getFilenameFromUrl(imgSrc, category, index);
      
      // Add class for filtering and data-src for access (NO error handler)
      html += `
        <div class="image-item" data-src="${imgSrc}" data-filename="${filename}" data-dimensions="${imgDimensions}">
          <div class="image-container click-trigger">
            <img src="${imgSrc}" alt="${img.alt || ''}" loading="lazy" />
          </div>
          <div class="image-info">
            <div class="image-dimensions">${imgDimensions}</div>
            <div class="image-actions">
              <div class="download-format-container">
                <button class="download-btn" data-src="${imgSrc}" data-filename="${filename}">⬇️</button>
                <select class="format-select" aria-label="Select format">
                  <option value="original">Original</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="webp">WEBP</option>
                </select>
              </div>
              <button class="info-btn" data-img-id="${imgId}">ℹ️</button>
            </div>
          </div>
          <div id="${imgId}" class="image-details" style="display: none;">
            <div><strong>Type:</strong> ${img.type}</div>
            <div><strong>URL:</strong> <span class="img-url">${imgSrc.substring(0, 50)}${imgSrc.length > 50 ? '...' : ''}</span></div>
            ${img.naturalWidth ? `<div><strong>Natural:</strong> ${img.naturalWidth}×${img.naturalHeight}px</div>` : ''}
            ${img.alt ? `<div><strong>Alt Text:</strong> ${img.alt}</div>` : ''}
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

// Add this function to clean up failed images after they're added to the DOM
export function cleanupImageErrors() {
  // Find all images and set up error handlers
  const images = document.querySelectorAll('.image-item img');
  let failedImages = 0;
  
  images.forEach(img => {
    img.onerror = function() {
      const imageItem = this.closest('.image-item');
      if (!imageItem) return;
      
      // Get the category container
      const categoryGroup = imageItem.closest('.image-group');
      if (!categoryGroup) return;
      
      // Remove the failed image
      if (imageItem.parentNode) {
        imageItem.parentNode.removeChild(imageItem);
        failedImages++;
        
        // Update the count in the category heading
        const countSpan = categoryGroup.querySelector('h4 .count');
        if (countSpan) {
          const currentCount = parseInt(countSpan.textContent) - 1;
          countSpan.textContent = currentCount;
          
          // If no images left in this category, remove the entire category
          if (currentCount <= 0) {
            categoryGroup.parentNode.removeChild(categoryGroup);
            
            // If no categories left, show "No images" message
            const remainingCategories = document.querySelectorAll('.image-group');
            if (remainingCategories.length === 0) {
              const container = document.querySelector('#images-content');
              if (container) {
                container.innerHTML = '<div class="no-images">No valid images found on this page</div>';
              }
            }
          }
        }
      }
    };
  });
}

/**
 * Set up image feature handlers
 */
export function setupImageFeatures() {
  // Clean up any failed images first
  cleanupImageErrors();
  
  // Direct download buttons
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const imgSrc = btn.getAttribute('data-src');
      const filename = btn.getAttribute('data-filename');
      const formatSelect = btn.parentElement.querySelector('.format-select');
      const selectedFormat = formatSelect ? formatSelect.value : 'original';
      
      import('./utils.js').then(module => {
        const { downloadImage, convertImageFormat } = module;
        
        if (selectedFormat === 'original') {
          downloadImage(imgSrc, filename);
        } else {
          // Show loading indicator
          btn.disabled = true;
          btn.textContent = '⌛';
          
          convertImageFormat(imgSrc, selectedFormat, (convertedImageUrl) => {
            if (convertedImageUrl) {
              // Change extension based on format
              const newFilename = filename.replace(/\.[^.]+$/, `.${selectedFormat}`);
              downloadImage(convertedImageUrl, newFilename);
            }
            
            // Restore button
            btn.disabled = false;
            btn.textContent = '⬇️';
          });
        }
      });
    };
  });
  
  // Create modal with Niblie branding
  let previewModal = document.getElementById('global-image_preview-modal');
  if (!previewModal) {
    previewModal = document.createElement('div');
    previewModal.id = 'global-image-preview-modal';
    previewModal.className = 'global-preview-modal';
    previewModal.innerHTML = `
      <div class="niblie-modal-header">
        <div class="niblie-logo">
          <span class="niblie-logo-icon">🔍</span>
          <span>Niblie</span>
        </div>
        <div class="niblie-modal-actions">
          <button class="dismiss-btn" title="Close (Esc)">✕</button>
        </div>
      </div>
      <div class="image-preview-container">
        <div class="preview-loading">
          <div class="loading-spinner"></div>
          Loading image...
        </div>
        <img src="" alt="" />
        <div class="preview-controls">
          <button class="zoom-in-btn" title="Zoom In">🔍+</button>
          <button class="zoom-out-btn" title="Zoom Out">🔍−</button>
          <button class="reset-zoom-btn" title="Reset">↻</button>
          <button class="download-preview-btn" title="Download">⬇️</button>
        </div>
        <div class="preview-details">
          <span class="preview-dimensions"></span>
          <span class="preview-filename"></span>
        </div>
      </div>
    `;
    document.body.appendChild(previewModal);
    
    // Close button functionality
    previewModal.querySelector('.dismiss-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      previewModal.classList.remove('active');
    });
    
    // Close on click outside the container
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.classList.remove('active');
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && previewModal.classList.contains('active')) {
        previewModal.classList.remove('active');
      }
    });
    
    // Zoom functionality
    let currentZoom = 1;
    const modalImg = previewModal.querySelector('img');
    
    previewModal.querySelector('.zoom-in-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentZoom < 3) {
        currentZoom += 0.25;
        modalImg.style.transform = `scale(${currentZoom})`;
      }
    });
    
    previewModal.querySelector('.zoom-out-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentZoom > 0.5) {
        currentZoom -= 0.25;
        modalImg.style.transform = `scale(${currentZoom})`;
      }
    });
    
    previewModal.querySelector('.reset-zoom-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      currentZoom = 1;
      modalImg.style.transform = 'scale(1)';
    });
    
    previewModal.querySelector('.download-preview-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const imgSrc = modalImg.src;
      const filename = previewModal.querySelector('.preview-filename').textContent || 'niblie-image';
      
      // Use downloadImage function from utils
      import('./utils.js').then(module => {
        const { downloadImage } = module;
        downloadImage(imgSrc, filename);
      });
    });
    
    // Loading indicator handling
    modalImg.onload = () => {
      previewModal.querySelector('.preview-loading').style.display = 'none';
    };
    
    modalImg.onerror = () => {
      previewModal.querySelector('.preview-loading').innerHTML = 'Error loading image';
    };
  }
  
  // Image containers - click to show preview in global modal
  document.querySelectorAll('.image-container').forEach(container => {
    container.classList.remove('hover-trigger');
    container.classList.add('click-trigger');
    
    container.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the parent item
      const item = container.closest('.image-item');
      if (!item) return;
      
      const imgSrc = item.getAttribute('data-src');
      const dimensions = container.querySelector('.image-dimensions') ? 
                       container.querySelector('.image-dimensions').textContent : 
                       item.querySelector('.image-dimensions').textContent;
      const filename = item.getAttribute('data-filename') || 'image';
      
      // Update the global modal with this image's data
      const modalImg = previewModal.querySelector('img');
      modalImg.src = '';  // Clear existing image to prevent flickering
      
      // Use a timeout to ensure smooth transition
      setTimeout(() => {
        modalImg.src = imgSrc;
        previewModal.querySelector('.preview-dimensions').textContent = dimensions;
        previewModal.querySelector('.preview-filename').textContent = 
          filename.split('.').pop().toUpperCase();
        previewModal.classList.add('active');
      }, 10);
    };
  });
  
  // Image info buttons
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const detailsId = btn.getAttribute('data-img-id');
      const detailsEl = document.getElementById(detailsId);
      if (detailsEl) {
        detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
      }
    };
  });
}

/**
 * Get a filename from an image URL
 */
export function getFilenameFromUrl(url, category, index) {
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


processSvgImages(); // Make sure SVGs are processed correctly

// Update the createImageElement function to remove images that fail to load

function createImageElement(imageData, container) {
  const imageItem = document.createElement('div');
  imageItem.className = `image-item ${imageData.type}`;
  
  const imageContainer = document.createElement('div');
  imageContainer.className = 'image-container hover-trigger';
  
  const img = document.createElement('img');
  
  // Add loading placeholder
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'image-loading-indicator';
  loadingIndicator.innerHTML = 'Loading...';
  imageContainer.appendChild(loadingIndicator);
  
  // Set up error handling to REMOVE failed images entirely
  img.onerror = function() {
    // If the image fails to load, completely remove it from DOM
    if (imageItem.parentNode) {
      imageItem.parentNode.removeChild(imageItem);
      
      // If this was the last image in a category, check if we need to remove the category
      const grid = container.querySelector('.image-grid');
      if (grid && grid.children.length === 0) {
        // Find and remove the empty category heading and grid
        const heading = grid.previousElementSibling;
        if (heading && heading.tagName === 'H4') {
          heading.parentNode.removeChild(heading);
        }
        grid.parentNode.removeChild(grid);
        
        // Check if there are any images left
        const remainingGrids = container.querySelectorAll('.image-grid');
        if (remainingGrids.length === 0) {
          container.innerHTML = '<div class="no-images">No valid images found on this page.</div>';
        }
      }
    }
  };
  
  // Success handling
  img.onload = function() {
    // Remove loading indicator
    if (loadingIndicator.parentNode) {
      loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
    
    // Update dimensions with actual loaded size
    img.dataset.actualWidth = img.naturalWidth;
    img.dataset.actualHeight = img.naturalHeight;
    
    // Update dimension display
    const dimensionElement = imageItem.querySelector('.image-dimensions');
    if (dimensionElement) {
      dimensionElement.textContent = `${img.naturalWidth || 0} × ${img.naturalHeight || 0}px`;
    }
  };
  
  // Set image source
  if (imageData.type === 'svg') {
    img.src = imageData.src;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
  } else {
    img.src = imageData.src;
  }
  
  imageContainer.appendChild(img);
  imageItem.appendChild(imageContainer);
  
  // Create image info section
  const imageInfo = document.createElement('div');
  imageInfo.className = 'image-info';
  
  // Add dimensions
  const dimensionsDiv = document.createElement('div');
  dimensionsDiv.className = 'image-dimensions';
  dimensionsDiv.textContent = `${imageData.width || 0} × ${imageData.height || 0}px`;
  imageInfo.appendChild(dimensionsDiv);
  
  // Add actions
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'image-actions';
  
  // Create download section
  const downloadContainer = document.createElement('div');
  downloadContainer.className = 'download-format-container';
  
  // Add download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'download-btn';
  downloadBtn.textContent = '⬇️';
  downloadBtn.setAttribute('data-src', imageData.src);
  downloadBtn.setAttribute('data-filename', getFilenameFromUrl(imageData.src, imageData.type, Math.floor(Math.random() * 1000)));
  downloadContainer.appendChild(downloadBtn);
  
  // Add format selector
  const formatSelect = document.createElement('select');
  formatSelect.className = 'format-select';
  formatSelect.setAttribute('aria-label', 'Select format');
  
  // Add format options
  const formats = ['original', 'png', 'jpg', 'webp'];
  formats.forEach(format => {
    const option = document.createElement('option');
    option.value = format;
    option.textContent = format.toUpperCase();
    formatSelect.appendChild(option);
  });
  
  downloadContainer.appendChild(formatSelect);
  actionsDiv.appendChild(downloadContainer);
  
  // Add info button
  const infoBtn = document.createElement('button');
  infoBtn.className = 'info-btn';
  infoBtn.textContent = 'ℹ️';
  const infoId = `img-${imageData.type}-${Math.random().toString(36).substr(2, 9)}`;
  infoBtn.setAttribute('data-img-id', infoId);
  actionsDiv.appendChild(infoBtn);
  
  imageInfo.appendChild(actionsDiv);
  imageItem.appendChild(imageInfo);
  
  // Add details section (hidden by default)
  const detailsSection = document.createElement('div');
  detailsSection.id = infoId;
  detailsSection.className = 'image-details';
  detailsSection.style.display = 'none';
  
  const typeDetail = document.createElement('div');
  typeDetail.innerHTML = `<strong>Type:</strong> ${imageData.type}`;
  detailsSection.appendChild(typeDetail);
  
  const urlDetail = document.createElement('div');
  const truncatedUrl = imageData.src.length > 50 
    ? imageData.src.substring(0, 47) + '...' 
    : imageData.src;
  urlDetail.innerHTML = `<strong>URL:</strong> <span class="img-url">${truncatedUrl}</span>`;
  detailsSection.appendChild(urlDetail);
  
  if (imageData.naturalWidth) {
    const naturalDetail = document.createElement('div');
    naturalDetail.innerHTML = `<strong>Natural:</strong> ${imageData.naturalWidth}×${imageData.naturalHeight}px`;
    detailsSection.appendChild(naturalDetail);
  }
  
  if (imageData.alt) {
    const altDetail = document.createElement('div');
    altDetail.innerHTML = `<strong>Alt Text:</strong> ${imageData.alt}`;
    detailsSection.appendChild(altDetail);
  }
  
  imageItem.appendChild(detailsSection);
  
  return imageItem;
}

// Enhanced SVG detection and handling

function processSvgImages() {
  try {
    // Track SVGs already processed
    const processedSvgElements = new Set();
    
    // Find all SVG elements on the page
    document.querySelectorAll('svg').forEach((svg, index) => {
      try {
        // Skip if already processed
        if (processedSvgElements.has(svg)) return;
        processedSvgElements.add(svg);
        
        // Skip very tiny SVGs likely to be icons
        const svgWidth = svg.width?.baseVal?.value || svg.viewBox?.baseVal?.width || svg.clientWidth || 0;
        const svgHeight = svg.height?.baseVal?.value || svg.viewBox?.baseVal?.height || svg.clientHeight || 0;
        
        // Skip icons and tiny decorative SVGs unless they have important content
        const hasImportantContent = svg.querySelector('image, pattern[href], use[href]');
        if ((svgWidth <= 16 && svgHeight <= 16) && !hasImportantContent) {
          return;
        }
        
        // First try to get SVG as an image element (if it contains external images)
        const svgImages = svg.querySelectorAll('image');
        if (svgImages.length > 0) {
          svgImages.forEach(image => {
            const href = image.getAttribute('href') || image.getAttribute('xlink:href');
            if (href) {
              addImageIfUnique(images.svg, {
                src: href,
                width: parseFloat(image.getAttribute('width')) || svgWidth || 0,
                height: parseFloat(image.getAttribute('height')) || svgHeight || 0,
                type: 'svg-image',
                index: index
              });
            }
          });
        }
        
        // Now capture the SVG itself properly
        try {
          // Clone the SVG to manipulate it safely
          const svgClone = svg.cloneNode(true);
          
          // Add width and height if not present
          if (!svgClone.hasAttribute('width') && svgWidth) {
            svgClone.setAttribute('width', svgWidth);
          }
          if (!svgClone.hasAttribute('height') && svgHeight) {
            svgClone.setAttribute('height', svgHeight);
          }
          
          // Make sure viewBox is set for proper scaling
          if (!svgClone.hasAttribute('viewBox') && svgWidth && svgHeight) {
            svgClone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
          }
          
          // Add preserveAspectRatio for better display
          if (!svgClone.hasAttribute('preserveAspectRatio')) {
            svgClone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          }
          
          // Serialize to string with proper XML declaration
          const serializer = new XMLSerializer();
          let svgString = serializer.serializeToString(svgClone);
          
          // Ensure SVG has xmlns attribute
          if (!svgString.includes('xmlns=')) {
            svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          }
          
          // Create a properly formatted SVG data URL
          const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
          
          // Add to collection
          addImageIfUnique(images.svg, {
            src: svgData,
            originalElement: svg,
            width: svgWidth || 0,
            height: svgHeight || 0,
            type: 'svg',
            index: index
          });
        } catch (svgError) {
          console.log('Error converting SVG:', svgError);
        }
      } catch (e) {
        // Skip problematic SVGs
      }
    });
    
    // Also look for SVGs in object/embed tags
    document.querySelectorAll('object[type="image/svg+xml"], embed[type="image/svg+xml"]').forEach((obj, index) => {
      try {
        const svgSrc = obj.data || obj.src;
        if (svgSrc) {
          addImageIfUnique(images.svg, {
            src: svgSrc,
            width: obj.width || obj.clientWidth || 0,
            height: obj.height || obj.clientHeight || 0,
            type: 'svg-object',
            index: index
          });
        }
      } catch (e) {
        // Skip problematic objects
      }
    });
  } catch (err) {
    console.error('Error processing SVGs:', err);
  }
}

// Update the preview image modal click handler

function setupImagePreview(imageItem, imageData) {
  const imageContainer = imageItem.querySelector('.image-container');
  if (!imageContainer) return;
  
  imageContainer.addEventListener('click', () => {
    const previewModal = document.getElementById('global-image-preview-modal');
    if (!previewModal) return;
    
    const previewImg = previewModal.querySelector('img');
    const loadingIndicator = previewModal.querySelector('.preview-loading');
    
    // Reset zoom
    const resetZoom = previewModal.querySelector('.reset-zoom-btn');
    if (resetZoom) resetZoom.click();
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    loadingIndicator.textContent = 'Loading image...';
    previewImg.style.display = 'none';
    
    // Special handling for SVGs
    if (imageData.type === 'svg' || imageData.src.includes('svg+xml')) {
      previewImg.style.background = 'white'; // Add white background for better visibility
      previewModal.classList.add('svg-preview');
    } else {
      previewImg.style.background = 'none';
      previewModal.classList.remove('svg-preview');
    }
    
    // Update image source
    previewImg.src = imageData.src;
    
    // Update details
    const dimensionsSpan = previewModal.querySelector('.preview-dimensions');
    if (dimensionsSpan) {
      dimensionsSpan.textContent = `${imageData.width || 0} × ${imageData.height || 0}px`;
    }
    
    const filenameSpan = previewModal.querySelector('.preview-filename');
    if (filenameSpan) {
      // Extract filename from URL
      let filename = imageData.src.split('/').pop().split('?')[0];
      if (filename.length > 30) {
        filename = filename.substring(0, 27) + '...';
      }
      filenameSpan.textContent = filename;
    }
    
    const typeSpan = previewModal.querySelector('.preview-type');
    if (typeSpan) {
      let typeText = imageData.type || 'image';
      
      // Add duplicate info if available
      if (imageData.occurrenceCount > 1 || imageData.duplicateCount) {
        const count = imageData.duplicateCount || imageData.occurrenceCount;
        typeText += ` (${count} occurrences found)`;
      }
      
      typeSpan.textContent = typeText;
    }
    
    // Show the modal
    previewModal.classList.add('active');
  });
}

// Update the displayImages function to show duplicate info

function displayImages(images, container) {
  try {
    if (!container) return;
    
    container.innerHTML = '';
    
    // Count total images
    let totalImages = 0;
    Object.keys(images).forEach(category => {
      totalImages += images[category].length;
    });
    
    if (totalImages === 0) {
      container.innerHTML = '<div class="no-images">No images found on this page.</div>';
      return;
    }
    
    // Add a placeholder message that will show if all images fail to load
    const noImagesPlaceholder = document.createElement('div');
    noImagesPlaceholder.className = 'no-images hidden';
    noImagesPlaceholder.textContent = 'No valid images found on this page.';
    noImagesPlaceholder.style.display = 'none';
    container.appendChild(noImagesPlaceholder);
    
    // Track how many images we're trying to load
    let imagesAttempted = 0;
    let imagesSuccessful = 0;
    
    // Display each image category
    Object.keys(images).forEach(category => {
      if (images[category].length === 0) return;
      
      // Create category section
      const categoryTitle = document.createElement('h4');
      
      // Format category name nicely
      let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      categoryName = categoryName.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
      
      // Add count
      categoryTitle.textContent = `${categoryName} Images (${images[category].length})`;
      categoryTitle.dataset.category = category;
      categoryTitle.dataset.originalCount = images[category].length;
      categoryTitle.dataset.currentCount = images[category].length;
      
      container.appendChild(categoryTitle);
      
      // Create image grid
      const imageGrid = document.createElement('div');
      imageGrid.className = 'image-grid';
      imageGrid.dataset.category = category;
      
      // Add images to grid
      images[category].forEach(imageData => {
        imagesAttempted++;
        
        // Create image item
        const imageItem = createImageElement(imageData, container);
        
        // Add load tracking
        const img = imageItem.querySelector('img');
        if (img) {
          // On successful load, increment counter
          img.addEventListener('load', () => {
            imagesSuccessful++;
            
            // Update category count
            const heading = container.querySelector(`h4[data-category="${category}"]`);
            if (heading) {
              const currentCount = parseInt(heading.dataset.currentCount) || 0;
              heading.dataset.currentCount = currentCount;
              heading.textContent = `${categoryName} Images (${heading.dataset.currentCount})`;
            }
          });
        }
        
        // Add to grid
        imageGrid.appendChild(imageItem);
        
        // Setup preview
        setupImagePreview(imageItem, imageData);
      });
      
      container.appendChild(imageGrid);
    });
    
    // After a timeout, check if all images failed to load
    setTimeout(() => {
      const remainingImages = container.querySelectorAll('.image-item');
      if (remainingImages.length === 0) {
        // All images failed, show the no images message
        noImagesPlaceholder.style.display = 'block';
        
        // Remove any empty category headings
        container.querySelectorAll('h4').forEach(heading => {
          heading.parentNode.removeChild(heading);
        });
      }
    }, 5000); // Give images 5 seconds to load
    
  } catch (err) {
    console.error('Error displaying images:', err);
    container.innerHTML = '<div class="error-message">Error displaying images.</div>';
  }
}