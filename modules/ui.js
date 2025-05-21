/**
 * UI components for the extension
 */

const BadgeUI = {
  badge: null,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  mouseDownOnBadge: false,
  settings: null,
  initialized: false,
  // Store bound event handlers to prevent memory leaks
  boundHandlers: {
    drag: null,
    stopDrag: null,
    mouseEnter: null,
    mouseLeave: null
  },
  
  /**
   * Initializes badge with settings
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  init: function() {
    // Prevent multiple initializations
    if (this.initialized) {
      return Promise.resolve();
    }
    
    console.log('BadgeUI: Initializing...');
    
    // Create bound event handlers once
    if (!this.boundHandlers.drag) {
      this.boundHandlers.drag = this.drag.bind(this);
      this.boundHandlers.stopDrag = this.stopDrag.bind(this);
      this.boundHandlers.mouseEnter = () => {
        if (this.badge) {
          this.badge.style.opacity = '1';
        }
      };
      this.boundHandlers.mouseLeave = () => {
        if (this.badge && this.settings) {
          this.badge.style.opacity = (this.settings.opacity || 90) / 100;
        }
      };
    }
    
    return new Promise((resolve) => {
      const defaultSettings = {
        position: 'top-right',
        showWordCount: true,
        colorStyle: 'solid',
        badgeColor: '#4285f4',
        textColor: '#ffffff',
        opacity: 90
      };
      
      const initComplete = (settings) => {
        this.settings = settings;
        this.initialized = true;
        this.forceBadgeCreation();
        resolve();
      };
      
      // Single storage access attempt with timeout safety
      const storageTimeout = setTimeout(() => {
        console.warn('BadgeUI: Settings load timed out, using defaults');
        initComplete(defaultSettings);
      }, 1500);
      
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
          chrome.storage.sync.get('settings', (data) => {
            clearTimeout(storageTimeout);
            const settings = data && data.settings ? data.settings : defaultSettings;
            console.log('BadgeUI: Settings loaded:', settings);
            initComplete(settings);
          });
        } else if (typeof localStorage !== 'undefined') {
          clearTimeout(storageTimeout);
          try {
            const stored = localStorage.getItem('viewportCounterSettings');
            const settings = stored ? JSON.parse(stored) : defaultSettings;
            console.log('BadgeUI: Settings loaded from localStorage');
            initComplete(settings);
          } catch (e) {
            console.error('BadgeUI: localStorage error', e);
            initComplete(defaultSettings);
          }
        } else {
          clearTimeout(storageTimeout);
          console.warn('BadgeUI: No storage available');
          initComplete(defaultSettings);
        }
      } catch (error) {
        clearTimeout(storageTimeout);
        console.error('BadgeUI: Init error', error);
        initComplete(defaultSettings);
      }
    });
  },
  
  /**
   * Creates badge with guaranteed visibility
   */
  forceBadgeCreation: function() {
    // Single creation attempt with error handling
    try {
      const badge = this.createBadge();
      if (badge) {
        if (this.settings && this.settings.showWordCount !== false) {
          badge.textContent = '0 words';
        }
        this.ensureBadgeIsVisible(badge);
      }
    } catch (error) {
      console.error('BadgeUI: Force creation failed', error);
    }
  },
  
  /**
   * Ensures badge is visible
   */
  ensureBadgeIsVisible: function(badge) {
    if (!badge) return;
    
    badge.style.display = 'block';
    badge.style.visibility = 'visible';
    
    // Force repaint to ensure visibility
    void badge.offsetHeight;
  },
  
  /**
   * Creates the draggable badge
   * @returns {HTMLElement} The badge element
   */
  createBadge: function() {
    if (this.badge) {
      this.ensureBadgeIsVisible(this.badge);
      return this.badge;
    }
    
    try {
      const badge = document.createElement('div');
      badge.id = 'viewport-word-counter-badge';
      
      // Apply base styling
      this.applyStyle(badge, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#4285f4',
        color: '#ffffff',
        borderRadius: '50px',
        padding: '10px 15px',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 2147483647,
        cursor: 'move',
        userSelect: 'none',
        opacity: 0.9,
        transition: 'opacity 0.3s',
        display: 'block',
        visibility: 'visible',
        pointerEvents: 'auto'
      });
      
      // Add to DOM
      this.appendBadgeToPage(badge);
      
      // Apply full styling after badge is added to DOM
      if (this.settings) {
        this.applyFullStyling(badge);
      }
      
      // Add event listeners
      badge.addEventListener('mousedown', this.handleMouseDown.bind(this));
      badge.addEventListener('mouseenter', this.boundHandlers.mouseEnter);
      badge.addEventListener('mouseleave', this.boundHandlers.mouseLeave);
      
      this.badge = badge;
      return badge;
    } catch (error) {
      console.error('BadgeUI: Error creating badge', error);
      return null;
    }
  },
  
  /**
   * Apply style properties with !important
   * @param {HTMLElement} element - Element to style
   * @param {Object} styleProps - Style properties object
   */
  applyStyle: function(element, styleProps) {
    for (const [prop, value] of Object.entries(styleProps)) {
      // Convert camelCase to kebab-case
      const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      element.style.setProperty(cssProperty, value, 'important');
    }
  },
  
  /**
   * Appends badge to page with fallbacks
   * @param {HTMLElement} badge - Badge element
   */
  appendBadgeToPage: function(badge) {
    if (document.body) {
      document.body.appendChild(badge);
      return;
    }
    
    // If body isn't available, use DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(badge);
      });
    } else {
      // Last resort - append to documentElement
      document.documentElement.appendChild(badge);
    }
  },
  
  /**
   * Apply full styling based on settings
   * @param {HTMLElement} badge - Badge element
   */
  applyFullStyling: function(badge) {
    if (!badge || !this.settings) return;
    
    try {
      const styleProps = {};
      
      // Position
      switch(this.settings.position) {
        case 'top-left':
          this.applyStyle(badge, {
            top: '20px',
            left: '20px',
            right: 'auto',
            bottom: 'auto',
            transform: 'none'
          });
          break;
        case 'top-center':
          this.applyStyle(badge, {
            top: '20px',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translateX(-50%)'
          });
          break;
        case 'top-right':
          this.applyStyle(badge, {
            top: '20px',
            right: '20px',
            left: 'auto',
            bottom: 'auto',
            transform: 'none'
          });
          break;
        case 'middle-left':
          this.applyStyle(badge, {
            top: '50%',
            left: '20px',
            right: 'auto',
            bottom: 'auto',
            transform: 'translateY(-50%)'
          });
          break;
        case 'middle-center':
          this.applyStyle(badge, {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)'
          });
          break;
        case 'middle-right':
          this.applyStyle(badge, {
            top: '50%',
            right: '20px',
            left: 'auto',
            bottom: 'auto',
            transform: 'translateY(-50%)'
          });
          break;
        case 'bottom-left':
          this.applyStyle(badge, {
            bottom: '20px',
            left: '20px',
            right: 'auto',
            top: 'auto',
            transform: 'none'
          });
          break;
        case 'bottom-center':
          this.applyStyle(badge, {
            bottom: '20px',
            left: '50%',
            right: 'auto',
            top: 'auto',
            transform: 'translateX(-50%)'
          });
          break;
        case 'bottom-right':
          this.applyStyle(badge, {
            bottom: '20px',
            right: '20px',
            left: 'auto',
            top: 'auto',
            transform: 'none'
          });
          break;
        default:
          this.applyStyle(badge, {
            top: '20px',
            right: '20px',
            left: 'auto',
            bottom: 'auto',
            transform: 'none'
          });
      }
      
      // Background
      if (this.settings.colorStyle === 'gradient' && 
          this.settings.gradientStart && 
          this.settings.gradientEnd) {
        const angle = this.settings.gradientAngle || 45;
        const gradient = `linear-gradient(${angle}deg, ${this.settings.gradientStart}, ${this.settings.gradientEnd})`;
        this.applyStyle(badge, { background: gradient });
      } else {
        this.applyStyle(badge, { 
          backgroundColor: this.settings.badgeColor || '#4285f4'
        });
      }
      
      // Text color and opacity
      this.applyStyle(badge, {
        color: this.settings.textColor || '#ffffff',
        opacity: (this.settings.opacity || 90) / 100
      });
      
      // Empty badge styling
      if (!this.settings.showWordCount) {
        badge.textContent = '🪼';
        this.applyStyle(badge, {
          width: '32px',
          height: '32px',
          borderRadius: '50px'
        });
      }
    } catch (error) {
      console.error('BadgeUI: Error applying styling', error);
    }
  },
  
  /**
   * Updates badge with word count
   * @param {number} count - Word count
   */
  updateBadge: function(count) {
    if (!this.initialized) {
      this.init().then(() => this.updateBadge(count));
      return;
    }
    
    const badge = this.badge || this.createBadge();
    if (!badge) return;
    
    if (!this.settings || this.settings.showWordCount !== false) {
      badge.textContent = `${count} words`;
      this.applyStyle(badge, {
        padding: '10px 15px',
        width: 'auto',
        height: 'auto',
        borderRadius: '50px'
      });
    }
  },
  
  /**
   * Handles mouse down on badge
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown: function(e) {
    e.preventDefault();
    
    this.mouseDownOnBadge = true;
    this.mouseDownTime = Date.now();
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    
    this.offsetX = e.clientX - this.badge.getBoundingClientRect().left;
    this.offsetY = e.clientY - this.badge.getBoundingClientRect().top;
    
    this.badge.style.cursor = 'grabbing';
    this.isDragging = false;
    
    // Add document event listeners with stored references
    document.addEventListener('mousemove', this.boundHandlers.drag);
    document.addEventListener('mouseup', this.boundHandlers.stopDrag);
  },
  
  /**
   * Handle drag movement
   * @param {MouseEvent} e - Mouse event
   */
  drag: function(e) {
    if (!this.badge || !this.mouseDownOnBadge) return;
    
    const moveX = Math.abs(e.clientX - this.initialX);
    const moveY = Math.abs(e.clientY - this.initialY);
    
    if (moveX > 5 || moveY > 5) {
      this.isDragging = true;
    }
    
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    // Use requestAnimationFrame for smooth movement
    requestAnimationFrame(() => {
      const left = e.clientX - this.offsetX;
      const top = e.clientY - this.offsetY;
      
      // Properly handle position reset
      this.applyStyle(this.badge, {
        left: `${left}px`,
        top: `${top}px`,
        right: 'auto',
        bottom: 'auto',
        transform: 'none'
      });
    });
  },
  
  /**
   * Stop dragging and handle click
   * @param {MouseEvent} e - Mouse event
   */
  stopDrag: function(e) {
    if (!this.badge || !this.mouseDownOnBadge) return;
    
    const isClick = !this.isDragging || 
                   (Date.now() - this.mouseDownTime < 300 && 
                    Math.abs(e.clientX - this.initialX) < 10 && 
                    Math.abs(e.clientY - this.initialY) < 10);
    
    this.isDragging = false;
    this.badge.style.cursor = 'move';
    
    if (isClick && typeof ModalUI !== 'undefined') {
      try {
        ModalUI.openModal();
      } catch (error) {
        console.error('Error opening modal:', error);
      }
    }
    
    // Reset state
    this.mouseDownTime = undefined;
    this.mouseDownOnBadge = false;
    
    // Remove listeners with stored references
    document.removeEventListener('mousemove', this.boundHandlers.drag);
    document.removeEventListener('mouseup', this.boundHandlers.stopDrag);
  },
  
  /**
   * Clean up resources
   */
  destroy: function() {
    if (this.badge) {
      // Remove event listeners
      this.badge.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.badge.removeEventListener('mouseenter', this.boundHandlers.mouseEnter);
      this.badge.removeEventListener('mouseleave', this.boundHandlers.mouseLeave);
      
      // Remove from DOM
      if (this.badge.parentNode) {
        this.badge.parentNode.removeChild(this.badge);
      }
      
      this.badge = null;
    }
    
    // Clean up document event listeners
    document.removeEventListener('mousemove', this.boundHandlers.drag);
    document.removeEventListener('mouseup', this.boundHandlers.stopDrag);
    
    this.initialized = false;
  }
};

// Simple, reliable self-initialization
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BadgeUI.init.bind(BadgeUI));
  } else {
    // Small delay to ensure extension API is ready
    setTimeout(() => BadgeUI.init(), 10);
  }
})();