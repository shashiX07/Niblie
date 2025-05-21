/**
 * Advanced word counter module with improved accuracy
 */

const ImprovedWordCounter = {
  /**
   * Gets visible text from the current viewport with improved element detection
   * @returns {string} Text content visible in viewport
   */
  getVisibleText: function() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Select all text-containing elements but exclude scripts, styles, and hidden elements
    const elements = Array.from(document.body.querySelectorAll('*')).filter(el => {
      // Skip script, style, and non-visible elements
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || 
          el.tagName === 'NOSCRIPT' || el.tagName === 'META') {
        return false;
      }
      
      // Skip elements with no text or only whitespace
      if (!el.textContent || el.textContent.trim() === '') {
        return false;
      }
      
      // Skip hidden elements
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || 
          style.opacity === '0' || parseFloat(style.opacity) === 0) {
        return false;
      }
      
      return true;
    });
    
    let visibleText = '';
    
    // Process elements to extract visible text
    elements.forEach(element => {
      // Skip if the element has no direct text (only child elements with text)
      if (!this._hasDirectTextNodes(element)) {
        return;
      }
      
      const rect = element.getBoundingClientRect();
      
      // Check if element is in viewport
      if ((rect.top >= 0 && rect.top <= viewportHeight && 
           rect.left >= 0 && rect.left <= viewportWidth) ||
          // Element partially in viewport
          (rect.bottom > 0 && rect.top < viewportHeight &&
           rect.right > 0 && rect.left < viewportWidth)) {
        
        // Get direct text content (not from child elements)
        const directText = this._getDirectTextContent(element);
        if (directText.trim()) {
          visibleText += ' ' + directText;
        }
      }
    });
    
    return visibleText;
  },
  
  /**
   * Check if an element has direct text nodes (not just child elements)
   * @param {Element} element - DOM element to check
   * @returns {boolean} True if element has direct text nodes
   */
  _hasDirectTextNodes: function(element) {
    return Array.from(element.childNodes)
      .some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');
  },
  
  /**
   * Get only the direct text content of an element (not from child elements)
   * @param {Element} element - DOM element to extract text from
   * @returns {string} Direct text content
   */
  _getDirectTextContent: function(element) {
    return Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent)
      .join(' ');
  },
  
  /**
   * Counts words in a given text with improved accuracy
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  countWords: function(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Unicode-aware word boundary pattern
    // This handles:
    // - Normal words (with letters from any language)
    // - Hyphenated words (count as one word)
    // - Contractions (don't, isn't, etc.)
    // - Numbers (including those with decimal points or commas)
    
    // First, normalize whitespace and remove extra spaces
    const normalizedText = text.trim().replace(/\s+/g, ' ');
    
    // Split by whitespace to get raw word count
    const rawWords = normalizedText.split(/\s+/);
    
    // Filter out non-words (e.g., lone punctuation)
    const words = rawWords.filter(word => {
      // Keep if contains at least one letter or number
      return /[\p{L}\p{N}]/u.test(word);
    });
    
    return words.length;
  },
  
  /**
   * Gets current word count in viewport using improved algorithm
   * @returns {number} Word count
   */
  getViewportWordCount: function() {
    const visibleText = this.getVisibleText();
    return this.countWords(visibleText);
  },
  
  /**
   * Analyzes text and returns detailed statistics
   * @param {string} text - Text to analyze
   * @returns {Object} Text statistics
   */
  getTextStatistics: function(text) {
    if (!text) return { wordCount: 0, charCount: 0, avgWordLength: 0 };
    
    const wordCount = this.countWords(text);
    const charCount = text.length;
    const avgWordLength = wordCount > 0 ? 
      Math.round((charCount / wordCount) * 10) / 10 : 0;
    
    return {
      wordCount,
      charCount,
      avgWordLength
    };
  }
};

// For backward compatibility, also expose through WordCounter
window.WordCounter = ImprovedWordCounter;