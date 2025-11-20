/**
 * IIT Kharagpur Hall Changer Script
 * Automatically fills hall name and room number in biodata page
 * Uses formautofiller.js data structure (key/value pairs)
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.__IITKGP_HALL_CHANGER_INITIALIZED__) {
    console.log('[IITKGP Hall Changer] Already initialized, skipping');
    return;
  }
  window.__IITKGP_HALL_CHANGER_INITIALIZED__ = true;

  console.log('[IITKGP Hall Changer] Initializing...');

  // Configuration
  const CONFIG = {
    storageKeys: {
      hallName: 'iitkgp_ch_hall_name',
      roomNo: 'iitkgp_ch_room_no'
    },
    selectors: {
      // The selectors need to match the actual input fields in the biodata page
      hallNameInput: 'input[name="ch_hall_name"]',
      roomNoInput: 'input[name="ch_room_no"]',
      // Alternative selectors if direct inputs don't exist
      hallNameText: 'td:contains("Hall(Allocated by HMC)") + td span',
      roomNoText: 'td:contains("Room(Allocated by hall)") + td span',
      editButton: 'input[value="Edit"][type="button"]',
      updateButton: 'input[value=" UPDATE "][type="button"]'
    },
    delays: {
      init: 500,
      fill: 300,
      observe: 100
    }
  };

  /**
   * Load credentials from Chrome storage
   */
  function loadHallData(callback) {
    chrome.storage.sync.get('autofillFields', (result) => {
      const fields = result.autofillFields || [];
      console.log('[IITKGP Hall Changer] Loaded fields from storage:', fields.length);
      
      const hallData = {
        hallName: null,
        roomNo: null
      };

      // Find hall name and room number in key/value pairs
      fields.forEach(field => {
        if (field.key === CONFIG.storageKeys.hallName && field.value) {
          hallData.hallName = field.value;
          console.log('[IITKGP Hall Changer] Found hall name:', hallData.hallName);
        }
        if (field.key === CONFIG.storageKeys.roomNo && field.value) {
          hallData.roomNo = field.value;
          console.log('[IITKGP Hall Changer] Found room no:', hallData.roomNo);
        }
      });

      callback(hallData);
    });
  }

  /**
   * Fill an input field with proper event triggering
   */
  function fillInput(element, value) {
    if (!element || !value) return false;

    try {
      // Store original type
      const originalType = element.type;
      
      // Temporarily change type to text for reliable filling
      if (originalType === 'password') {
        element.type = 'text';
      }

      // Set the value
      element.value = value;

      // Trigger events
      ['input', 'change', 'blur'].forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
      });

      // Restore original type
      if (originalType === 'password') {
        element.type = originalType;
      }

      console.log('[IITKGP Hall Changer] Filled input:', element.name || element.id, 'with:', value);
      return true;
    } catch (error) {
      console.error('[IITKGP Hall Changer] Error filling input:', error);
      return false;
    }
  }

  /**
   * Find input fields by various strategies
   */
  function findInputField(fieldName) {
    // Try by name attribute
    let input = document.querySelector(`input[name="${fieldName}"]`);
    if (input) return input;

    // Try by id
    input = document.getElementById(fieldName);
    if (input) return input;

    // Try to find in edit mode spans
    const editSpans = document.querySelectorAll('span[style*="display: none"]');
    for (const span of editSpans) {
      const input = span.querySelector(`input[name="${fieldName}"]`);
      if (input) return input;
    }

    return null;
  }

  /**
   * Click edit button to enable input fields
   */
  function enableEditMode() {
    const editButton = document.querySelector(CONFIG.selectors.editButton);
    if (editButton) {
      console.log('[IITKGP Hall Changer] Clicking edit button...');
      editButton.click();
      return true;
    }
    return false;
  }

  /**
   * Fill hall name and room number
   */
  function fillHallData(hallData) {
    if (!hallData.hallName && !hallData.roomNo) {
      console.log('[IITKGP Hall Changer] No hall data to fill');
      return;
    }

    console.log('[IITKGP Hall Changer] Attempting to fill hall data...');

    // Try to enable edit mode first
    let editModeEnabled = false;
    const editButton = document.querySelector(CONFIG.selectors.editButton);
    if (editButton && editButton.offsetParent !== null) {
      // Edit button is visible, click it
      enableEditMode();
      editModeEnabled = true;
      
      // Wait for edit mode to activate
      setTimeout(() => {
        attemptFill(hallData);
      }, CONFIG.delays.fill);
    } else {
      // Already in edit mode or no edit button
      attemptFill(hallData);
    }
  }

  /**
   * Attempt to fill the fields
   */
  function attemptFill(hallData) {
    let filledCount = 0;

    // Try to fill hall name
    if (hallData.hallName) {
      // Try different possible field names
      const possibleHallNames = ['ch_hall_name', 'hall_name', 'deptcode'];
      
      for (const fieldName of possibleHallNames) {
        const input = findInputField(fieldName);
        if (input && input.offsetParent !== null) {
          // Check if it's a select dropdown
          if (input.tagName === 'SELECT') {
            // Try to select by text content
            const options = Array.from(input.options);
            const matchingOption = options.find(opt => 
              opt.text.toUpperCase().includes(hallData.hallName.toUpperCase()) ||
              hallData.hallName.toUpperCase().includes(opt.text.toUpperCase())
            );
            
            if (matchingOption) {
              input.value = matchingOption.value;
              input.dispatchEvent(new Event('change', { bubbles: true }));
              console.log('[IITKGP Hall Changer] Selected hall from dropdown:', matchingOption.text);
              filledCount++;
              break;
            }
          } else {
            // Regular input field
            if (fillInput(input, hallData.hallName)) {
              filledCount++;
              break;
            }
          }
        }
      }
    }

    // Try to fill room number
    if (hallData.roomNo) {
      const possibleRoomNames = ['ch_room_no', 'room_no', 'room'];
      
      for (const fieldName of possibleRoomNames) {
        const input = findInputField(fieldName);
        if (input && input.offsetParent !== null) {
          if (fillInput(input, hallData.roomNo)) {
            filledCount++;
            break;
          }
        }
      }
    }

    if (filledCount > 0) {
      console.log('[IITKGP Hall Changer] Successfully filled', filledCount, 'field(s)');
    } else {
      console.log('[IITKGP Hall Changer] No visible input fields found to fill');
    }
  }

  /**
   * Watch for dynamic content changes
   */
  function setupObserver(hallData) {
    const observer = new MutationObserver((mutations) => {
      // Check if edit mode was activated
      const editInputs = document.querySelectorAll('span[style=""] input[name*="hall"], span[style=""] input[name*="room"]');
      
      if (editInputs.length > 0) {
        console.log('[IITKGP Hall Changer] Edit mode detected, filling fields...');
        observer.disconnect();
        setTimeout(() => {
          attemptFill(hallData);
        }, CONFIG.delays.observe);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    console.log('[IITKGP Hall Changer] Mutation observer setup complete');

    // Disconnect after 10 seconds to avoid performance issues
    setTimeout(() => {
      observer.disconnect();
      console.log('[IITKGP Hall Changer] Observer disconnected after timeout');
    }, 10000);
  }

  /**
   * Initialize the hall changer
   */
  function init() {
    console.log('[IITKGP Hall Changer] Starting initialization...');

    // Load hall data from storage
    loadHallData((hallData) => {
      if (!hallData.hallName && !hallData.roomNo) {
        console.log('[IITKGP Hall Changer] No hall data found in storage');
        return;
      }

      console.log('[IITKGP Hall Changer] Hall data loaded, attempting to fill...');
      
      // Try to fill immediately
      fillHallData(hallData);

      // Setup observer for dynamic changes
      setupObserver(hallData);
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, CONFIG.delays.init);
    });
  } else {
    setTimeout(init, CONFIG.delays.init);
  }

  console.log('[IITKGP Hall Changer] Script loaded successfully');
})();
