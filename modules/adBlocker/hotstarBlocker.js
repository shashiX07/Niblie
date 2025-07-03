/**
 * Hotstar Ad Blocker Module
 */

const HotstarBlocker = {
  platform: 'hotstar',
  isActive: false,
  observer: null,
  
  features: [
    'Skip pre-roll video ads',
    'Block mid-roll interruptions',
    'Hide banner advertisements',
    'Remove promoted content',
    'Fast-forward ad segments'
  ],

  /**
   * Initializes Hotstar ad blocking
   */
  async init() {
    const settings = await AdBlockerStorage.getPlatformSettings(this.platform);
    if (!settings.enabled) return;

    this.isActive = true;
    this.startBlocking();
    console.log('Hotstar Ad Blocker: Initialized');
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
    }, 1000);
  },

  /**
   * Main ad blocking logic
   */
  blockAds() {
    this.blockVideoAds();
    this.blockBannerAds();
    this.blockPromotedContent();
  },

  /**
   * Blocks video ads
   */
  blockVideoAds() {
    // Look for skip button
    const skipButton = document.querySelector('.skip-ad, .ad-skip-button, [class*="skip"]');
    if (skipButton && skipButton.offsetParent !== null) {
      skipButton.click();
      console.log('Hotstar Ad Blocker: Skipped video ad');
      this.notifyAdBlocked();
    }

    // Try to manipulate video time during ads
    const video = document.querySelector('video');
    const adIndicator = document.querySelector('.ad-overlay, [class*="ad-"], .advertisement');
    
    if (video && adIndicator && video.duration) {
      video.currentTime = video.duration;
      console.log('Hotstar Ad Blocker: Fast-forwarded through ad');
      this.notifyAdBlocked();
    }

    // Hide ad overlays
    const adOverlays = document.querySelectorAll('.ad-overlay, .advertisement, [class*="ad-container"]');
    adOverlays.forEach(overlay => {
      overlay.style.display = 'none';
    });
  },

  /**
   * Blocks banner ads
   */
  blockBannerAds() {
    const adSelectors = [
      '.banner-ad',
      '.display-ad',
      '.sponsored-banner',
      '[class*="advertisement"]',
      '.ad-banner',
      '.promo-banner'
    ];

    adSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        if (ad.style.display !== 'none') {
          ad.style.display = 'none';
          console.log('Hotstar Ad Blocker: Blocked banner ad');
          this.notifyAdBlocked();
        }
      });
    });
  },

  /**
   * Blocks promoted content
   */
  blockPromotedContent() {
    const promotedElements = document.querySelectorAll('[data-promoted], [class*="promoted"], [class*="sponsored"]');
    promotedElements.forEach(element => {
      if (element.style.display !== 'none') {
        element.style.display = 'none';
        console.log('Hotstar Ad Blocker: Blocked promoted content');
        this.notifyAdBlocked();
      }
    });
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
        setTimeout(() => this.blockAds(), 100);
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
    console.log('Hotstar Ad Blocker: Stopped');
  }
};

// Make globally available
window.HotstarBlocker = HotstarBlocker;