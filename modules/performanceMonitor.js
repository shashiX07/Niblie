/**
 * Performance Monitor for Niblie Extension
 * Tracks performance metrics and optimizes resource usage
 */

const PerformanceMonitor = {
  metrics: {},
  isEnabled: false, // Disabled by default, enabled through settings
  
  /**
   * Initialize performance monitoring
   */
  init: async function() {
    // Check if performance monitoring is enabled in settings
    try {
      const result = await chrome.storage.sync.get('settings');
      const settings = result.settings || {};
      this.isEnabled = settings.enablePerformanceMonitor !== false;
      
      if (this.isEnabled) {
        console.log('[Niblie PerformanceMonitor] Initialized and enabled');
        
        // Monitor page load performance
        if (typeof PerformanceObserver !== 'undefined') {
          this.observePerformance();
        }
        
        // Monitor memory usage periodically
        this.startMemoryMonitoring();
      } else {
        console.log('[Niblie PerformanceMonitor] Disabled in settings');
      }
    } catch (error) {
      console.error('[Niblie PerformanceMonitor] Failed to load settings:', error);
    }
    
    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.settings) {
        const newSettings = changes.settings.newValue || {};
        const wasEnabled = this.isEnabled;
        this.isEnabled = newSettings.enablePerformanceMonitor !== false;
        
        if (!wasEnabled && this.isEnabled) {
          console.log('[Niblie PerformanceMonitor] Enabled');
          this.observePerformance();
          this.startMemoryMonitoring();
        } else if (wasEnabled && !this.isEnabled) {
          console.log('[Niblie PerformanceMonitor] Disabled');
        }
      }
    });
  },
  
  /**
   * Start timing a performance marker
   * @param {string} label - Marker label
   */
  startTimer: function(label) {
    if (!this.isEnabled) return;
    
    this.metrics[label] = {
      start: performance.now(),
      end: null,
      duration: null
    };
  },
  
  /**
   * End timing a performance marker
   * @param {string} label - Marker label
   * @returns {number} Duration in milliseconds
   */
  endTimer: function(label) {
    if (!this.isEnabled || !this.metrics[label]) return 0;
    
    const metric = this.metrics[label];
    metric.end = performance.now();
    metric.duration = metric.end - metric.start;
    
    console.log(`[Niblie Performance] ${label}: ${metric.duration.toFixed(2)}ms`);
    
    // Store metric if duration is significant
    if (metric.duration > 100) {
      this.storeMetric(label, metric.duration);
    }
    
    return metric.duration;
  },
  
  /**
   * Measure a function's execution time
   * @param {string} label - Measurement label
   * @param {Function} fn - Function to measure
   * @returns {*} Function result
   */
  measure: async function(label, fn) {
    if (!this.isEnabled) return fn();
    
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  },
  
  /**
   * Store performance metric
   * @param {string} label - Metric label
   * @param {number} value - Metric value
   */
  storeMetric: function(label, value) {
    try {
      chrome.storage.local.get('performanceMetrics', (data) => {
        const metrics = data.performanceMetrics || {};
        
        if (!metrics[label]) {
          metrics[label] = {
            count: 0,
            total: 0,
            average: 0,
            min: Infinity,
            max: 0
          };
        }
        
        const metric = metrics[label];
        metric.count++;
        metric.total += value;
        metric.average = metric.total / metric.count;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        
        chrome.storage.local.set({ performanceMetrics: metrics });
      });
    } catch (e) {
      console.debug('[Niblie PerformanceMonitor] Could not store metric:', e);
    }
  },
  
  /**
   * Observe performance entries
   */
  observePerformance: function() {
    // Don't monitor performance on Spotify - it floods the console
    if (window.location.hostname.includes('spotify.com')) {
      return;
    }
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.log(`[Niblie Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (e) {
      console.debug('[Niblie PerformanceMonitor] PerformanceObserver not supported:', e);
    }
  },
  
  /**
   * Monitor memory usage
   */
  startMemoryMonitoring: function() {
    if (!performance.memory) return;
    
    setInterval(() => {
      const memory = performance.memory;
      const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
      
      console.log(`[Niblie Memory] Used: ${usedMB}MB / Total: ${totalMB}MB / Limit: ${limitMB}MB`);
      
      // Warn if memory usage is high
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
        console.warn('[Niblie Memory] High memory usage detected! Consider refreshing the page.');
      }
    }, 60000); // Check every minute
  },
  
  /**
   * Get performance report
   * @returns {Object} Performance metrics
   */
  getReport: function() {
    return {
      metrics: this.metrics,
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  },
  
  /**
   * Clear all metrics
   */
  clearMetrics: function() {
    this.metrics = {};
    try {
      chrome.storage.local.remove('performanceMetrics');
    } catch (e) {
      console.debug('[Niblie PerformanceMonitor] Could not clear metrics:', e);
    }
  },
  
  /**
   * Throttle DOM operations
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Time limit in ms
   * @returns {Function} Throttled function
   */
  throttleDOMOperation: function(fn, limit = 100) {
    let inThrottle;
    let lastRan;
    
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        lastRan = Date.now();
        inThrottle = true;
        
        setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            inThrottle = false;
          }
        }, limit);
      }
    };
  }
};

// Auto-initialize
PerformanceMonitor.init();

// Export to global scope
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}
