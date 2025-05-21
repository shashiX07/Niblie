/**
 * Background script for the extension
 */

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Viewport Word Counter extension installed');
});

// Nothing else required for background script as content script handles the main functionality