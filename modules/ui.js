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
        opacity: 90,
        useCuteTheme: true, // Enable cute theme by default
        cuteThemeStyle: 'kawaii', // Default cute style
        enableAnimations: true // Enable animations
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
      
      // Apply base styling - more rounded, softer shadows for cute look
      this.applyStyle(badge, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: this.settings?.useCuteTheme ? '#FF86C8' : '#4285f4', // Pink for cute theme
        color: '#ffffff',
        borderRadius: '18px', // More rounded corners
        padding: '10px 18px',
        fontSize: '14px',
        fontFamily: this.settings?.useCuteTheme ? "'Comic Sans MS', 'Marker Felt', Arial, sans-serif" : 'Arial, sans-serif',
        boxShadow: this.settings?.useCuteTheme ? '0 4px 15px rgba(255, 134, 200, 0.4)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 2147483647,
        cursor: 'move',
        userSelect: 'none',
        opacity: 0.95,
        transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)', // Bouncy transition for cute theme
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: this.settings?.useCuteTheme ? '2px solid #ffffff' : 'none',
        visibility: 'visible',
        pointerEvents: 'auto'
      });
      
      // Add to DOM
      this.appendBadgeToPage(badge);
      
      // Apply full styling after badge is added to DOM
      if (this.settings) {
        this.applyFullStyling(badge);
      } else {
        // If no settings yet, add default content
        if (this.settings?.useCuteTheme) {
          badge.innerHTML = '<span class="badge-icon">📝</span><span class="badge-text">0 words</span>';
        } else {
          badge.textContent = '0 words';
        }
      }
      
      // Add event listeners
      badge.addEventListener('mousedown', this.handleMouseDown.bind(this));
      badge.addEventListener('mouseenter', this.boundHandlers.mouseEnter);
      badge.addEventListener('mouseleave', this.boundHandlers.mouseLeave);
      
      this.badge = badge;
      
      // Add animation styles
      this.addAnimationStyles();
      
      // Start animations if enabled
      if (this.settings?.enableAnimations) {
        this.startPeriodicAnimations();
      }
      
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
      // Position handling (keep your existing code)
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
      
      // Apply cute theme if enabled
      if (this.settings.useCuteTheme) {
        const cuteThemes = {
          'kawaii': {
            backgroundColor: '#FF86C8', // Pink
            textColor: '#ffffff',
            font: "'Comic Sans MS', 'Marker Felt', Arial, sans-serif",
            border: '2px solid #ffffff',
            emoji: '📝'
          },
          'pastel': {
            backgroundColor: '#A5DEF1', // Light blue
            textColor: '#ffffff',
            font: "'Quicksand', 'Varela Round', sans-serif",
            border: '2px solid #ffffff',
            emoji: '✏️'
          },
          'bubbly': {
            backgroundColor: '#9ED9CC', // Mint
            textColor: '#ffffff',
            font: "'Baloo 2', 'Comic Sans MS', sans-serif",
            border: '2px solid #ffffff',
            emoji: '📚'
          }
        };
        
        const theme = cuteThemes[this.settings.cuteThemeStyle || 'kawaii'];
        
        this.applyStyle(badge, {
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          fontFamily: theme.font,
          border: theme.border,
          boxShadow: `0 4px 15px ${theme.backgroundColor}66`
        });
        
        // Update badge content
        if (!this.settings.showWordCount) {
          badge.innerHTML = `<span class="badge-icon">${theme.emoji}</span>`;
          this.applyStyle(badge, {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          });
        } else {
          badge.innerHTML = `<span class="badge-icon">${theme.emoji}</span><span class="badge-text">0 words</span>`;
        }
      } else {
        // Original styling for non-cute theme
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
          opacity: (this.settings.opacity || 90) / 100,
          border: 'none'
        });
        
        // Empty badge styling
        if (!this.settings.showWordCount) {
          badge.textContent = '📊';
          this.applyStyle(badge, {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0'
          });
        }
      }
    } catch (error) {
      console.error('BadgeUI: Error applying styling', error);
    }
  },
  
  /**
   * Updates badge with word count and cute styling
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
      // If cute theme is enabled, add emoji and styled text
      if (this.settings?.useCuteTheme) {
        // Define cute theme styles
        const cuteThemes = {
          'kawaii': { emoji: '📝', color: '#FF86C8', border: '2px solid #ffffff' },
          'pastel': { emoji: '✏️', color: '#A5DEF1', border: '2px solid #ffffff' },
          'bubbly': { emoji: '📚', color: '#9ED9CC', border: '2px solid #ffffff' }
        };
        
        // Get selected theme or default to kawaii
        const theme = cuteThemes[this.settings?.cuteThemeStyle || 'kawaii'];
        
        // Update badge content with emoji
        badge.innerHTML = `<span class="badge-icon">${theme.emoji}</span><span class="badge-text">${count} words</span>`;
        
        // Apply theme styling
        this.applyStyle(badge, {
          backgroundColor: theme.color,
          border: theme.border,
          padding: '10px 18px',
          width: 'auto',
          height: 'auto',
          borderRadius: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        });
        
        // Style the icon and text
        const iconElement = badge.querySelector('.badge-icon');
        const textElement = badge.querySelector('.badge-text');
        
        if (iconElement) {
          this.applyStyle(iconElement, {
            fontSize: '16px',
            display: 'inline-block'
          });
        }
        
        if (textElement) {
          this.applyStyle(textElement, {
            marginLeft: '4px',
            fontFamily: "'Comic Sans MS', 'Marker Felt', Arial, sans-serif"
          });
        }
        
        // Possibly trigger a cute animation on update if count changed
        if (this.lastCount !== count && this.settings?.enableAnimations) {
          this.playPulseAnimation();
        }
      } else {
        // Standard non-cute styling
        badge.textContent = `${count} words`;
        this.applyStyle(badge, {
          padding: '10px 15px',
          width: 'auto',
          height: 'auto',
          borderRadius: '50px',
          fontFamily: 'Arial, sans-serif'
        });
      }
    } else {
      // If word count is disabled, just show an icon
      if (this.settings?.useCuteTheme) {
        const cuteThemes = {
          'kawaii': { emoji: '📝', color: '#FF86C8' },
          'pastel': { emoji: '✏️', color: '#A5DEF1' },
          'bubbly': { emoji: '📚', color: '#9ED9CC' }
        };
        
        const theme = cuteThemes[this.settings.cuteThemeStyle || 'kawaii'];
        badge.innerHTML = `<span class="badge-icon">${theme.emoji}</span>`;
        
        this.applyStyle(badge, {
          backgroundColor: theme.color,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        });
      } else {
        badge.textContent = '📊';
        this.applyStyle(badge, {
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        });
      }
    }
    
    // Check for milestone and store last count
    this.checkForMilestone(count);
    this.lastCount = count;

    // Start animations if enabled and not already running
    if (this.settings?.enableAnimations && !this.animationInterval) {
      this.startPeriodicAnimations();
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
    
    // Clear animation interval
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    
    this.initialized = false;
  },
  
  /**
   * Add animation styles to page
   */
  addAnimationStyles: function() {
    // If styles are already added, don't add them again
    if (document.getElementById('badge-animation-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'badge-animation-styles';
    styleSheet.textContent = `
      @keyframes badgePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }
      
      @keyframes badgeWiggle {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        50% { transform: rotate(0deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
      }
      
      @keyframes badgeSparkle {
        0% { filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7)); }
        50% { filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9)); }
        100% { filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7)); }
      }
      
      @keyframes iconBounce {
        0% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
        100% { transform: translateY(0); }
      }
      
      .badge-animation-pulse {
        animation: badgePulse 1s ease-in-out;
      }
      
      .badge-animation-wiggle {
        animation: badgeWiggle 0.5s ease-in-out;
      }
      
      .badge-animation-sparkle {
        animation: badgeSparkle 1s ease-in-out;
      }
      
      .badge-icon.bounce {
        animation: iconBounce 0.5s ease-in-out;
      }
    `;
    
    document.head.appendChild(styleSheet);
  },
  
  /**
   * Start periodic animations for engagement
   */
  startPeriodicAnimations: function() {
    if (!this.settings?.enableAnimations) return;
    
    // Clear any existing animation intervals
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    // Create random animation sequence
    this.animationInterval = setInterval(() => {
      if (!this.badge || !document.body.contains(this.badge)) {
        clearInterval(this.animationInterval);
        return;
      }
      
      // Choose a random animation
      const animations = ['pulse', 'wiggle', 'sparkle', 'iconBounce'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      
      switch(randomAnimation) {
        case 'pulse':
          this.playPulseAnimation();
          break;
        case 'wiggle':
          this.playWiggleAnimation();
          break;
        case 'sparkle':
          this.playSparkleAnimation();
          break;
        case 'iconBounce':
          this.playIconBounceAnimation();
          break;
      }
    }, 15000); // Run an animation every 15 seconds
  },
  
  /**
   * Play pulse animation
   */
  playPulseAnimation: function() {
    if (!this.badge) return;
    
    // Remove any existing animation classes
    this.badge.classList.remove('badge-animation-wiggle', 'badge-animation-sparkle');
    
    // Force repaint
    void this.badge.offsetWidth;
    
    // Add pulse animation class
    this.badge.classList.add('badge-animation-pulse');
    
    // Remove class after animation completes
    setTimeout(() => {
      if (this.badge) {
        this.badge.classList.remove('badge-animation-pulse');
      }
    }, 1000);
  },
  
  /**
   * Play wiggle animation
   */
  playWiggleAnimation: function() {
    if (!this.badge) return;
    
    // Remove any existing animation classes
    this.badge.classList.remove('badge-animation-pulse', 'badge-animation-sparkle');
    
    // Force repaint
    void this.badge.offsetWidth;
    
    // Add wiggle animation class
    this.badge.classList.add('badge-animation-wiggle');
    
    // Remove class after animation completes
    setTimeout(() => {
      if (this.badge) {
        this.badge.classList.remove('badge-animation-wiggle');
      }
    }, 500);
  },
  
  /**
   * Play sparkle animation
   */
  playSparkleAnimation: function() {
    if (!this.badge) return;
    
    // Remove any existing animation classes
    this.badge.classList.remove('badge-animation-pulse', 'badge-animation-wiggle');
    
    // Force repaint
    void this.badge.offsetWidth;
    
    // Add sparkle animation class
    this.badge.classList.add('badge-animation-sparkle');
    
    // Remove class after animation completes
    setTimeout(() => {
      if (this.badge) {
        this.badge.classList.remove('badge-animation-sparkle');
      }
    }, 1000);
  },
  
  /**
   * Play icon bounce animation
   */
  playIconBounceAnimation: function() {
    if (!this.badge) return;
    
    const iconElement = this.badge.querySelector('.badge-icon');
    if (!iconElement) return;
    
    // Remove bounce class if it exists
    iconElement.classList.remove('bounce');
    
    // Force repaint
    void iconElement.offsetWidth;
    
    // Add bounce class
    iconElement.classList.add('bounce');
    
    // Remove class after animation completes
    setTimeout(() => {
      if (iconElement) {
        iconElement.classList.remove('bounce');
      }
    }, 500);
  },
  
  /**
   * Check for milestone achievements
   * @param {number} count - Current word count
   */
  checkForMilestone: function(count) {
    // Example milestone: 100, 500, 1000 words, etc.
    const milestones = [100, 500, 1000, 5000, 10000];
    
    for (const milestone of milestones) {
      if (count === milestone) {
        this.celebrateMilestone(milestone);
      }
    }
  },
  
  /**
   * Celebrate milestone achievement
   * @param {number} milestone - The milestone value
   */
  celebrateMilestone: function(milestone) {
    console.log(`Congratulations! You've reached ${milestone} words!`);
    
    // Show a special animation or effect
    if (this.badge) {
      this.badge.classList.add('badge-animation-celebrate');
      
      // Remove class after animation completes
      setTimeout(() => {
        if (this.badge) {
          this.badge.classList.remove('badge-animation-celebrate');
        }
      }, 2000);
    }
    
    // Optionally, show a browser notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Milestone Reached!',
        message: `🎉 Congratulations! You've reached ${milestone} words! 🎉`,
        priority: 2
      });
    }
  }
};