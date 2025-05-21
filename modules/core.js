
/**
 * Core functionality for word counting
 */

const WordCounter = {
  /**
   * Gets visible text from the current viewport
   * @returns {string} Text content visible in viewport
   */
  getVisibleText: function() {
    const viewportHeight = window.innerHeight;
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, a');
    let visibleText = '';
    
    // Filter for elements currently visible in the viewport
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      // Check if element is in viewport
      if (rect.top >= 0 && rect.bottom <= viewportHeight) {
        visibleText += ' ' + element.textContent;
      }
      // Element partially in viewport
      else if ((rect.top < viewportHeight && rect.bottom > 0)) {
        visibleText += ' ' + element.textContent;
      }
    });
    
    return visibleText;
  },
  
  /**
   * Counts words in a given text
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  countWords: function(text) {
    if (!text) return 0;
    
    // Remove special characters and extra spaces
    const cleanText = text.trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
    const words = cleanText.split(' ').filter(word => word.length > 0);
    
    return words.length;
  },
  
  /**
   * Gets current word count in viewport
   * @returns {number} Word count
   */
  getViewportWordCount: function() {
    const visibleText = this.getVisibleText();
    return this.countWords(visibleText);
  }
};