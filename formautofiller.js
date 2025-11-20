// === Enhanced Universal Form AutoFiller ===
// Supports Google Forms, regular forms, and various input types

(function() {
  'use strict';

  /**
   * Fuzzy match two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings match
   */
  function fuzzyMatch(a, b) {
    if (!a || !b) return false;
    const normalizeStr = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalizeStr(a).includes(normalizeStr(b)) || normalizeStr(b).includes(normalizeStr(a));
  }

// Simulates real typing by using native setter and dispatching events
function simulateInput(input, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeInputValueSetter.call(input, value);

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function autofillGoogleForm(fields) {
  const formFields = document.querySelectorAll('form div[role="listitem"]');

  formFields.forEach(field => {
    const labelEl = field.querySelector('div[role="heading"], div[aria-label]');
    const input = field.querySelector('input[type="text"], input[type="email"], textarea');

    if (!labelEl || !input) return;

    const labelText = labelEl.innerText || labelEl.getAttribute('aria-label') || '';
    if (!labelText) return;

    for (const { key, value } of fields) {
      if (fuzzyMatch(labelText, key)) {
        input.focus();
        simulateInput(input, value);
        break;
      }
    }
  });
}

function autofillGenericForm(fields) {
  const inputs = document.querySelectorAll('input, textarea');

  inputs.forEach(input => {
    const label = input.closest('label')?.innerText || input.name || input.id || input.placeholder || '';
    for (const { key, value } of fields) {
      if (fuzzyMatch(label, key)) {
        simulateInput(input, value);
        break;
      }
    }
  });
}

  /**
   * Initialize autofill
   */
  function init() {
    chrome.storage.sync.get('autofillFields', (data) => {
      const fields = data.autofillFields || [];
      if (!fields.length) return;

      setTimeout(() => {
        try {
          if (location.hostname.includes('docs.google.com') && location.pathname.includes('/forms')) {
            autofillGoogleForm(fields);
            console.log('[Niblie AutoFill] Google Form fields filled');
          } else {
            autofillGenericForm(fields);
            console.log('[Niblie AutoFill] Generic form fields filled');
          }
        } catch (error) {
          console.error('[Niblie AutoFill] Error:', error);
        }
      }, 2000); // Wait for DOM to fully render
    });
  }
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
