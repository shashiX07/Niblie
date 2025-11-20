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
    
    const adBlockerItem = document.createElement('a');
    adBlockerItem.className = 'niblie-nav-item';
    adBlockerItem.textContent = 'Ad Blockers';
    adBlockerItem.href = '#';
    adBlockerItem.dataset.section = 'adblockers';
    adBlockerItem.style.cssText = `
      display: block;
      padding: 12px 20px;
      color: #5f6368;
      text-decoration: none;
      font-weight: 400;
      margin-bottom: 5px;
      border-left: 4px solid transparent;
      transition: all 0.2s;
    `;

    adBlockerItem.addEventListener('click', (e) => {
      e.preventDefault();
      this._loadSection('adblockers');
    });
    
    navItems.appendChild(linksItem);
    navItems.appendChild(imagesItem);
    navItems.appendChild(videosItem);
    navItems.appendChild(tablesItem);
    navItems.appendChild(adBlockerItem);
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
    settingsButton.addEventListener("click", async () => {
      try {
        // Try to get stored extension ID
        chrome.storage.local.get(['extensionId', 'optionsUrl'], (data) => {
          if (data.optionsUrl) {
            // Open options page in new tab
            chrome.runtime.sendMessage({ action: 'openOptions' });
          } else {
            // Fallback: construct URL using runtime ID
            const extensionId = chrome.runtime.id;
            const optionsUrl = `chrome-extension://${extensionId}/settings.html`;
            chrome.runtime.sendMessage({ action: 'openOptions' });
          }
        });
      } catch (error) {
        console.error('[Niblie] Error opening settings:', error);
        // Fallback to opening options page
        chrome.runtime.sendMessage({ action: 'openOptions' });
      }
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
      chrome.runtime.sendMessage({ action: 'openOptions' });
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
    } else if (window.ExtModules && window.ExtModules.LinkFinder) {
      console.log('Using LinkFinder from ExtModules');
      window.ExtModules.LinkFinder.findLinks(forceRefresh)
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
      // Try to wait for it to load
      if (window.ModuleLoader) {
        window.ModuleLoader.waitForModule('LinkFinder', 5)
          .then(linkFinder => {
            console.log('LinkFinder loaded via ModuleLoader');
            linkFinder.findLinks(forceRefresh)
              .then(linkData => {
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
                showErrorMessage('An error occurred while analyzing links.');
              });
          })
          .catch(error => {
            console.error('Failed to load LinkFinder module:', error);
            loadingSpinner.style.display = 'none';
            showErrorMessage('Link finder module is not available.');
          });
      } else {
        loadingSpinner.style.display = 'none';
        showErrorMessage('Link finder module is not available.');
      }
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
    refreshButton.title = "Refresh images";
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'niblie-button niblie-settings-button';
    settingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
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
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadImagesSection(true);
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openOptions' });
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
    refreshButton.title = "Refresh videos";
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'niblie-button niblie-settings-button';
    settingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
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
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadVideosSection(true);
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openOptions' });
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
    
    const scanAllButton = document.createElement('button');
    scanAllButton.className = 'niblie-button niblie-scan-all-button';
    scanAllButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
      </svg>
    `;
    scanAllButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    scanAllButton.title = "Scan entire page for videos";
    
    // Add event listener for scan all button
    scanAllButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Show loading indicator
      mainContent.innerHTML = '';
      mainContent.appendChild(contentHeader);
      
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'niblie-loading';
      loadingIndicator.innerHTML = `
        <div class="niblie-spinner"></div>
        <p>Scanning entire page for videos...</p>
      `;
      loadingIndicator.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 0;
      `;
      
      const spinner = loadingIndicator.querySelector('.niblie-spinner');
      spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid rgba(66, 133, 244, 0.2);
        border-radius: 50%;
        border-top-color: #4285f4;
        animation: niblie-spin 1s linear infinite;
        margin-bottom: 15px;
      `;
      
      mainContent.appendChild(loadingIndicator);
      
      // Call VideoFinder with scanEntirePage flag
      if (window.VideoFinder) {
        // Clear cache to force fresh scan
        window.VideoFinder.clearCache();
        
        // Set a flag to scan entire page
        window.VideoFinder.scanEntirePage = true;
        
        // Reload the videos section with force refresh
        setTimeout(() => {
          this.loadVideosSection(true);
          
          // Reset flag after scan
          window.VideoFinder.scanEntirePage = false;
        }, 100);
      }
    });
    
    actionButtons.appendChild(scanAllButton);
    actionButtons.appendChild(settingsButton);
    actionButtons.appendChild(closeButton);
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(actionButtons);
    
    // Add header to main content
    mainContent.appendChild(contentHeader);
    
    // Create and add videos content
    if (window.VideoUI) {
      const videosContent = VideoUI.createVideosContent(forceRefresh);
      mainContent.appendChild(videosContent);
    } else {
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Video finder module is not available.';
      errorMsg.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #d93025;
      `;
      mainContent.appendChild(errorMsg);
    }
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
    refreshButton.title = "Refresh tables";
    
    const settingsButton = document.createElement('button');
    settingsButton.className = 'niblie-button niblie-settings-button';
    settingsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
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
      this.closeModal();
    });
    
    refreshButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadTablesSection(true);
    });
    
    settingsButton.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openOptions' });
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
    
    // Add scan all button
    const scanAllButton = document.createElement('button');
    scanAllButton.className = 'niblie-button niblie-scan-all-button';
    scanAllButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
      </svg>
    `;
    scanAllButton.style.cssText = `
      background: none;
      border: none;
      color: #5f6368;
      cursor: pointer;
      padding: 8px;
      margin-right: 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    scanAllButton.title = "Scan entire page for tables";
    
    // Add event listener for scan all button
    scanAllButton.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Show loading indicator
      mainContent.innerHTML = '';
      mainContent.appendChild(contentHeader);
      
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'niblie-loading';
      loadingIndicator.innerHTML = `
        <div class="niblie-spinner"></div>
        <p>Scanning entire page for tables...</p>
      `;
      loadingIndicator.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 0;
      `;
      
      const spinner = loadingIndicator.querySelector('.niblie-spinner');
      spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid rgba(66, 133, 244, 0.2);
        border-radius: 50%;
        border-top-color: #4285f4;
        animation: niblie-spin 1s linear infinite;
        margin-bottom: 15px;
      `;
      
      mainContent.appendChild(loadingIndicator);
      
      // Call TableFinder with scanEntirePage flag
      if (window.TableFinder) {
        // Clear cache to force fresh scan
        window.TableFinder.clearCache();
        
        // Set a flag to scan entire page
        window.TableFinder.scanEntirePage = true;
        
        // Reload the tables section with force refresh
        setTimeout(() => {
          this.loadTablesSection(true);
          
          // Reset flag after scan
          window.TableFinder.scanEntirePage = false;
        }, 100);
      }
    });
    
    actionButtons.appendChild(refreshButton);
    actionButtons.appendChild(scanAllButton);
    actionButtons.appendChild(settingsButton);
    actionButtons.appendChild(closeButton);
    contentHeader.appendChild(sectionTitle);
    contentHeader.appendChild(actionButtons);
    
    // Add header to main content
    mainContent.appendChild(contentHeader);
    
    // Create and add tables content
    if (window.TableUI && typeof window.TableUI.createTablesContent === 'function') {
      console.log('TableUI found in global scope');
      try {
        const tablesContent = window.TableUI.createTablesContent(forceRefresh);
        mainContent.appendChild(tablesContent);
      } catch (error) {
        console.error('Error creating tables content:', error);
        this._showErrorMessage(mainContent, 'An error occurred while creating tables content.');
      }
    } else if (window.ExtModules && window.ExtModules.TableUI && 
              typeof window.ExtModules.TableUI.createTablesContent === 'function') {
      console.log('TableUI found in ExtModules');
      try {
        const tablesContent = window.ExtModules.TableUI.createTablesContent(forceRefresh);
        mainContent.appendChild(tablesContent);
      } catch (error) {
        console.error('Error creating tables content from ExtModules:', error);
        this._showErrorMessage(mainContent, 'An error occurred while creating tables content.');
      }
    } else {
      console.error('TableUI not found in any scope');
      this._showErrorMessage(mainContent, 'Table finder module is not available.');
      
      // Try to re-register modules if possible
      if (typeof registerModules === 'function') {
        console.log('Attempting to re-register modules');
        registerModules();
        
        // Check again after a short delay
        setTimeout(() => {
          if (window.TableUI || (window.ExtModules && window.ExtModules.TableUI)) {
            console.log('TableUI found after re-registration, reloading');
            this.loadTablesSection(forceRefresh);
          }
        }, 500);
      }
    }
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
      
      // CHANGED: Swapped display priority - URL first, then text
      const linkUrl = document.createElement('div');
      linkUrl.textContent = link.href; // FIXED: Using href instead of url
      linkUrl.title = link.href; // FIXED: Using href instead of url
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
      
      linkText.appendChild(linkUrl); // URL first
      linkText.appendChild(linkTitle); // Text second
    
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
    
    // FIXED: Button actions - using href instead of url
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(link.href).then(() => {
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
      window.open(link.href, '_blank'); // FIXED: Using href instead of url
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
 * Load Ad Blockers section
 */
loadAdBlockersSection: function() {
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
  sectionTitle.textContent = 'Ad Blocker Controls';
  sectionTitle.style.cssText = `
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  `;
  
  contentHeader.appendChild(sectionTitle);
  mainContent.appendChild(contentHeader);
  
  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.className = 'niblie-adblocker-content';
  contentContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 20px;
  `;
  
  // Load current settings
  chrome.storage.sync.get(['youtubeAdBlockerEnabled', 'spotifyAdBlockerEnabled'], (result) => {
    const youtubeEnabled = result.youtubeAdBlockerEnabled !== false;
    const spotifyEnabled = result.spotifyAdBlockerEnabled !== false;
    
    // YouTube Ad Blocker Card
    const youtubeCard = this._createAdBlockerCard(
      'YouTube Ad Blocker',
      'Automatically removes, skips, and fast-forwards YouTube ads. Blocks banner ads, video ads, and promoted content.',
      youtubeEnabled,
      'youtubeAdBlockerEnabled'
    );
    
    // Spotify Ad Blocker Card
    const spotifyCard = this._createAdBlockerCard(
      'Spotify Ad Blocker',
      'Mutes and fast-forwards Spotify ads. Removes banner ads and audio advertisements on Spotify Web Player.',
      spotifyEnabled,
      'spotifyAdBlockerEnabled'
    );
    
    contentContainer.appendChild(youtubeCard);
    contentContainer.appendChild(spotifyCard);
    
    // Add info note
    const infoNote = document.createElement('div');
    infoNote.style.cssText = `
      background-color: #e8f0fe;
      border-left: 4px solid #4285f4;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
    `;
    infoNote.innerHTML = `
      <strong style="color: #1967d2;">ℹ️ Important Notes:</strong>
      <ul style="margin: 10px 0 0 20px; color: #202124;">
        <li>Ad blockers only work on <strong>YouTube.com</strong> and <strong>Spotify Web Player</strong></li>
        <li>Changes take effect immediately - no page reload required</li>
        <li>YouTube: Skips video ads, removes banner ads and promoted videos</li>
        <li>Spotify: Mutes ads, fast-forwards through them, and removes banner ads</li>
        <li>These ad blockers respect content creators while improving your experience</li>
      </ul>
    `;
    contentContainer.appendChild(infoNote);
  });
  
  mainContent.appendChild(contentContainer);
},

/**
 * Create an ad blocker control card
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @param {boolean} enabled - Whether the blocker is enabled
 * @param {string} settingKey - Storage key for this setting
 * @param {string} emoji - Emoji icon
 * @returns {HTMLElement} Card element
 */
_createAdBlockerCard: function(title, description, enabled, settingKey, emoji) {
  const card = document.createElement('div');
  card.className = 'niblie-adblocker-card';
  card.style.cssText = `
    background-color: #f8f9fa;
    border: 1px solid #e4e8ed;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  `;
  
  // Left side: Icon, title, and description
  const leftSide = document.createElement('div');
  leftSide.style.cssText = `
    flex: 1;
    display: flex;
    gap: 15px;
    align-items: flex-start;
  `;
  
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    font-size: 32px;
    line-height: 1;
  `;
  iconContainer.textContent = emoji;
  
  const textContainer = document.createElement('div');
  textContainer.style.cssText = `
    flex: 1;
  `;
  
  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 500;
    color: #202124;
  `;
  
  const descEl = document.createElement('p');
  descEl.textContent = description;
  descEl.style.cssText = `
    margin: 0;
    font-size: 13px;
    color: #5f6368;
    line-height: 1.5;
  `;
  
  textContainer.appendChild(titleEl);
  textContainer.appendChild(descEl);
  leftSide.appendChild(iconContainer);
  leftSide.appendChild(textContainer);
  
  // Right side: Toggle switch
  const toggleContainer = document.createElement('div');
  toggleContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  const statusText = document.createElement('span');
  statusText.style.cssText = `
    font-size: 13px;
    font-weight: 500;
    color: ${enabled ? '#34a853' : '#5f6368'};
    min-width: 60px;
  `;
  statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  
  const toggleSwitch = document.createElement('label');
  toggleSwitch.style.cssText = `
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
    cursor: pointer;
  `;
  
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = enabled;
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
    background-color: ${enabled ? '#34a853' : '#ccc'};
    transition: 0.3s;
    border-radius: 24px;
  `;
  
  const sliderButton = document.createElement('span');
  sliderButton.style.cssText = `
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: ${enabled ? '27px' : '3px'};
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  `;
  
  slider.appendChild(sliderButton);
  toggleSwitch.appendChild(toggleInput);
  toggleSwitch.appendChild(slider);
  
  // Toggle event handler
  toggleInput.addEventListener('change', () => {
    const isEnabled = toggleInput.checked;
    
    // Update UI immediately
    slider.style.backgroundColor = isEnabled ? '#34a853' : '#ccc';
    sliderButton.style.left = isEnabled ? '27px' : '3px';
    statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
    statusText.style.color = isEnabled ? '#34a853' : '#5f6368';
    
    // Save to storage
    const setting = {};
    setting[settingKey] = isEnabled;
    chrome.storage.sync.set(setting, () => {
      console.log(`[Niblie] ${title} ${isEnabled ? 'enabled' : 'disabled'}`);
      
      // Show notification
      this._showAdBlockerNotification(
        isEnabled ? `${title} Enabled` : `${title} Disabled`,
        isEnabled ? 'Ad blocking is now active' : 'Ad blocking is now inactive'
      );
    });
  });
  
  toggleContainer.appendChild(statusText);
  toggleContainer.appendChild(toggleSwitch);
  
  card.appendChild(leftSide);
  card.appendChild(toggleContainer);
  
  return card;
},

/**
 * Show notification for ad blocker changes
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
_showAdBlockerNotification: function(title, message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #202124;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10002;
    min-width: 250px;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 500; margin-bottom: 5px;">${title}</div>
    <div style="font-size: 13px; opacity: 0.9;">${message}</div>
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(20px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
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
      this.loadAdBlockersSection();
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
 * Shows or hides link categories based on tab selection
 * @param {string} category - Selected category, or 'all' for all categories
 */
_showCategoryLinks: function(category) {
  const content = document.getElementById('niblie-links-content');
  if (!content) return;
  
  const categories = content.querySelectorAll('.niblie-link-category');
  
  // Show/hide categories based on selection
  categories.forEach(cat => {
    if (category === 'all' || cat.dataset.category === category) {
      cat.style.display = 'block';
    } else {
      cat.style.display = 'none';
    }
  });
  
  // If no links are shown, display a message
  let visibleCount = 0;
  categories.forEach(cat => {
    if (cat.style.display !== 'none') {
      visibleCount++;
    }
  });
  
  // Remove existing message if it exists
  const existingMsg = content.querySelector('.niblie-no-category-links');
  if (existingMsg) {
    existingMsg.remove();
  }
  
  // Add message if no links in this category
  if (visibleCount === 0) {
    const noCategoryLinks = document.createElement('div');
    noCategoryLinks.className = 'niblie-no-category-links';
    noCategoryLinks.textContent = 'No links found in this category.';
    noCategoryLinks.style.cssText = `
      padding: 20px;
      text-align: center;
      color: #5f6368;
      font-style: italic;
    `;
    content.appendChild(noCategoryLinks);
  }
},

/**
 * Shows an error message in the content area
 * @param {HTMLElement} container - The container to show the message in
 * @param {string} message - The error message to display
 */
_showErrorMessage: function(container, message) {
  // Clear existing content
  container.innerHTML = '';
  
  const errorMsg = document.createElement('div');
  errorMsg.className = 'niblie-error';
  errorMsg.textContent = message;
  errorMsg.style.cssText = `
    padding: 40px 0;
    text-align: center;
    color: #d93025;
  `;
  container.appendChild(errorMsg);
},

/**
 * Gets the appropriate icon element for a given category
 * @param {string} category - The category to get the icon for
 * @returns {HTMLElement} The icon element
 */
getCategoryIcon: function(category) {
  // Default icon (link)
  const icon = document.createElement('span');
  icon.className = 'niblie-category-icon';
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.354 1.146a.5.5 0 0 1 .293.5V4.5h2.5a.5.5 0 0 1 0 1H8.646a.5.5 0 0 1-.354-.854L9.793 2.5H8.5a.5.5 0 0 1-.354-.854l.208-.208a.5.5 0 0 1 .354-.146zM4.5 8a.5.5 0 0 1 .5-.5h2.5V5.5a.5.5 0 0 1 1 0v2.5h2.5a.5.5 0 0 1 0 1H8.5v2.5a.5.5 0 0 1-1 0V8.5H5a.5.5 0 0 1-.5-.5z"/>
    </svg>
  `;
  
  // Customize icons for specific categories
  switch(category) {
    case 'socialLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0zm3.646 11.354a.5.5 0 0 1-.708 0L8 9.207l-2.938 2.147a.5.5 0 0 1-.708-.708l3.646-3.646a.5.5 0 0 1 .708 0l3.646 3.646a.5.5 0 0 1 0 .708z"/>
        </svg>
      `;
      break;
    case 'externalLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
      `;
      break;
    case 'internalLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.354 1.146a.5.5 0 0 1 .293.5V4.5h2.5a.5.5 0 0 1 0 1H8.646a.5.5 0 0 1-.354-.854L9.793 2.5H8.5a.5.5 0 0 1-.354-.854l.208-.208a.5.5 0 0 1 .354-.146zM4.5 8a.5.5 0 0 1 .5-.5h2.5V5.5a.5.5 0 0 1 1 0v2.5h2.5a.5.5 0 0 1 0 1H8.5v2.5a.5.5 0 0 1-1 0V8.5H5a.5.5 0 0 1-.5-.5z"/>
        </svg>
      `;
      break;
    case 'documentLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0zm3.646 11.354a.5.5 0 0 1-.708 0L8 9.207l-2.938 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 0 1 .708-.708L8 7.293l2.646-2.147a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1 0 .708z"/>
        </svg>
      `;
      break;
    case 'mediaLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0zm3.646 11.354a.5.5 0 0 1-.708 0L8 9.207l-2.938 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 0 1 .708-.708L8 7.293l2.646-2.147a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1 0 .708z"/>
        </svg>
      `;
      break;
    case 'emailLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0zm3.646 11.354a.5.5 0 0 1-.708 0L8 9.207l-2.938 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 0 1 .708-.708L8 7.293l2.646-2.147a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1 0 .708z"/>
        </svg>
      `;
      break;
    case 'navigationLinks':
      icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0a8 8 0 1 0 8 8A8.009 8.009 0 0 0 8 0zm3.646 11.354a.5.5 0 0 1-.708 0L8 9.207l-2.938 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 0 1 .708-.708L8 7.293l2.646-2.147a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1 0 .708z"/>
        </svg>
      `;
      break;
  }
  
  return icon;
},

/**
 * Initializes the modal UI component
 */
init: function() {
  // Create modal element
  this.createModal();
  
  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && this.isOpen) {
      this.closeModal();
    }
  });
},

/**
 * Destroys the modal UI component
 */
destroy: function() {
  if (!this.modal) return;
  
  // Remove event listeners
  document.removeEventListener('keydown', this._handleKeyDown);
  document.removeEventListener('wheel', this._preventScroll, { passive: false });
  document.removeEventListener('touchmove', this._preventScroll, { passive: false });
  
  // Remove modal from DOM
  this.modal.remove();
  this.modal = null;
},

/**
 * Handles key down events for the modal
 * @param {KeyboardEvent} e - The keyboard event
 */
_handleKeyDown: function(e) {
  // Close modal on ESC key
  if (e.key === 'Escape' && ModalUI.isOpen) {
    ModalUI.closeModal();
  }
},

/**
 * Prevents background scrolling but allows scrolling within the modal
 * @param {Event} e - The event object
 */
_preventScroll: function(e) {
  if (!this.isOpen) return;
  
  // Find if the scroll event originated from within modal content
  const modalContent = document.querySelector('.niblie-main-content');
  if (!modalContent) return;
  
  let target = e.target;
  let isWithinModalContent = false;
  
  // Check if scroll event is within modal content area
  while (target) {
    if (target === modalContent) {
      isWithinModalContent = true;
      break;
    }
    target = target.parentElement;
  }
  
  // Only prevent default if not within modal content
  if (!isWithinModalContent) {
    e.preventDefault();
  }
},

/**
 * Helper method to ensure scrolling works correctly in all cases
 */
_ensureScrollingWorks: function() {
  // Fix main content scrolling
  const mainContent = document.querySelector('.niblie-main-content');
  if (mainContent) {
    mainContent.style.overflow = 'auto';
    mainContent.style.overflowX = 'hidden';
    mainContent.style.overflowY = 'auto';
    mainContent.style.maxHeight = 'calc(80vh - 60px)';
  }
  
  // Fix table preview scrolling
  const tablePreviewElements = document.querySelectorAll('.niblie-table-preview');
  tablePreviewElements.forEach(preview => {
    preview.style.position = 'relative'; // For absolute positioning of overlay
    preview.style.overflowX = 'auto';
    preview.style.maxHeight = '200px';
  });
},

/**
 * Adds a global style to enforce scrolling in the modal content
 * This is the most reliable way to ensure scrolling works
 */
_addScrollingStyles: function() {
  // Check if we already added the style
  if (document.getElementById('niblie-scroll-styles')) return;
  
  // Create a style element
  const style = document.createElement('style');
  style.id = 'niblie-scroll-styles';
  
  // Add styles that force scrolling to work in the modal
  style.textContent = `
    .niblie-main-content {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      max-height: calc(80vh - 60px) !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    .niblie-table-preview {
      overflow-x: auto !important;
      max-height: 200px !important;
      position: relative !important;
    }
    
    .niblie-modal-content {
      overflow: hidden !important;
    }
  `;
  
  // Add the style to the document head
  document.head.appendChild(style);
  console.log('Added scroll styles to document');
},

/**
 * Fixes scrolling inside the modal
 */
fixScrollBehavior: function() {
  console.log('Applying scroll behavior fix');
  
  // 1. Remove any existing wheel/touch event listeners that might interfere
  if (this._boundPreventScroll) {
    document.removeEventListener('wheel', this._boundPreventScroll, { passive: false });
    document.removeEventListener('touchmove', this._boundPreventScroll, { passive: false });
  }
  
  // 2. Set explicit CSS to force scrolling to work in the main content area
  const mainContent = document.querySelector('.niblie-main-content');
  if (mainContent) {
    mainContent.style.cssText += `
      overflow-y: scroll !important; 
      overflow-x: hidden !important;
      max-height: calc(80vh - 120px) !important;
      -webkit-overflow-scrolling: touch !important;
    `;
    
    // Make sure the content is actually scrollable by preventing event propagation
    mainContent.addEventListener('wheel', function(e) {
      e.stopPropagation();
    }, { passive: true });
  }
  
  // 3. Inject a style tag with !important rules to override any conflicting styles
  if (!document.getElementById('niblie-scroll-fix')) {
    const style = document.createElement('style');
    style.id = 'niblie-scroll-fix';
    style.innerHTML = `
      .niblie-main-content {
        overflow-y: scroll !important;
        overflow-x: hidden !important;
        max-height: calc(80vh - 120px) !important;
      }
      
      .niblie-table-preview {
        overflow: auto !important;
        max-height: 200px !important;
      }
    `;
    document.head.appendChild(style);
  }
}
};

// Initialize the ModalUI component
ModalUI.init();