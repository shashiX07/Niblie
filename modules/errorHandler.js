/**
 * Centralized Error Handler for Niblie Extension
 * Provides graceful error handling and logging
 */

const ErrorHandler = {
  // Error storage for analytics
  errors: [],
  maxErrors: 50,
  isEnabled: true, // Enabled by default
  
  /**
   * Initialize error handler
   */
  init: async function() {
    // Check if error tracking is enabled in settings
    try {
      const result = await chrome.storage.sync.get('settings');
      const settings = result.settings || {};
      this.isEnabled = settings.enableErrorTracking !== false;
      
      if (this.isEnabled) {
        console.log('[Niblie ErrorHandler] Initialized and enabled');
      } else {
        console.log('[Niblie ErrorHandler] Disabled in settings');
      }
    } catch (error) {
      console.error('[Niblie ErrorHandler] Failed to load settings:', error);
    }
    
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'uncaught',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
      });
    });
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        error: event.reason
      });
    });
    
    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.settings) {
        const newSettings = changes.settings.newValue || {};
        this.isEnabled = newSettings.enableErrorTracking !== false;
        console.log(`[Niblie ErrorHandler] ${this.isEnabled ? 'Enabled' : 'Disabled'}`);
      }
    });
  },
  
  /**
   * Log an error with context
   * @param {Object} errorInfo - Error information
   */
  logError: function(errorInfo) {
    if (!this.isEnabled) return; // Don't log if disabled
    
    const errorRecord = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...errorInfo
    };
    
    // Add to errors array
    this.errors.push(errorRecord);
    
    // Maintain max errors limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Log to console in development
    console.error('[Niblie Error]', errorRecord);
    
    // Store in local storage for debugging
    try {
      chrome.storage.local.set({
        lastError: errorRecord,
        errorCount: this.errors.length
      });
    } catch (e) {
      console.debug('[Niblie ErrorHandler] Could not store error:', e);
    }
  },
  
  /**
   * Wrap a function with error handling
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context description
   * @returns {Function} Wrapped function
   */
  wrap: function(fn, context = 'unknown') {
    return (...args) => {
      try {
        const result = fn(...args);
        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            this.logError({
              type: 'wrapped-promise',
              context,
              message: error?.message || 'Promise error',
              error
            });
            throw error;
          });
        }
        return result;
      } catch (error) {
        this.logError({
          type: 'wrapped-sync',
          context,
          message: error?.message || 'Synchronous error',
          error
        });
        throw error;
      }
    };
  },
  
  /**
   * Get recent errors for debugging
   * @returns {Array} Array of error records
   */
  getErrors: function() {
    return this.errors;
  },
  
  /**
   * Clear error history
   */
  clearErrors: function() {
    this.errors = [];
    try {
      chrome.storage.local.remove(['lastError', 'errorCount']);
    } catch (e) {
      console.debug('[Niblie ErrorHandler] Could not clear errors:', e);
    }
  }
};

// Auto-initialize
ErrorHandler.init();

// Export to global scope
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}
