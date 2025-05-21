/**
 * Content script that runs on web pages
 * Counts words in the viewport and displays them in a draggable badge
 */

// Update word count when scrolling or on DOM mutations
const updateWordCount = () => {
  // Check if we need to run word counting
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || { showWordCount: true };
    
    // Skip counting if disabled
    if (!settings.showWordCount) {
      if (typeof BadgeUI !== 'undefined') {
        BadgeUI.updateBadge(0);
      }
      return;
    }
    
    // Get the viewport text and count words
    const count = WordCounter.countWords();
    
    // Update the badge
    if (typeof BadgeUI !== 'undefined') {
      BadgeUI.updateBadge(count);
    }
  });
};

// Initialize the word counter
const initWordCounter = () => {
  console.log('Initializing WordCounter');
  
  // Initialize BadgeUI with settings
  if (typeof BadgeUI !== 'undefined') {
    BadgeUI.init().then(() => {
      // Initial count
      performWordCount();
      
      // Set up event listeners based on settings
      setupWordCountListeners();
    });
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
    
    console.log('Settings changed:', newSettings);
    
    // If word count setting changed
    if (newSettings.showWordCount !== oldSettings.showWordCount) {
      if (newSettings.showWordCount) {
        // Re-enable word counting
        console.log('Word counting enabled, setting up listeners');
        setupWordCountListeners();
        performWordCount(); // Update count immediately
      } else {
        // Just update badge to empty state if disabled
        console.log('Word counting disabled');
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
      });
    }
  }
});

// Debounce function to prevent excessive updates
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

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