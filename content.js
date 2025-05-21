/**
 * Content script that runs on web pages
 * Counts words in the viewport and displays them in a draggable badge
 */

// Update word count when scrolling or on DOM mutations
const updateWordCount = () => {
  // Use the improved word counter
  const count = ImprovedWordCounter.getViewportWordCount();
  BadgeUI.updateBadge(count);
};

// Initialize the word counter
const initWordCounter = () => {
  console.log('Viewport Word Counter: Initializing content script');
  
  // Create badge immediately
  setTimeout(() => {
    updateWordCount();
    console.log('Initial word count updated');
  }, 500); // Small delay to ensure DOM is fully processed
  
  // Update on scroll with improved debouncing
  window.addEventListener('scroll', debounce(updateWordCount, 300));
  
  // Update on resize
  window.addEventListener('resize', debounce(updateWordCount, 300));
  
  // Update on DOM changes with more specific targeting
  const observer = new MutationObserver(mutations => {
    // Only update if text content changed
    const hasTextChange = mutations.some(mutation => 
      mutation.type === 'characterData' || 
      mutation.type === 'childList'
    );
    
    if (hasTextChange) {
      debounce(updateWordCount, 300)();
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true 
  });
  
  console.log('Viewport Word Counter: Observers initialized');
};

// Improved debounce function with immediate option
function debounce(func, delay, immediate = false) {
  let timeout;
  return function(...args) {
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    }, delay);
    
    if (callNow) func.apply(this, args);
  };
}

// Run when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWordCounter);
} else {
  initWordCounter();
}