/**
 * Background script for the extension
 */

// Listen for installation
chrome.runtime.onInstalled.addListener(details => {
  console.log('Viewport Word Counter extension installed');
  
  if (details.reason === "install") {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});