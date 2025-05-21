/**
 * Optimized LinkFinder module with better memory management and deduplication
 */
const LinkFinder = {
  linkCache: null,
  lastAnalyzedUrl: '',
  
  findLinks: function(forceRefresh = false) {
    return new Promise((resolve) => {
      // Check if we have cached results for this URL (unchanged)
      const currentUrl = window.location.href;
      if (!forceRefresh && this.linkCache && this.lastAnalyzedUrl === currentUrl) {
        resolve(this.linkCache);
        return;
      }
      
      // Get all links on the page
      const links = Array.from(document.querySelectorAll('a[href]'));
      const uniqueLinks = new Map(); // Use Map for deduplication by href
      
      // Initialize link categories
      const categories = {
        socialLinks: [],
        internalLinks: [],
        externalLinks: [],
        documentLinks: [],
        emailLinks: [],
        mediaLinks: [],
        navigationLinks: [],
        otherLinks: []
      };
      
      // Get current domain for determining internal vs external
      const currentDomain = window.location.hostname;
      
      // Process links with better memory management
      this._processLinksOptimized(links, uniqueLinks, categories, currentDomain)
        .then(categorizedLinks => {
          // Cache the results
          this.linkCache = categorizedLinks;
          this.lastAnalyzedUrl = currentUrl;
          resolve(categorizedLinks);
        });
    });
  },
  
  _processLinksOptimized: function(links, uniqueLinks, categories, currentDomain) {
    return new Promise(resolve => {
      // Increase chunk size for better performance
      const CHUNK_SIZE = 100;
      let currentIndex = 0;
      
      const processNextChunk = () => {
        const chunkEnd = Math.min(currentIndex + CHUNK_SIZE, links.length);
        let hasProcessedLinks = false;
        
        for (let i = currentIndex; i < chunkEnd; i++) {
          const link = links[i];
          // Skip empty or javascript: links
          const href = link.href;
          if (!href || href.startsWith('javascript:')) continue;
          
          // Deduplicate by href - only process if not seen before
          if (!uniqueLinks.has(href)) {
            uniqueLinks.set(href, true);
            hasProcessedLinks = true;
            this._categorizeLink(link, categories, currentDomain);
          }
        }
        
        currentIndex = chunkEnd;
        
        // If we're done, resolve the promise
        if (currentIndex >= links.length) {
          resolve(categories);
        } else {
          // If this chunk had links to process, use a small timeout
          // Otherwise process immediately for better performance
          if (hasProcessedLinks) {
            setTimeout(processNextChunk, 0);
          } else {
            processNextChunk();
          }
        }
      };
      
      // Start processing
      processNextChunk();
    });
  },
  
  /**
   * Get display text for a link (handles various cases)
   * @param {HTMLElement} link - Link element
   * @returns {string} Display text
   * @private
   */
  _getDisplayText: function(link) {
    let text = link.innerText.trim();
    
    // If no text content, try various fallbacks
    if (!text) {
      text = link.getAttribute('title') || 
             link.getAttribute('aria-label') ||
             link.getAttribute('alt') || '';
      
      // Last resort: use the URL itself
      if (!text) {
        try {
          const url = new URL(link.href);
          text = url.hostname + (url.pathname !== '/' ? url.pathname : '');
        } catch (e) {
          text = link.href;
        }
      }
    }
    
    return text;
  },
  
  _categorizeLink: function(link, categories, currentDomain) {
    const href = link.href;
    
    // Create link object with relevant data but without DOM reference
    const linkObj = {
      href: href,
      text: this._getDisplayText(link),
      title: link.getAttribute('title') || '',
      rel: link.getAttribute('rel') || ''
      // No element reference to avoid memory leaks
    };
    
    // Categorize the link
    if (this.isSocialLink(href)) {
      categories.socialLinks.push(linkObj);
    } else if (this.isEmailLink(href)) {
      categories.emailLinks.push(linkObj);
    } else if (this.isDocumentLink(href)) {
      categories.documentLinks.push(linkObj);
    } else if (this.isMediaLink(href)) {
      categories.mediaLinks.push(linkObj);
    } else if (this.isNavigationLink(link)) {
      categories.navigationLinks.push(linkObj);
    } else if (this.isInternalLink(href, currentDomain)) {
      categories.internalLinks.push(linkObj);
    } else {
      categories.externalLinks.push(linkObj);
    }
  },
  
  /**
   * Checks if a URL points to a social media site
   * @param {string} url - URL to check
   * @returns {boolean} True if social media link
   */
  isSocialLink: function(url) {
    try {
      const socialDomains = [
        'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 
        'pinterest.com', 'youtube.com', 'tiktok.com', 'reddit.com',
        'tumblr.com', 'flickr.com', 'snapchat.com', 'discord.com',
        'telegram.org', 'whatsapp.com', 'medium.com', 'quora.com',
        'github.com', 'twitch.tv', 'vimeo.com', 'vk.com'
      ];
      
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      return socialDomains.some(socialDomain => 
        domain === socialDomain || domain.endsWith('.' + socialDomain)
      );
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Checks if a URL is an email link
   * @param {string} url - URL to check
   * @returns {boolean} True if email link
   */
  isEmailLink: function(url) {
    return url.startsWith('mailto:');
  },
  
  /**
   * Checks if a URL points to a document file
   * @param {string} url - URL to check
   * @returns {boolean} True if document link
   */
  isDocumentLink: function(url) {
    const documentExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.txt', '.rtf', '.csv', '.odt', '.ods', '.odp'
    ];
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      return documentExtensions.some(ext => path.endsWith(ext));
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Checks if a URL points to a media file
   * @param {string} url - URL to check
   * @returns {boolean} True if media link
   */
  isMediaLink: function(url) {
    const mediaExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
      '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac'
    ];
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      return mediaExtensions.some(ext => path.endsWith(ext));
    } catch (e) {
      return false;
    }
  },
  
  /**
   * Checks if a URL is internal to the current site
   * @param {string} url - URL to check
   * @param {string} currentDomain - Current site domain
   * @returns {boolean} True if internal link
   */
  isInternalLink: function(url, currentDomain) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === currentDomain ||
             urlObj.hostname === 'www.' + currentDomain;
    } catch (e) {
      // If URL parsing fails, assume it's an internal link (relative URL)
      return true;
    }
  },
  
  /**
   * Determines if a link is likely a navigation link
   * @param {HTMLElement} link - Link element
   * @returns {boolean} True if navigation link
   */
  isNavigationLink: function(link) {
    // Check for common navigation indicators
    const isInNav = this._hasAncestor(link, ['nav', 'header', 'footer', 'menu']);
    const hasNavClass = /(^|\s)(nav|menu|navigation)(\s|$)/i.test(link.className) || 
                        /(^|\s)(nav|menu|navigation)(\s|$)/i.test(link.parentElement?.className || '');
                       
    // Check for typical navigation-related roles
    const navRole = link.getAttribute('role') === 'navigation' ||
                   link.parentElement?.getAttribute('role') === 'navigation';
    
    return isInNav || hasNavClass || navRole;
  },
  
  /**
   * Checks if an element has an ancestor with one of the specified tag names
   * @param {HTMLElement} element - Element to check
   * @param {string[]} tagNames - Array of tag names to check for
   * @returns {boolean} True if element has an ancestor with one of the tag names
   * @private
   */
  _hasAncestor: function(element, tagNames) {
    let parent = element.parentElement;
    let depth = 0;
    const MAX_DEPTH = 4; // Limit search depth to avoid performance issues
    
    while (parent && depth < MAX_DEPTH) {
      if (tagNames.includes(parent.tagName.toLowerCase())) {
        return true;
      }
      parent = parent.parentElement;
      depth++;
    }
    
    return false;
  },
  
  clearCache: function() {
    this.linkCache = null;
    this.lastAnalyzedUrl = '';
    // Force garbage collection by suggesting it to the browser
    if (window.gc) window.gc();
  }
};