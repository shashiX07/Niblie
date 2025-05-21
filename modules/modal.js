/**
 * Modal UI component for the extension
 */

const ModalUI = {
  modal: null,
  isOpen: false,
  inTransition: false,
  currentSection: 'links',
  
  /**
   * Creates the modal element if it doesn't exist
   * @returns {HTMLElement} The modal element
   */
  createModal: function() {
    if (this.modal) return this.modal;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'niblie-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
      visibility: hidden;
    `;
    
    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'niblie-modal-content';
    modalContent.style.cssText = `
      display: flex;
      width: 80%;
      max-width: 1000px;
      height: 80%;
      max-height: 600px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      transform: translateY(-20px);
      transition: transform 0.3s ease;
    `;
    
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'niblie-sidebar';
    sidebar.style.cssText = `
      width: 200px;
      background-color: #f0f4f8;
      border-right: 1px solid #dce5ef;
      padding: 20px 0;
      display: flex;
      flex-direction: column;
    `;
    
    // Create sidebar header
    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'niblie-sidebar-header';
    sidebarHeader.style.cssText = `
      padding: 0 20px 20px;
      border-bottom: 1px solid #e4e8ed;
      margin-bottom: 20px;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Niblie';
    title.style.cssText = `
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #4285f4;
    `;
    
    sidebarHeader.appendChild(title);
    sidebar.appendChild(sidebarHeader);
    
    // Create sidebar nav items
    const navItems = document.createElement('nav');
    navItems.style.cssText = `
      flex-grow: 1;
    `;
    
    const linksItem = document.createElement('a');
    linksItem.className = 'niblie-nav-item niblie-nav-active';
    linksItem.textContent = 'Links';
    linksItem.href = '#';
    linksItem.dataset.section = 'links';
    linksItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #1a73e8;
      text-decoration: none;
      font-weight: 500;
      background-color: rgba(26, 115, 232, 0.1);
      border-left: 4px solid #1a73e8;
      margin-bottom: 5px;
      transition: all 0.2s;
    `;
    
    const imagesItem = document.createElement('a');
    imagesItem.className = 'niblie-nav-item';
    imagesItem.textContent = 'Images';
    imagesItem.href = '#';
    imagesItem.dataset.section = 'images';
    imagesItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #5f6368;
      text-decoration: none;
      font-weight: 400;
      margin-bottom: 5px;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    `;

    imagesItem.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active tab
      navItems.querySelectorAll('.niblie-nav-item').forEach(item => {
        item.className = 'niblie-nav-item';
        item.style.color = '#5f6368';
        item.style.fontWeight = '400';
        item.style.backgroundColor = '';
        item.style.borderLeftColor = 'transparent';
      });
      
      imagesItem.className = 'niblie-nav-item niblie-nav-active';
      imagesItem.style.color = '#1a73e8';
      imagesItem.style.fontWeight = '500';
      imagesItem.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
      imagesItem.style.borderLeftColor = '#1a73e8';
      
      // Update current section
      this.currentSection = 'images';
      
      // Load images section
      this.loadImagesSection();
    });
    
    navItems.appendChild(linksItem);
    navItems.appendChild(imagesItem);
    sidebar.appendChild(navItems);
    
    // Create main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'niblie-main-content';
    mainContent.style.cssText = `
      flex-grow: 1;
      padding: 20px;
      overflow-y: auto;
      position: relative;
    `;
    
    // Create header with actions
    const contentHeader = document.createElement('div');
    contentHeader.className = 'niblie-content-header';
    contentHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e4e8ed;
    `;
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = 'Links on This Page';
    sectionTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    `;
    
    const actionButtons = document.createElement('div');
    actionButtons.className = 'niblie-actions';
    
    const refreshButton = document.createElement('button');
    refreshButton.className = 'niblie-button niblie-refresh-button';
    refreshButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `;
    refreshButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    refreshButton.title = "Refresh links";
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'niblie-button niblie-settings-button';
    settingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a.873.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a.873.873 0 0 0 2.692-1.115l.094-.319z"/>
      </svg>
    `;
    settingsButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'niblie-button niblie-close-button';
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    `;
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    // Events for buttons
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentSection === 'links') {
        this.loadLinksSection(true); // Force refresh
      }
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      // Settings functionality will be added in the future
      console.log('Settings clicked');
    });
    
    // Add hover effects for buttons
    [closeButton, settingsButton, refreshButton].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = '#f1f3f4';
        btn.style.color = '#202124';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = '';
        btn.style.color = '#5f6368';
      });
    });
    
    actionButtons.appendChild(refreshButton);
    actionButtons.appendChild(settingsButton);
    actionButtons.appendChild(closeButton);
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(actionButtons);
    
    // Create links content container
    const linksContent = document.createElement('div');
    linksContent.id = 'niblie-links-content';
    linksContent.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    
    // Add loading indicator
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'niblie-loading';
    loadingSpinner.innerHTML = `
      <div class="niblie-spinner"></div>
      <p>Analyzing links on the page...</p>
    `;
    loadingSpinner.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
    `;
    
    const spinner = loadingSpinner.querySelector('.niblie-spinner');
    spinner.style.cssText = `
      width: 40px;
      height: 40px;
      border: 4px solid rgba(66, 133, 244, 0.2);
      border-radius: 50%;
      border-top-color: #4285f4;
      animation: niblie-spin 1s linear infinite;
      margin-bottom: 15px;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes niblie-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    linksContent.appendChild(loadingSpinner);
    
    // After creating contentHeader but before creating linksContent
    // Add category tabs navigation
    const categoryTabs = document.createElement('div');
    categoryTabs.className = 'niblie-category-tabs';
    categoryTabs.style.cssText = `
      display: flex;
      overflow-x: auto;
      scrollbar-width: thin;
      margin-bottom: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e4e8ed;
      padding: 4px;
    `;
    
    // Define categories with nice labels - make sure these match the actual category names
    const categories = [
      { id: 'all', label: 'All Links' },
      { id: 'socialLinks', label: 'Social' },
      { id: 'externalLinks', label: 'External' },
      { id: 'internalLinks', label: 'Internal' },
      { id: 'documentLinks', label: 'Documents' },
      { id: 'mediaLinks', label: 'Media' },
      { id: 'emailLinks', label: 'Email' },
      { id: 'navigationLinks', label: 'Navigation' }
    ];
    
    // Create tab for each category
    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.className = `niblie-tab ${cat.id === 'all' ? 'active' : ''}`;
      tab.dataset.category = cat.id;
      tab.textContent = cat.label;
      tab.style.cssText = `
        padding: 10px 16px;
        border: none;
        background-color: ${cat.id === 'all' ? '#e8f0fe' : 'transparent'};
        color: ${cat.id === 'all' ? '#1a73e8' : '#5f6368'};
        font-weight: ${cat.id === 'all' ? '500' : 'normal'};
        border-radius: 6px;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
        margin: 0 2px;
        font-size: 14px;
      `;
      
      // Handle tab selection
      tab.addEventListener('click', () => {
        // Update active tab styles
        document.querySelectorAll('.niblie-tab').forEach(t => {
          t.style.backgroundColor = 'transparent';
          t.style.color = '#5f6368';
          t.style.fontWeight = 'normal';
          t.classList.remove('active');
        });
        
        tab.style.backgroundColor = '#e8f0fe';
        tab.style.color = '#1a73e8';
        tab.style.fontWeight = '500';
        tab.classList.add('active');
        
        // Filter links by category
        this._showCategoryLinks(cat.id);
      });
      
      categoryTabs.appendChild(tab);
    });
    
    // Add tabs after header
    mainContent.appendChild(contentHeader);
    mainContent.appendChild(categoryTabs);
    mainContent.appendChild(linksContent);
    
    // Assemble the modal
    modalContent.appendChild(sidebar);
    modalContent.appendChild(mainContent);
    modal.appendChild(modalContent);
    
    // Add event listeners for easy cleanup
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        e.stopPropagation();
        this.closeModal();
      }
    });
    
    // Prevent scrolling on body when modal is open
    document.body.appendChild(modal);
    this.modal = modal;
    
    return modal;
  },
  
  /**
   * Opens the modal and initializes the current section
   */
  openModal: function() {
    // Prevent opening if already open or in transition
    if (this.isOpen || this.inTransition) return;
    
    this.inTransition = true;
    const modal = this.createModal();
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Show the modal with animation
    modal.style.visibility = 'visible';
    
    // Use a small timeout to trigger the animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('.niblie-modal-content').style.transform = 'translateY(0)';
      
      // Initialize the links section
      if (this.currentSection === 'links') {
        this.loadLinksSection();
      }
      
      // Set open state after animation completes
      setTimeout(() => {
        this.isOpen = true;
        this.inTransition = false;
      }, 300);
    }, 10);
  },
  
  /**
   * Closes the modal with animation
   */
  closeModal: function() {
    // Prevent closing if not open or in transition
    if (!this.isOpen || this.inTransition || !this.modal) return;
    
    this.inTransition = true;
    const modal = this.modal;
    const modalContent = modal.querySelector('.niblie-modal-content');
    
    // Animate closing
    modalContent.style.transform = 'translateY(-20px)';
    modal.style.opacity = '0';
    
    // Re-enable scrolling
    document.body.style.overflow = '';
    
    // Remove after animation completes
    setTimeout(() => {
      modal.style.visibility = 'hidden';
      
      // Clear link finder cache to free memory when modal is closed
      if (window.LinkFinder) {
        LinkFinder.clearCache();
      }
      
      // Reset state
      this.isOpen = false;
      this.inTransition = false;
    }, 300);
  },
  
  /**
   * Loads and displays the links section content
   * @param {boolean} forceRefresh - Whether to force refreshing link data
   */
  loadLinksSection: function(forceRefresh = false) {
    // IMPORTANT: Fix sidebar navigation first - ensure all nav items work 
    this._updateSidebarNavigation('links');
    
    const linksContent = document.getElementById('niblie-links-content');
    
    // Clear existing content except loading indicator
    while (linksContent.firstChild && !linksContent.firstChild.classList.contains('niblie-loading')) {
      linksContent.removeChild(linksContent.firstChild);
    }
    
    const loadingSpinner = linksContent.querySelector('.niblie-loading');
    loadingSpinner.style.display = 'flex';
    
    // Use LinkFinder to get link data
    LinkFinder.findLinks(forceRefresh).then(linkData => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';
      
      // Create link category sections
      let hasLinks = false;
      
      // Track which categories have links for later use in tab filtering
      const categoriesWithLinks = {};
      
      Object.keys(linkData).forEach(category => {
        const links = linkData[category];
        categoriesWithLinks[category] = links.length > 0;
        
        if (links.length === 0) return;
        
        hasLinks = true;
        
        // Create category section
        this.createLinkCategory(linksContent, category, links);
      });
      
      // Store categories with links for tab filtering
      this.categoriesWithLinks = categoriesWithLinks;
      
      // If no links were found
      if (!hasLinks) {
        const noLinks = document.createElement('div');
        noLinks.className = 'niblie-no-links';
        noLinks.textContent = 'No links found on this page.';
        noLinks.style.cssText = `
          padding: 40px 0;
          text-align: center;
          color: #5f6368;
          font-style: italic;
        `;
        linksContent.appendChild(noLinks);
      } else {
        // Apply current tab filter
        const activeTab = document.querySelector('.niblie-tab.active');
        if (activeTab) {
          const selectedCategory = activeTab.dataset.category;
          console.log('Initial filter with active tab:', selectedCategory);
          setTimeout(() => {
            // Defer execution to ensure DOM is updated
            this._showCategoryLinks(selectedCategory);
          }, 0);
        }
      }
    }).catch(error => {
      console.error('Error analyzing links:', error);
      loadingSpinner.style.display = 'none';
      
      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'niblie-error';
      errorMsg.textContent = 'An error occurred while analyzing links.';
      errorMsg.style.cssText = `
        padding: 40px 0;
        text-align: center;
        color: #d93025;
      `;
      linksContent.appendChild(errorMsg);
    });
  },
  
  /**
   * Loads and displays the images section content
   * @param {boolean} forceRefresh - Whether to force refreshing image data
   */
  loadImagesSection: function(forceRefresh = false) {
    // IMPORTANT: Fix sidebar navigation first - ensure all nav items work
    this._updateSidebarNavigation('images');
    
    // Get main content area
    const mainContent = document.querySelector('.niblie-main-content');
    if (!mainContent) return;
    
    // Clear existing content
    mainContent.innerHTML = '';
    
    // Create header with actions
    const contentHeader = document.createElement('div');
    contentHeader.className = 'niblie-content-header';
    contentHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e4e8ed;
    `;
    
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = 'Images on This Page';
    sectionTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    `;
    
    const actionButtons = document.createElement('div');
    actionButtons.className = 'niblie-actions';
    
    // Create buttons
    const refreshButton = document.createElement('button');
    refreshButton.className = 'niblie-button niblie-refresh-button';
    refreshButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
    `;
    refreshButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    refreshButton.title = "Refresh images";
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'niblie-button niblie-settings-button';
    settingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a.873.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a.873.873 0 0 0 2.692-1.115l.094-.319z"/>
      </svg>
    `;
    settingsButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'niblie-button niblie-close-button';
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    `;
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    
    // Button events
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadImagesSection(true);
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof this._showSettingsView === 'function') {
        this._showSettingsView();
      }
    });
    
    // Add hover effects
    [closeButton, settingsButton, refreshButton].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.backgroundColor = '#f1f3f4';
        btn.style.color = '#202124';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.backgroundColor = '';
        btn.style.color = '#5f6368';
      });
    });
    
    actionButtons.appendChild(refreshButton);
    actionButtons.appendChild(settingsButton);
    actionButtons.appendChild(closeButton);
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(actionButtons);
    
    // Add header to main content
    mainContent.appendChild(contentHeader);
    
    // Create and add images content
    if (window.ImageUI) {
      const imagesContent = ImageUI.createImagesContent(forceRefresh);
      mainContent.appendChild(imagesContent);
    } else {
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Image finder module is not available.';
      errorMsg.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #d93025;
      `;
      mainContent.appendChild(errorMsg);
    }
  },
  
  /**
   * Opens the settings view
   * @private
   */
  _showSettingsView: function() {
    // For now, just log to console
    console.log('Settings view is not implemented yet.');
  },
  
  /**
   * Gets the current section (links or images)
   * @returns {string} - Current section ID
   * @private
   */
  _getCurrentSection: function() {
    return this.currentSection;
  },
  
  /**
   * Sets the current section (links or images)
   * @param {string} section - Section ID to set as current
   * @private
   */
  _setCurrentSection: function(section) {
    this.currentSection = section;
  },
  
  /**
   * Creates a link category section
   * @param {HTMLElement} container - Container to append to
   * @param {string} category - Category name
   * @param {Array} links - Array of link objects
   */
  createLinkCategory: function(container, category, links) {
    const categorySection = document.createElement('div');
    categorySection.className = 'niblie-link-category';
    // Add data attribute for more reliable category identification
    categorySection.dataset.category = category;
    categorySection.style.cssText = `
      margin-bottom: 20px;
    `;
    
    // Format category name for display
    const displayName = category.charAt(0).toUpperCase() + 
                        category.slice(1).replace(/([A-Z])/g, ' $1');
    
    // Create category header
    const header = document.createElement('div');
    header.className = 'niblie-category-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e4e8ed;
    `;
    
    const icon = this.getCategoryIcon(category);
    icon.style.cssText = `
      margin-right: 8px;
      color: #4285f4;
    `;
    
    const title = document.createElement('h3');
    title.textContent = displayName;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    `;
    
    const count = document.createElement('span');
    count.textContent = `${links.length}`;
    count.style.cssText = `
      margin-left: 8px;
      background-color: #e8f0fe;
      color: #4285f4;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
    `;
    
    title.appendChild(count);
    header.appendChild(icon);
    header.appendChild(title);
    
    // Create links list with updated styling for URL display
    const linksList = document.createElement('ul');
    linksList.style.cssText = `
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // Add links with full URLs and action buttons
    links.forEach(link => {
      const listItem = document.createElement('li');
      listItem.style.cssText = `
        padding: 10px;
        border-radius: 6px;
        transition: background-color 0.2s;
        border: 1px solid #e4e8ed;
        background-color: #f8f9fa;
      `;
      
      // Create container for URL and buttons
      const itemContainer = document.createElement('div');
      itemContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;
      
      // URL display area
      const urlDisplay = document.createElement('div');
      urlDisplay.className = 'niblie-url-display';
      urlDisplay.style.cssText = `
        font-family: monospace;
        font-size: 13px;
        padding: 6px 10px;
        background-color: #fff;
        border: 1px solid #e4e8ed;
        border-radius: 4px;
        white-space: nowrap;
        overflow-x: auto;
        scrollbar-width: thin;
        color: #1a0dab;
      `;
      urlDisplay.textContent = link.href;
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
      `;
      
      // Copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'niblie-action-button niblie-copy-button';
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
      </svg>
      Copy
    `;
    copyButton.style.cssText = `
      background-color: #f1f3f4;
      color: #202124;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background-color 0.2s;
    `;
    
    // Visit button
    const visitButton = document.createElement('button');
    visitButton.className = 'niblie-action-button niblie-visit-button';
    visitButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
        <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
      </svg>
      Visit
    `;
    visitButton.style.cssText = `
      background-color: #e8f0fe;
      color: #1a73e8;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background-color 0.2s;
    `;
    
    // Add hover effects for buttons
    copyButton.addEventListener('mouseenter', () => {
      copyButton.style.backgroundColor = '#e8eaed';
    });
    
    copyButton.addEventListener('mouseleave', () => {
      copyButton.style.backgroundColor = '#f1f3f4';
    });
    
    visitButton.addEventListener('mouseenter', () => {
      visitButton.style.backgroundColor = '#d4e6fc';
    });
    
    visitButton.addEventListener('mouseleave', () => {
      visitButton.style.backgroundColor = '#e8f0fe';
    });
    
    // Add functionality to buttons
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(link.href)
        .then(() => {
          // Visual feedback for copy success
          const originalText = copyButton.innerHTML;
          copyButton.innerHTML = '✓ Copied!';
          copyButton.style.backgroundColor = '#d2f5d2';
          copyButton.style.color = '#0d652d';
          
          setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.style.backgroundColor = '#f1f3f4';
            copyButton.style.color = '#202124';
          }, 1500);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    });
    
    visitButton.addEventListener('click', () => {
      window.open(link.href, '_blank', 'noopener,noreferrer');
    });
    
    // Add hover effect for the entire list item
    listItem.addEventListener('mouseenter', () => {
      listItem.style.backgroundColor = '#f0f4f8';
    });
    
    listItem.addEventListener('mouseleave', () => {
      listItem.style.backgroundColor = '#f8f9fa';
    });
    
    // Assemble everything
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(visitButton);
    itemContainer.appendChild(urlDisplay);
    itemContainer.appendChild(buttonContainer);
    listItem.appendChild(itemContainer);
    linksList.appendChild(listItem);
  });
  
  categorySection.appendChild(header);
  categorySection.appendChild(linksList);
  container.appendChild(categorySection);
},
  
  /**
   * Get an appropriate icon for a link category
   * @param {string} category - Category name
   * @returns {HTMLElement} - SVG icon element
   */
  getCategoryIcon: function(category) {
    const iconWrapper = document.createElement('div');
    
    // Choose icon based on category
    let iconSvg = '';
    
    switch (category) {
      case 'socialLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
        </svg>`;
        break;
      case 'navigationLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.5 12.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          <path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z"/>
        </svg>`;
        break;
      case 'externalLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>`;
        break;
      case 'internalLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
          <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
        </svg>`;
        break;
      case 'documentLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
          <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
        </svg>`;
        break;
      case 'emailLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
        </svg>`;
        break;
      case 'mediaLinks':
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.002 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2V3zm1 9v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12zm5-6.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/>
        </svg>`;
        break;
      default:
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
          <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"/>
        </svg>`;
    }
    
    iconWrapper.innerHTML = iconSvg;
    return iconWrapper;
  },
  
  /**
   * Filter links to show only the selected category
   * @param {string} category - Category to show
   * @private
   */
  _showCategoryLinks: function(category) {
    console.log('Filtering links by category:', category);
    const categories = document.querySelectorAll('.niblie-link-category');
    console.log('Found categories:', categories.length);
    
    // Remove any existing "no links in category" messages
    const existingNoLinksMsg = document.querySelector('.niblie-no-category-links');
    if (existingNoLinksMsg) {
      existingNoLinksMsg.remove();
    }
    
    if (category === 'all') {
      // Show all categories
      let hasVisibleCategory = false;
      
      categories.forEach(cat => {
        cat.style.display = '';
        console.log('Showing category:', cat.dataset.category);
        hasVisibleCategory = true;
      });
      
      // If no categories with links, show message
      if (!hasVisibleCategory) {
        this._showNoCategoryLinksMessage('No links found on this page.');
      }
      
      return;
    }
    
    // Check if the selected category exists and has links
    let categoryFound = false;
    
    // Show only selected category, hide others
    categories.forEach(cat => {
      // Use data attribute instead of text manipulation
      const categoryName = cat.dataset.category;
      console.log('Checking category:', categoryName, 'against', category);
      
      if (categoryName === category) {
        cat.style.display = '';
        categoryFound = true;
        console.log('Showing category:', categoryName);
      } else {
        cat.style.display = 'none';
        console.log('Hiding category:', categoryName);
      }
    });
    
    // If category doesn't exist or has no links, show message
    if (!categoryFound) {
      // Check if we know this category exists but has no links
      if (this.categoriesWithLinks && this.categoriesWithLinks.hasOwnProperty(category) && !this.categoriesWithLinks[category]) {
        this._showNoCategoryLinksMessage(`No links found in the ${this._formatCategoryName(category)} category.`);
      } else if (category !== 'all') {
        this._showNoCategoryLinksMessage(`No links found in the ${this._formatCategoryName(category)} category.`);
      }
    }
  },
  
  /**
   * Shows a message when a category has no links
   * @param {string} message - Message to display
   * @private
   */
  _showNoCategoryLinksMessage: function(message) {
    const linksContent = document.getElementById('niblie-links-content');
    const noLinks = document.createElement('div');
    noLinks.className = 'niblie-no-category-links';
    noLinks.textContent = message;
    noLinks.style.cssText = `
      padding: 40px 0;
      text-align: center;
      color: #5f6368;
      font-style: italic;
    `;
    linksContent.appendChild(noLinks);
  },
  
  /**
   * Format category name for display
   * @param {string} category - Category name
   * @returns {string} Formatted category name
   * @private
   */
  _formatCategoryName: function(category) {
    // Remove "Links" suffix if present
    let name = category.replace(/Links$/, '');
    
    // Convert camelCase to space-separated words
    name = name.charAt(0).toUpperCase() + 
           name.slice(1).replace(/([A-Z])/g, ' $1');
    
    return name;
  },
  
  /**
   * Helper function to update sidebar navigation state
   * @param {string} activeSection - The currently active section
   * @private
   */
  _updateSidebarNavigation: function(activeSection) {
    // Find all navigation items
    const navItems = document.querySelectorAll('.niblie-nav-item');
    
    // Update active state for each item
    navItems.forEach(item => {
      const section = item.dataset.section;
      
      // Reset styles
      item.className = 'niblie-nav-item';
      item.style.color = '#5f6368';
      item.style.fontWeight = '400';
      item.style.backgroundColor = '';
      item.style.borderLeftColor = 'transparent';
      
      // Set active styles
      if (section === activeSection) {
        item.className = 'niblie-nav-item niblie-nav-active';
        item.style.color = '#1a73e8';
        item.style.fontWeight = '500';
        item.style.backgroundColor = 'rgba(26, 115, 232, 0.1)';
        item.style.borderLeftColor = '#1a73e8';
      }
    });
    
    // Update current section
    this.currentSection = activeSection;
  },
};