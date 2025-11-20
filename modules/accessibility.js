/**
 * Accessibility Enhancements for Niblie Extension
 * Improves usability for all users including those with disabilities
 */

const AccessibilityHelper = {
  /**
   * Initialize accessibility features
   */
  init: function() {
    console.log('[Niblie Accessibility] Initializing...');
    
    // Add ARIA labels to dynamically created elements
    this.enhanceDynamicElements();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Add focus management
    this.setupFocusManagement();
  },
  
  /**
   * Enhance dynamically created elements with ARIA attributes
   */
  enhanceDynamicElements: function() {
    // Observer to add ARIA labels to new elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            this.addAriaLabels(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
  
  /**
   * Add appropriate ARIA labels to an element
   * @param {HTMLElement} element - Element to enhance
   */
  addAriaLabels: function(element) {
    // Badge
    if (element.id === 'viewport-word-counter-badge') {
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-label', 'Word count badge');
      element.setAttribute('tabindex', '0');
    }
    
    // Modal
    if (element.id === 'niblie-modal') {
      element.setAttribute('role', 'dialog');
      element.setAttribute('aria-modal', 'true');
      element.setAttribute('aria-label', 'Niblie content analyzer');
    }
    
    // Buttons without labels
    const buttons = element.querySelectorAll('button:not([aria-label])');
    buttons.forEach(btn => {
      if (!btn.textContent.trim() && btn.title) {
        btn.setAttribute('aria-label', btn.title);
      }
    });
    
    // Images without alt text
    const images = element.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      img.setAttribute('alt', img.title || 'Image');
    });
  },
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation: function() {
    document.addEventListener('keydown', (e) => {
      // ESC to close modal
      if (e.key === 'Escape' && typeof ModalUI !== 'undefined') {
        ModalUI.closeModal();
      }
      
      // Alt+N to open/close modal
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        if (typeof ModalUI !== 'undefined') {
          if (ModalUI.isOpen) {
            ModalUI.closeModal();
          } else {
            ModalUI.openModal();
          }
        }
      }
      
      // Tab trap in modal
      if (e.key === 'Tab' && typeof ModalUI !== 'undefined' && ModalUI.isOpen) {
        this.handleModalTabbing(e);
      }
    });
  },
  
  /**
   * Handle tab navigation within modal
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleModalTabbing: function(e) {
    const modal = document.getElementById('niblie-modal');
    if (!modal) return;
    
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Shift+Tab on first element - go to last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tab on last element - go to first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  },
  
  /**
   * Setup focus management
   */
  setupFocusManagement: function() {
    let lastFocusedElement = null;
    
    // Store last focused element before modal opens
    document.addEventListener('click', (e) => {
      const modal = document.getElementById('niblie-modal');
      if (modal && modal.contains(e.target)) return;
      
      lastFocusedElement = document.activeElement;
    });
    
    // Focus first element when modal opens
    const originalOpenModal = typeof ModalUI !== 'undefined' ? ModalUI.openModal : null;
    if (originalOpenModal) {
      ModalUI.openModal = function() {
        lastFocusedElement = document.activeElement;
        originalOpenModal.call(ModalUI);
        
        setTimeout(() => {
          const modal = document.getElementById('niblie-modal');
          if (modal) {
            const firstFocusable = modal.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (firstFocusable) {
              firstFocusable.focus();
            }
          }
        }, 100);
      };
    }
    
    // Restore focus when modal closes
    const originalCloseModal = typeof ModalUI !== 'undefined' ? ModalUI.closeModal : null;
    if (originalCloseModal) {
      ModalUI.closeModal = function() {
        originalCloseModal.call(ModalUI);
        
        if (lastFocusedElement && lastFocusedElement !== document.body) {
          setTimeout(() => {
            lastFocusedElement.focus();
          }, 100);
        }
      };
    }
  },
  
  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announce: function(message, priority = 'polite') {
    let announcer = document.getElementById('niblie-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'niblie-announcer';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', priority);
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
    }
    
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  },
  
  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if reduced motion preferred
   */
  prefersReducedMotion: function() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * Check if user prefers dark mode
   * @returns {boolean} True if dark mode preferred
   */
  prefersDarkMode: function() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  /**
   * Add high contrast mode support
   */
  addHighContrastSupport: function() {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.documentElement.classList.add('niblie-high-contrast');
    }
  }
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AccessibilityHelper.init());
} else {
  AccessibilityHelper.init();
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.AccessibilityHelper = AccessibilityHelper;
}
