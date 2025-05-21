/**
 * Simple module initialization helper
 */

// Initialize modules when this script is loaded
(function() {
  console.log('Viewport Word Counter: Initializing modules');
  
  // Check that required modules are loaded
  if (typeof WordCounter === 'undefined') {
    console.error('Error: WordCounter module not loaded');
  }
  
  if (typeof BadgeUI === 'undefined') {
    console.error('Error: BadgeUI module not loaded');
  }
  
  if (typeof LinkFinder === 'undefined') {
    console.error('Error: LinkFinder module not loaded');
  }
  
  if (typeof ModalUI === 'undefined') {
    console.error('Error: ModalUI module not loaded');
  }
  
  // You could add version checking or other simple module setup here
  console.log('Modules initialized successfully');
})();