/**
 * Background script for the extension
 */

chrome.runtime.onInstalled.addListener(details => {
  console.log('[Niblie] Extension installed');

  if (details.reason === "install") {
    const extensionId = chrome.runtime.id;
    
    // 1. Store extension ID in chrome.storage for future use
    chrome.storage.local.set({ 
      extensionId: extensionId,
      optionsUrl: `chrome-extension://${extensionId}/settings.html`
    }, () => {
      console.log('[Niblie] Extension ID stored:', extensionId);
    });
    
    // 2. Open the options page
    chrome.runtime.openOptionsPage();

    // 3. Download extension ID as text file using data URL
    const content = `Niblie ID: ${extensionId}`;
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:text/plain;base64,${base64Content}`;

    chrome.downloads.download({
      url: dataUrl,
      filename: "NiblieId.txt",
      saveAs: false
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error('[Niblie] Download error:', chrome.runtime.lastError);
      } else {
        console.log('[Niblie] NiblieId.txt downloaded successfully (ID:', downloadId, ')');
      }
    });
  }
});

// Message listener for opening options page and downloading videos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
  }
  else if (message.action === 'downloadVideo') {
    // Handle video download request from content script
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || 'video.mp4',
      saveAs: false
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error('[Niblie] Download error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[Niblie] Video download started (ID:', downloadId, ')');
        sendResponse({ success: true, downloadId: downloadId });
      }
    });
    return true; // Keep channel open for async response
  }
  return true;
});
