/**
 * Main entry point for the extension
 * Uses dynamic imports for better performance and code splitting
 */

// Add the stylesheet first for immediate styling
const style = document.createElement('style');
style.textContent = `
  #live-word-count-box {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #0073e6;
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    user-select: none;
    transition: background-color 0.2s;
  }
  #live-word-count-box:hover {
    background: #0066cc;
  }
`;
document.head.appendChild(style);

// Initialize when the DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtension);
} else {
  initExtension();
}

/**
 * Initialize the extension
 * Uses dynamic imports to load modules only when needed
 */
function initExtension() {
  try {
    // Delay initialization to avoid interfering with page load
    setTimeout(() => {
      import('./modules/core.js')
        .then(module => {
          module.initExtension();
        })
        .catch(error => {
          console.error('Failed to initialize extension:', error);
          
          // Fallback to minimal functionality if module loading fails
          createMinimalWordCounter();
        });
    }, 1000);
  } catch (err) {
    console.error('Error initializing extension:', err);
    createMinimalWordCounter();
  }
}

/**
 * Minimal word counter as fallback if module loading fails
 */
function createMinimalWordCounter() {
  // Create floating box
  const box = document.createElement("div");
  box.id = "live-word-count-box";
  box.innerText = "👀 Words in View: ...";
  document.body.appendChild(box);
  
  // Simple word counting
  function countWords() {
    try {
      const text = document.body.innerText || '';
      const count = text.trim().split(/\s+/).filter(Boolean).length;
      box.innerText = `👀 Words in View: ${count}`;
    } catch (err) {
      box.innerText = `👀 Words: Error`;
    }
  }
  
  // Add click handler to show alert
  box.addEventListener('click', () => {
    alert('Extension is running in minimal mode due to an error loading modules.');
  });
  
  // Set up basic observers
  window.addEventListener('scroll', countWords);
  window.addEventListener('resize', countWords);
  setTimeout(countWords, 500);
}
