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
    
    linksItem.addEventListener('click', (e) => {
      e.preventDefault();
      this._loadSection('links');
    });
    
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
      this._loadSection('images');
    });
    
    const videosItem = document.createElement('a');
    videosItem.className = 'niblie-nav-item';
    videosItem.textContent = 'Videos';
    videosItem.href = '#';
    videosItem.dataset.section = 'videos';
    videosItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #5f6368;
      text-decoration: none;
      font-weight: 400;
      margin-bottom: 5px;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    `;

    videosItem.addEventListener('click', (e) => {
      e.preventDefault();
      this._loadSection('videos');
    });
    
    const tablesItem = document.createElement('a');
    tablesItem.className = 'niblie-nav-item';
    tablesItem.textContent = 'Tables';
    tablesItem.href = '#';
    tablesItem.dataset.section = 'tables';
    tablesItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #5f6368;
      text-decoration: none;
      font-weight: 400;
      margin-bottom: 5px;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    `;

    tablesItem.addEventListener('click', (e) => {
      e.preventDefault();
      this._loadSection('tables');
    });

    // Add Ad Blockers section
    const adBlockersItem = document.createElement('a');
    adBlockersItem.className = 'niblie-nav-item';
    adBlockersItem.textContent = 'Ad Blockers';
    adBlockersItem.href = '#';
    adBlockersItem.dataset.section = 'adblockers';
    adBlockersItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #5f6368;
      text-decoration: none;
      font-weight: 400;
      margin-bottom: 5px;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    `;

    adBlockersItem.addEventListener('click', (e) => {
      e.preventDefault();
      this._loadSection('adblockers');
    });
    
    navItems.appendChild(linksItem);
    navItems.appendChild(imagesItem);
    navItems.appendChild(videosItem);
    navItems.appendChild(tablesItem);
    navItems.appendChild(adBlockersItem);
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
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes niblie-spin {
        to { transform: rotate(360deg); }
        }
      };
    `;
    document.head.appendChild(style);
    
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
    
    // Add to body
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
    
    // Add scrolling styles first
    this._addScrollingStyles();
    
    // Only prevent scrolling on the body, not inside the modal
    document.body.style.overflow = 'hidden';
    
    // Show the modal with animation
    modal.style.visibility = 'visible';
    
    // Use a small timeout to trigger the animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('.niblie-modal-content').style.transform = 'translateY(0)';
      
      // Initialize the current section
      this._loadSection(this.currentSection);
      
      // Apply scroll behavior fix
      this.fixScrollBehavior();
      
      // Set open state after animation completes
      setTimeout(() => {
        this.isOpen = true;
        this.inTransition = false;
        
        // Apply the fix again to make sure it works after DOM updates
        this.fixScrollBehavior();
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
    
    // Re-enable scrolling on the body
    document.body.style.overflow = '';
    
    // Remove after animation completes
    setTimeout(() => {
      modal.style.visibility = 'hidden';
      
      // Clear caches to free memory when modal is closed
      if (window.LinkFinder) LinkFinder.clearCache();
      if (window.ImageFinder) ImageFinder.clearCache();
      if (window.VideoFinder) VideoFinder.clearCache();
      if (window.TableFinder) TableFinder.clearCache();
      
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
    // Update navigation state
    this._updateSidebarNavigation('links');
    
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
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
      </svg>
    `;

    settingsButton.title = "Settings";
    settingsButton.addEventListener("click", () => {
      const settingURL = "https://shashix07.github.io/Niblie/";
      window.location.href = settingURL;
    })

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
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadLinksSection(true);
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof this._showSettingsView === 'function') {
        this._showSettingsView();
      }
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
    
    // Create category tabs navigation
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
        categoryTabs.querySelectorAll('.niblie-tab').forEach(t => {
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
    
    linksContent.appendChild(loadingSpinner);
    
    // Add all elements to main content
    mainContent.appendChild(contentHeader);
    mainContent.appendChild(categoryTabs);
    mainContent.appendChild(linksContent);
    
    // Use LinkFinder to get link data
    if (window.LinkFinder) {
      console.log('Using LinkFinder from window');
      window.LinkFinder.findLinks(forceRefresh)
        .then(linkData => {
          // Hide loading spinner
          loadingSpinner.style.display = 'none';
          
          // Create link category sections
          let hasLinks = false;
          
          // Track which categories have links for tab filtering
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
            const activeTab = categoryTabs.querySelector('.niblie-tab.active');
            if (activeTab) {
              const selectedCategory = activeTab.dataset.category;
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
    } else {
      // Show error message
      loadingSpinner.style.display = 'none';
      const errorMsg = document.createElement('div');
      errorMsg.className = 'niblie-error';
      errorMsg.textContent = 'Link finder module is not available.';
      errorMsg.style.cssText = `
        padding: 40px 0;
        text-align: center;
        color: #d93025;
      `;
      linksContent.appendChild(errorMsg);
    }
  },
  
  /**
   * Loads and displays the images section content
   * @param {boolean} forceRefresh - Whether to force refreshing image data
   */
  loadImagesSection: function(forceRefresh = false) {
    // Update navigation state
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
    
    closeButton.addEventListener('click', () => this.closeModal());
    
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(closeButton);
    mainContent.appendChild(contentHeader);
    
    // Add placeholder content
    const placeholderContent = document.createElement('div');
    placeholderContent.textContent = 'Images section - Implementation pending';
    placeholderContent.style.cssText = `
      padding: 40px;
      text-align: center;
      color: #5f6368;
      font-style: italic;
    `;
    mainContent.appendChild(placeholderContent);
  },
  
  /**
   * Loads and displays the videos section content
   * @param {boolean} forceRefresh - Whether to force refreshing video data
   */
  loadVideosSection: function(forceRefresh = false) {
    // Update navigation state
    this._updateSidebarNavigation('videos');
    
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
    sectionTitle.textContent = 'Videos on This Page';
    sectionTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
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
    
    closeButton.addEventListener('click', () => this.closeModal());
    
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(closeButton);
    mainContent.appendChild(contentHeader);
    
    // Add placeholder content
    const placeholderContent = document.createElement('div');
    placeholderContent.textContent = 'Videos section - Implementation pending';
    placeholderContent.style.cssText = `
      padding: 40px;
      text-align: center;
      color: #5f6368;
      font-style: italic;
    `;
    mainContent.appendChild(placeholderContent);
  },

  /**
   * Loads and displays the tables section content
   * @param {boolean} forceRefresh - Whether to force refreshing table data
   */
  loadTablesSection: function(forceRefresh = false) {
    // Update navigation state
    this._updateSidebarNavigation('tables');
    
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
    sectionTitle.textContent = 'Tables on This Page';
    sectionTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
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
    
    closeButton.addEventListener('click', () => this.closeModal());
    
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(closeButton);
    mainContent.appendChild(contentHeader);
    
    // Add placeholder content
    const placeholderContent = document.createElement('div');
    placeholderContent.textContent = 'Tables section - Implementation pending';
    placeholderContent.style.cssText = `
      padding: 40px;
      text-align: center;
      color: #5f6368;
      font-style: italic;
    `;
    mainContent.appendChild(placeholderContent);
  },

  /**
   * Loads and displays the ad blockers section content
   * @param {boolean} forceRefresh - Whether to force refreshing data
   */
  loadAdBlockersSection: function(forceRefresh = false) {
    // Update navigation state
    this._updateSidebarNavigation('adblockers');
    
    // Get main content area
    const mainContent = document.querySelector('.niblie-main-content');
    if (!mainContent) return;
    
    // Clear existing content
    mainContent.innerHTML = '';
    
    // Create header
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
    sectionTitle.textContent = 'Ad Blockers';
    sectionTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #202124;
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
    
    closeButton.addEventListener('click', () => this.closeModal());
    
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(closeButton);
    mainContent.appendChild(contentHeader);
    
    // Create ad blockers content
    this.createAdBlockersContent(mainContent);
  },

  /**
   * Creates the ad blockers content
   * @param {HTMLElement} container Container element
   */
  createAdBlockersContent: function(container) {
    // Create loading indicator while fetching settings
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'niblie-loading';
    loadingSpinner.innerHTML = `
      <div class="niblie-spinner"></div>
      <p>Loading ad blocker settings...</p>
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
    
    container.appendChild(loadingSpinner);

    // Try to get settings
    const defaultBlockerData = [
      {
        platform: 'youtube',
        name: 'YouTube',
        icon: '📺',
        features: [
          'Block pre-roll video ads',
          'Skip mid-roll advertisements', 
          'Hide banner advertisements',
          'Remove sponsored content',
          'Fast-forward through ad breaks'
        ],
        settings: { enabled: false }
      },
      {
        platform: 'spotify', 
        name: 'Spotify',
        icon: '🎵',
        features: [
          'Mute audio advertisements',
          'Skip ad breaks automatically',
          'Hide banner advertisements', 
          'Remove sponsored playlists',
          'Block popup advertisements'
        ],
        settings: { enabled: false }
      },
      {
        platform: 'hotstar',
        name: 'Hotstar',
        icon: '🎬',
        features: [
          'Skip pre-roll video ads',
          'Block mid-roll interruptions',
          'Hide banner advertisements',
          'Remove promoted content',
          'Fast-forward ad segments'
        ],
        settings: { enabled: false }
      },
      {
        platform: 'general',
        name: 'General Web',
        icon: '🌐',
        features: [
          'Block banner advertisements',
          'Remove popup overlays',
          'Hide video advertisements',
          'Block tracking scripts',
          'Remove sponsored content'
        ],
        settings: { enabled: false }
      }
    ];

    // Simulate loading or use default data
    setTimeout(() => {
      // Hide loading spinner
      loadingSpinner.style.display = 'none';

      const blockersContainer = document.createElement('div');
      blockersContainer.className = 'niblie-adblockers-container';
      blockersContainer.style.cssText = `
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      `;

      defaultBlockerData.forEach(blocker => {
        const blockerCard = this.createBlockerCard(blocker);
        blockersContainer.appendChild(blockerCard);
      });

      container.appendChild(blockersContainer);
    }, 500);
  },

  /**
   * Creates a single ad blocker card
   * @param {Object} blocker Blocker data
   * @returns {HTMLElement} Blocker card element
   */
  createBlockerCard: function(blocker) {
    const card = document.createElement('div');
    card.className = 'niblie-blocker-card';
    card.style.cssText = `
      background: white;
      border: 1px solid #e4e8ed;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;

    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
      card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      card.style.transform = '';
    });

    // Header with icon and name
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
    `;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
      display: flex;
      align-items: center;
    `;

    const icon = document.createElement('span');
    icon.textContent = blocker.icon;
    icon.style.cssText = `
      font-size: 24px;
      margin-right: 10px;
    `;

    const title = document.createElement('h3');
    title.textContent = blocker.name;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #202124;
    `;

    titleContainer.appendChild(icon);
    titleContainer.appendChild(title);

    // Toggle switch
    const toggle = document.createElement('label');
    toggle.className = 'niblie-toggle-switch';
    toggle.style.cssText = `
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
      cursor: pointer;
    `;

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = blocker.settings.enabled;
    toggleInput.style.cssText = `
      opacity: 0;
      width: 0;
      height: 0;
    `;

    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: ${blocker.settings.enabled ? '#4285f4' : '#ccc'};
      transition: .4s;
      border-radius: 26px;
    `;

    const sliderButton = document.createElement('span');
    sliderButton.style.cssText = `
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: ${blocker.settings.enabled ? '27px' : '3px'};
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    `;

    slider.appendChild(sliderButton);
    toggle.appendChild(toggleInput);
    toggle.appendChild(slider);

    // Toggle event
    toggleInput.addEventListener('change', () => {
      const isEnabled = toggleInput.checked;
      slider.style.backgroundColor = isEnabled ? '#4285f4' : '#ccc';
      sliderButton.style.left = isEnabled ? '27px' : '3px';
      
      // Save to storage (if available)
      if (window.AdBlockerStorage) {
        window.AdBlockerStorage.updatePlatformSettings(blocker.platform, { enabled: isEnabled });
      }
      
      // Initialize blocker if enabled
      if (isEnabled && window.BlockerUI) {
        window.BlockerUI.initializePlatformBlocker(blocker.platform);
      }

      console.log(`${blocker.name} ad blocker ${isEnabled ? 'enabled' : 'disabled'}`);
    });

    header.appendChild(titleContainer);
    header.appendChild(toggle);

    // Features list
    const featuresList = document.createElement('ul');
    featuresList.style.cssText = `
      margin: 0;
      padding: 0;
      list-style: none;
    `;

    blocker.features.forEach(feature => {
      const featureItem = document.createElement('li');
      featureItem.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 14px;
        color: #5f6368;
      `;

      const checkmark = document.createElement('span');
      checkmark.textContent = '✓';
      checkmark.style.cssText = `
        color: #34a853;
        margin-right: 8px;
        font-weight: bold;
        font-size: 12px;
      `;

      featureItem.appendChild(checkmark);
      featureItem.appendChild(document.createTextNode(feature));
      featuresList.appendChild(featureItem);
    });

    card.appendChild(header);
    card.appendChild(featuresList);

    return card;
  },
  
  /**
   * Creates a link category section in the UI
   * @param {HTMLElement} container - Container element to append the category to
   * @param {string} category - Category name
   * @param {Array} links - Array of link objects
   */
  createLinkCategory: function(container, category, links) {
    // Skip if no links
    if (!links || links.length === 0) return;
    
    // Create category section
    const categorySection = document.createElement('div');
    categorySection.className = 'niblie-link-category';
    categorySection.dataset.category = category;
    categorySection.style.cssText = `
      margin-bottom: 30px;
    `;
    
    // Category header
    const header = document.createElement('div');
    header.className = 'niblie-category-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e8ed;
    `;
    
    // Get icon for category
    const icon = this.getCategoryIcon(category);
    icon.style.cssText = `
      margin-right: 10px;
      color: #5f6368;
    `;
    
    // Format category name
    let categoryName = category.replace(/Links$/, '');
    categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).replace(/([A-Z])/g, ' $1');
    
    const title = document.createElement('h3');
    title.textContent = categoryName;
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    `;
    
    const count = document.createElement('span');
    count.textContent = links.length;
    count.style.cssText = `
      margin-left: 10px;
      background-color: #f1f3f4;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 12px;
      color: #5f6368;
    `;
    
    title.appendChild(count);
    header.appendChild(icon);
    header.appendChild(title);
    
    // Create links list
    const linksList = document.createElement('ul');
    linksList.style.cssText = `
      list-style: none;
      margin: 0;
      padding: 0;
    `;
    
    // Add each link as a list item
    links.forEach(link => {
      const listItem = document.createElement('li');
      listItem.style.cssText = `
        margin-bottom: 8px;
      `;
      
      // Item container with flex layout
      const itemContainer = document.createElement('div');
      itemContainer.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #fff;
        border: 1px solid #e4e8ed;
        border-radius: 8px;
        padding: 10px;
        transition: all 0.2s;
      `;
      
      itemContainer.addEventListener('mouseenter', () => {
        itemContainer.style.backgroundColor = '#f8f9fa';
        itemContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      });
      
      itemContainer.addEventListener('mouseleave', () => {
        itemContainer.style.backgroundColor = '#fff';
        itemContainer.style.boxShadow = '';
      });
      
      // Link text and URL
      const linkText = document.createElement('div');
      linkText.style.cssText = `
        flex-grow: 1;
        overflow: hidden;
      `;
      
      // URL first, then text
      const linkUrl = document.createElement('div');
      linkUrl.textContent = link.href || link.url || '';
      linkUrl.title = link.href || link.url || '';
      linkUrl.style.cssText = `
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      `;
      
      const linkTitle = document.createElement('div');
      linkTitle.textContent = link.text || '';
      linkTitle.title = link.text || '';
      linkTitle.style.cssText = `
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #5f6368;
      `;
      
      linkText.appendChild(linkUrl);
      linkText.appendChild(linkTitle);
    
      // Action buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'niblie-link-actions';
      buttonContainer.style.cssText = `
        margin-left: 15px;
        display: flex;
        gap: 5px;
      `;
      
      const copyButton = document.createElement('button');
      copyButton.className = 'niblie-button niblie-copy-button';
      copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
      `;
      copyButton.style.cssText = `
        background: none;
        border: none;
        color: #5f6368;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.2s;
      `;
      copyButton.title = "Copy link URL";
      
      const openButton = document.createElement('button');
      openButton.className = 'niblie-button niblie-open-button';
      openButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>
      `;
      openButton.style.cssText = `
        background: none;
        border: none;
        color: #5f6368;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.2s;
      `;
      openButton.title = "Open link in new tab";
      
      // Button hover effects
      [copyButton, openButton].forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#f1f3f4';
          btn.style.color = '#202124';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '';
          btn.style.color = '#5f6368';
        });
      });
      
      // Button actions
      copyButton.addEventListener('click', () => {
        const urlToCopy = link.href || link.url || '';
        navigator.clipboard.writeText(urlToCopy).then(() => {
          copyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          `;
          copyButton.style.color = '#34A853';
          
          setTimeout(() => {
            copyButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            `;
            copyButton.style.color = '#5f6368';
          }, 2000);
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      });
      
      openButton.addEventListener('click', () => {
        const urlToOpen = link.href || link.url || '';
        if (urlToOpen) {
          window.open(urlToOpen, '_blank');
        }
      });
      
      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(openButton);
      itemContainer.appendChild(linkText);
      itemContainer.appendChild(buttonContainer);
      listItem.appendChild(itemContainer);
      linksList.appendChild(listItem);
    });
    
    categorySection.appendChild(header);
    categorySection.appendChild(linksList);
    container.appendChild(categorySection);
  },

  /**
   * Load a specific section of the modal
   * @param {string} section - Section name to load
   * @param {boolean} forceRefresh - Whether to force refreshing data
   */
  _loadSection: function(section, forceRefresh = false) {
    // Update current section
    this.currentSection = section;
    
    // Update navigation UI
    this._updateSidebarNavigation(section);
    
    // Load appropriate section content
    switch(section) {
      case 'links':
        this.loadLinksSection(forceRefresh);
        break;
      case 'images':
        this.loadImagesSection(forceRefresh);
        break;
      case 'videos':
        this.loadVideosSection(forceRefresh);
        break;
      case 'tables':
        this.loadTablesSection(forceRefresh);
        break;
      case 'adblockers':
        this.loadAdBlockersSection(forceRefresh);
        break;
      default:
        console.warn(`Unknown section: ${section}`);
        this.loadLinksSection(forceRefresh);
    }
  },

  /**
   * Updates the sidebar navigation to highlight the active section
   * @param {string} activeSection - The section to mark as active
   */
  _updateSidebarNavigation: function(activeSection) {
    if (!this.modal) return;
    
    // Get all nav items
    const navItems = this.modal.querySelectorAll('.niblie-nav-item');
    
    // Update styles for each item
    navItems.forEach(item => {
      const isActive = item.dataset.section === activeSection;
      
      item.className = isActive ? 'niblie-nav-item niblie-nav-active' : 'niblie-nav-item';
      item.style.color = isActive ? '#1a73e8' : '#5f6368';
      item.style.fontWeight = isActive ? '500' : '400';
      item.style.backgroundColor = isActive ? 'rgba(26, 115, 232, 0.1)' : 'transparent';
      item.style.borderLeft = isActive ? '4px solid #1a73e8' : '4px solid transparent';
    });
  },

  /**
   * Adds scrolling styles to prevent body scroll when modal is open
   */
  _addScrollingStyles: function() {
    if (!document.getElementById('niblie-scroll-styles')) {
      const style = document.createElement('style');
      style.id = 'niblie-scroll-styles';
      style.textContent = `
        .niblie-modal-open {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }
  },

  /**
   * Fixes scroll behavior inside modal
   */
  fixScrollBehavior: function() {
    if (!this.modal) return;
    
    const mainContent = this.modal.querySelector('.niblie-main-content');
    if (mainContent) {
      mainContent.style.overflowY = 'auto';
      mainContent.style.height = '100%';
    }
  },

  /**
   * Gets category icon for links
   * @param {string} category - Category name
   * @returns {HTMLElement} Icon element
   */
  getCategoryIcon: function(category) {
    const iconMap = {
      'socialLinks': '👥',
      'externalLinks': '🔗',
      'internalLinks': '🏠',
      'documentLinks': '📄',
      'mediaLinks': '🎬',
      'emailLinks': '✉️',
      'navigationLinks': '🧭'
    };
    
    const icon = document.createElement('span');
    icon.textContent = iconMap[category] || '🔗';
    return icon;
  },

  /**
   * Shows or hides link categories based on tab selection
   * @param {string} category - Selected category, or 'all' for all categories
   */
  _showCategoryLinks: function(category) {
    const linkCategories = document.querySelectorAll('.niblie-link-category');
    
    linkCategories.forEach(categoryElement => {
      if (category === 'all') {
        categoryElement.style.display = 'block';
      } else {
        const categoryName = categoryElement.dataset.category;
        categoryElement.style.display = categoryName === category ? 'block' : 'none';
      }
    });
  }
};