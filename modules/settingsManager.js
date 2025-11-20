/**
 * Centralized Settings Manager for Niblie Extension
 * Handles all settings storage, retrieval, and synchronization
 */

const SettingsManager = {
  // Default settings
  defaults: {
    position: 'top-right',
    showWordCount: true,
    colorStyle: 'solid',
    badgeColor: '#4285f4',
    textColor: '#ffffff',
    gradientStart: '#4285f4',
    gradientEnd: '#0F9D58',
    gradientAngle: 45,
    opacity: 90,
    useCuteTheme: false,
    cuteThemeStyle: 'kawaii',
    enableAnimations: false,
    autoSave: true,
    performanceMode: false,
    debugMode: false
  },
  
  // Current settings cache
  cache: null,
  
  // Change listeners
  listeners: new Set(),
  
  /**
   * Initialize settings manager
   * @returns {Promise<Object>} Current settings
   */
  init: async function() {
    console.log('[Niblie SettingsManager] Initializing...');
    
    // Load settings from storage
    await this.load();
    
    // Listen for storage changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync' && changes.settings) {
          this.cache = changes.settings.newValue;
          this.notifyListeners(changes.settings.newValue, changes.settings.oldValue);
        }
      });
    }
    
    console.log('[Niblie SettingsManager] Initialized with settings:', this.cache);
    return this.cache;
  },
  
  /**
   * Load settings from storage
   * @returns {Promise<Object>} Loaded settings
   */
  load: async function() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        this.cache = { ...this.defaults };
        resolve(this.cache);
        return;
      }
      
      chrome.storage.sync.get('settings', (data) => {
        this.cache = { ...this.defaults, ...(data.settings || {}) };
        resolve(this.cache);
      });
    });
  },
  
  /**
   * Get current settings (from cache or storage)
   * @returns {Promise<Object>} Current settings
   */
  get: async function() {
    if (this.cache) {
      return { ...this.cache };
    }
    return await this.load();
  },
  
  /**
   * Get a specific setting value
   * @param {string} key - Setting key
   * @param {*} defaultValue - Default value if not found
   * @returns {Promise<*>} Setting value
   */
  getValue: async function(key, defaultValue = null) {
    const settings = await this.get();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  },
  
  /**
   * Update settings
   * @param {Object} newSettings - New settings to merge
   * @param {boolean} autoSave - Whether to auto-save
   * @returns {Promise<Object>} Updated settings
   */
  update: async function(newSettings, autoSave = true) {
    const currentSettings = await this.get();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    this.cache = updatedSettings;
    
    if (autoSave) {
      await this.save(updatedSettings);
    }
    
    return updatedSettings;
  },
  
  /**
   * Save settings to storage
   * @param {Object} settings - Settings to save
   * @returns {Promise<void>}
   */
  save: async function(settings = null) {
    const toSave = settings || this.cache || this.defaults;
    
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('[Niblie SettingsManager] Storage API not available');
        resolve();
        return;
      }
      
      chrome.storage.sync.set({ settings: toSave }, () => {
        if (chrome.runtime.lastError) {
          console.error('[Niblie SettingsManager] Save error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[Niblie SettingsManager] Settings saved:', toSave);
          resolve();
        }
      });
    });
  },
  
  /**
   * Reset settings to defaults
   * @returns {Promise<Object>} Default settings
   */
  reset: async function() {
    this.cache = { ...this.defaults };
    await this.save(this.cache);
    this.notifyListeners(this.cache, {});
    return this.cache;
  },
  
  /**
   * Register a change listener
   * @param {Function} callback - Callback function (newSettings, oldSettings)
   */
  onChange: function(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  },
  
  /**
   * Unregister a change listener
   * @param {Function} callback - Callback function to remove
   */
  offChange: function(callback) {
    this.listeners.delete(callback);
  },
  
  /**
   * Notify all listeners of settings change
   * @param {Object} newSettings - New settings
   * @param {Object} oldSettings - Old settings
   */
  notifyListeners: function(newSettings, oldSettings) {
    this.listeners.forEach(listener => {
      try {
        listener(newSettings, oldSettings);
      } catch (error) {
        console.error('[Niblie SettingsManager] Listener error:', error);
      }
    });
  },
  
  /**
   * Export settings as JSON
   * @returns {string} JSON string of settings
   */
  export: function() {
    return JSON.stringify(this.cache || this.defaults, null, 2);
  },
  
  /**
   * Import settings from JSON
   * @param {string} jsonString - JSON string of settings
   * @returns {Promise<Object>} Imported settings
   */
  import: async function(jsonString) {
    try {
      const importedSettings = JSON.parse(jsonString);
      // Validate imported settings
      const validSettings = {};
      
      for (const [key, value] of Object.entries(importedSettings)) {
        if (this.defaults.hasOwnProperty(key)) {
          validSettings[key] = value;
        }
      }
      
      return await this.update(validSettings, true);
    } catch (error) {
      console.error('[Niblie SettingsManager] Import error:', error);
      throw new Error('Invalid settings format');
    }
  },
  
  /**
   * Toggle a boolean setting
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} New value
   */
  toggle: async function(key) {
    const currentValue = await this.getValue(key, false);
    const newValue = !currentValue;
    await this.update({ [key]: newValue });
    return newValue;
  }
};

// Export to global scope
if (typeof window !== 'undefined') {
  window.SettingsManager = SettingsManager;
}
