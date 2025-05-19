import { debounce } from './utils.js';

/**
 * Count visible words in the current viewport
 */
export function countVisibleWords() {
  try {
    let visibleText = '';
    // Only process visible elements (optimization)
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    // Process in chunks to avoid blocking the main thread
    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    // Quick visibility check - only check parent element positions first
    for (const node of textNodes) {
      if (!node.parentElement) continue;
      
      const rect = node.parentElement.getBoundingClientRect();
      // Skip elements clearly out of view
      if (rect.bottom < 0 || rect.top > viewportHeight || 
          rect.right < 0 || rect.left > viewportWidth) {
        continue;
      }
      
      visibleText += ' ' + node.textContent;
    }
    
    return visibleText.trim().split(/\s+/).filter(Boolean).length;
  } catch (err) {
    console.error('Error counting visible words:', err);
    return 0;
  }
}

/**
 * Get a more accurate word count using NLP techniques
 * More expensive but better quality
 */
export function getAccurateWordCount() {
  try {
    // Get all visible text
    let visibleText = '';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (isNodeVisible(node)) {
        visibleText += ' ' + node.textContent;
      }
    }
    
    // Clean up the text
    visibleText = visibleText
      .replace(/[\n\r\t]+/g, ' ')      // Replace newlines/tabs with space
      .replace(/\s+/g, ' ')            // Normalize spaces
      .replace(/[^\w\s.,?!;:()'"]/g, '') // Remove special characters except common punctuation
      .trim();
      
    // Split by whitespace and filter out empty strings
    return visibleText.split(/\s+/).filter(Boolean).length;
  } catch (err) {
    console.error('Error getting accurate word count:', err);
    return countVisibleWords(); // Fall back to basic count
  }
}

/**
 * Check if a text node is visible
 */
function isNodeVisible(node) {
  if (!node || !node.parentElement) return false;
  
  const style = window.getComputedStyle(node.parentElement);
  if (style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0' ||
      style.fontSize === '0px') {
    return false;
  }
  
  // Check if in viewport
  const rect = node.parentElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return !(rect.bottom < 0 || rect.top > viewportHeight || 
           rect.right < 0 || rect.left > viewportWidth);
}

// Create debounced versions of our functions
export const debouncedUpdateWordCount = debounce(function() {
  const count = countVisibleWords();
  const box = document.getElementById("live-word-count-box");
  if (box) box.innerText = `👀 Words in View: ${count}`;
}, 300);

export function updateWordCount() {
  // Use the debounced version for performance
  debouncedUpdateWordCount();
}