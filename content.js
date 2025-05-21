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
  window.addEventListener('scroll', debounce(updateWordCount, 500)); // Longer delay for scroll
  
  // Update on resize
  window.addEventListener('resize', debounce(updateWordCount, 500)); // Longer delay for resize
  
  // Update on DOM changes with more specific targeting
  const observer = new MutationObserver(debounce(() => {
    updateWordCount();
  }, 500));
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true,
    attributes: false // Don't watch attributes for better performance
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