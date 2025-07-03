/**
 * Storage Manager for Ad Blocker Settings
 */

const AdBlockerStorage = {
  storageKey: 'niblie_adblocker_settings',

  /**
   * Default ad blocker settings
   */
  defaultSettings: {
    youtube: {
      enabled: false,
      skipAds: true,
      hideAdElements: true,
      blockPreRoll: true,
      blockMidRoll: true
    },
    spotify: {
      enabled: false,
      skipAds: true,
      muteAds: true,
      hideAdElements: true
    },
    hotstar: {
      enabled: false,
      skipAds: true,
      hideAdElements: true,
      blockPreRoll: true
    },
    general: {
      enabled: false,
      blockBanners: true,
      blockPopups: true,
      blockVideoAds: true,
      hideAdElements: true
    },
    ui: {
      showModal: true,
      modalTimeout: 44,
      badgeAnimation: 'sprinkler',
      enableAnimations: true
    }
  },

  /**
   * Gets ad blocker settings from storage
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.storageKey, (data) => {
        const settings = data[this.storageKey] || this.defaultSettings;
        resolve({ ...this.defaultSettings, ...settings });
      });
    });
  },

  /**
   * Saves ad blocker settings to storage
   * @param {Object} settings Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        [this.storageKey]: settings
      }, () => {
        resolve();
      });
    });
  },

  /**
   * Gets setting for specific platform
   * @param {string} platform Platform identifier
   * @returns {Promise<Object>} Platform settings
   */
  async getPlatformSettings(platform) {
    const settings = await this.getSettings();
    return settings[platform] || {};
  },

  /**
   * Updates setting for specific platform
   * @param {string} platform Platform identifier
   * @param {Object} platformSettings Settings to update
   * @returns {Promise<void>}
   */
  async updatePlatformSettings(platform, platformSettings) {
    const settings = await this.getSettings();
    settings[platform] = { ...settings[platform], ...platformSettings };
    await this.saveSettings(settings);
  },

  /**
   * Checks if ad blocker is enabled for platform
   * @param {string} platform Platform identifier
   * @returns {Promise<boolean>}
   */
  async isEnabledForPlatform(platform) {
    const platformSettings = await this.getPlatformSettings(platform);
    return platformSettings.enabled || false;
  }
};

// Make globally available
window.AdBlockerStorage = AdBlockerStorage;