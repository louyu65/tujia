document.addEventListener('DOMContentLoaded', () => {
  const autoDecryptToggle = document.getElementById('autoDecryptToggle');
  const detectTextToggle = document.getElementById('detectTextToggle');
  const detectImageToggle = document.getElementById('detectImageToggle');
  const globalPassword = document.getElementById('globalPassword');
  const scanBtn = document.getElementById('scanBtn');
  const textCount = document.getElementById('textCount');
  const binderCount = document.getElementById('binderCount');

  // Load saved settings
  chrome.storage.sync.get(['autoDecryptEnabled', 'detectTextEnabled', 'detectImageEnabled', 'globalPassword'], (res) => {
    if (res.autoDecryptEnabled !== undefined) autoDecryptToggle.checked = res.autoDecryptEnabled;
    if (res.detectTextEnabled !== undefined) detectTextToggle.checked = res.detectTextEnabled;
    if (res.detectImageEnabled !== undefined) detectImageToggle.checked = res.detectImageEnabled;
    if (res.globalPassword) globalPassword.value = res.globalPassword;
  });

  // Save settings on change
  autoDecryptToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ autoDecryptEnabled: autoDecryptToggle.checked });
  });

  detectTextToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ detectTextEnabled: detectTextToggle.checked });
  });

  detectImageToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ detectImageEnabled: detectImageToggle.checked });
  });

  globalPassword.addEventListener('input', () => {
    chrome.storage.sync.set({ globalPassword: globalPassword.value });
  });

  // Query tab stats
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_PAGE_STATS' }, (response) => {
        if (response) {
          textCount.textContent = response.textCount || 0;
          binderCount.textContent = response.binderCount || 0;
        }
      });
    }
  });

  // Trigger manual scan
  scanBtn.addEventListener('click', () => {
    scanBtn.textContent = '⏳ 正在扫描中...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_SCAN' }, (response) => {
          scanBtn.textContent = '✅ 扫描并解密完成';
          if (response) {
            textCount.textContent = response.textCount || 0;
            binderCount.textContent = response.binderCount || 0;
          }
          setTimeout(() => {
            scanBtn.textContent = '🔍 扫描并解密当前页面';
          }, 2000);
        });
      }
    });
  });
});
