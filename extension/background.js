// HiddenBox Chrome Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    autoDecryptEnabled: true,
    detectTextEnabled: true,
    detectImageEnabled: true
  });
  console.log('[HiddenBox Extension] Ready and initialized.');
});

// Relay messages if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_SETTINGS') {
    chrome.storage.sync.get(['autoDecryptEnabled', 'detectTextEnabled', 'detectImageEnabled'], (res) => {
      sendResponse(res);
    });
    return true;
  }
});
