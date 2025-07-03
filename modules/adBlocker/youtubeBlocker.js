/**
 * YouTube Ad Blocker Module
 */

const YouTubeBlocker = {
  platform: 'youtube',
  isActive: false,
  observer: null,
  
  features: [
    'Block pre-roll video ads',
    'Skip mid-roll advertisements', 
    'Hide banner advertisements',
    'Remove sponsored content',
    'Fast-forward through ad breaks'
  ],

  /**
   * Initializes YouTube ad blocking
   */
  async init() {
    const settings = await AdBlockerStorage.getPlatformSettings(this.platform);
    if (!settings.enabled) return;

    this.isActive = true;
    this.startBlocking();
    console.log('YouTube Ad Blocker: Initialized');
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
    this.blockSponsoredContent();
  },

  /**
   * Blocks video ads
   */
  blockVideoAds() {
    // Skip button selector
    const skipButton = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipButton && skipButton.offsetParent !== null) {
      skipButton.click();
      console.log('YouTube Ad Blocker: Skipped video ad');
      this.notifyAdBlocked();
    }

    // Try to skip by manipulating video time
    const video = document.querySelector('video');
    const adIndicator = document.querySelector('.ytp-ad-player-overlay, .ytp-ad-text');
    
    if (video && adIndicator && video.duration) {
      video.currentTime = video.duration;
      console.log('YouTube Ad Blocker: Fast-forwarded through ad');
      this.notifyAdBlocked();
    }

    // Hide ad overlay
    const adOverlays = document.querySelectorAll('.ytp-ad-player-overlay, .ytp-ad-overlay-close-button, .ytp-ad-text');
    adOverlays.forEach(overlay => {
      overlay.style.display = 'none';
    });
  },

  /**
   * Blocks banner ads
   */
  blockBannerAds() {
    const adSelectors = [
      '#player-ads',
      '.ytd-display-ad-renderer',
      '.ytd-promoted-sparkles-web-renderer',
      '.ytd-ad-slot-renderer',
      'ytd-banner-promo-renderer',
      '#masthead-ad',
      '.ytd-in-feed-ad-layout-renderer'
    ];

    adSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        if (ad.style.display !== 'none') {
          ad.style.display = 'none';
          console.log('YouTube Ad Blocker: Blocked banner ad');
          this.notifyAdBlocked();
        }
      });
    });
  },

  /**
   * Blocks sponsored content
   */
  blockSponsoredContent() {
    const sponsoredElements = document.querySelectorAll('[aria-label*="Sponsored"], [aria-label*="Ad"]');
    sponsoredElements.forEach(element => {
      const container = element.closest('ytd-video-renderer, ytd-compact-video-renderer');
      if (container && container.style.display !== 'none') {
        container.style.display = 'none';
        console.log('YouTube Ad Blocker: Blocked sponsored content');
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
    console.log('YouTube Ad Blocker: Stopped');
  }
};

// Make globally available
window.YouTubeBlocker = YouTubeBlocker;