/**
 * Niblie Extension - Tables Module
 * Detects, processes, displays and exports tables from webpages
 */

// Global state for tables
let detectedTables = [];
let tableModal = null;
let activeTableIndex = 0;
let currentSortColumn = null;
let sortDirection = 'asc';

/**
 * Initialize tables functionality
 */
export function initTablesFeature() {
  try {
    // Create modal for tables
    tableModal = createTableModal();
    
    return true;
  } catch (err) {
    console.error('Failed to initialize tables feature:', err);
    return false;
  }
}

/**
 * Main function to detect and process all tables
 */
export function getAllTables() {
  detectedTables = [];
  
  try {
    // 1. First detect standard HTML tables
    const htmlTables = detectHtmlTables();
    
    // 2. Detect visually structured tables (divs that look like tables)
    const visualTables = detectVisualTables();
    
    // 3. Detect list-based tables
    const listTables = detectListTables();
    
    // 4. Combine all tables
    const allTables = [...htmlTables, ...visualTables, ...listTables];
    
    // 5. Clean and normalize tables
    const normalizedTables = normalizeTables(allTables);
    
    // 6. Merge tables with same headers
    const mergedTables = mergeTablesWithSameHeaders(normalizedTables);
    
    // Save to global state
    detectedTables = mergedTables;
    
    console.log(`Tables detected: ${detectedTables.length}`);
    return detectedTables;
  } catch (err) {
    console.error('Error detecting tables:', err);
    return [];
  }
}

/**
 * Detect standard HTML tables
 */
function detectHtmlTables() {
  const tables = [];
  
  document.querySelectorAll('table').forEach((table, tableIndex) => {
    // Skip tiny or hidden tables
    if (isTableTooSmall(table) || isElementHidden(table)) {
      return;
    }
    
    try {
      // Get table caption or closest heading
      const caption = getTableCaption(table);
      
      // Get table headers from thead or first row
      const headers = extractTableHeaders(table);
      
      // Get table rows
      const rows = [];
      const tableRows = Array.from(table.querySelectorAll('tbody tr, tr'));
      // Skip header rows
      const headerRows = Array.from(table.querySelectorAll('thead tr'));
      const dataRows = tableRows.filter(row => !headerRows.includes(row) && !row.querySelector('th'));
      
      dataRows.forEach(row => {
        // Extract cells
        const cells = Array.from(row.querySelectorAll('td')).map(cell => {
          return {
            text: cell.innerText.trim(),
            html: cell.innerHTML,
            colspan: parseInt(cell.getAttribute('colspan') || '1', 10),
            rowspan: parseInt(cell.getAttribute('rowspan') || '1', 10)
          };
        });
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      // Only add if we have actual data
      if (headers.length > 0 && rows.length > 0) {
        tables.push({
          type: 'html',
          id: `table-${tableIndex}`,
          element: table,
          caption: caption,
          headers: headers,
          rows: rows,
          source: 'HTML Table'
        });
      }
    } catch (e) {
      console.error('Error processing HTML table:', e);
    }
  });
  
  return tables;
}

/**
 * Detect visually structured tables made with divs
 */
function detectVisualTables() {
  const tables = [];
  
  // Common table-like class patterns
  const tableLikeClasses = [
    'table', 'grid', 'datagrid', 'datatable', 'data-table', 
    'spreadsheet', 'listing', 'records'
  ];
  
  // Find div structures that look like tables
  for (const cls of tableLikeClasses) {
    document.querySelectorAll(`div[class*=${cls}], section[class*=${cls}]`).forEach((container, containerIndex) => {
      // Skip already processed tables or tables inside tables
      if (container.closest('table') || isElementHidden(container)) {
        return;
      }
      
      try {
        // Check for grid-like structure
        if (isGridLikeElement(container)) {
          // Get table caption from closest heading
          const caption = getClosestHeading(container);
          
          // Find header row based on styling, position, or content
          const headerRow = findHeaderRowInGrid(container);
          const headers = headerRow ? extractVisualHeaders(headerRow) : [];
          
          if (headers.length === 0) {
            return; // Skip if no headers found
          }
          
          // Get data rows
          const rowElements = findDataRowsInGrid(container, headerRow);
          const rows = [];
          
          rowElements.forEach(rowElement => {
            const cells = extractVisualCells(rowElement, headers.length);
            if (cells.length > 0) {
              rows.push(cells);
            }
          });
          
          if (rows.length > 0) {
            tables.push({
              type: 'visual',
              id: `visual-table-${containerIndex}`,
              element: container,
              caption: caption,
              headers: headers,
              rows: rows,
              source: 'Visual Grid'
            });
          }
        }
      } catch (e) {
        console.error('Error processing visual table:', e);
      }
    });
  }
  
  // Also look for tables with ARIA roles
  document.querySelectorAll('[role="table"], [role="grid"]').forEach((container, containerIndex) => {
    if (container.closest('table') || isElementHidden(container)) {
      return;
    }
    
    try {
      const caption = container.querySelector('[role="caption"]')?.innerText.trim() 
        || getClosestHeading(container);
      
      const headerRow = container.querySelector('[role="rowheader"], [role="columnheader"]')?.closest('[role="row"]')
        || container.querySelector('[role="row"]');
      
      if (!headerRow) return;
      
      const headers = Array.from(
        headerRow.querySelectorAll('[role="columnheader"]')
      ).map(cell => cell.innerText.trim());
      
      if (headers.length === 0) {
        return; // Skip if no headers found
      }
      
      // Get data rows
      const rowElements = Array.from(container.querySelectorAll('[role="row"]'))
        .filter(row => row !== headerRow);
      
      const rows = [];
      
      rowElements.forEach(rowElement => {
        const cells = Array.from(
          rowElement.querySelectorAll('[role="cell"], [role="gridcell"]')
        ).map(cell => {
          return {
            text: cell.innerText.trim(),
            html: cell.innerHTML
          };
        });
        
        if (cells.length > 0) {
          rows.push(cells);
        }
      });
      
      if (rows.length > 0) {
        tables.push({
          type: 'aria',
          id: `aria-table-${containerIndex}`,
          element: container,
          caption: caption,
          headers: headers,
          rows: rows,
          source: 'ARIA Table'
        });
      }
    } catch (e) {
      console.error('Error processing ARIA table:', e);
    }
  });
  
  return tables;
}

/**
 * Detect tables formatted as lists
 */
function detectListTables() {
  const tables = [];
  
  try {
    // Look for definition lists that may represent tabular data
    document.querySelectorAll('dl').forEach((list, listIndex) => {
      if (isElementHidden(list)) return;
      
      const terms = Array.from(list.querySelectorAll('dt')).map(dt => dt.innerText.trim());
      
      // Only process if we have multiple terms (potential headers)
      if (terms.length > 2) {
        const descriptions = Array.from(list.querySelectorAll('dd'));
        
        // Group by rows (assume each row is a complete set of terms)
        const rows = [];
        let currentRow = [];
        
        for (let i = 0; i < descriptions.length; i++) {
          currentRow.push({
            text: descriptions[i].innerText.trim(),
            html: descriptions[i].innerHTML
          });
          
          if ((i + 1) % terms.length === 0) {
            rows.push(currentRow);
            currentRow = [];
          }
        }
        
        if (rows.length > 0) {
          tables.push({
            type: 'list',
            id: `list-table-${listIndex}`,
            element: list,
            caption: getClosestHeading(list),
            headers: terms,
            rows: rows,
            source: 'Definition List'
          });
        }
      }
    });
  } catch (e) {
    console.error('Error detecting list tables:', e);
  }
  
  return tables;
}

/**
 * Clean and normalize tables structure
 */
function normalizeTables(tables) {
  return tables.map(table => {
    // Normalize headers: trim, remove empty
    const normalizedHeaders = table.headers
      .map(header => typeof header === 'string' ? header.trim() : header.text.trim())
      .filter(header => header !== '');
    
    // Make sure all rows have the same length as headers
    const normalizedRows = table.rows.map(row => {
      // Ensure row is an array of cell objects
      const normalizedRow = Array.isArray(row) ? [...row] : [row];
      
      // Pad or trim row to match header length
      while (normalizedRow.length < normalizedHeaders.length) {
        normalizedRow.push({ text: '', html: '' });
      }
      
      if (normalizedRow.length > normalizedHeaders.length) {
        normalizedRow.length = normalizedHeaders.length;
      }
      
      return normalizedRow;
    });
    
    return {
      ...table,
      headers: normalizedHeaders,
      rows: normalizedRows,
      rowCount: normalizedRows.length,
      columnCount: normalizedHeaders.length
    };
  }).filter(table => {
    // Remove tables with no headers or no rows
    return table.headers.length > 0 && table.rows.length > 0;
  });
}

/**
 * Merge tables with identical header structures
 */
function mergeTablesWithSameHeaders(tables) {
  const tableGroups = {};
  
  // Group tables by header structure
  tables.forEach(table => {
    // Create a normalized header key for comparison
    const headerKey = table.headers.map(h => h.toLowerCase().trim()).join('|');
    
    if (!tableGroups[headerKey]) {
      tableGroups[headerKey] = [];
    }
    
    tableGroups[headerKey].push(table);
  });
  
  // Process each group
  const result = [];
  
  for (const headerKey in tableGroups) {
    const group = tableGroups[headerKey];
    
    if (group.length === 1) {
      // Only one table with this header structure - keep as is
      result.push(group[0]);
    } else {
      // Multiple tables with same headers - merge them
      const mergedTable = {
        ...group[0],
        id: `merged-${group.map(t => t.id).join('-')}`,
        caption: findBestCaption(group.map(t => t.caption)),
        rows: [].concat(...group.map(t => t.rows)),
        rowCount: group.reduce((sum, t) => sum + t.rowCount, 0),
        merged: true,
        mergedFrom: group.map(t => ({ id: t.id, caption: t.caption, rowCount: t.rowCount })),
        source: `Merged from ${group.length} tables`
      };
      
      result.push(mergedTable);
    }
  }
  
  return result;
}

/**
 * Create modal dialog for displaying tables
 */
function createTableModal() {
  let modal = document.getElementById('niblie-table-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'niblie-table-modal';
    modal.className = 'niblie-modal';
    modal.style.display = 'none';
    
    modal.innerHTML = `
      <div class="niblie-modal-content table-modal-content">
        <div class="niblie-modal-header">
          <div class="niblie-logo">
            <span class="niblie-logo-icon">📊</span>
            <span class="table-title">Table Data</span>
          </div>
          <div class="niblie-modal-actions">
            <button class="dismiss-btn" title="Close (Esc)">✕</button>
          </div>
        </div>
        
        <div class="table-controls">
          <div class="table-navigation">
            <button class="prev-table-btn" disabled>&larr; Previous</button>
            <span class="table-counter">Table 1 of 1</span>
            <button class="next-table-btn" disabled>Next &rarr;</button>
          </div>
          
          <div class="table-info">
            <span class="table-caption">Table Title</span>
            <span class="table-source">(Source: HTML Table)</span>
          </div>
          
          <div class="table-actions">
            <div class="table-export-group">
              <button class="export-btn">Export</button>
              <div class="export-dropdown">
                <button data-format="csv">CSV</button>
                <button data-format="excel">Excel</button>
                <button data-format="json">JSON</button>
                <button data-format="html">HTML</button>
                <button data-format="markdown">Markdown</button>
                <button data-format="pdf">PDF</button>
              </div>
            </div>
            <button class="table-copy-btn">Copy to Clipboard</button>
            <button class="table-search-btn">Search</button>
          </div>
        </div>
        
        <div class="table-search-bar" style="display: none;">
          <input type="text" placeholder="Search table..." class="table-search-input">
          <span class="search-results">0 results</span>
          <button class="search-prev-btn" disabled>&uarr;</button>
          <button class="search-next-btn" disabled>&darr;</button>
          <button class="search-close-btn">✕</button>
        </div>
        
        <div class="table-container">
          <table class="table-preview">
            <thead>
              <tr></tr>
            </thead>
            <tbody></tbody>
          </table>
          
          <div class="table-pagination">
            <button class="pagination-prev">&larr;</button>
            <span class="pagination-info">Rows 1-100 of 100</span>
            <button class="pagination-next">&rarr;</button>
            <select class="pagination-size">
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100" selected>100 per page</option>
              <option value="250">250 per page</option>
              <option value="500">500 per page</option>
              <option value="1000">1000 per page</option>
              <option value="all">Show all</option>
            </select>
          </div>
        </div>
        
        <div class="table-footer">
          <div class="table-stats">
            <span class="row-count">0 rows</span>
            <span class="column-count">0 columns</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    setupTableModalEvents(modal);
  }
  
  return modal;
}

/**
 * Setup all event listeners for table modal
 */
function setupTableModalEvents(modal) {
  // Close button
  modal.querySelector('.dismiss-btn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close on click outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
  
  // Table navigation
  modal.querySelector('.prev-table-btn').addEventListener('click', () => {
    if (activeTableIndex > 0) {
      activeTableIndex--;
      displayTableInModal(detectedTables[activeTableIndex], modal);
    }
  });
  
  modal.querySelector('.next-table-btn').addEventListener('click', () => {
    if (activeTableIndex < detectedTables.length - 1) {
      activeTableIndex++;
      displayTableInModal(detectedTables[activeTableIndex], modal);
    }
  });
  
  // Export buttons - FIXED IMPLEMENTATION
  const exportBtn = modal.querySelector('.export-btn');
  const exportDropdown = modal.querySelector('.export-dropdown');
  
  // Fix for export dropdown positioning
  const exportGroup = modal.querySelector('.table-export-group');
  if (exportGroup) {
    // Force relative positioning with higher z-index
    exportGroup.style.position = 'relative';
    exportGroup.style.zIndex = '2147483646'; // Just below modal z-index
  }
  
  // Fix for export dropdown display
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click from immediately closing
    
    // Toggle visibility with proper z-index
    if (exportDropdown.style.display === 'block') {
      exportDropdown.style.display = 'none';
    } else {
      exportDropdown.style.display = 'block';
      exportDropdown.style.zIndex = '2147483647';  // Ensure dropdown is visible
    }
  });
  
  // Close dropdown when clicking elsewhere - fixed
  document.addEventListener('click', (e) => {
    if (exportDropdown.style.display === 'block' && !exportGroup.contains(e.target)) {
      exportDropdown.style.display = 'none';
    }
  });
  
  // Export format buttons - fixed
  exportDropdown.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      const format = button.getAttribute('data-format');
      const currentTable = detectedTables[activeTableIndex];
      
      if (currentTable) {
        try {
          exportTable(currentTable, format);
          showToast(`Exporting table as ${format.toUpperCase()}...`);
        } catch (err) {
          console.error(`Error exporting as ${format}:`, err);
          showToast(`Error exporting as ${format}`);
        }
      }
      
      exportDropdown.style.display = 'none';
    });
  });
  
  // Copy to clipboard
  modal.querySelector('.table-copy-btn').addEventListener('click', () => {
    const currentTable = detectedTables[activeTableIndex];
    if (currentTable) {
      copyTableToClipboard(currentTable);
    }
  });
  
  // Search functionality
  const searchBar = modal.querySelector('.table-search-bar');
  const searchInput = modal.querySelector('.table-search-input');
  
  modal.querySelector('.table-search-btn').addEventListener('click', () => {
    searchBar.style.display = searchBar.style.display === 'none' ? 'flex' : 'none';
    if (searchBar.style.display === 'flex') {
      searchInput.focus();
    }
  });
  
  searchInput.addEventListener('input', () => {
    searchTable(searchInput.value);
  });
  
  modal.querySelector('.search-close-btn').addEventListener('click', () => {
    searchBar.style.display = 'none';
    searchInput.value = '';
    clearTableSearch();
  });
  
  modal.querySelector('.search-next-btn').addEventListener('click', () => {
    navigateSearchResults('next');
  });
  
  modal.querySelector('.search-prev-btn').addEventListener('click', () => {
    navigateSearchResults('prev');
  });
  
  // Pagination
  const pageSizeSelect = modal.querySelector('.pagination-size');
  pageSizeSelect.addEventListener('change', () => {
    updateTablePagination();
  });
  
  modal.querySelector('.pagination-prev').addEventListener('click', () => {
    navigateTablePages('prev');
  });
  
  modal.querySelector('.pagination-next').addEventListener('click', () => {
    navigateTablePages('next');
  });
  
  // Column sorting
  modal.addEventListener('click', (e) => {
    const headerCell = e.target.closest('th');
    if (headerCell) {
      const columnIndex = Array.from(headerCell.parentNode.children).indexOf(headerCell);
      sortTableByColumn(columnIndex);
    }
  });
}

/**
 * Display table in modal
 */
export function showTablesInModal() {
  if (detectedTables.length === 0) {
    // Detect tables first if none are detected
    getAllTables();
    
    if (detectedTables.length === 0) {
      alert('No tables detected on this page.');
      return;
    }
  }
  
  // Reset active table to first table
  activeTableIndex = 0;
  
  // Make sure we have modal
  if (!tableModal) {
    tableModal = createTableModal();
  }
  
  // Display first table
  displayTableInModal(detectedTables[0], tableModal);
  
  // Show modal
  tableModal.style.display = 'block';
  
  // Update navigation buttons
  updateTableNavigationButtons();
}

/**
 * Display specific table in modal
 */
function displayTableInModal(table, modal) {
  if (!table || !modal) return;
  
  // Update table caption/title
  const captionText = table.caption || 'Untitled Table';
  modal.querySelector('.table-caption').textContent = captionText;
  
  // Update source info
  modal.querySelector('.table-source').textContent = `(Source: ${table.source}${table.merged ? ', Merged' : ''})`;
  
  // Update counter
  modal.querySelector('.table-counter').textContent = `Table ${activeTableIndex + 1} of ${detectedTables.length}`;
  
  // Update table content
  const tableHead = modal.querySelector('.table-preview thead tr');
  const tableBody = modal.querySelector('.table-preview tbody');
  
  // Clear existing content
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';
  
  // Add headers
  table.headers.forEach((header, index) => {
    const th = document.createElement('th');
    th.textContent = header;
    th.dataset.columnIndex = index;
    
    // Mark as sorted column if applicable
    if (index === currentSortColumn) {
      th.classList.add('sorted');
      th.classList.add(sortDirection);
    }
    
    tableHead.appendChild(th);
  });
  
  // Add rows (will be paginated)
  const pageSize = getSelectedPageSize();
  const startRow = 0;
  const endRow = pageSize === 'all' ? table.rows.length : Math.min(pageSize, table.rows.length);
  
  for (let i = startRow; i < endRow; i++) {
    const row = table.rows[i];
    const tr = document.createElement('tr');
    
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell.text;
      td.title = cell.text; // Show full text on hover
      tr.appendChild(td);
    });
    
    tableBody.appendChild(tr);
  }
  
  // Update statistics
  modal.querySelector('.row-count').textContent = `${table.rows.length} rows`;
  modal.querySelector('.column-count').textContent = `${table.headers.length} columns`;
  
  // Update pagination info
  updatePaginationInfo(table, startRow, endRow);
  
  // Update navigation buttons
  updateTableNavigationButtons();
}

/**
 * Update table navigation buttons state
 */
function updateTableNavigationButtons() {
  if (!tableModal) return;
  
  const prevBtn = tableModal.querySelector('.prev-table-btn');
  const nextBtn = tableModal.querySelector('.next-table-btn');
  
  prevBtn.disabled = activeTableIndex === 0;
  nextBtn.disabled = activeTableIndex >= detectedTables.length - 1;
}

/**
 * Get selected page size from dropdown
 */
function getSelectedPageSize() {
  if (!tableModal) return 100;
  
  const select = tableModal.querySelector('.pagination-size');
  const value = select.value;
  
  return value === 'all' ? 'all' : parseInt(value, 10);
}

/**
 * Update pagination info text
 */
function updatePaginationInfo(table, startRow, endRow) {
  if (!tableModal) return;
  
  const paginationInfo = tableModal.querySelector('.pagination-info');
  paginationInfo.textContent = `Rows ${startRow + 1}-${endRow} of ${table.rows.length}`;
  
  // Update pagination buttons state
  const prevBtn = tableModal.querySelector('.pagination-prev');
  const nextBtn = tableModal.querySelector('.pagination-next');
  
  prevBtn.disabled = startRow === 0;
  nextBtn.disabled = endRow >= table.rows.length;
}

/**
 * Export table to specified format - fixed implementation
 */
function exportTable(table, format) {
  if (!table) return;
  // Create tableData with handling of undefined values
  const tableData = {
    caption: table.caption || 'Table',
    headers: table.headers.map(header => 
      typeof header === 'string' ? header : header.text || ''),
    rows: table.rows.map(row => 
      row.map(cell => typeof cell === 'string' ? cell : (cell?.text || '')))
  };
  
  try {
    switch (format.toLowerCase()) {
      case 'csv':
        exportTableToCsv(tableData);
        break;
      case 'excel':
        exportTableToExcel(tableData);
        break;
      case 'json':
        exportTableToJson(tableData);
        break;
      case 'html':
        exportTableToHtml(tableData);
        break;
      case 'markdown':
        exportTableToMarkdown(tableData);
        break;
      case 'pdf':
        exportTableToPdf(tableData);
        break;
      default:
        console.error('Unsupported export format:', format);
        throw new Error(`Unsupported format: ${format}`);
    }
    return true;
  } catch (err) {
    console.error(`Error exporting table to ${format}:`, err);
    showToast(`Failed to export table as ${format.toUpperCase()}`);
    return false;
  }
}

/**
 * Export table to CSV
 */
function exportTableToCsv(tableData) {
  // Prepare CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(tableData.headers.map(header => {
    // Escape quotes and wrap in quotes if needed
    const escaped = `${header}`.replace(/"/g, '""');
    return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
  }).join(','));
  
  // Add data rows
  tableData.rows.forEach(row => {
    csvRows.push(row.map(cell => {
      const value = cell || '';
      const escaped = `${value}`.replace(/"/g, '""');
      return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
    }).join(','));
  });
  
  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${tableData.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
  
  downloadBlob(blob, filename);
}

/**
 * Export table to Excel (XLSX)
 */
function exportTableToExcel(tableData) {
  // Using SheetJS (xlsx) library if available, otherwise fall back to CSV
  if (typeof XLSX === 'undefined') {
    // SheetJS not available, try to load it
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      // Try again after loading
      exportTableToExcel(tableData);
    };
    script.onerror = () => {
      console.error('Failed to load XLSX library, falling back to CSV');
      exportTableToCsv(tableData);
      alert('Excel export requires an additional library which could not be loaded. Exported as CSV instead.');
    };
    document.head.appendChild(script);
    return;
  }
  
  try {
    // Prepare data for XLSX format
    const wsData = [tableData.headers];
    tableData.rows.forEach(row => {
      wsData.push(row.map(cell => cell || ''));
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Table');
    
    // Generate filename
    const filename = `${tableData.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;
    
    // Write and download
    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    // Fall back to CSV
    exportTableToCsv(tableData);
    alert('There was an error exporting to Excel. Exported as CSV instead.');
  }
}

/**
 * Export table to JSON
 */
function exportTableToJson(tableData) {
  // Convert to structured JSON
  const jsonData = {
    caption: tableData.caption,
    columns: tableData.headers,
    data: tableData.rows.map(row => {
      const rowObj = {};
      tableData.headers.forEach((header, idx) => {
        rowObj[header] = row[idx] || '';
      });
      return rowObj;
    })
  };
  
  // Convert to formatted JSON string
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `${tableData.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  
  downloadBlob(blob, filename);
}

/**
 * Export table to HTML
 */
function exportTableToHtml(tableData) {
  // Create HTML structure
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(tableData.caption)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    caption { font-weight: bold; margin-bottom: 10px; font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>${escapeHtml(tableData.caption)}</h1>
  <table>
    <caption>${escapeHtml(tableData.caption)}</caption>
    <thead>
      <tr>
        ${tableData.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableData.rows.map(row => `
        <tr>
          ${row.map(cell => `<td>${escapeHtml(cell || '')}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <p>Exported by Niblie</p>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const filename = `${tableData.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
  
  downloadBlob(blob, filename);
}

/**
 * Export table to Markdown
 */
function exportTableToMarkdown(tableData) {
  // Create markdown table
  let markdown = `# ${tableData.caption}\n\n`;
  
  // Calculate column widths based on content
  const colWidths = tableData.headers.map((header, idx) => {
    let maxWidth = header.length;
    tableData.rows.forEach(row => {
      const cellLength = (row[idx] || '').toString().length;
      if (cellLength > maxWidth) {
        maxWidth = cellLength;
      }
    });
    return maxWidth;
  });
  
  // Generate header row
  markdown += '| ' + tableData.headers.map((header, idx) => 
    header.padEnd(colWidths[idx])).join(' | ') + ' |\n';
  
  // Generate separator row
  markdown += '| ' + colWidths.map(width => '-'.repeat(width)).join(' | ') + ' |\n';
  
  // Generate data rows
  tableData.rows.forEach(row => {
    markdown += '| ' + row.map((cell, idx) => 
      (cell || '').toString().padEnd(colWidths[idx])).join(' | ') + ' |\n';
  });
  
  // Add footer
  markdown += `\n*Exported by Niblie*`;
  
  // Create blob and download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const filename = `${tableData.caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  
  downloadBlob(blob, filename);
}

/**
 * Export table to PDF
 */
function exportTableToPdf(tableData) {
  // Create a print-friendly HTML page that can be saved as PDF
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(tableData.caption)} - PDF Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2c3e50; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
    th { background-color: #3498db; color: white; font-weight: bold; text-align: left; padding: 10px; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .footer { color: #7f8c8d; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
    @media print {
      .no-print { display: none; }
      body { margin: 0; padding: 15px; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(tableData.caption)}</h1>
  
  <div class="no-print" style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
    <p style="font-size: 16px; margin: 0;">To save as PDF:</p>
    <ol style="margin-top: 10px;">
      <li>Press <strong>Ctrl+P</strong> (or Cmd+P on Mac)</li>
      <li>Select "Save as PDF" as the destination</li>
      <li>Click "Save" or "Print"</li>
    </ol>
    <button onclick="window.print()" style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Print Now</button>
  </div>
  
  <table>
    <thead>
      <tr>
        ${tableData.headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableData.rows.map(row => `
        <tr>
          ${row.map(cell => `<td>${escapeHtml(cell || '')}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Exported from ${window.location.hostname} by Niblie Extension</p>
    <p>Date: ${new Date().toLocaleString()}</p>
  </div>
  
  <script>
    // Auto-prompt the print dialog after a short delay
    setTimeout(() => window.print(), 1000);
  </script>
</body>
</html>`;

  // Create blob and open in new tab
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new tab
  window.open(url, '_blank');
  
  // Show toast message with instructions
  showToast('PDF Export: Use Print dialog to save as PDF');
  
  // Clean up the URL object after a delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Copy table to clipboard
 */
function copyTableToClipboard(table) {
  if (!table) return;
  
  try {
    // Create formatted text version for clipboard
    const formattedText = formatTableForClipboard(table);
    
    // Use clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formattedText)
        .then(() => {
          showToast('Table copied to clipboard!');
        })
        .catch(err => {
          console.error('Clipboard API error:', err);
          copyUsingExecCommand(formattedText);
        });
    } else {
      copyUsingExecCommand(formattedText);
    }
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    alert('Failed to copy table to clipboard.');
  }
}

/**
 * Format table data for clipboard
 */
function formatTableForClipboard(table) {
  // Format as tab-separated values for spreadsheet compatibility
  const lines = [];
  
  // Add header row
  lines.push(table.headers.join('\t'));
  
  // Add data rows
  table.rows.forEach(row => {
    lines.push(row.map(cell => cell.text || '').join('\t'));
  });
  
  return lines.join('\n');
}

/**
 * Fallback copy method using execCommand
 */
function copyUsingExecCommand(text) {
  // Create temporary element
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  
  // Select and copy
  el.select();
  const success = document.execCommand('copy');
  document.body.removeChild(el);
  
  if (success) {
    showToast('Table copied to clipboard!');
  } else {
    alert('Failed to copy table to clipboard.');
  }
}

/**
 * Search table data
 */
function searchTable(query) {
  if (!tableModal || !query) {
    clearTableSearch();
    return;
  }
  
  const table = detectedTables[activeTableIndex];
  if (!table) return;
  
  const searchQuery = query.toLowerCase();
  const tableElement = tableModal.querySelector('.table-preview');
  const cells = tableElement.querySelectorAll('td');
  let matchCount = 0;
  
  // Reset previous search
  cells.forEach(cell => {
    cell.classList.remove('search-match', 'current-match');
  });
  
  // Find new matches
  cells.forEach(cell => {
    if (cell.textContent.toLowerCase().includes(searchQuery)) {
      cell.classList.add('search-match');
      matchCount++;
    }
  });
  
  // Update search results count
  tableModal.querySelector('.search-results').textContent = 
    `${matchCount} result${matchCount !== 1 ? 's' : ''}`;
  
  // Enable/disable navigation buttons
  const prevBtn = tableModal.querySelector('.search-prev-btn');
  const nextBtn = tableModal.querySelector('.search-next-btn');
  
  prevBtn.disabled = nextBtn.disabled = matchCount === 0;
  
  // Highlight first match if any
  if (matchCount > 0) {
    const firstMatch = tableElement.querySelector('.search-match');
    firstMatch.classList.add('current-match');
    firstMatch.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

/**
 * Clear table search highlights
 */
function clearTableSearch() {
  if (!tableModal) return;
  
  const cells = tableModal.querySelectorAll('.search-match');
  cells.forEach(cell => {
    cell.classList.remove('search-match', 'current-match');
  });
  
  tableModal.querySelector('.search-results').textContent = '0 results';
  tableModal.querySelector('.search-prev-btn').disabled = true;
  tableModal.querySelector('.search-next-btn').disabled = true;
}

/**
 * Navigate through search results
 */
function navigateSearchResults(direction) {
  if (!tableModal) return;
  
  const matches = tableModal.querySelectorAll('.search-match');
  if (matches.length === 0) return;
  
  const currentMatch = tableModal.querySelector('.current-match');
  if (!currentMatch) return;
  
  // Find current index
  const currentIndex = Array.from(matches).indexOf(currentMatch);
  let nextIndex;
  
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % matches.length;
  } else {
    nextIndex = (currentIndex - 1 + matches.length) % matches.length;
  }
  
  // Update current match
  currentMatch.classList.remove('current-match');
  matches[nextIndex].classList.add('current-match');
  matches[nextIndex].scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

/**
 * Update table pagination
 */
function updateTablePagination() {
  if (!tableModal) return;
  
  const table = detectedTables[activeTableIndex];
  if (!table) return;
  
  // Get current page size
  const pageSize = getSelectedPageSize();
  
  // Redisplay the table with new page size
  displayTableInModal(table, tableModal);
}

/**
 * Navigate between pages of table data
 */
function navigateTablePages(direction) {
  if (!tableModal) return;
  
  const table = detectedTables[activeTableIndex];
  if (!table) return;
  
  // Get current pagination info
  const pageSize = getSelectedPageSize();
  if (pageSize === 'all') return; // No pagination when showing all
  
  const paginationInfo = tableModal.querySelector('.pagination-info');
  const currentInfo = paginationInfo.textContent.match(/Rows (\d+)-(\d+) of (\d+)/);
  
  if (!currentInfo) return;
  
  const startRow = parseInt(currentInfo[1], 10) - 1;
  const endRow = parseInt(currentInfo[2], 10);
  const totalRows = parseInt(currentInfo[3], 10);
  
  // Calculate new page
  let newStartRow, newEndRow;
  
  if (direction === 'next') {
    newStartRow = endRow;
    newEndRow = Math.min(newStartRow + pageSize, totalRows);
  } else {
    newStartRow = Math.max(0, startRow - pageSize);
    newEndRow = newStartRow + pageSize;
  }
  
  // Update table content
  const tableBody = tableModal.querySelector('.table-preview tbody');
  tableBody.innerHTML = '';
  
  for (let i = newStartRow; i < newEndRow; i++) {
    const row = table.rows[i];
    const tr = document.createElement('tr');
    
    row.forEach(cell => {
      const td = document.createElement('td');
      td.textContent = cell.text;
      td.title = cell.text;
      tr.appendChild(td);
    });
    
    tableBody.appendChild(tr);
  }
  
  // Update pagination info
  updatePaginationInfo(table, newStartRow, newEndRow);
}

/**
 * Sort table by column
 */
function sortTableByColumn(columnIndex) {
  if (!tableModal) return;
  
  const table = detectedTables[activeTableIndex];
  if (!table) return;
  
  // Determine sort direction
  let direction = 'asc';
  if (columnIndex === currentSortColumn) {
    // Toggle direction if already sorted by this column
    direction = sortDirection === 'asc' ? 'desc' : 'asc';
  }
  
  // Store current sort
  currentSortColumn = columnIndex;
  sortDirection = direction;
  
  // Sort the rows
  table.rows.sort((a, b) => {
    const aValue = a[columnIndex]?.text || '';
    const bValue = b[columnIndex]?.text || '';
    
    // Try numeric sort if both values are numbers
    if (!isNaN(aValue) && !isNaN(bValue)) {
      return direction === 'asc' ?
        parseFloat(aValue) - parseFloat(bValue) :
        parseFloat(bValue) - parseFloat(aValue);
    }
    
    // Otherwise do string comparison
    const comparison = aValue.localeCompare(bValue);
    return direction === 'asc' ? comparison : -comparison;
  });
  
  // Redisplay the table
  displayTableInModal(table, tableModal);
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
  // Create or reuse toast element
  let toast = document.getElementById('niblie-toast');
  
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'niblie-toast';
    document.body.appendChild(toast);
  }
  
  // Set message and show
  toast.textContent = message;
  toast.classList.add('show');
  
  // Hide after duration
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  // Cleanup
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
  }, 100);
}

/**
 * Helper: Extract table headers
 */
function extractTableHeaders(table) {
  let headers = [];
  
  // Try to get headers from thead first
  const thead = table.querySelector('thead');
  if (thead) {
    const headerRow = thead.querySelector('tr');
    if (headerRow) {
      headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.innerText.trim());
    }
  }
  
  // If no headers found, try first row
  if (headers.length === 0) {
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      // Check if first row has TH elements
      const thCells = firstRow.querySelectorAll('th');
      if (thCells.length > 0) {
        headers = Array.from(thCells).map(th => th.innerText.trim());
      } else {
        // Use first row TD elements as headers
        headers = Array.from(firstRow.querySelectorAll('td')).map(td => td.innerText.trim());
      }
    }
  }
  
  return headers;
}

/**
 * Helper: Get table caption
 */
function getTableCaption(table) {
  // Try to find direct caption element
  const captionEl = table.querySelector('caption');
  if (captionEl) {
    return captionEl.innerText.trim();
  }
  
  // Try to find caption from figcaption if table is in a figure
  const figure = table.closest('figure');
  if (figure) {
    const figCaption = figure.querySelector('figcaption');
    if (figCaption) {
      return figCaption.innerText.trim();
    }
  }
  
  // Try to find nearest heading
  return getClosestHeading(table);
}

/**
 * Helper: Get closest heading to an element
 */
function getClosestHeading(element) {
  // Look for headings before the element (up to 3 elements)
  let sibling = element.previousElementSibling;
  let count = 0;
  
  while (sibling && count < 3) {
    if (/^H[1-6]$/.test(sibling.tagName)) {
      return sibling.innerText.trim();
    }
    sibling = sibling.previousElementSibling;
    count++;
  }
  
  // Look for headings within parent containers (up to 2 levels up)
  let parent = element.parentElement;
  let level = 0;
  
  while (parent && level < 2) {
    // Check for heading directly before our target element within this parent
    const children = Array.from(parent.children);
    const elementIndex = children.indexOf(element);
    
    for (let i = elementIndex - 1; i >= 0 && i > elementIndex - 3; i--) {
      if (children[i] && /^H[1-6]$/.test(children[i].tagName)) {
        return children[i].innerText.trim();
      }
    }
    
    // Move up one level
    element = parent;
    parent = parent.parentElement;
    level++;
  }
  
  // If no heading found, use closest section aria-label or id or parent container id
  const section = element.closest('section, div[id], [aria-label]');
  if (section) {
    return section.getAttribute('aria-label') || 
           section.id || 
           'Untitled Table';
  }
  
  return 'Untitled Table';
}

/**
 * Helper: Check if element is visually hidden
 */
function isElementHidden(element) {
  const style = window.getComputedStyle(element);
  return style.display === 'none' || 
         style.visibility === 'hidden' || 
         style.opacity === '0' ||
         element.offsetWidth === 0 ||
         element.offsetHeight === 0;
}

/**
 * Helper: Check if table is too small to be meaningful
 */
function isTableTooSmall(table) {
  // Skip tables with only a few cells
  const cells = table.querySelectorAll('td, th');
  if (cells.length < 4) {
    return true;
  }
  
  // Skip very small tables by dimensions
  if (table.offsetWidth < 50 || table.offsetHeight < 30) {
    return true;
  }
  
  return false;
}

/**
 * Helper: Check if element has grid-like structure
 */
function isGridLikeElement(element) {
  const style = window.getComputedStyle(element);
  
  // Check if display is grid or flex
  if (style.display === 'grid' || style.display === 'flex') {
    return true;
  }
  
  // Check for child elements that form a grid
  const children = element.children;
  if (children.length > 0) {
    // Check if children are arranged in rows
    const firstChild = children[0];
    const firstChildStyle = window.getComputedStyle(firstChild);
    
    if (firstChildStyle.display === 'flex' || firstChildStyle.display === 'grid') {
      return true;
    }
    
    // Check if children contain consistent structures
    if (children.length >= 2) {
      // Check if first two children have similar structure
      const firstGrandchildren = firstChild.children.length;
      const secondGrandchildren = children[1].children.length;
      
      if (firstGrandchildren > 1 && firstGrandchildren === secondGrandchildren) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Helper: Find the header row in a grid-like element
 */
function findHeaderRowInGrid(container) {
  // Look for row with text styling differences
  const rows = Array.from(container.children);
  
  if (rows.length === 0) return null;
  
  // Check if first row has bold, different color, or background
  if (rows.length > 1) {
    const firstRow = rows[0];
    const firstRowStyle = window.getComputedStyle(firstRow);
    const secondRowStyle = window.getComputedStyle(rows[1]);
    
    // Check for styling differences indicating a header
    if (firstRowStyle.fontWeight > secondRowStyle.fontWeight ||
        firstRowStyle.backgroundColor !== secondRowStyle.backgroundColor ||
        firstRowStyle.color !== secondRowStyle.color) {
      return firstRow;
    }
    
    // Check if first row has elements with header semantics
    const firstRowHeaders = firstRow.querySelectorAll('[role="columnheader"], [role="rowheader"], [aria-label]');
    if (firstRowHeaders.length > 0) {
      return firstRow;
    }
  }
  
  // Look for row with direct header-like children
  for (const row of rows) {
    if (isHeaderLikeRow(row)) {
      return row;
    }
  }
  
  // Default to first row if we can't determine better
  return rows[0];
}

/**
 * Helper: Check if a row appears to be a header row
 */
function isHeaderLikeRow(row) {
  const children = Array.from(row.children);
  
  // No children can't be a header row
  if (children.length === 0) return false;
  
  // Look for distinguishing characteristics
  const hasHeaderSemantics = children.some(child => {
    // Check for header-like semantics
    if (child.role === 'columnheader' || 
        child.role === 'rowheader' || 
        child.tagName === 'TH' || 
        child.getAttribute('aria-label')) {
      return true;
    }
    
    // Check for header-like styling (bold text)
    const style = window.getComputedStyle(child);
    if (style.fontWeight >= 600 || style.fontWeight === 'bold') {
      return true;
    }
    
    // Check for background color different from siblings
    if (row.children.length > 1 && row.nextElementSibling) {
      const nextRowChild = row.nextElementSibling.children[0];
      if (nextRowChild) {
        const nextStyle = window.getComputedStyle(nextRowChild);
        if (style.backgroundColor !== nextStyle.backgroundColor) {
          return true;
        }
      }
    }
    
    return false;
  });
  
  return hasHeaderSemantics;
}

/**
 * Helper: Extract headers from visual row element
 */
function extractVisualHeaders(headerRow) {
  const headers = [];
  const children = Array.from(headerRow.children);
  
  children.forEach(child => {
    headers.push({
      text: child.innerText.trim(),
      html: child.innerHTML,
      element: child
    });
  });
  
  return headers;
}

/**
 * Helper: Find data rows in a grid structure
 */
function findDataRowsInGrid(container, headerRow) {
  if (!headerRow) return [];
  
  const allRows = Array.from(container.children);
  const headerIndex = allRows.indexOf(headerRow);
  
  // If header row is found, return all subsequent rows
  if (headerIndex >= 0) {
    return allRows.slice(headerIndex + 1);
  }
  
  // Fall back to all rows except the first
  return allRows.length > 1 ? allRows.slice(1) : [];
}

/**
 * Helper: Extract cells from a visual row
 */
function extractVisualCells(rowElement, expectedCellCount) {
  const cells = [];
  const children = Array.from(rowElement.children);
  
  // Use direct children if they match expected count
  if (children.length === expectedCellCount) {
    children.forEach(child => {
      cells.push({
        text: child.innerText.trim(),
        html: child.innerHTML
      });
    });
  } 
  // Try to find nested elements that might be cells
  else if (children.length === 1 && children[0].children.length === expectedCellCount) {
    Array.from(children[0].children).forEach(child => {
      cells.push({
        text: child.innerText.trim(),
        html: child.innerHTML
      });
    });
  }
  // Handle case where row has too many or too few cells
  else {
    // Just use what we have
    children.forEach(child => {
      cells.push({
        text: child.innerText.trim(),
        html: child.innerHTML
      });
    });
    
    // Pad with empty cells if needed
    while (cells.length < expectedCellCount) {
      cells.push({ text: '', html: '' });
    }
  }
  
  return cells;
}

/**
 * Helper: Choose the best caption from multiple options
 */
function findBestCaption(captions) {
  const filteredCaptions = captions.filter(caption => caption && caption !== 'Untitled Table');
  
  if (filteredCaptions.length === 0) {
    return 'Merged Table';
  }
  
  // Find the most common caption
  const captionCounts = {};
  let maxCount = 0;
  let mostCommonCaption = filteredCaptions[0];
  
  filteredCaptions.forEach(caption => {
    captionCounts[caption] = (captionCounts[caption] || 0) + 1;
    if (captionCounts[caption] > maxCount) {
      maxCount = captionCounts[caption];
      mostCommonCaption = caption;
    }
  });
  
  return mostCommonCaption;
}

/**
 * Helper: Escape HTML entities
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

/**
 * Add table detection to core module
 */
export function addTableSection(tabContainer) {
  // Create tables tab
  const tablesTab = document.createElement('button');
  tablesTab.className = 'tab';
  tablesTab.textContent = 'Tables';
  tablesTab.dataset.tab = 'tables';
  
  // Add tab to container
  tabContainer.appendChild(tablesTab);
  
  // Create tab content
  const tablesContent = document.createElement('div');
  tablesContent.className = 'tab-content';
  tablesContent.id = 'tables-content';
  tablesContent.innerHTML = `
    <div class="tables-header">
      <h3>Tables on This Page</h3>
      <button class="refresh-tables-btn">Refresh</button>
    </div>
    <div class="tables-summary">
      <div class="tables-loading">Detecting tables...</div>
    </div>
    <div class="tables-list"></div>
  `;
  
  // Add content to parent
  tabContainer.parentNode.appendChild(tablesContent);
  
  // Initialize tables functionality
  initTablesFeature();
  
  // Return the content element for further manipulation
  return tablesContent;
}

/**
 * Load and display tables in tab
 */
export function loadTablesContent(contentElement) {
  if (!contentElement) return false;
  
  const summary = contentElement.querySelector('.tables-summary');
  const list = contentElement.querySelector('.tables-list');
  
  // Show loading state
  summary.innerHTML = '<div class="tables-loading">Detecting tables...</div>';
  list.innerHTML = '';
  
  // Detect tables
  const tables = getAllTables();
  
  // Update summary
  if (tables.length === 0) {
    summary.innerHTML = '<div class="no-tables">No tables detected on this page.</div>';
    return false;
  }
  
  summary.innerHTML = `<div class="tables-count">${tables.length} table${tables.length !== 1 ? 's' : ''} detected</div>`;
  
  // Create list of tables - using proper variable
  let tableCardsHtml = '';
  
  tables.forEach((table, index) => {
    const rowCount = table.rows.length;
    const columnCount = table.headers.length;
    
    tableCardsHtml += `
      <div class="table-card" data-table-index="${index}">
        <div class="table-card-header">
          <h4>${table.caption || 'Untitled Table'}</h4>
          <div class="table-badge ${table.type}-badge">${table.type.toUpperCase()}</div>
        </div>
        <div class="table-card-details">
          <div class="table-card-info">
            <div class="table-size">${rowCount} row${rowCount !== 1 ? 's' : ''} × ${columnCount} column${columnCount !== 1 ? 's' : ''}</div>
            <div class="table-source">${table.source}</div>
          </div>
          <div class="table-card-preview">
            <div class="table-scroll-container">
              <table class="mini-table-preview">
                <thead>
                  <tr>
                    ${table.headers.slice(0, 3).map(header => `<th>${header}</th>`).join('')}
                    ${table.headers.length > 3 ? '<th>...</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${table.rows.slice(0, 3).map(row => `
                    <tr>
                      ${row.slice(0, 3).map(cell => `<td>${cell.text || ''}</td>`).join('')}
                      ${table.headers.length > 3 ? '<td>...</td>' : ''}
                    </tr>
                  `).join('')}
                  ${table.rows.length > 3 ? `<tr><td colspan="${Math.min(table.headers.length, 4)}">...</td></tr>` : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="table-card-actions">
          <button class="view-table-btn" data-table-index="${index}">View Table</button>
        </div>
      </div>
    `;
  });
  
  // Add to list element
  list.innerHTML = tableCardsHtml;
  
  // Add event listeners
  contentElement.querySelectorAll('.view-table-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tableIndex = parseInt(btn.getAttribute('data-table-index'), 10);
      activeTableIndex = tableIndex;
      showTablesInModal();
    });
  });
  
  // Add refresh button listener
  contentElement.querySelector('.refresh-tables-btn')?.addEventListener('click', () => {
    loadTablesContent(contentElement);
  });
  
  // Make sure we have styles
  addTableStyles();
  
  return true;
}

// Initialize tables feature
initTablesFeature();

/**
 * Export a specific function to be called from core.js
 */
export function showTablesTab() {
  getAllTables();
  showTablesInModal();
}

/**
 * Add table-specific CSS styles to the document
 */
function addTableStyles() {
  // Check if styles are already added
  if (document.getElementById('niblie-tables-styles')) {
    return; // Already added
  }
  
  // Create style element
  const styleEl = document.createElement('style');
  styleEl.id = 'niblie-tables-styles';
  
  // Add CSS for tables with improved styling
  styleEl.textContent = `
    /* Table section styling */
    #tables-content {
      padding: 15px;
      font-family: Arial, sans-serif;
    }
    
    .tables-header {
      display: flex;
      justify-content: space-between;s
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ebeef5;
    }
    
    .tables-header h3 {
      margin: 0;
      font-size: 18px;
      color: #2c3e50;
    }
    
    .refresh-tables-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    
    .refresh-tables-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .tables-summary {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      text-align: center;
      font-size: 16px;
      color: #34495e;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .tables-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: #7f8c8d;
      min-height: 40px;
    }
    
    .tables-loading::before {
      content: '';
      width: 20px;
      height: 20px;
      border: 3px solid rgba(52, 152, 219, 0.3);
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .no-tables {
      padding: 40px 20px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 8px;
      color: #7f8c8d;
      font-size: 16px;
      font-style: italic;
      border: 1px dashed #e0e0e0;
    }
    
    .tables-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      grid-gap: 20px;
    }
    
    /* Table card styling */
    .table-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border: 1px solid #ebeef5;
    }
    
    .table-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    
    .table-card-header {
      padding: 15px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .table-card-header h4 {
      margin: 0;
      font-size: 16px;
      color: #2c3e50;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .table-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 20px;
      color: white;
      font-weight: 500;
    }
    
    .html-badge {
      background: linear-gradient(45deg, #3498db, #2980b9);
    }
    
    .visual-badge {
      background: linear-gradient(45deg, #9b59b6, #8e44ad);
    }
    
    .aria-badge {
      background: linear-gradient(45deg, #2ecc71, #27ae60);
    }
    
    .list-badge {
      background: linear-gradient(45deg, #f39c12, #e67e22);
    }
    
    .table-card-details {
      display: flex;
      padding: 15px 20px;
    }
    
    .table-card-info {
      flex: 1;
      font-size: 14px;
      color: #7f8c8d;
    }
    
    .table-size {
      margin-bottom: 5px;
      color: #34495e;
      font-weight: 500;
    }
    
    .table-source {
      font-style: italic;
      font-size: 12px;
    }
    
    .table-card-preview {
      width: 220px;
      margin-left: 15px;
    }
    
    .table-scroll-container {
      max-height: 120px;
      overflow: auto;
      border: 1px solid #ebeef5;
      border-radius: 4px;
      box-shadow: inset 0 0 3px rgba(0,0,0,0.05);
      background: #fff;
    }
    
    /* Scrollbar styling */
    .table-scroll-container::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    .table-scroll-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .table-scroll-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .table-scroll-container::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
    
    .mini-table-preview {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    
    .mini-table-preview th {
      background: #f8fafc;
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #ebeef5;
      font-weight: 600;
      color: #2c3e50;
      white-space: nowrap;
    }
    
    .mini-table-preview td {
      padding: 5px 8px;
      border-bottom: 1px solid #f0f0f0;
      color: #5a6a7a;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .mini-table-preview tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    .mini-table-preview tr:hover td {
      background-color: #f0f7ff;
    }
    
    .table-card-actions {
      padding: 12px 20px;
      background: #f8fafc;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: flex-end;
    }
    
    .view-table-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s;
      display: flex;
      align-items: center;
    }
    
    .view-table-btn::before {
      content: "👁️ ";
      margin-right: 5px;
    }
    
    .view-table-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    /* Modal styles for tables */
    .niblie-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.75);
      z-index: 2147483647; /* Maximum possible z-index value */
      display: none;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(3px);
    }
    
    /* This ensures the modal is visible when active */
    .niblie-modal[style*="display: block"] {
      display: flex !important;
    }
    
    .table-modal-content {
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
      width: 92%;
      height: 90%;
      max-width: 1400px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalFadeIn 0.3s;
    }
    
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .niblie-modal-header {
      background: linear-gradient(90deg, #2c3e50, #3498db);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 25px;
    }
    
    .niblie-logo {
      display: flex;
      align-items: center;
      font-weight: bold;
      font-size: 18px;
    }
    
    .niblie-logo-icon {
      margin-right: 10px;
      font-size: 20px;
    }
    
    .table-title {
      font-weight: 600;
    }
    
    .dismiss-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .dismiss-btn:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: scale(1.1);
    }
    
    /* Table controls */
    .table-controls {
      padding: 15px 25px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      background: #f8fafc;
      gap: 15px;
    }
    
    .table-navigation {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .table-counter {
      font-size: 14px;
      color: #5a6a7a;
      font-weight: 500;
    }
    
    .table-info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .table-caption {
      font-weight: bold;
      font-size: 18px;
      color: #2c3e50;
    }
    
    .table-source {
      font-size: 13px;
      color: #7f8c8d;
      margin-top: 4px;
    }
    
    .table-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .prev-table-btn,
    .next-table-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s;
    }
    
    .prev-table-btn:hover,
    .next-table-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0.1);
    }
    
    .prev-table-btn:disabled,
    .next-table-btn:disabled {
      background: #d1d8e0;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .export-btn {
      background: #27ae60;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s;
    }
    
    .export-btn::before {
      content: "📊 ";
    }
    
    .export-btn:hover {
      background: #219653;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .table-copy-btn {
      background: #9b59b6;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .table-copy-btn::before {
      content: "📋 ";
    }
    
    .table-copy-btn:hover {
      background: #8e44ad;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .table-search-btn {
      background: #f39c12;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s;
    }
    
    .table-search-btn::before {
      content: "🔍 ";
    }
    
    .table-search-btn:hover {
      background: #e67e22;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    /* Export dropdown styling fix */
    .table-export-group {
      position: relative;
    }
    
    .export-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #ebeef5;
      border-radius: 6px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      z-index: 2147483646; /* One less than the modal */
      display: none;
      width: 140px;
      overflow: hidden;
      margin-top: 5px; /* Add some spacing from the button */
    }
    
    .export-dropdown button {
      display: block;
      width: 100%;
      padding: 10px 15px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
      color: #34495e;
      border-bottom: 1px solid #f5f5f5;
    }
    
    .export-dropdown button:last-child {
      border-bottom: none;
    }
    
    .export-dropdown button:hover {
      background: #f8fafc;
      color: #3498db;
    }
    
    /* Adding icons for export options */
    .export-dropdown button[data-format="csv"]::before { content: "📄 "; }
    .export-dropdown button[data-format="excel"]::before { content: "📊 "; }
    .export-dropdown button[data-format="json"]::before { content: "🔄 "; }
    .export-dropdown button[data-format="html"]::before { content: "🌐 "; }
    .export-dropdown button[data-format="markdown"]::before { content: "📝 "; }
    .export-dropdown button[data-format="pdf"]::before { content: "📑 "; }
    
    /* Search bar styles */
    .table-search-bar {
      padding: 12px 25px;
      background: #f8fafc;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .table-search-input {
      flex: 1;
      padding: 8px 15px;
      border: 1px solid #dfe4ea;
      border-radius: 4px;
      font-size: 14px;
      transition: all 0.3s;
    }
    
    .table-search-input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    .search-results {
      color: #7f8c8d;
      font-size: 14px;
      min-width: 80px;
    }
    
    .search-prev-btn,
    .search-next-btn,
    .search-close-btn {
      background: #f1f2f6;
      border: 1px solid #dfe4ea;
      border-radius: 4px;
      padding: 6px 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .search-prev-btn:hover,
    .search-next-btn:hover,
    .search-close-btn:hover {
      background: #dfe4ea;
    }
    
    .search-prev-btn:disabled,
    .search-next-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f1f2f6;
    }
    
    /* Table container */
    .table-container {
      flex: 1;
      overflow: auto;
      position: relative;
      background: white;
    }
    
    .table-preview {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    .table-preview th {
      position: sticky;
      top: 0;
      background: linear-gradient(180deg, #34495e, #2c3e50);
      color: white;
      text-align: left;
      padding: 12px 15px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      font-weight: 500;
      border-right: 1px solid rgba(255,255,255,0.1);
      transition: background 0.2s;
      z-index: 1;
    }
    
    .table-preview th:last-child {
      border-right: none;
    }
    
    .table-preview th:hover {
      background: linear-gradient(180deg, #2c3e50, #1e2b38);
    }
    
    .table-preview th.sorted {
      background: linear-gradient(180deg, #3498db, #2980b9);
    }
    
    .table-preview th.sorted::after {
      content: '';
      display: inline-block;
      margin-left: 8px;
      width: 0;
      height: 0;
      vertical-align: middle;
    }
    
    .table-preview th.sorted.asc::after {
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 6px solid white;
    }
    
    .table-preview th.sorted.desc::after {
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 6px solid white;
    }
    
    .table-preview td {
      padding: 10px 15px;
      border-bottom: 1px solid #ebeef5;
      color: #34495e;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: top;
    }
    
    .table-preview tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .table-preview tr:hover {
      background: #f0f7ff;
    }
    
    /* Search result highlighting */
    .table-preview td.search-match {
      background-color: rgba(255, 235, 59, 0.3);
    }
    
    .table-preview td.current-match {
      background-color: rgba(255, 152, 0, 0.3);
      outline: 2px solid rgba(255, 152, 0, 0.5);
      position: relative;
    }
    
    /* Pagination */
    .table-pagination {
      padding: 12px 25px;
      background: #f8fafc;
      border-top: 1px solid #ebeef5;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }
    
    .pagination-prev,
    .pagination-next {
      background: #3498db;
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.3s;
    }
    
    .pagination-prev:hover,
    .pagination-next:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .pagination-prev:disabled,
    .pagination-next:disabled {
      background: #d1d8e0;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .pagination-info {
      font-size: 14px;
      color: #5a6a7a;
      font-weight: 500;
      min-width: 160px;
      text-align: center;
    }
    
    .pagination-size {
      padding: 8px 10px;
      border: 1px solid #dfe4ea;
      border-radius: 4px;
      color: #34495e;
      font-size: 14px;
      background: white;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .pagination-size:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    /* Table Footer */
    .table-footer {
      padding: 12px 25px;
      background: #f8fafc;
      border-top: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #7f8c8d;
    }
    
    .table-stats {
      display: flex;
      gap: 20px;
    }
    
    /* Toast notification */
    #niblie-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(44, 62, 80, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 2147483645; /* Still extremely high */
      font-size: 14px;
      transition: opacity 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      pointer-events: none;
    }
    
    #niblie-toast::before {
      content: "✅";
    }
    
    #niblie-toast.show {
      opacity: 1;
      animation: toastFadeIn 0.3s, toastFadeOut 0.3s 2.7s;
    }
    
    @keyframes toastFadeIn {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    
    @keyframes toastFadeOut {
      from { opacity: 1; transform: translate(-50%, 0); }
      to { opacity: 0; transform: translate(-50%, -20px); }
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .tables-list {
        grid-template-columns: 1fr;
      }
      
      .table-card-details {
        flex-direction: column;
      }
      
      .table-card-preview {
        width: 100%;
        margin-left: 0;
        margin-top: 15px;
      }
      
      .table-controls {
        flex-direction: column;
        align-items: center;
      }
      
      .table-info {
        order: -1;
        margin-bottom: 10px;
      }
      
      .table-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  
  // Add to document
  document.head.appendChild(styleEl);
}