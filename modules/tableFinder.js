/**
 * Table finder module for extracting tables from a webpage
 */

// Create a module registry if it doesn't exist
if (!window.ExtModules) {
  window.ExtModules = {};
}

// Simple module check
function isModuleAvailable(moduleName) {
  return window[moduleName] !== undefined || 
         (window.ExtModules && window.ExtModules[moduleName] !== undefined);
}

const TableFinder = {
  // Cache for table data
  tableCache: null,
  
  /**
   * Find all tables on the current page
   * @param {boolean} forceRefresh - Whether to force refresh the cache
   * @returns {Promise<Object>} Object containing tables
   */
  findTables: function(forceRefresh = false) {
    // Use cached results if available and not forcing refresh
    if (this.tableCache && !forceRefresh) {
      return Promise.resolve(this.tableCache);
    }
    
    return new Promise((resolve) => {
      console.log('TableFinder: Scanning page for tables...');
      
      const results = {
        htmlTables: [],
        divTables: []
      };
      
      try {
        // Find HTML tables
        this._findHtmlTables(results.htmlTables);
        
        // Find div-based tables
        this._findDivTables(results.divTables);
        
        // Process and merge similar tables
        const processedTables = this._processTables([...results.htmlTables, ...results.divTables]);
        
        console.log(`TableFinder: Found ${processedTables.length} tables`);
        
        // Store in cache
        this.tableCache = processedTables;
        
        resolve(processedTables);
      } catch (error) {
        console.error('TableFinder: Error while scanning for tables:', error);
        // Return empty result instead of failing completely
        this.tableCache = [];
        resolve([]);
      }
    });
  },
  
  /**
   * Find traditional HTML tables
   * @param {Array} targetArray - Array to add found tables to
   * @private
   */
  _findHtmlTables: function(targetArray) {
    try {
      const tables = document.querySelectorAll('table');
      
      tables.forEach((table, tableIndex) => {
        try {
          // Skip invisible tables
          if (!this._isElementVisible(table)) return;
          
          // Skip tiny tables (likely used for layout)
          const rows = table.querySelectorAll('tr');
          if (rows.length <= 1) return;
          
          // Extract headers
          let headers = [];
          try {
            const headerRow = table.querySelector('thead tr');
            
            if (headerRow) {
              headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => ({
                text: this._cleanText(cell.textContent || ''),
                colspan: cell.getAttribute('colspan') ? parseInt(cell.getAttribute('colspan'), 10) : 1
              }));
            } else if (rows.length > 0) {
              // Use first row as header if no thead exists
              headers = Array.from(rows[0].querySelectorAll('th, td')).map(cell => ({
                text: this._cleanText(cell.textContent || ''),
                colspan: cell.getAttribute('colspan') ? parseInt(cell.getAttribute('colspan'), 10) : 1
              }));
            }
          } catch (headerError) {
            console.warn('Error extracting table headers:', headerError);
            // Use empty headers rather than failing
            headers = [];
          }
          
          // Expand headers with colspan
          const expandedHeaders = [];
          headers.forEach(header => {
            if (header.colspan > 1) {
              for (let i = 0; i < header.colspan; i++) {
                expandedHeaders.push(i === 0 ? header.text : `${header.text} (${i + 1})`);
              }
            } else {
              expandedHeaders.push(header.text);
            }
          });
          
          // Extract data rows
          const startRowIndex = table.querySelector('thead tr') ? 0 : 1;
          const dataRows = [];
          
          try {
            for (let i = startRowIndex; i < rows.length; i++) {
              if (i === 0 && startRowIndex === 1) continue; // Skip header row
              
              const rowData = [];
              const cells = rows[i].querySelectorAll('td, th');
              
              cells.forEach(cell => {
                const cellData = {
                  text: this._cleanText(cell.textContent || ''),
                  colspan: cell.getAttribute('colspan') ? parseInt(cell.getAttribute('colspan'), 10) : 1,
                  rowspan: cell.getAttribute('rowspan') ? parseInt(cell.getAttribute('rowspan'), 10) : 1
                };
                
                // Handle colspan by duplicating cell content
                for (let j = 0; j < cellData.colspan; j++) {
                  rowData.push(cellData.text);
                }
              });
              
              dataRows.push(rowData);
            }
          } catch (rowsError) {
            console.warn('Error extracting table rows:', rowsError);
          }
          
          // Only add if we have data
          if (expandedHeaders.length > 0 || dataRows.length > 0) {
            // Create table object
            const tableObj = {
              id: `html-table-${tableIndex}`,
              type: 'html',
              element: table,
              caption: (table.querySelector('caption')?.textContent || '').trim(),
              headers: expandedHeaders,
              rows: dataRows,
              position: this._getElementPosition(table)
            };
            
            targetArray.push(tableObj);
          }
        } catch (tableError) {
          console.warn(`Error processing table ${tableIndex}:`, tableError);
          // Continue to next table instead of failing completely
        }
      });
    } catch (error) {
      console.error('Error finding HTML tables:', error);
    }
  },
  
  /**
   * Find div-based tables
   * @param {Array} targetArray - Array to add found tables to
   * @private
   */
  _findDivTables: function(targetArray) {
    try {
      // Find potential table containers based on common patterns
      const divTableSelectors = [
        '.table',
        '[class*="table"]',
        '.grid',
        '[class*="grid"]',
        '[role="table"]',
        '[role="grid"]',
        '.datatable',
        '[class*="datatable"]'
      ];
      
      // Use a safer selection approach
      let potentialTables = [];
      try {
        potentialTables = document.querySelectorAll(divTableSelectors.join(', '));
      } catch (selectorError) {
        console.warn('Error with div table selectors, trying simpler approach:', selectorError);
        
        // Try with simpler selectors if the complex one failed
        divTableSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => potentialTables.push(el));
          } catch (err) {
            // Skip this selector
          }
        });
      }
      
      // Create an array from NodeList to avoid issues
      Array.from(potentialTables).forEach((container, tableIndex) => {
        try {
          // Skip if it contains a standard table element (to avoid duplication)
          if (container.querySelector('table')) return;
          
          // Skip invisible elements
          if (!this._isElementVisible(container)) return;
          
          let headers = [];
          let rows = [];
          
          // Find header row elements with safer approach
          const headerRowSelectors = [
            '[role="rowgroup"]:first-child [role="row"]',
            '[role="rowgroup"]:first-child > div',
            '[class*="header"] > div',
            '[class*="head"] > div',
            '> div:first-child',
            '.row:first-child',
            '[class*="row"]:first-child'
          ];
          
          // Try to get header row
          let headerRowElement = null;
          for (const selector of headerRowSelectors) {
            try {
              const potentialHeader = container.querySelector(selector);
              if (potentialHeader) {
                headerRowElement = potentialHeader;
                break;
              }
            } catch (e) {
              // Skip this selector
            }
          }
          
          // Find header cells
          if (headerRowElement) {
            const headerCellSelectors = [
              '[role="columnheader"]', 
              '[role="cell"]',
              '[class*="header-cell"]',
              '[class*="cell"]',
              '> div',
              '> span'
            ];
            
            // Try to get header cells
            let headerCells = null;
            for (const selector of headerCellSelectors) {
              try {
                const potentialCells = headerRowElement.querySelectorAll(selector);
                if (potentialCells.length > 1) {
                  headerCells = potentialCells;
                  break;
                }
              } catch (e) {
                // Skip this selector
              }
            }
            
            // Extract header texts
            if (headerCells) {
              headers = Array.from(headerCells).map(cell => 
                this._cleanText(cell.textContent || ''));
            } else {
              // If no header cells found, use first row's text content
              headers = [this._cleanText(headerRowElement.textContent || '')];
            }
          }
          
          // Find data rows with safer approach
          const rowSelectors = [
            '[role="row"]',
            '[class*="row"]',
            '> div'
          ];
          
          let rowElements = [];
          for (const selector of rowSelectors) {
            try {
              const potentialRows = container.querySelectorAll(selector);
              if (potentialRows.length > 1) {
                // Skip the first row if it was used as header
                rowElements = Array.from(potentialRows).slice(headerRowElement ? 1 : 0);
                break;
              }
            } catch (e) {
              // Skip this selector
            }
          }
          
          // Extract data from rows
          rowElements.forEach(row => {
            try {
              const cellSelectors = [
                '[role="cell"]',
                '[class*="cell"]',
                '> div',
                '> span'
              ];
              
              let cells = null;
              for (const selector of cellSelectors) {
                try {
                  const potentialCells = row.querySelectorAll(selector);
                  if (potentialCells.length > 1) {
                    cells = potentialCells;
                    break;
                  }
                } catch (e) {
                  // Skip this selector
                }
              }
              
              if (cells) {
                const rowData = Array.from(cells).map(cell => 
                  this._cleanText(cell.textContent || ''));
                rows.push(rowData);
              } else {
                // If no cells found, use row's text content
                rows.push([this._cleanText(row.textContent || '')]);
              }
            } catch (rowError) {
              console.warn('Error processing div table row:', rowError);
            }
          });
          
          // Only add if we have meaningful data (more than just header)
          if (rows.length > 0 && headers.length > 0) {
            const tableObj = {
              id: `div-table-${tableIndex}`,
              type: 'div',
              element: container,
              caption: '',
              headers: headers,
              rows: rows,
              position: this._getElementPosition(container)
            };
            
            targetArray.push(tableObj);
          }
        } catch (containerError) {
          console.warn(`Error processing div table container ${tableIndex}:`, containerError);
          // Continue to next potential table instead of failing completely
        }
      });
    } catch (error) {
      console.error('Error finding div tables:', error);
    }
  },
  
  /**
   * Process and merge similar tables
   * @param {Array} tables - Array of tables
   * @returns {Array} Processed tables
   * @private
   */
  _processTables: function(tables) {
    if (tables.length <= 1) return tables;
    
    // Group tables by header signature
    const groupedTables = {};
    
    tables.forEach(table => {
      // Create a hash of the headers
      const headerSignature = table.headers.join('|').toLowerCase();
      
      if (!groupedTables[headerSignature]) {
        groupedTables[headerSignature] = [table];
      } else {
        groupedTables[headerSignature].push(table);
      }
    });
    
    // Merge tables with the same headers
    const mergedTables = [];
    
    Object.entries(groupedTables).forEach(([signature, tableGroup]) => {
      if (tableGroup.length === 1) {
        // Just add the table if it's the only one with this header signature
        mergedTables.push(tableGroup[0]);
      } else {
        // Merge tables with the same header signature
        const mergedTable = {
          id: `merged-${tableGroup[0].id}`,
          type: 'merged',
          elements: tableGroup.map(t => t.element),
          caption: `Merged Table (${tableGroup.length} tables)`,
          headers: tableGroup[0].headers,
          rows: [],
          position: tableGroup[0].position,
          mergedFrom: tableGroup.map(t => t.id)
        };
        
        // Combine all rows from all tables
        tableGroup.forEach(table => {
          mergedTable.rows = [...mergedTable.rows, ...table.rows];
        });
        
        mergedTables.push(mergedTable);
      }
    });
    
    return mergedTables;
  },
  
  /**
   * Check if an element is visible
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Whether element is visible
   * @private
   */
  _isElementVisible: function(element) {
    if (!element) return false;
    
    try {
      // Check if we should ignore viewport constraints
      if (this.scanEntirePage) {
        // When scanning the entire page, only check if the element is present in DOM
        // and has non-zero dimensions
        const style = window.getComputedStyle(element);
        
        // Skip hidden elements regardless
        if (style.display === 'none' || 
            style.visibility === 'hidden' || 
            style.opacity === '0') {
          return false;
        }
        
        // Return true if the element exists and isn't explicitly hidden
        return true;
      }
      
      // Standard viewport-based visibility check
      const style = window.getComputedStyle(element);
      
      if (style.display === 'none' || 
          style.visibility === 'hidden' || 
          style.opacity === '0' ||
          element.offsetWidth === 0 || 
          element.offsetHeight === 0) {
        return false;
      }
      
      // Check if element is in viewport or near it
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      
      // Consider elements that might be just outside the viewport
      const extendedViewport = {
        top: -viewportHeight,
        left: -viewportWidth,
        bottom: viewportHeight * 2,
        right: viewportWidth * 2
      };
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom >= extendedViewport.top &&
        rect.right >= extendedViewport.left &&
        rect.top <= extendedViewport.bottom &&
        rect.left <= extendedViewport.right
      );
    } catch (error) {
      console.warn('Error checking element visibility:', error);
      return false;
    }
  },
  
  /**
   * Get element position relative to page
   * @param {HTMLElement} element - Element to get position for
   * @returns {Object} Element position
   * @private
   */
  _getElementPosition: function(element) {
    const rect = element.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft
    };
  },
  
  /**
   * Clean and normalize text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   * @private
   */
  _cleanText: function(text) {
    // Remove multiple spaces, tabs, newlines
    return text.replace(/\s+/g, ' ').trim();
  },
  
  /**
   * Clear the table cache
   */
  clearCache: function() {
    this.tableCache = null;
  },
  
  /**
   * Export table data to CSV format
   * @param {Object} table - Table object
   * @returns {string} CSV content
   */
  exportToCSV: function(table) {
    // Create CSV content
    let csv = [];
    
    // Add headers
    csv.push(table.headers.map(header => this._escapeCSV(header)).join(','));
    
    // Add rows
    table.rows.forEach(row => {
      csv.push(row.map(cell => this._escapeCSV(cell)).join(','));
    });
    
    return csv.join('\n');
  },
  
  /**
   * Escape special characters for CSV
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  _escapeCSV: function(text) {
    // Double quotes need to be doubled in CSV
    const escaped = text.replace(/"/g, '""');
    // Enclose in quotes if contains comma, quote or newline
    if (/[",\n]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  },
  
  /**
   * Export table data to Excel format
   * @param {Object} table - Table object
   * @returns {Blob} Excel file blob
   */
  exportToExcel: function(table) {
    // Create a basic Excel XML file
    let xml = '<?xml version="1.0"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
    xml += '<Worksheet ss:Name="Sheet1">';
    xml += '<Table>';
    
    // Add headers
    xml += '<Row>';
    table.headers.forEach(header => {
      xml += `<Cell><Data ss:Type="String">${this._escapeXML(header)}</Data></Cell>`;
    });
    xml += '</Row>';
    
    // Add rows
    table.rows.forEach(row => {
      xml += '<Row>';
      row.forEach(cell => {
        xml += `<Cell><Data ss:Type="String">${this._escapeXML(cell)}</Data></Cell>`;
      });
      xml += '</Row>';
    });
    
    xml += '</Table>';
    xml += '</Worksheet>';
    xml += '</Workbook>';
    
    return new Blob([xml], { type: 'application/vnd.ms-excel' });
  },
  
  /**
   * Escape special characters for XML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  _escapeXML: function(text) {
    return text.replace(/[<>&'"]/g, function(c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }
};

/**
 * Table UI component for managing table display and export
 */
const TableUI = {
  /**
   * Create tables content for the modal
   * @param {boolean} forceRefresh - Whether to force refresh
   * @returns {HTMLElement} Tables content container
   */
  createTablesContent: function(forceRefresh = false) {
    // Create tables container
    const container = document.createElement('div');
    container.className = 'niblie-tables-content';
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
    `;
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'niblie-loading';
    loadingIndicator.innerHTML = `
      <div class="niblie-spinner"></div>
      <p>Extracting tables from the page...</p>
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
    
    container.appendChild(loadingIndicator);
    
    // Find tables
    TableFinder.findTables(forceRefresh).then(tables => {
      // Remove loading indicator
      loadingIndicator.remove();
      
      // Process table data
      this._displayTables(container, tables);
    }).catch(error => {
      console.error('Error finding tables:', error);
      loadingIndicator.remove();
      
      // Show error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'niblie-error';
      errorMessage.textContent = 'An error occurred while extracting tables.';
      errorMessage.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #d93025;
      `;
      container.appendChild(errorMessage);
    });
    
    return container;
  },
  
  /**
   * Display tables in the UI
   * @param {HTMLElement} container - Container element
   * @param {Array} tables - Array of table objects
   * @private
   */
  _displayTables: function(container, tables) {
    // Check if any tables were found
    if (tables.length === 0) {
      const noTables = document.createElement('div');
      noTables.className = 'niblie-no-tables';
      noTables.textContent = 'No tables found on this page.';
      noTables.style.cssText = `
        padding: 40px;
        text-align: center;
        color: #5f6368;
        font-style: italic;
      `;
      container.appendChild(noTables);
      return;
    }
    
    // Create a card for each table
    tables.forEach((table, index) => {
      const card = this._createTableCard(table, index);
      container.appendChild(card);
    });
  },
  
  /**
   * Create a card for a table
   * @param {Object} table - Table data
   * @param {number} index - Table index
   * @returns {HTMLElement} Table card
   * @private
   */
  _createTableCard: function(table, index) {
    const card = document.createElement('div');
    card.className = 'niblie-table-card';
    card.dataset.tableId = table.id;
    card.style.cssText = `
      background: white;
      border-radius: 8px;
      border: 1px solid #e4e8ed;
      margin-bottom: 20px;
      overflow: hidden;
    `;
    
    // Table header section with title
    const header = document.createElement('div');
    header.className = 'niblie-table-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #e4e8ed;
      background-color: #f8f9fa;
    `;
    
    // Title section
    const titleContainer = document.createElement('div');
    titleContainer.className = 'niblie-table-title-container';
    titleContainer.style.cssText = `
      flex-grow: 1;
      margin-right: 10px;
    `;
    
    const titleDisplay = document.createElement('h3');
    titleDisplay.className = 'niblie-table-title-display';
    titleDisplay.textContent = table.userTitle || table.caption || `Table ${index + 1}`;
    titleDisplay.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #202124;
      cursor: pointer;
      display: flex;
      align-items: center;
    `;
    
    // Add edit icon to indicate the title is editable
    const editIcon = document.createElement('span');
    editIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="margin-left: 5px; opacity: 0.5;">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
      </svg>
    `;
    titleDisplay.appendChild(editIcon);
    
    const titleInput = document.createElement('input');
    titleInput.className = 'niblie-table-title-input';
    titleInput.type = 'text';
    titleInput.value = table.userTitle || table.caption || `Table ${index + 1}`;
    titleInput.style.cssText = `
      width: 100%;
      font-size: 16px;
      font-weight: 500;
      padding: 5px;
      border: 1px solid #4285f4;
      border-radius: 4px;
      display: none;
      margin: 0;
    `;
    
    // Toggle between display and edit mode
    titleDisplay.addEventListener('click', () => {
      titleDisplay.style.display = 'none';
      titleInput.style.display = 'block';
      titleInput.focus();
      titleInput.select();
    });
    
    titleInput.addEventListener('blur', () => {
      const newTitle = titleInput.value.trim();
      if (newTitle) {
        titleDisplay.childNodes[0].nodeValue = newTitle;
        table.userTitle = newTitle;
      }
      titleInput.style.display = 'none';
      titleDisplay.style.display = 'flex';
    });
    
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        titleInput.blur();
      } else if (e.key === 'Escape') {
        titleInput.value = titleDisplay.childNodes[0].nodeValue;
        titleInput.blur();
      }
    });
    
    titleContainer.appendChild(titleDisplay);
    titleContainer.appendChild(titleInput);
    
    // Row and column count
    const tableInfo = document.createElement('div');
    tableInfo.className = 'niblie-table-info';
    tableInfo.textContent = `${table.rows.length} rows × ${table.headers.length || 0} columns`;
    tableInfo.style.cssText = `
      font-size: 12px;
      color: #5f6368;
      margin-top: 5px;
    `;
    
    titleContainer.appendChild(tableInfo);
    header.appendChild(titleContainer);
    
    // Rest of the existing code for the table card
    // ... (keep the existing export and view functionality)
    
    return card;
  },
  
  /**
   * Show table preview in a modal
   * @param {Object} table - Table data
   * @private
   */
  _showTablePreview: function(table) {
    // Create or get overlay
    let overlay = document.getElementById('niblie-table-preview-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    overlay = document.createElement('div');
    overlay.id = 'niblie-table-preview-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'niblie-table-full-preview';
    previewContainer.style.cssText = `
      background-color: white;
      width: 90%;
      max-width: 1000px;
      height: 80%;
      max-height: 600px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
    `;
    
    // Preview header
    const previewHeader = document.createElement('div');
    previewHeader.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #e4e8ed;
      background-color: #f8f9fa;
    `;
    
    const previewTitle = document.createElement('h3');
    previewTitle.textContent = table.caption || 'Table Preview';
    previewTitle.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
      </svg>
    `;
    closeButton.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: #5f6368;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = '#f1f3f4';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = '';
    });
    
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    previewHeader.appendChild(previewTitle);
    previewHeader.appendChild(closeButton);
    
    // Table content
    const tableContent = document.createElement('div');
    tableContent.style.cssText = `
      flex-grow: 1;
      padding: 20px;
      overflow: auto;
    `;
    
    const fullTable = document.createElement('table');
    fullTable.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;
    
    // Table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    table.headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.cssText = `
        padding: 12px;
        text-align: left;
        border: 1px solid #e4e8ed;
        background-color: #f8f9fa;
        position: sticky;
        top: 0;
        font-weight: 500;
      `;
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    fullTable.appendChild(thead);
    
    // Table body
    const tbody = document.createElement('tbody');
    
    table.rows.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      
      row.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell;
        td.style.cssText = `
          padding: 12px;
          border: 1px solid #e4e8ed;
          ${rowIndex % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8f9fa;'}
        `;
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    fullTable.appendChild(tbody);
    tableContent.appendChild(fullTable);
    
    // Export options
    const exportOptions = document.createElement('div');
    exportOptions.style.cssText = `
      padding: 15px 20px;
      border-top: 1px solid #e4e8ed;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background-color: #f8f9fa;
    `;
    
    const exportFormats = [
      { format: 'csv', label: 'Export as CSV' },
      { format: 'excel', label: 'Export as Excel' },
      { format: 'json', label: 'Export as JSON' }
    ];
    
    exportFormats.forEach(format => {
      const button = document.createElement('button');
      button.textContent = format.label;
      button.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background-color: ${format.format === 'csv' ? '#e8f0fe' : '#f1f3f4'};
        color: ${format.format === 'csv' ? '#1a73e8' : '#202124'};
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = format.format === 'csv' ? '#d4e6fc' : '#e8eaed';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = format.format === 'csv' ? '#e8f0fe' : '#f1f3f4';
      });
      
      button.addEventListener('click', () => {
        this._exportTable(table, format.format);
      });
      
      exportOptions.appendChild(button);
    });
    
    previewContainer.appendChild(previewHeader);
    previewContainer.appendChild(tableContent);
    previewContainer.appendChild(exportOptions);
    
    overlay.appendChild(previewContainer);
    document.body.appendChild(overlay);
    
    // Close on click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  },
  
  /**
   * Export table to selected format
   * @param {Object} table - Table data
   * @param {string} format - Export format
   * @private
   */
  _exportTable: function(table, format) {
    let data, filename, mimeType, extension;
    
    switch (format) {
      case 'csv':
        data = TableFinder.exportToCSV(table);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
        
      case 'excel':
        data = TableFinder.exportToExcel(table);
        mimeType = 'application/vnd.ms-excel';
        extension = 'xls';
        // No need to create blob, already handled by exportToExcel
        this._downloadFile(data, `table-${Date.now()}.${extension}`);
        return;
        
      case 'json':
        data = JSON.stringify({
          caption: table.caption,
          headers: table.headers,
          rows: table.rows
        }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      case 'markdown':
        data = this._tableToMarkdown(table);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
        
      case 'html':
        data = this._tableToHTML(table);
        mimeType = 'text/html';
        extension = 'html';
        break;
        
      default:
        console.error(`Unsupported export format: ${format}`);
        return;
    }
    
    // Create and download file
    const blob = new Blob([data], { type: mimeType });
    this._downloadFile(blob, `table-${Date.now()}.${extension}`);
  },
  
  /**
   * Helper to download a file
   * @param {Blob} blob - File blob
   * @param {string} filename - File name
   * @private
   */
  _downloadFile: function(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  },
  
  /**
   * Convert table to Markdown format
   * @param {Object} table - Table data
   * @returns {string} Markdown string
   * @private
   */
  _tableToMarkdown: function(table) {
    let md = [];
    
    // Add caption
    if (table.caption) {
      md.push(`# ${table.caption}\n`);
    }
    
    // Add headers
    md.push('| ' + table.headers.join(' | ') + ' |');
    
    // Add separator
    md.push('| ' + table.headers.map(() => '---').join(' | ') + ' |');
    
    // Add rows
    table.rows.forEach(row => {
      md.push('| ' + row.join(' | ') + ' |');
    });
    
    return md.join('\n');
  },
  
  /**
   * Convert table to HTML format
   * @param {Object} table - Table data
   * @returns {string} HTML string
   * @private
   */
  _tableToHTML: function(table) {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="UTF-8">\n';
    html += '  <title>' + (table.caption || 'Table') + '</title>\n';
    html += '  <style>\n';
    html += '    table { border-collapse: collapse; width: 100%; }\n';
    html += '    th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }\n';
    html += '    th { background-color: #f2f2f2; }\n';
    html += '    tr:nth-child(even) { background-color: #f9f9f9; }\n';
    html += '  </style>\n';
    html += '</head>\n<body>\n';
    
    if (table.caption) {
      html += '  <h1>' + table.caption + '</h1>\n';
    }
    
    html += '  <table>\n';
    html += '    <thead>\n      <tr>\n';
    
    // Add headers
    table.headers.forEach(header => {
      html += '        <th>' + header + '</th>\n';
    });
    
    html += '      </tr>\n    </thead>\n    <tbody>\n';
    
    // Add rows
    table.rows.forEach(row => {
      html += '      <tr>\n';
      row.forEach(cell => {
        html += '        <td>' + cell + '</td>\n';
      });
      html += '      </tr>\n';
    });
    
    html += '    </tbody>\n  </table>\n</body>\n</html>';
    
    return html;
  }
};

// Register the module for use by other components
function registerModules() {
  console.log('Registering TableFinder and TableUI modules');
  
  // Force expose these modules to the global scope
  window.TableFinder = TableFinder;
  window.TableUI = TableUI;
  
  // Update the module registry if it exists
  if (window.ExtModules) {
    window.ExtModules.TableFinder = TableFinder;
    window.ExtModules.TableUI = TableUI;
  }
  
  console.log('Table modules registered successfully');
  
  // Dispatch event to indicate modules are ready
  const event = new CustomEvent('tableModulesReady');
  document.dispatchEvent(event);
}

// Execute registration immediately
registerModules();