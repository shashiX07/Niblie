import { updateWordCount } from './word-count.js';
import { showLinkBox } from './ui.js';

/**
 * Initialize the extension
 */
export function initExtension() {
  try {
    // Delay initialization to avoid interfering with page load
    setTimeout(() => {
      // Floating draggable box
      const box = document.createElement("div");
      box.id = "live-word-count-box";
      box.innerText = "👀 Words in View: ...";
      document.body.appendChild(box);
      
      // Track if we're dragging vs clicking
      let isDragging = false, offsetX = 0, offsetY = 0;
      let hasMovedDuringDrag = false;
      
      box.addEventListener("mousedown", function (e) {
        isDragging = true;
        hasMovedDuringDrag = false;
        offsetX = e.clientX - box.getBoundingClientRect().left;
        offsetY = e.clientY - box.getBoundingClientRect().top;
        box.style.transition = "none";
        e.preventDefault(); // Prevent text selection
      });
      
      document.addEventListener("mousemove", function (e) {
        if (isDragging) {
          hasMovedDuringDrag = true;
          box.style.left = (e.clientX - offsetX) + "px";
          box.style.top = (e.clientY - offsetY) + "px";
          box.style.right = "auto"; 
          box.style.bottom = "auto";
        }
      });
      
      document.addEventListener("mouseup", function() {
        if (isDragging && !hasMovedDuringDrag) {
          showLinkBox(); // This calls our fixed showLinkBox function
        }
        isDragging = false;
      });
      
      // Set up observers
      window.addEventListener("scroll", updateWordCount);
      window.addEventListener("resize", updateWordCount);
      
      // Watch for dynamic content changes
      const observer = new MutationObserver(updateWordCount);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        characterData: true
      });
      
      // Initial word count
      setTimeout(updateWordCount, 500);
    }, 1000); // Delay extension start by 1 second
  } catch (err) {
    console.error('Error initializing extension:', err);
  }
}