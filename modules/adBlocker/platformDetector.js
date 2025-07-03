/**
 * Platform Detection Module
 * Detects which platform the user is currently on
 */

const PlatformDetector = {
  platforms: {
    YOUTUBE: 'youtube',
    SPOTIFY: 'spotify', 
    HOTSTAR: 'hotstar',
    GENERAL: 'general'
  },

  /**
   * Detects the current platform based on URL and page elements
   * @returns {string} Platform identifier
   */
  detectCurrentPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();

    // YouTube detection
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return this.platforms.YOUTUBE;
    }

    // Spotify detection  
    if (hostname.includes('spotify.com') || hostname.includes('open.spotify.com')) {
      return this.platforms.SPOTIFY;
    }

    // Hotstar detection
    if (hostname.includes('hotstar.com') || hostname.includes('disneyplus.com')) {
      return this.platforms.HOTSTAR;
    }

    return this.platforms.GENERAL;
  },

  /**
   * Gets platform display name
   * @param {string} platform Platform identifier
   * @returns {string} Display name
   */
  getPlatformDisplayName(platform) {
    const names = {
      [this.platforms.YOUTUBE]: 'YouTube',
      [this.platforms.SPOTIFY]: 'Spotify',
      [this.platforms.HOTSTAR]: 'Hotstar',
      [this.platforms.GENERAL]: 'General Web'
    };
    return names[platform] || 'Unknown';
  },

  /**
   * Checks if platform has ads typically
   * @param {string} platform Platform identifier
   * @returns {boolean} Whether platform typically shows ads
   */
  platformHasAds(platform) {
    return [
      this.platforms.YOUTUBE,
      this.platforms.SPOTIFY,
      this.platforms.HOTSTAR
    ].includes(platform);
  }
};

// Make globally available
window.PlatformDetector = PlatformDetector;