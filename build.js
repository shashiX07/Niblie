/**
 * Simple module initialization helper
 */

// Initialize modules when this script is loaded
(function() {
  console.log('Viewport Word Counter: Initializing modules');
  
  // Check that required modules are loaded
  if (typeof WordCounter === 'undefined') {
    console.error('WordCounter module not found');
    return;
  }
  
  if (typeof BadgeUI === 'undefined') {
    console.error('BadgeUI module not found');
    return;
  }
  
  if (typeof LinkFinder === 'undefined') {
    console.error('LinkFinder module not found');
    return;
  }
  
  if (typeof ImageFinder === 'undefined') {
    console.error('ImageFinder module not found');
    return;
  }
  
  if (typeof ModalUI === 'undefined') {
    console.error('ModalUI module not found');
    return;
  }
  
  // Initialize BadgeUI with settings
  BadgeUI.init().then(() => {
    // Initial word count
    const count = WordCounter.countWords();
    BadgeUI.updateBadge(count);
    
    console.log('Viewport Word Counter: Initialization complete');
  });
})();