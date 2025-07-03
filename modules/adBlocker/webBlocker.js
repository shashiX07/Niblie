/**
 * General Web Ad Blocker Module
 */

const WebBlocker = {
  platform: 'general',
  isActive: false,
  observer: null,
  
  features: [
    'Block banner advertisements',
    'Remove popup overlays',
    'Hide video advertisements',
    'Block tracking scripts',
    'Remove sponsored content'
  ],

  /**
   * Initializes general web ad blocking
   */
  async init() {
    const settings = await AdBlockerStorage.getPlatformSettings(this.platform);
    if (!settings.enabled) return;

    this.isActive = true;
    this.startBlocking();
    console.log('Web Ad Blocker: Initialized');
  },

  /**
   * Starts the ad blocking process
   */
  startBlocking() {
    // Block ads immediately
    this.blockAds();
    
    // Set up observer for dynamic content
    this.setupObserver();
    
    // Set up periodic checks
    setInterval(() => {
      this.blockAds();
    }, 2000);
  },

  /**
   * Main ad blocking logic
   */
  blockAds() {
    this.blockBannerAds();
    this.blockPopupAds();
    this.blockVideoAds();
    this.blockSponsoredContent();
  },

  /**
   * Blocks banner ads
   */
  blockBannerAds() {
    const adSelectors = [
      '.ad',
      '.ads',
      '.advertisement',
      '.banner',
      '.sponsored',
      '[class*="ad-"]',
      '[class*="ads-"]',
      '[id*="ad-"]',
      '[id*="ads-"]',
      'iframe[src*="ads"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]'
    ];

    adSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        if (ad.style.display !== 'none' && this.isLikelyAd(ad)) {
          ad.style.display = 'none';
          console.log('Web Ad Blocker: Blocked banner ad');
          this.notifyAdBlocked();
        }
      });
    });
  },

  /**
   * Blocks popup ads
   */
  blockPopupAds() {
    const popupSelectors = [
      '.popup',
      '.modal[class*="ad"]',
      '.overlay[class*="ad"]',
      '[role="dialog"][class*="ad"]',
      '.lightbox[class*="ad"]'
    ];

    popupSelectors.forEach(selector => {
      const popups = document.querySelectorAll(selector);
      popups.forEach(popup => {
        if (popup.style.display !== 'none') {
          popup.style.display = 'none';
          console.log('Web Ad Blocker: Blocked popup ad');
          this.notifyAdBlocked();
        }
      });
    });
  },

  /**
   * Blocks video ads
   */
  blockVideoAds() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (this.isAdVideo(video)) {
        video.style.display = 'none';
        console.log('Web Ad Blocker: Blocked video ad');
        this.notifyAdBlocked();
      }
    });
  },

  /**
   * Blocks sponsored content
   */
  blockSponsoredContent() {
    const sponsoredElements = document.querySelectorAll('[data-sponsored], [class*="sponsored"], [class*="promoted"]');
    sponsoredElements.forEach(element => {
      if (element.style.display !== 'none') {
        element.style.display = 'none';
        console.log('Web Ad Blocker: Blocked sponsored content');
        this.notifyAdBlocked();
      }
    });
  },

  /**
   * Checks if element is likely an ad
   * @param {Element} element Element to check
   * @returns {boolean} Whether element is likely an ad
   */
  isLikelyAd(element) {
    const adKeywords = ['advertisement', 'sponsored', 'promo', 'banner', 'commercial'];
    const text = element.textContent?.toLowerCase() || '';
    const className = element.className?.toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    
    return adKeywords.some(keyword => 
      text.includes(keyword) || 
      className.includes(keyword) || 
      id.includes(keyword)
    );
  },

  /**
   * Checks if video is an ad
   * @param {Element} video Video element to check
   * @returns {boolean} Whether video is an ad
   */
  isAdVideo(video) {
    const parent = video.closest('[class*="ad"], [id*="ad"], [data-ad]');
    return !!parent;
  },

  /**
   * Sets up mutation observer for dynamic content
   */
  setupObserver() {
    if (this.observer) this.observer.disconnect();

    this.observer = new MutationObserver((mutations) => {
      let shouldBlock = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          shouldBlock = true;
        }
      });
      
      if (shouldBlock) {
        setTimeout(() => this.blockAds(), 200);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },

  /**
   * Notifies that an ad was blocked
   */
  notifyAdBlocked() {
    if (window.BadgeUI && typeof window.BadgeUI.showAdBlockingAnimation === 'function') {
      window.BadgeUI.showAdBlockingAnimation();
    }
  },

  /**
   * Stops ad blocking
   */
  stop() {
    this.isActive = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    console.log('Web Ad Blocker: Stopped');
  }
};

// Make globally available
window.WebBlocker = WebBlocker;