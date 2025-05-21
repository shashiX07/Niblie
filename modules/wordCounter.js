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
    
    // More efficient selector - only get text elements
    const selector = 'p, h1, h2, h3, h4, h5, h6, li, td, th, span, div:not(:has(*))';
    const elements = document.querySelectorAll(selector);
    let visibleText = '';
    
    // Process elements with better performance
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      
      // Skip hidden elements faster
      if (element.offsetParent === null || element.clientHeight === 0) continue;
      
      // More efficient viewport check
      const rect = element.getBoundingClientRect();
      if ((rect.bottom < 0 || rect.top > viewportHeight || 
           rect.right < 0 || rect.left > viewportWidth)) continue;
          
      // Get text directly
      visibleText += ' ' + element.textContent;
    }
    
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
  },
  
  /**
   * Count words in the current viewport
   * @returns {number} Number of words visible in viewport
   */
  countWords: function() {
    try {
      // Get all text nodes in the viewport
      const textNodes = this._getVisibleTextNodes();
      
      // Extract text content from visible nodes
      let text = '';
      for (const node of textNodes) {
        text += ' ' + node.textContent;
      }
      
      // Count words using regex
      const wordCount = (text.trim().match(/\S+/g) || []).length;
      console.log(`WordCounter: Found ${wordCount} words in viewport`);
      
      return wordCount;
    } catch (error) {
      console.error('WordCounter: Error counting words', error);
      return 0;
    }
  },
  
  /**
   * Get all text nodes that are currently visible in the viewport
   * @returns {Array} Array of visible text nodes
   * @private
   */
  _getVisibleTextNodes: function() {
    // Implementation will vary based on your needs
    // Here's a simple one that gets text nodes from visible elements
    const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      // Check if element is visible and within viewport
      return rect.width > 0 && 
             rect.height > 0 && 
             rect.top < window.innerHeight &&
             rect.bottom > 0 &&
             rect.left < window.innerWidth &&
             rect.right > 0 &&
             style.display !== 'none' &&
             style.visibility !== 'hidden' &&
             parseFloat(style.opacity) > 0;
    });
    
    // Extract text nodes
    const textNodes = [];
    for (const el of visibleElements) {
      this._extractTextNodes(el, textNodes);
    }
    
    return textNodes;
  },
  
  /**
   * Recursively extract text nodes from an element
   * @param {HTMLElement} element - Element to extract text nodes from
   * @param {Array} result - Array to store text nodes
   * @private
   */
  _extractTextNodes: function(element, result) {
    if (!element) return;
    
    // Check if it's a text node
    if (element.nodeType === Node.TEXT_NODE && element.textContent.trim().length > 0) {
      result.push(element);
      return;
    }
    
    // Skip invisible elements
    if (element.nodeType === Node.ELEMENT_NODE) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
        return;
      }
    }
    
    // Recursively process child nodes
    for (const child of element.childNodes) {
      this._extractTextNodes(child, result);
    }
  }
};

// For backward compatibility, also expose through WordCounter
window.WordCounter = ImprovedWordCounter;