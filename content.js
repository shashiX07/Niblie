/**
 * Content script that runs on web pages
 * Counts words in the viewport and displays them in a draggable badge
 */

// Update word count when scrolling or on DOM mutations
const updateWordCount = () => {
  try {
    // Check WordCounter enabled state
    if (typeof WordCounter !== 'undefined') {
      // WordCounter.countWords() already checks isEnabled internally
      const count = WordCounter.countWords();
      
      // Update the badge
      if (typeof BadgeUI !== 'undefined') {
        BadgeUI.updateBadge(count);
      }
    }
  } catch (error) {
    console.error('[Niblie] Error in updateWordCount:', error);
  }
};

// Initialize the word counter with error handling
const initWordCounter = async () => {
  try {
    console.log('[Niblie] Initializing WordCounter');
    
    // Check if required modules are loaded
    if (typeof BadgeUI === 'undefined') {
      console.error('[Niblie] BadgeUI module not found');
      return;
    }
    
    if (typeof WordCounter === 'undefined') {
      console.error('[Niblie] WordCounter module not found');
      return;
    }
    
    // Initialize WordCounter with settings first
    if (WordCounter.init) {
      await WordCounter.init();
    }
    
    // Initialize BadgeUI with settings
    BadgeUI.init().then(() => {
      // Initial count
      performWordCount();
      
      // Set up event listeners based on settings
      setupWordCountListeners();
    }).catch(error => {
      console.error('[Niblie] BadgeUI initialization failed:', error);
    });
  } catch (error) {
    console.error('[Niblie] WordCounter initialization error:', error);
  }
};

// Perform actual word counting
const performWordCount = () => {
  if (typeof WordCounter === 'undefined') {
    console.error('WordCounter module not found');
    return;
  }
  
  const count = WordCounter.countWords();
  console.log('Word count:', count);
  
  if (typeof BadgeUI !== 'undefined') {
    BadgeUI.updateBadge(count);
  }
};

// Set up listeners for word count updates
const setupWordCountListeners = () => {
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || { showWordCount: true };
    
    // Only set up listeners if word counting is enabled
    if (settings.showWordCount) {
      console.log('Setting up word count listeners');
      
      // Throttled scroll and resize handlers
      window.addEventListener('scroll', debounce(performWordCount, 300));
      window.addEventListener('resize', debounce(performWordCount, 300));
      
      // Watch for content changes
      const observer = new MutationObserver(debounce(performWordCount, 300));
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true,
        attributes: false
      });
    }
  });
};

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.settings) {
    const newSettings = changes.settings.newValue;
    const oldSettings = changes.settings.oldValue || {};
    
    console.log('[Niblie] Settings changed:', newSettings);
    
    // If word count setting changed
    if (newSettings.showWordCount !== oldSettings.showWordCount) {
      // Update WordCounter enabled state
      if (typeof WordCounter !== 'undefined') {
        WordCounter.isEnabled = newSettings.showWordCount;
      }
      
      if (newSettings.showWordCount) {
        // Re-enable word counting
        console.log('[Niblie] Word counting enabled, setting up listeners');
        setupWordCountListeners();
        performWordCount(); // Update count immediately
      } else {
        // Just update badge to empty state if disabled
        console.log('[Niblie] Word counting disabled');
        if (typeof BadgeUI !== 'undefined') {
          BadgeUI.updateBadge(0);
        }
      }
    }
    
    // Refresh BadgeUI with new settings
    if (typeof BadgeUI !== 'undefined') {
      BadgeUI.init().then(() => {
        if (newSettings.showWordCount) {
          performWordCount(); // Update badge immediately
        }
        // Restart floating particles if settings changed
        if (newSettings.enableFloatingParticles !== oldSettings.enableFloatingParticles ||
            newSettings.particleType !== oldSettings.particleType ||
            newSettings.particleFrequency !== oldSettings.particleFrequency ||
            newSettings.particleSpeed !== oldSettings.particleSpeed) {
          BadgeUI.restartFloatingParticles();
        }
      });
    }
  }
});

// Use debounce from CoreUtils if available, otherwise create a simple one
const debounce = (typeof CoreUtils !== 'undefined' && CoreUtils.debounce) ? 
  CoreUtils.debounce : 
  function(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

// Start the app when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded - initializing word counter');
  initWordCounter();
});

// Also try to initialize now in case DOM is already loaded
if (document.readyState !== 'loading') {
  console.log('Document already loaded - initializing word counter');
  initWordCounter();
}

// Ensure modules are registered after page load
window.addEventListener('load', function() {
  console.log('Checking for module registration on page load');
  
  if (typeof TableFinder === 'undefined' || typeof TableUI === 'undefined') {
    console.warn('Table modules not found, attempting to re-register');
    
    // Check if the registration function exists in the global scope
    if (typeof registerModules === 'function') {
      registerModules();
    }
  }
});