/**
 * UI components for the extension
 */

const BadgeUI = {
  badge: null,
  offsetX: 0,
  offsetY: 0,
  isDragging: false,
  mouseDownOnBadge: false, // Add this flag to track badge clicks
  
  /**
   * Creates the draggable word count badge
   * @returns {HTMLElement} The badge element
   */
  createBadge: function() {
    // If badge already exists, return it
    if (this.badge) return this.badge;
    
    // Create badge element
    const badge = document.createElement('div');
    badge.id = 'viewport-word-counter-badge';
    badge.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4285f4;
      color: white;
      border-radius: 50px;
      padding: 10px 15px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      cursor: move;
      user-select: none;
      opacity: 0.9;
      transition: opacity 0.3s;
    `;
    
    // Make badge draggable - Only add mousedown to badge
    badge.addEventListener('mousedown', this.handleMouseDown.bind(this));
    
    // Add global event listeners with proper cleanup
    // Add these event listeners when needed, not at creation time
    
    // Add hover effect
    badge.addEventListener('mouseenter', () => badge.style.opacity = '1');
    badge.addEventListener('mouseleave', () => badge.style.opacity = '0.9');
    
    document.body.appendChild(badge);
    this.badge = badge;
    return badge;
  },
  
  /**
   * Handles mouse down events on the badge
   * Differentiates between clicks and drag starts
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown: function(e) {
    e.preventDefault();
    
    // Set flag to indicate mouse down originated on badge
    this.mouseDownOnBadge = true;
    
    // Record initial position and time for differentiating clicks from drags
    this.mouseDownTime = Date.now();
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    
    // Get initial mouse position for potential dragging
    this.offsetX = e.clientX - this.badge.getBoundingClientRect().left;
    this.offsetY = e.clientY - this.badge.getBoundingClientRect().top;
    
    // Change cursor
    this.badge.style.cursor = 'grabbing';
    
    // We'll set isDragging in the mousemove handler if the mouse really moves
    this.isDragging = false;
    
    // Add document event listeners only when needed
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  },
  
  /**
   * Updates the badge with a word count
   * @param {number} count - Word count to display
   */
  updateBadge: function(count) {
    const badge = this.createBadge();
    badge.textContent = `${count} words`;
  },
  
  /**
   * Handle drag movement
   * @param {MouseEvent} e - Mouse event
   */
  drag: function(e) {
    // Only process drag if mousedown started on badge
    if (!this.badge || !this.mouseDownOnBadge || this.mouseDownTime === undefined) return;
    
    // Check if we've moved enough to be considered a drag (5px threshold)
    const moveX = Math.abs(e.clientX - this.initialX);
    const moveY = Math.abs(e.clientY - this.initialY);
    
    // If we've moved enough, consider it a drag
    if (moveX > 5 || moveY > 5) {
      this.isDragging = true;
    }
    
    if (!this.isDragging) return;
    
    e.preventDefault();
    
    // Calculate new position
    const left = e.clientX - this.offsetX;
    const top = e.clientY - this.offsetY;
    
    // Apply new position
    this.badge.style.right = 'auto';
    this.badge.style.left = `${left}px`;
    this.badge.style.top = `${top}px`;
  },
  
  /**
   * Stop dragging the badge or process click
   * @param {MouseEvent} e - Mouse event
   */
  stopDrag: function(e) {
    // Only process if mousedown started on badge
    if (!this.badge || !this.mouseDownOnBadge) return;
    
    // More forgiving click detection (300ms instead of 200ms)
    const isClick = !this.isDragging || 
                   (Date.now() - this.mouseDownTime < 300 && 
                    Math.abs(e.clientX - this.initialX) < 10 && 
                    Math.abs(e.clientY - this.initialY) < 10);
    
    this.isDragging = false;
    this.badge.style.cursor = 'move';
    
    // Check if ModalUI is available before trying to use it
    if (isClick) {
      try {
        if (typeof ModalUI !== 'undefined') {
          ModalUI.openModal();
        } else {
          console.error('ModalUI is not defined');
        }
      } catch (error) {
        console.error('Error opening modal:', error);
      }
    }
    
    // Reset all mouse tracking state
    this.mouseDownTime = undefined;
    this.mouseDownOnBadge = false;
    
    // Remove document event listeners
    document.removeEventListener('mousemove', this.drag.bind(this));
    document.removeEventListener('mouseup', this.stopDrag.bind(this));
  }
};