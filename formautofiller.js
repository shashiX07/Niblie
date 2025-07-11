// === Universal Form AutoFiller with Google Forms Fix ===

function fuzzyMatch(a, b) {
  return a.toLowerCase().replace(/[^a-z0-9]/g, '').includes(
    b.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
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

chrome.storage.sync.get('autofillFields', (data) => {
  const fields = data.autofillFields || [];
  if (!fields.length) return;

  setTimeout(() => {
    if (location.hostname.includes('docs.google.com') && location.pathname.includes('/forms')) {
      autofillGoogleForm(fields);
    } else {
      autofillGenericForm(fields);
    }
  }, 2000); // Wait for DOM to fully render
});
