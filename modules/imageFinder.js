/**
 * Image finder module for finding all images on a webpage
 */

const ImageFinder = {
  // Cache for image data to avoid rescanning
  imageCache: null,
  
  /**
   * Find all images on the current page
   * @param {boolean} forceRefresh - Whether to force refresh the cache
   * @returns {Promise<Object>} Object containing categorized images
   */
  findImages: function(forceRefresh = false) {
    // Use cached results if available and not forcing refresh
    if (this.imageCache && !forceRefresh) {
      return Promise.resolve(this.imageCache);
    }
    
    return new Promise((resolve) => {
      console.log('ImageFinder: Scanning page for images...');
      
      // Create result object with image categories
      const result = {
        regularImages: [],    // <img> tags
        backgroundImages: [], // CSS background images
        svgImages: [],        // Inline and referenced SVGs
        canvasImages: [],     // Canvas elements
        mediaImages: []       // Picture elements and video posters
      };
      
      // Start timing for performance tracking
      const startTime = performance.now();
      
      // Use requestIdleCallback for better performance (non-blocking)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this._scanImagesOptimized(result, startTime, resolve);
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        this._scanImagesOptimized(result, startTime, resolve);
      }
    });
  },
  
  /**
   * Optimized image scanning with batching
   * @param {Object} result - Result object
   * @param {number} startTime - Start time
   * @param {Function} resolve - Promise resolve function
   * @private
   */
  _scanImagesOptimized: function(result, startTime, resolve) {
    // Batch scanning for better performance
    const tasks = [
      () => this._findRegularImages(result.regularImages),
      () => this._findBackgroundImages(result.backgroundImages),
      () => this._findSvgImages(result.svgImages),
      () => this._findCanvasImages(result.canvasImages),
      () => this._findMediaImages(result.mediaImages)
    ];
    
    // Execute tasks sequentially but with micro-delays to prevent blocking
    let currentTask = 0;
    const executeTasks = () => {
      if (currentTask < tasks.length) {
        tasks[currentTask]();
        currentTask++;
        
        // Use setTimeout with 0 delay to yield to browser between tasks
        setTimeout(executeTasks, 0);
      } else {
        // All tasks completed
        const endTime = performance.now();
        console.log(`ImageFinder: Found ${this._countTotalImages(result)} images in ${Math.round(endTime - startTime)}ms`);
        
        // Cache the results
        this.imageCache = result;
        
        // Return the results
        resolve(result);
      }
    };
    
    executeTasks();
  },
  
  /**
   * Find all regular <img> tags
   * @param {Array} targetArray - Array to store found images
   * @private
   */
  _findRegularImages: function(targetArray) {
    const images = document.querySelectorAll('img');
    
    images.forEach((img) => {
      // Skip tiny, hidden, or data URI images if they're likely UI elements
      if (this._shouldSkipImage(img)) return;
      
      // Get image dimensions
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      
      // Extract image data
      const imageData = {
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        width: width,
        height: height,
        type: this._getImageTypeFromUrl(img.src),
        element: img,
        isVisible: this._isElementVisible(img),
        aspectRatio: width && height ? (width / height).toFixed(2) : 'unknown',
        fileSize: 'Unknown', // We'll fetch this asynchronously later
        supportsAlpha: this._doesFormatSupportAlpha(this._getImageTypeFromUrl(img.src))
      };
      
      targetArray.push(imageData);
    });
    
    // Fetch file sizes asynchronously
    this._fetchFileSizes(targetArray);
  },
  
  /**
   * Find all background images in CSS
   * @param {Array} targetArray - Array to store found images
   * @private
   */
  _findBackgroundImages: function(targetArray) {
    const allElements = document.querySelectorAll('*');
    const processedUrls = new Set(); // To prevent duplicates
    
    allElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = computedStyle.backgroundImage;
      
      // Skip if no background image or it's 'none'
      if (!backgroundImage || backgroundImage === 'none') return;
      
      // Extract URLs from background-image
      const urls = this._extractUrlsFromCssValue(backgroundImage);
      
      urls.forEach(url => {
        // Skip if already processed or data URI that's too small
        if (processedUrls.has(url) || (url.startsWith('data:') && url.length < 300)) return;
        processedUrls.add(url);
        
        const imageData = {
          src: url,
          alt: 'Background image',
          width: 'unknown',
          height: 'unknown',
          type: this._getImageTypeFromUrl(url),
          element: element,
          isVisible: this._isElementVisible(element),
          aspectRatio: 'unknown',
          fileSize: 'Unknown',
          supportsAlpha: this._doesFormatSupportAlpha(this._getImageTypeFromUrl(url)),
          isBackground: true
        };
        
        targetArray.push(imageData);
      });
    });
    
    // Fetch file sizes asynchronously
    this._fetchFileSizes(targetArray);
  },
  
  /**
   * Find all SVG images (inline and referenced)
   * @param {Array} targetArray - Array to store found images
   * @private
   */
  _findSvgImages: function(targetArray) {
    // Find inline SVGs
    const svgElements = document.querySelectorAll('svg');
    
    svgElements.forEach(svg => {
      // Skip tiny or hidden SVGs
      if (this._shouldSkipElement(svg)) return;
      
      // Get SVG dimensions
      const width = svg.width?.baseVal?.value || svg.viewBox?.baseVal?.width || 0;
      const height = svg.height?.baseVal?.value || svg.viewBox?.baseVal?.height || 0;
      
      const imageData = {
        isSvg: true,
        element: svg,
        alt: svg.getAttribute('aria-label') || 'SVG graphic',
        width: width,
        height: height,
        aspectRatio: width && height ? (width / height).toFixed(2) : 'unknown',
        isVisible: this._isElementVisible(svg),
        supportsAlpha: true,
        svgContent: svg.outerHTML,
        fileSize: `~${Math.round(svg.outerHTML.length / 1024)} KB (estimate)`
      };
      
      targetArray.push(imageData);
    });
    
    // Find referenced SVGs
    const referencedSvgs = document.querySelectorAll('img[src$=".svg"], object[type="image/svg+xml"]');
    
    referencedSvgs.forEach(elem => {
      if (this._shouldSkipImage(elem)) return;
      
      const src = elem.src || elem.data || '';
      
      const imageData = {
        src: src,
        alt: elem.alt || 'SVG graphic',
        width: elem.width || 0,
        height: elem.height || 0,
        type: 'svg',
        element: elem,
        isSvg: true,
        isVisible: this._isElementVisible(elem),
        aspectRatio: elem.width && elem.height ? (elem.width / elem.height).toFixed(2) : 'unknown',
        fileSize: 'Unknown',
        supportsAlpha: true
      };
      
      targetArray.push(imageData);
    });
    
    // Fetch file sizes for referenced SVGs
    this._fetchFileSizes(targetArray.filter(img => img.src));
  },
  
  /**
   * Find canvas elements that might contain images
   * @param {Array} targetArray - Array to store found images
   * @private
   */
  _findCanvasImages: function(targetArray) {
    const canvasElements = document.querySelectorAll('canvas');
    
    canvasElements.forEach(canvas => {
      // Skip small, hidden, or empty canvases
      if (canvas.width < 50 || canvas.height < 50 || !this._isElementVisible(canvas)) return;
      
      try {
        const imageData = {
          isCanvas: true,
          element: canvas,
          alt: 'Canvas content',
          width: canvas.width,
          height: canvas.height,
          aspectRatio: canvas.width && canvas.height ? (canvas.width / canvas.height).toFixed(2) : 'unknown',
          isVisible: this._isElementVisible(canvas),
          dataUrl: canvas.toDataURL('image/png'),
          supportsAlpha: true,
          fileSize: 'Generated on download'
        };
        
        targetArray.push(imageData);
      } catch (err) {
        // Skip canvases we can't access due to CORS or other security issues
        console.warn('ImageFinder: Could not access canvas data', err);
      }
    });
  },
  
  /**
   * Find picture elements and video posters
   * @param {Array} targetArray - Array to store found images
   * @private
   */
  _findMediaImages: function(targetArray) {
    // Picture elements
    const pictureElements = document.querySelectorAll('picture');
    
    pictureElements.forEach(picture => {
      const img = picture.querySelector('img');
      const sources = Array.from(picture.querySelectorAll('source'));
      
      if (img && !this._shouldSkipImage(img)) {
        const imageData = {
          src: img.currentSrc || img.src,
          alt: img.alt || 'Picture element',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          type: this._getImageTypeFromUrl(img.currentSrc || img.src),
          element: img,
          isPicture: true,
          isVisible: this._isElementVisible(img),
          aspectRatio: (img.naturalWidth && img.naturalHeight) ? 
                      (img.naturalWidth / img.naturalHeight).toFixed(2) : 'unknown',
          fileSize: 'Unknown',
          supportsAlpha: this._doesFormatSupportAlpha(this._getImageTypeFromUrl(img.currentSrc || img.src)),
          sources: sources.map(source => ({
            srcset: source.srcset,
            type: source.type,
            media: source.media
          }))
        };
        
        targetArray.push(imageData);
      }
    });
    
    // Video posters
    const videoElements = document.querySelectorAll('video[poster]');
    
    videoElements.forEach(video => {
      const posterUrl = video.poster;
      if (!posterUrl) return;
      
      const imageData = {
        src: posterUrl,
        alt: 'Video poster',
        width: video.videoWidth || video.clientWidth || 0,
        height: video.videoHeight || video.clientHeight || 0,
        type: this._getImageTypeFromUrl(posterUrl),
        element: video,
        isVideoPoster: true,
        isVisible: this._isElementVisible(video),
        aspectRatio: (video.videoWidth && video.videoHeight) ? 
                    (video.videoWidth / video.videoHeight).toFixed(2) : 'unknown',
        fileSize: 'Unknown',
        supportsAlpha: this._doesFormatSupportAlpha(this._getImageTypeFromUrl(posterUrl))
      };
      
      targetArray.push(imageData);
    });
    
    // Fetch file sizes asynchronously
    const itemsWithSrc = targetArray.filter(img => img.src);
    this._fetchFileSizes(itemsWithSrc);
  },
  
  /**
   * Extract URLs from CSS background-image value
   * @param {string} cssValue - CSS background-image value
   * @returns {Array} Array of extracted URLs
   * @private
   */
  _extractUrlsFromCssValue: function(cssValue) {
    const urls = [];
    const regex = /url\(['"]?([^'"()]+)['"]?\)/g;
    let match;
    
    while ((match = regex.exec(cssValue)) !== null) {
      urls.push(match[1]);
    }
    
    return urls;
  },
  
  /**
   * Determine if an image should be skipped (too small, hidden, etc.)
   * @param {HTMLElement} img - Image element to check
   * @returns {boolean} Whether to skip this image
   * @private
   */
  _shouldSkipImage: function(img) {
    // Skip very small images that are likely UI elements
    if ((img.width > 0 && img.width < 20) || (img.height > 0 && img.height < 20)) return true;
    
    // Skip hidden images
    if (!this._isElementVisible(img)) return true;
    
    // Skip data URLs that are very small (likely placeholders or tracking pixels)
    if (img.src && img.src.startsWith('data:') && img.src.length < 300) return true;
    
    return false;
  },
  
  /**
   * Determine if an element should be skipped
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether to skip this element
   * @private
   */
  _shouldSkipElement: function(element) {
    // Skip small elements
    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return true;
    
    // Skip hidden elements
    if (!this._isElementVisible(element)) return true;
    
    return false;
  },
  
  /**
   * Check if an element is visible (not hidden by CSS)
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether the element is visible
   * @private
   */
  _isElementVisible: function(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  },
  
  /**
   * Get image type from URL or src
   * @param {string} url - Image URL
   * @returns {string} Image type (extension)
   * @private
   */
  _getImageTypeFromUrl: function(url) {
    if (!url) return 'unknown';
    
    if (url.startsWith('data:')) {
      const match = url.match(/data:image\/([a-zA-Z0-9-+.]+);/);
      return match ? match[1] : 'unknown';
    }
    
    const extension = url.split('?')[0].split('#')[0].split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(extension)) {
      return extension === 'jpeg' ? 'jpg' : extension;
    }
    
    return 'unknown';
  },
  
  /**
   * Check if image format supports alpha transparency
   * @param {string} type - Image type
   * @returns {boolean} Whether format supports alpha
   * @private
   */
  _doesFormatSupportAlpha: function(type) {
    return ['png', 'webp', 'svg', 'gif', 'avif', 'ico'].includes(type);
  },
  
  /**
   * Fetch file sizes for images asynchronously
   * @param {Array} images - Array of image objects with src
   * @private
   */
  _fetchFileSizes: function(images) {
    images.forEach(async (img) => {
      if (!img.src || img.src.startsWith('data:')) return;
      
      try {
        const response = await fetch(img.src, { method: 'HEAD' });
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            const sizeInKB = Math.round(parseInt(contentLength) / 1024);
            img.fileSize = sizeInKB < 1024 ? `${sizeInKB} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`;
          }
        }
      } catch (error) {
        console.warn(`ImageFinder: Could not fetch size for ${img.src}`);
        // Keep the default "Unknown" value
      }
    });
  },
  
  /**
   * Count total images across all categories
   * @param {Object} imageData - Object with image categories
   * @returns {number} Total image count
   * @private
   */
  _countTotalImages: function(imageData) {
    return Object.values(imageData).reduce((total, category) => total + category.length, 0);
  },
  
  /**
   * Clear the image cache
   */
  clearCache: function() {
    this.imageCache = null;
  },
  
  /**
   * Generate a downloadable image in the specified format
   * @param {Object} imageData - Image data object
   * @param {string} format - Target format (png, jpg, webp, etc.)
   * @returns {Promise<string>} Data URL for the converted image
   */
  convertImageFormat: function(imageData, format) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Handle different image types
      if (imageData.isSvg) {
        if (imageData.svgContent) {
          // For inline SVGs, use content directly
          this._convertSvgToFormat(imageData.svgContent, format, resolve, reject);
          return;
        } else if (imageData.src) {
          // For referenced SVGs, fetch first
          fetch(imageData.src)
            .then(response => response.text())
            .then(svgText => {
              this._convertSvgToFormat(svgText, format, resolve, reject);
            })
            .catch(reject);
          return;
        }
      } else if (imageData.isCanvas) {
        // For canvas elements, use their data directly
        if (format === 'png') {
          resolve(imageData.dataUrl);
          return;
        }
        
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.drawImage(imageData.element, 0, 0);
      } else {
        // For regular images, create img element and draw to canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          ctx.drawImage(img, 0, 0);
          
          let mimeType;
          let quality = 0.92;
          
          switch (format) {
            case 'jpg':
            case 'jpeg':
              mimeType = 'image/jpeg';
              // Draw white background to handle transparency
              if (imageData.supportsAlpha) {
                const prevStyle = ctx.fillStyle;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = prevStyle;
              }
              break;
            case 'webp':
              mimeType = 'image/webp';
              quality = 0.85; // WebP allows higher compression with good results
              break;
            case 'png':
            default:
              mimeType = 'image/png';
              break;
          }
          
          try {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve(dataUrl);
          } catch (err) {
            reject(new Error('Failed to convert image: ' + err.message));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for conversion'));
        };
        
        // Set src after setting handlers
        if (imageData.dataUrl) {
          img.src = imageData.dataUrl;
        } else {
          img.src = imageData.src;
        }
        return;
      }
      
      // Default fallback
      reject(new Error('Unsupported image type for conversion'));
    });
  },
  
  /**
   * Convert SVG to the specified format
   * @param {string} svgText - SVG content as text
   * @param {string} format - Target format
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @private
   */
  _convertSvgToFormat: function(svgText, format, resolve, reject) {
    // If we want SVG, just return it
    if (format === 'svg') {
      const blob = new Blob([svgText], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      resolve(url);
      return;
    }
    
    // Otherwise convert to raster
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Extract SVG dimensions if possible
    let width = 800;
    let height = 600;
    
    const dimensionMatch = svgText.match(/width="([^"]+)".*height="([^"]+)"/);
    if (dimensionMatch) {
      width = parseInt(dimensionMatch[1]) || width;
      height = parseInt(dimensionMatch[2]) || height;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      
      let mimeType;
      let quality = 0.92;
      
      switch (format) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          // Draw white background for JPEGs
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        case 'webp':
          mimeType = 'image/webp';
          quality = 0.85;
          break;
        case 'png':
        default:
          mimeType = 'image/png';
          break;
      }
      
      try {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      } catch (err) {
        reject(new Error('Failed to convert SVG: ' + err.message));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load SVG for conversion'));
    };
    
    // Create a data URL from the SVG
    const svgBlob = new Blob([svgText], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  },
  
  /**
   * Download an image with the specified filename and format
   * @param {Object} imageData - Image data object
   * @param {string} format - Target format
   * @param {string} filename - Filename without extension
   */
  downloadImage: function(imageData, format, filename) {
    this.convertImageFormat(imageData, format)
      .then(dataUrl => {
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          if (dataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(dataUrl); // Clean up blob URLs
          }
        }, 100);
      })
      .catch(error => {
        console.error('ImageFinder: Download failed', error);
        alert('Failed to download image: ' + error.message);
      });
  }
};

/**
 * UI for displaying and interacting with images in the modal
 */
const ImageUI = {
  /**
   * Creates image section content for the modal
   * @param {boolean} forceRefresh - Whether to force refresh image data
   * @returns {HTMLElement} Container element with loading state
   */
  createImagesContent: function(forceRefresh = false) {
    // Create container for images content
    const imagesContainer = document.createElement('div');
    imagesContainer.id = 'niblie-images-content';
    imagesContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    
    // Add loading indicator
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'niblie-loading';
    loadingSpinner.innerHTML = `
      <div class="niblie-spinner"></div>
      <p>Finding images on the page...</p>
    `;
    loadingSpinner.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    `;
    
    const spinner = loadingSpinner.querySelector('.niblie-spinner');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid rgba(66, 133, 244, 0.2);
      border-radius: 50%;
      border-top-color: #4285f4;
      animation: niblie-spin 1s linear infinite;
      margin-bottom: 15px;
    `;
    
    imagesContainer.appendChild(loadingSpinner);
    
    // Load images async
    ImageFinder.findImages(forceRefresh).then(imageData => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';
      
      // Process and display image data
      this._processImageData(imagesContainer, imageData);
    }).catch(error => {
      console.error('Error finding images:', error);
      loadingSpinner.style.display = 'none';
      
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'niblie-error';
      errorMsg.textContent = 'An error occurred while finding images on the page.';
      errorMsg.style.cssText = `
        padding: 40px 0;
        text-align: center;
        color: #d93025;
      `;
      imagesContainer.appendChild(errorMsg);
    });
    
    return imagesContainer;
  },
  
  /**
   * Process image data and display in the container
   * @param {HTMLElement} container - Container element
   * @param {Object} imageData - Object containing image categories
   * @private
   */
  _processImageData: function(container, imageData) {
    // Check if we have any images
    const totalImages = Object.values(imageData).reduce((total, arr) => total + arr.length, 0);
    
    if (totalImages === 0) {
      const noImagesMsg = document.createElement('div');
      noImagesMsg.className = 'niblie-no-images';
      noImagesMsg.textContent = 'No images found on this page.';
      noImagesMsg.style.cssText = `
        padding: 40px 0;
        text-align: center;
        color: #5f6368;
        font-style: italic;
      `;
      container.appendChild(noImagesMsg);
      return;
    }
    
    // Create tabs for image categories
    const tabsContainer = this._createImageTabs(imageData);
    container.appendChild(tabsContainer);
    
    // Create content area for images
    const imagesGridContainer = document.createElement('div');
    imagesGridContainer.className = 'niblie-images-grid-container';
    container.appendChild(imagesGridContainer);
    
    // Show all images by default (we'll filter by active tab)
    this._showImageCategory(imagesGridContainer, 'all', imageData);
    
    // Set up image preview functionality
    this._setupImagePreview();
  },
  
  /**
   * Create tabs for image categories
   * @param {Object} imageData - Object containing image categories
   * @returns {HTMLElement} Tabs container
   * @private
   */
  _createImageTabs: function(imageData) {
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'niblie-image-tabs';
    tabsContainer.style.cssText = `
      display: flex;
      overflow-x: auto;
      scrollbar-width: thin;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e4e8ed;
      padding: 4px;
    `;
    
    // Create tab data with counts
    const tabs = [
      { id: 'all', label: `All Images (${ImageFinder._countTotalImages(imageData)})` },
      { id: 'regularImages', label: `Regular Images (${imageData.regularImages.length})` },
      { id: 'backgroundImages', label: `Background Images (${imageData.backgroundImages.length})` },
      { id: 'svgImages', label: `SVG Graphics (${imageData.svgImages.length})` },
      { id: 'canvasImages', label: `Canvas Content (${imageData.canvasImages.length})` },
      { id: 'mediaImages', label: `Media Images (${imageData.mediaImages.length})` }
    ];
    
    // Create tab elements
    tabs.forEach(tab => {
      const tabElement = document.createElement('button');
      tabElement.className = `niblie-tab ${tab.id === 'all' ? 'active' : ''}`;
      tabElement.dataset.category = tab.id;
      tabElement.textContent = tab.label;
      tabElement.style.cssText = `
        padding: 10px 16px;
        border: none;
        background-color: ${tab.id === 'all' ? '#e8f0fe' : 'transparent'};
        color: ${tab.id === 'all' ? '#1a73e8' : '#5f6368'};
        font-weight: ${tab.id === 'all' ? '500' : 'normal'};
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        margin: 0 2px;
        font-size: 14px;
      `;
      
      // Handle tab click
      tabElement.addEventListener('click', () => {
        // Update tab styles
        tabsContainer.querySelectorAll('.niblie-tab').forEach(t => {
          t.style.backgroundColor = 'transparent';
          t.style.color = '#5f6368';
          t.style.fontWeight = 'normal';
          t.classList.remove('active');
        });
        
        tabElement.style.backgroundColor = '#e8f0fe';
        tabElement.style.color = '#1a73e8';
        tabElement.style.fontWeight = '500';
        tabElement.classList.add('active');
        
        // Update displayed images
        const gridContainer = document.querySelector('.niblie-images-grid-container');
        if (gridContainer) {
          this._showImageCategory(gridContainer, tab.id, imageData);
        }
      });
      
      tabsContainer.appendChild(tabElement);
    });
    
    return tabsContainer;
  },
  
  /**
   * Show images from the specified category
   * @param {HTMLElement} container - Container element
   * @param {string} category - Category to show
   * @param {Object} imageData - Object containing image categories
   * @private
   */
  _showImageCategory: function(container, category, imageData) {
    // Clear container
    container.innerHTML = '';
    
    // Determine which images to show
    let imagesToShow = [];
    
    if (category === 'all') {
      // Combine all images
      Object.values(imageData).forEach(categoryImages => {
        imagesToShow = imagesToShow.concat(categoryImages);
      });
    } else if (imageData[category]) {
      imagesToShow = imageData[category];
    }
    
    if (imagesToShow.length === 0) {
      const noImagesMsg = document.createElement('div');
      noImagesMsg.className = 'niblie-no-category-images';
      noImagesMsg.textContent = `No images found in the ${this._formatCategoryName(category)} category.`;
      noImagesMsg.style.cssText = `
        padding: 40px 0;
        text-align: center;
        color: #5f6368;
        font-style: italic;
      `;
      container.appendChild(noImagesMsg);
      return;
    }
    
    // Create image grid
    const imageGrid = document.createElement('div');
    imageGrid.className = 'niblie-image-grid';
    imageGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      grid-gap: 16px;
      margin-top: 20px;
    `;
    
    // Add images to grid
    imagesToShow.forEach((image, index) => {
      const imageCard = this._createImageCard(image, index);
      imageGrid.appendChild(imageCard);
    });
    
    container.appendChild(imageGrid);
  },
  
  /**
   * Create a card for displaying an image
   * @param {Object} image - Image data object
   * @param {number} index - Image index
   * @returns {HTMLElement} Image card element
   * @private
   */
  _createImageCard: function(image, index) {
    const card = document.createElement('div');
    card.className = 'niblie-image-card';
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
    
    // Image preview container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'niblie-image-preview';
    imageContainer.style.cssText = `
      height: 160px;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      cursor: pointer;
    `;
    
    // Image or placeholder
    let imgElement;
    
    if (image.isSvg && image.svgContent) {
      // Display inline SVG directly
      imageContainer.innerHTML = image.svgContent;
      imgElement = imageContainer.querySelector('svg');
      if (imgElement) {
        imgElement.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        `;
      }
    } else {
      imgElement = document.createElement('img');
      imgElement.className = 'niblie-thumbnail';
      imgElement.alt = image.alt || 'Image';
      imgElement.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      `;
      
      // Set source based on image type
      if (image.dataUrl) {
        imgElement.src = image.dataUrl;
      } else if (image.isCanvas) {
        try {
          imgElement.src = image.element.toDataURL('image/png');
        } catch (e) {
          imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';
        }
      } else {
        imgElement.src = image.src || '';
      }
      
      // Handle load errors
      imgElement.onerror = () => {
        imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23d93025" d="M3.27,2L2,3.27L4.73,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16C16.2,18 16.39,17.92 16.54,17.82L19.73,21L21,19.73M21,5V15.27L18.73,13H20V5H6.27L8.27,7H15.73L13.73,5Z"/%3E%3C/svg%3E';
        imgElement.style.padding = '40px';
      };
      
      imageContainer.appendChild(imgElement);
    }
    
    // Add click event to open preview
    imageContainer.addEventListener('click', () => {
      const allImages = this._getAllVisibleImages();
      const currentIndex = allImages.findIndex(img => 
        (img.src && img.src === image.src) || 
        (img.svgContent && img.svgContent === image.svgContent) ||
        (img.dataUrl && img.dataUrl === image.dataUrl)
      );
      
      this.showImagePreview(image, currentIndex);
    });
    
    // Add information section
    const infoSection = document.createElement('div');
    infoSection.className = 'niblie-image-info';
    infoSection.style.cssText = `
      padding: 12px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    `;
    
    // Image dimensions
    const dimensions = document.createElement('div');
    dimensions.className = 'niblie-image-dimensions';
    dimensions.textContent = image.width !== 'unknown' && image.height !== 'unknown' 
      ? `${image.width} × ${image.height}` 
      : 'Dimensions unknown';
    dimensions.style.cssText = `
      font-size: 13px;
      color: #5f6368;
      margin-bottom: 4px;
    `;
    
    // Image type
    const typeInfo = document.createElement('div');
    typeInfo.className = 'niblie-image-type';
    typeInfo.textContent = image.type ? image.type.toUpperCase() : 'Unknown type';
    typeInfo.style.cssText = `
      font-size: 12px;
      color: #80868b;
    `;
    
    // Add download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'niblie-download-button';
    downloadButton.title = 'Download image';
    downloadButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
      </svg>
    `;
    downloadButton.style.cssText = `
      background-color: #f8f9fa;
      border: 1px solid #dadce0;
      border-radius: 4px;
      padding: 6px 8px;
      margin-top: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;
    
    downloadButton.addEventListener('mouseenter', () => {
      downloadButton.style.backgroundColor = '#f1f3f4';
    });
    
    downloadButton.addEventListener('mouseleave', () => {
      downloadButton.style.backgroundColor = '#f8f9fa';
    });
    
    downloadButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showDownloadOptions(image, downloadButton);
    });
    
    // Assemble the info section
    infoSection.appendChild(dimensions);
    infoSection.appendChild(typeInfo);
    infoSection.appendChild(downloadButton);
    
    // Assemble the card
    card.appendChild(imageContainer);
    card.appendChild(infoSection);
    
    return card;
  },
  
  /**
   * Show download options for an image
   * @param {Object} image - Image data object
   * @param {HTMLElement} button - Button that was clicked
   * @private
   */
  _showDownloadOptions: function(image, button) {
    // Create dropdown
    const dropdown = this._createFormatDropdown(image);
    
    // Position it near the button using fixed positioning relative to viewport
    const btnRect = button.getBoundingClientRect();
    
    dropdown.style.position = 'fixed';
    dropdown.style.left = `${btnRect.left}px`;
    dropdown.style.top = `${btnRect.bottom + 5}px`;
    dropdown.style.zIndex = '10001';
    
    // Ensure dropdown stays within viewport
    document.body.appendChild(dropdown);
    
    // Adjust position if dropdown goes off screen
    const dropdownRect = dropdown.getBoundingClientRect();
    if (dropdownRect.right > window.innerWidth) {
      dropdown.style.left = `${window.innerWidth - dropdownRect.width - 10}px`;
    }
    if (dropdownRect.bottom > window.innerHeight) {
      dropdown.style.top = `${btnRect.top - dropdownRect.height - 5}px`;
    }
    
    // Close dropdown when clicking elsewhere
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== button) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeDropdown);
    }, 10);
  },
  
  /**
   * Create format dropdown for image download
   * @param {Object} image - Image data object
   * @returns {HTMLElement} Dropdown element
   * @private
   */
  _createFormatDropdown: function(image) {
    const dropdown = document.createElement('div');
    dropdown.className = 'niblie-format-dropdown';
    dropdown.style.cssText = `
      background-color: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      padding: 8px;
      min-width: 150px;
    `;
    
    // Title
    const title = document.createElement('div');
    title.textContent = 'Download as:';
    title.style.cssText = `
      font-size: 13px;
      color: #5f6368;
      margin-bottom: 6px;
      padding: 4px 8px;
    `;
    dropdown.appendChild(title);
    
    // Format options
    const formats = ['png', 'jpg', 'webp'];
    
    // Add SVG option for SVG images
    if (image.isSvg) {
      formats.unshift('svg');
    }
    
    formats.forEach(format => {
      const option = document.createElement('button');
      option.className = 'niblie-format-option';
      option.textContent = format.toUpperCase();
      option.style.cssText = `
        display: block;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.15s;
        font-size: 14px;
      `;
      
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#f1f3f4';
      });
      
      option.addEventListener('mouseleave', () => {
        option.style.backgroundColor = '';
      });
      
      option.addEventListener('click', () => {
        const filename = this._generateFilename(image);
        ImageFinder.downloadImage(image, format, filename);
        dropdown.remove();
      });
      
      dropdown.appendChild(option);
    });
    
    return dropdown;
  },
  
  /**
   * Generate a filename for downloading
   * @param {Object} image - Image data object
   * @returns {string} Generated filename
   * @private
   */
  _generateFilename: function(image) {
    // Get page title or domain as base
    const pageTitle = document.title.replace(/[^\w\s-]/g, '').trim();
    const domain = window.location.hostname.replace('www.', '');
    const base = pageTitle || domain || 'image';
    
    // Add image type if available
    const type = image.type ? `-${image.type}` : '';
    
    // Add timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    return `${base}${type}-${timestamp}`;
  },
  
  /**
   * Setup image preview functionality
   * @private
   */
  _setupImagePreview: function() {
    // Create preview overlay if it doesn't exist
    let overlay = document.getElementById('niblie-image-preview-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'niblie-image-preview-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10000;
        flex-direction: column;
      `;
      
      // Create preview content container
      const previewContent = document.createElement('div');
      previewContent.className = 'niblie-preview-content';
      previewContent.style.cssText = `
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
      `;
      
      // Create info bar
      const infoBar = document.createElement('div');
      infoBar.className = 'niblie-preview-info-bar';
      infoBar.style.cssText = `
        background-color: #f8f9fa;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 24px;
        color: #3c4043;
        font-size: 14px;
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
      
      closeBtn.onclick = () => this.hideImagePreview();
      
      // Navigation buttons
      const prevBtn = document.createElement('button');
      prevBtn.className = 'niblie-preview-prev';
      prevBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
      `;
      prevBtn.style.cssText = `
        position: absolute;
        top: 50%;
        left: 20px;
        transform: translateY(-50%);
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
      `;
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'niblie-preview-next';
      nextBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      `;
      nextBtn.style.cssText = `
        position: absolute;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
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
      `;
      
      [prevBtn, nextBtn].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });
      });
      
      // Add elements to overlay
      previewContent.appendChild(closeBtn);
      previewContent.appendChild(prevBtn);
      previewContent.appendChild(nextBtn);
      
      overlay.appendChild(previewContent);
      overlay.appendChild(infoBar);
      
      // Close on click outside the image
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === previewContent) {
          this.hideImagePreview();
        }
      });
      
      document.body.appendChild(overlay);
    }
  },
  
  /**
   * Show image preview
   * @param {Object} image - Image data object
   * @param {number} index - Image index
   */
  showImagePreview: function(image, index) {
    // Get or create preview overlay
    let overlay = document.getElementById('niblie-image-preview-overlay');
    if (!overlay) {
      this._setupImagePreview();
      overlay = document.getElementById('niblie-image-preview-overlay');
    }
    
    // Set current index
    overlay.dataset.currentIndex = index;
    
    // Get content elements
    const previewContent = overlay.querySelector('.niblie-preview-content');
    const infoBar = overlay.querySelector('.niblie-preview-info-bar');
    const prevBtn = overlay.querySelector('.niblie-preview-prev');
    const nextBtn = overlay.querySelector('.niblie-preview-next');
    
    // Clear existing content
    previewContent.innerHTML = '';
    infoBar.innerHTML = '';
    
    // Add navigation and close buttons back
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
    closeBtn.onclick = () => this.hideImagePreview();
    
    previewContent.appendChild(closeBtn);
    previewContent.appendChild(prevBtn);
    previewContent.appendChild(nextBtn);
    
    // Display image based on type
    if (image.isSvg && image.svgContent) {
      // Display inline SVG
      previewContent.innerHTML += image.svgContent;
      const svg = previewContent.querySelector('svg');
      if (svg) {
        svg.style.cssText = `
          max-width: 90%;
          max-height: 80vh;
          filter: drop-shadow(0 0 20px rgba(0,0,0,0.3));
        `;
      }
    } else {
      // Create image element
      const img = document.createElement('img');
      img.className = 'niblie-preview-image';
      img.alt = image.alt || 'Image preview';
      img.style.cssText = `
        max-width: 90%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
      `;
      
      // Set source based on image type
      if (image.dataUrl) {
        img.src = image.dataUrl;
      } else if (image.isCanvas) {
        try {
          img.src = image.element.toDataURL('image/png');
        } catch (e) {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';
        }
      } else {
        img.src = image.src || '';
      }
      
      // Handle load errors
      img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"%3E%3Cpath fill="%23d93025" d="M3.27,2L2,3.27L4.73,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16C16.2,18 16.39,17.92 16.54,17.82L19.73,21L21,19.73M21,5V15.27L18.73,13H20V5H6.27L8.27,7H15.73L13.73,5Z"/%3E%3C/svg%3E';
        img.style.padding = '40px';
      };
      
      previewContent.appendChild(img);
    }
    
    // Add info to the info bar
    const dimensionsInfo = document.createElement('div');
    dimensionsInfo.textContent = `Dimensions: ${image.width === 'unknown' ? 'Unknown' : image.width} × ${image.height === 'unknown' ? 'Unknown' : image.height}`;
    infoBar.appendChild(dimensionsInfo);
    
    const typeInfo = document.createElement('div');
    typeInfo.textContent = `Type: ${image.type || 'unknown'}`;
    infoBar.appendChild(typeInfo);
    
    const sizeInfo = document.createElement('div');
    sizeInfo.textContent = `Size: ${image.fileSize || 'Unknown'}`;
    infoBar.appendChild(sizeInfo);
    
    // Download button on info bar
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.style.cssText = `
      background-color: #1a73e8;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      margin-left: auto;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.backgroundColor = '#0d66d0';
    });
    
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.backgroundColor = '#1a73e8';
    });
    
    downloadBtn.addEventListener('click', () => {
      // Create format dropdown in the overlay
      const dropdown = this._createFormatDropdown(image);
      
      // Position near the download button
      const btnRect = downloadBtn.getBoundingClientRect();
      dropdown.style.position = 'absolute';
      dropdown.style.bottom = `${window.innerHeight - btnRect.top + 10}px`;
      dropdown.style.right = `${window.innerWidth - btnRect.right + 10}px`;
      dropdown.style.zIndex = '10002';
      
      // Add to overlay
      overlay.appendChild(dropdown);
      
      // Close dropdown when clicking elsewhere
      const closeDropdown = (e) => {
        if (!dropdown.contains(e.target) && e.target !== downloadBtn) {
          dropdown.remove();
          overlay.removeEventListener('click', closeDropdown);
        }
      };
      
      setTimeout(() => {
        overlay.addEventListener('click', closeDropdown);
      }, 10);
    });
    
    infoBar.appendChild(downloadBtn);
    
    // Setup navigation buttons
    const allImages = this._getAllVisibleImages();
    if (allImages.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';
      
      prevBtn.onclick = () => {
        const currentIndex = parseInt(overlay.dataset.currentIndex);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1;
        this.showImagePreview(allImages[prevIndex], prevIndex);
      };
      
      nextBtn.onclick = () => {
        const currentIndex = parseInt(overlay.dataset.currentIndex);
        const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0;
        this.showImagePreview(allImages[nextIndex], nextIndex);
      };
    }
    
    // Show the overlay
    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
  },
  
  /**
   * Hide the image preview overlay
   */
  hideImagePreview: function() {
    const overlay = document.getElementById('niblie-image-preview-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
        
        // Clean up any dropdowns
        document.querySelectorAll('.niblie-format-dropdown').forEach(el => {
          if (el.parentNode === overlay) {
            overlay.removeChild(el);
          }
        });
      }, 300);
    }
  },
  
  /**
   * Get all currently visible images based on active category
   * @returns {Array} Array of image objects
   * @private
   */
  _getAllVisibleImages: function() {
    // Find the active category tab
    const activeTab = document.querySelector('.niblie-image-tabs .active');
    if (!activeTab) return [];
    
    const category = activeTab.dataset.category;
    
    // Get images from the ImageFinder cache
    const imageData = ImageFinder.imageCache;
    if (!imageData) return [];
    
    // Collect images based on category
    let images = [];
    if (category === 'all') {
      // Combine all images
      Object.values(imageData).forEach(categoryImages => {
        images = images.concat(categoryImages);
      });
    } else if (imageData[category]) {
      images = imageData[category];
    }
    
    return images;
  },
  
  /**
   * Format category name for display
   * @param {string} category - Category name
   * @returns {string} Formatted category name
   * @private
   */
  _formatCategoryName: function(category) {
    // Convert camelCase to space-separated words
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  },
  
  /**
   * Add CSS keyframes for spinner animation
   * @private
   */
  _addSpinnerAnimation: function() {
    // Add spinner animation if it doesn't exist
    if (!document.getElementById('niblie-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'niblie-spinner-style';
      style.textContent = `
        @keyframes niblie-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },
  
  /**
   * Initialize the UI
   */
  init: function() {
    this._addSpinnerAnimation();
  }
};

// Initialize ImageUI
ImageUI.init();

// Export the modules
window.ImageFinder = ImageFinder;
window.ImageUI = ImageUI;