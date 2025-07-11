/**
 * Background script for the extension
 */

chrome.runtime.onInstalled.addListener(details => {
  console.log('[Niblie] Extension installed');

  if (details.reason === "install") {
    // 1. Open the options page
    chrome.runtime.openOptionsPage();

    // 2. Download extension ID as text file using data URL
    const extensionId = chrome.runtime.id;
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
