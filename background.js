/**
 * Background script for the extension
 * Currently minimal but can be expanded for future functionality
 */

// Log when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
});

// Message handling between content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getStats') {
    // Example of future functionality
    sendResponse({ success: true });
    return true;
  }
});