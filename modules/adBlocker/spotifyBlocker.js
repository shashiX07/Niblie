/**
 * Spotify Ad Blocker Module
 */

const SpotifyBlocker = {
  platform: 'spotify',
  isActive: false,
  observer: null,
  
  features: [
    'Mute audio advertisements',
    'Skip ad breaks automatically',
    'Hide banner advertisements', 
    'Remove sponsored playlists',
    'Block popup advertisements'
  ],

  /**
   * Initializes Spotify ad blocking
   */
  async init() {
    const settings = await AdBlockerStorage.getPlatformSettings(this.platform);
    if (!settings.enabled) return;

    this.isActive = true;
    this.startBlocking();
    console.log('Spotify Ad Blocker: Initialized');
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
    this.blockAudioAds();
    this.blockBannerAds();
    this.blockSponsoredContent();
  },

  /**
   * Blocks audio ads
   */
  blockAudioAds() {
    // Check for ad indicators
    const adIndicators = document.querySelectorAll('[data-testid="ad-feedback-button"], [aria-label*="Advertisement"]');
    
    if (adIndicators.length > 0) {
      // Mute the audio during ads
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach(audio => {
        if (!audio.muted) {
          audio.muted = true;
          console.log('Spotify Ad Blocker: Muted audio ad');
          this.notifyAdBlocked();
        }
      });

      // Try to skip if possible
      const skipButton = document.querySelector('[data-testid="control-button-skip-forward"]');
      if (skipButton) {
        setTimeout(() => {
          skipButton.click();
          console.log('Spotify Ad Blocker: Attempted to skip ad');
        }, 100);
      }
    } else {
      // Unmute when not in ad
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach(audio => {
        if (audio.muted) {
          audio.muted = false;
        }
      });
    }
  },

  /**
   * Blocks banner ads
   */
  blockBannerAds() {
    const adSelectors = [
      '[data-testid="ad-feedback-button"]',
      '.ad-container',
      '.spotify-ad',
      '[aria-label*="Advertisement"]',
      '.ReactModalPortal [role="dialog"]' // Popup ads
    ];

    adSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      ads.forEach(ad => {
        if (ad.style.display !== 'none') {
          ad.style.display = 'none';
          console.log('Spotify Ad Blocker: Blocked banner ad');
          this.notifyAdBlocked();
        }
      });
    });
  },

  /**
   * Blocks sponsored content
   */
  blockSponsoredContent() {
    const sponsoredElements = document.querySelectorAll('[aria-label*="Sponsored"], [data-testid*="sponsored"]');
    sponsoredElements.forEach(element => {
      const container = element.closest('[data-testid="playlist-card"], [data-testid="track-row"]');
      if (container && container.style.display !== 'none') {
        container.style.display = 'none';
        console.log('Spotify Ad Blocker: Blocked sponsored content');
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
    console.log('Spotify Ad Blocker: Stopped');
  }
};

// Make globally available
window.SpotifyBlocker = SpotifyBlocker;