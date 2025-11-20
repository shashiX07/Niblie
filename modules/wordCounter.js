/**
 * Advanced word counter module with improved accuracy and performance
 */

const WordCounter = {
  // Cache for enabled state
  isEnabled: true,
  
  /**
   * Initialize word counter with settings
   */
  init: async function() {
    try {
      // Check if SettingsManager is available
      if (typeof SettingsManager !== 'undefined') {
        const settings = await SettingsManager.get();
        this.isEnabled = settings.showWordCount !== false;
      } else {
        // Fallback to chrome.storage
        chrome.storage.sync.get('settings', (data) => {
          const settings = data.settings || {};
          this.isEnabled = settings.showWordCount !== false;
        });
      }
    } catch (error) {
      console.error('[Niblie WordCounter] Init error:', error);
      this.isEnabled = true; // Default to enabled
    }
  },
  
  /**
   * Gets visible text from the current viewport with improved element detection
   * @returns {string} Text content visible in viewport
   */
  getVisibleText: function() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // More efficient selector - only get text elements
    const selector = 'p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label';
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
   * Counts words in a given text string with improved accuracy
   * @param {string} text - Text to count words in
   * @returns {number} Word count
   */
  _countWordsInText: function(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Unicode-aware word boundary pattern
    // This handles:
    // - Normal words (with letters from any language)
    // - Hyphenated words (count as one word)
    // - Contractions (don't, isn't, etc.)
    // - Numbers (including those with decimal points or commas)
    
    // First, normalize whitespace and remove extra spaces
    const normalizedText = text.trim().replace(/\s+/g, ' ');
    
    if (normalizedText === '') return 0;
    
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
    return this._countWordsInText(visibleText);
  },
  
  /**
   * Analyzes text and returns detailed statistics
   * @param {string} text - Text to analyze
   * @returns {Object} Text statistics
   */
  getTextStatistics: function(text) {
    if (!text) return { wordCount: 0, charCount: 0, avgWordLength: 0 };
    
    const wordCount = this._countWordsInText(text);
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
   * Main entry point - count words in viewport
   * Respects settings to enable/disable counting
   * @returns {number} Number of words visible in viewport (0 if disabled)
   */
  countWords: function() {
    try {
      // Check if word counting is enabled
      if (!this.isEnabled) {
        return 0;
      }
      
      // Get word count
      const count = this.getViewportWordCount();
      return count;
    } catch (error) {
      console.error('[Niblie WordCounter] Error counting words:', error);
      if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.logError({
          type: 'word-counter',
          message: error.message,
          error
        });
      }
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

// Export WordCounter to global scope
if (typeof window !== 'undefined') {
  window.WordCounter = WordCounter;
}