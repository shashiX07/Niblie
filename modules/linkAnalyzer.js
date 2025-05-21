// filepath: d:\code\tp\ext\modules\linkAnalyzer.js
/**
 * Link Analyzer for categorizing links on a webpage
 */

const LinkAnalyzer = {
  /**
   * Analyzes all links on the current page and categorizes them
   * @returns {Object} Categorized link objects
   */
  analyzePage: function() {
    // Get all links on the page
    const links = Array.from(document.querySelectorAll('a[href]'));
    
    // Initialize link categories
    const categories = {
      socialLinks: [],
      internalLinks: [],
      externalLinks: [],
      documentLinks: [],
      emailLinks: [],
      mediaLinks: [],
      otherLinks: []
    };
    
    // Get current domain for determining internal vs external
    const currentDomain = window.location.hostname;
    
    // Process each link
    links.forEach(link => {
      // Skip empty or javascript: links
      const href = link.href;
      if (!href || href.startsWith('javascript:')) return;
      
      // Create link object with relevant data
      const linkObj = {
        href: href,
        text: link.innerText.trim() || link.getAttribute('title') || link.getAttribute('aria-label') || '',
        element: link
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
      } else if (this.isInternalLink(href, currentDomain)) {
        categories.internalLinks.push(linkObj);
      } else {
        categories.externalLinks.push(linkObj);
      }
    });
    
    return categories;
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
  }
};