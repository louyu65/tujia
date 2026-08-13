/**
 * HiddenBox Chrome/Edge Extension Content Script
 * Auto-detects text steganography & Stego Image Binders on any web page
 * Replaces hidden elements in-place with clean badges & password unlock dialogs.
 */

(() => {
  let pageStats = { textCount: 0, binderCount: 0 };
  let autoDecryptEnabled = true;
  let detectTextEnabled = true;
  let detectImageEnabled = true;
  let globalPassword = '';

  // ----------------------------------------------------
  // Core Steganography Protocol & Decoders
  // ----------------------------------------------------

  const ZW_CHARS = ['\u200B', '\u200C', '\u200D', '\u200E', '\u200F', '\u2060', '\uFEFF'];

  function textHasHiddenChars(text) {
    if (!text || typeof text !== 'string') return false;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code === 0x200B || code === 0x200C || code === 0x200D || code === 0x200E || code === 0x200F || code === 0x2060 || code === 0xFEFF) {
        return true;
      }
      if (code >= 0xFE00 && code <= 0xFE0F) {
        return true;
      }
    }
    return false;
  }

  function extractZeroWidthBytes(text) {
    let bits = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '\u200B') bits += '0';
      else if (char === '\u200C') bits += '1';
    }
    if (!bits || bits.length % 8 !== 0) return null;
    const bytes = new Uint8Array(bits.length / 8);
    for (let i = 0; i < bits.length; i += 8) {
      bytes[i / 8] = parseInt(bits.substr(i, 8), 2);
    }
    return bytes;
  }

  function extractVariationSelectorBytes(text) {
    const chars = Array.from(text);
    const nibbles = [];
    for (const char of chars) {
      const code = char.codePointAt(0);
      if (code >= 0xFE00 && code <= 0xFE0F) {
        nibbles.push(code - 0xFE00);
      }
    }
    if (nibbles.length < 2 || nibbles.length % 2 !== 0) return null;
    const bytes = new Uint8Array(nibbles.length / 2);
    for (let i = 0; i < nibbles.length; i += 2) {
      bytes[i / 2] = (nibbles[i] << 4) | nibbles[i + 1];
    }
    return bytes;
  }

  // Web Crypto AES-256-GCM Decryption Helper
  async function decryptAESGCM(ciphertext, salt, iv, password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new Uint8Array(decrypted);
  }

  // Unpack HBX1 Payload Header
  async function parseHBX1Payload(bytes, password = '') {
    if (!bytes || bytes.length < 12) {
      throw new Error('格式错误: 数据长度不足');
    }

    // Magic Header: HBX1 (0x48, 0x42, 0x58, 0x31)
    if (bytes[0] !== 0x48 || bytes[1] !== 0x42 || bytes[2] !== 0x58 || bytes[3] !== 0x31) {
      throw new Error('未检测到 HBX1 协议签名');
    }

    const flags = bytes[4];
    const type = bytes[5];
    const isEncrypted = (flags & 0x01) !== 0;

    let payloadData = bytes.slice(6);

    if (isEncrypted) {
      if (!password) {
        return { isEncrypted: true, payloadBytes: null };
      }

      if (payloadData.length < 28) {
        throw new Error('加密数据块损坏');
      }

      const salt = payloadData.slice(0, 16);
      const iv = payloadData.slice(16, 28);
      const ciphertext = payloadData.slice(28);

      try {
        payloadData = await decryptAESGCM(ciphertext, salt, iv, password);
      } catch (err) {
        throw new Error('密码错误或数据解密失败');
      }
    }

    const textDecoder = new TextDecoder('utf-8');
    const textContent = textDecoder.decode(payloadData);

    return {
      isEncrypted: false,
      type,
      textContent,
      payloadBytes: payloadData
    };
  }

  // Container Polyglot Tail Extractor
  function extractContainerBytes(fileBytes) {
    const MAGIC = [0x48, 0x42, 0x58, 0x31]; // HBX1
    if (fileBytes.length < MAGIC.length + 4) return null;

    let matchPos = -1;
    for (let i = fileBytes.length - MAGIC.length - 4; i >= 0; i--) {
      if (
        fileBytes[i] === MAGIC[0] &&
        fileBytes[i + 1] === MAGIC[1] &&
        fileBytes[i + 2] === MAGIC[2] &&
        fileBytes[i + 3] === MAGIC[3]
      ) {
        matchPos = i;
        break;
      }
    }

    if (matchPos === -1) return null;

    const dataLength =
      (fileBytes[fileBytes.length - 4] << 24) |
      (fileBytes[fileBytes.length - 3] << 16) |
      (fileBytes[fileBytes.length - 2] << 8) |
      fileBytes[fileBytes.length - 1];

    if (dataLength > 0 && matchPos + dataLength <= fileBytes.length) {
      return fileBytes.slice(matchPos, matchPos + dataLength);
    }

    return fileBytes.slice(matchPos);
  }

  // ----------------------------------------------------
  // DOM Text In-Place Decryption & Replacement
  // ----------------------------------------------------

  async function scanAndDecryptTextNodes(rootNode = document.body) {
    if (!detectTextEnabled) return;

    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.nodeValue || !textHasHiddenChars(node.nodeValue)) {
            return NodeFilter.FILTER_SKIP;
          }
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'TEXTAREA' || parent.classList.contains('hb-decrypted-badge'))) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const targetNodes = [];
    while (walker.nextNode()) {
      targetNodes.push(walker.currentNode);
    }

    for (const node of targetNodes) {
      const rawText = node.nodeValue;
      let bytes = extractZeroWidthBytes(rawText) || extractVariationSelectorBytes(rawText);

      if (!bytes) continue;

      try {
        const result = await parseHBX1Payload(bytes, globalPassword);

        const span = document.createElement('span');

        if (result.isEncrypted) {
          span.className = 'hb-password-badge';
          span.innerHTML = `🔒 发现 HiddenBox 加密隐写 (点击输入密码解密)`;
          span.onclick = () => promptPasswordForNode(span, bytes);
        } else {
          span.className = 'hb-decrypted-badge';
          span.innerHTML = `<span class="hb-badge-tag">🔓 HiddenBox已解密</span> <span>${escapeHtml(result.textContent)}</span>`;
          pageStats.textCount++;
        }

        if (node.parentElement) {
          node.parentElement.replaceChild(span, node);
        }
      } catch (err) {
        // Silently skip non-HBX1 text
      }
    }
  }

  // ----------------------------------------------------
  // Stego Image & Image Binder In-Page Decryption Card
  // ----------------------------------------------------

  async function scanAndDecryptImages() {
    if (!detectImageEnabled) return;

    const images = document.querySelectorAll('img:not([data-hb-scanned])');

    for (const img of images) {
      img.setAttribute('data-hb-scanned', 'true');
      const src = img.src;
      if (!src || src.startsWith('data:image/svg')) continue;

      try {
        const resp = await fetch(src, { mode: 'cors' }).catch(() => null);
        if (!resp || !resp.ok) continue;

        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const payloadBytes = extractContainerBytes(bytes);

        if (!payloadBytes) continue;

        const result = await parseHBX1Payload(payloadBytes, globalPassword);

        if (result.isEncrypted) {
          renderImagePasswordOverlay(img, payloadBytes);
        } else {
          renderDecryptedImageCard(img, result);
        }
      } catch (e) {
        // Silently ignore cross-origin fetch failures or invalid images
      }
    }
  }

  function renderDecryptedImageCard(imgElement, result) {
    let manifest = null;
    try {
      manifest = JSON.parse(result.textContent);
    } catch {
      manifest = null;
    }

    const container = document.createElement('div');
    container.className = 'hb-binder-container';

    if (manifest && manifest.type === 'HIDDENBOX_IMAGE_BINDER_V1' && Array.isArray(manifest.images)) {
      pageStats.binderCount++;
      container.innerHTML = `
        <div class="hb-binder-header">
          <div class="hb-binder-title">
            <span>📦 HiddenBox 隐写图夹已成功提取</span>
            <span style="font-size:10px; background:#7e22ce; color:#fff; padding:1px 6px; border-radius:99px; font-family:monospace;">
              共 ${manifest.images.length} 张秘密相册
            </span>
          </div>
        </div>
        <div class="hb-binder-grid">
          ${manifest.images.map((item, idx) => `
            <div class="hb-binder-item">
              <img src="${item.dataUrl}" class="hb-binder-img" alt="${escapeHtml(item.name)}" />
              <div class="hb-binder-name">${escapeHtml(item.name)}</div>
              <a href="${item.dataUrl}" download="${escapeHtml(item.name)}" class="hb-btn-dl">📥 下载照片</a>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      pageStats.textCount++;
      container.innerHTML = `
        <div class="hb-binder-header">
          <div class="hb-binder-title">🔓 HiddenBox 图片解密内容</div>
        </div>
        <div style="font-size:12px; color:#e2e8f0; font-family:monospace; line-height:1.5;">
          ${escapeHtml(result.textContent)}
        </div>
      `;
    }

    if (imgElement.parentNode) {
      imgElement.parentNode.insertBefore(container, imgElement.nextSibling);
    }
  }

  function renderImagePasswordOverlay(imgElement, payloadBytes) {
    const container = document.createElement('div');
    container.className = 'hb-binder-container';
    container.style.borderStyle = 'dashed';
    container.style.borderColor = '#f43f5e';
    container.innerHTML = `
      <div class="hb-binder-header" style="border:none; margin:0;">
        <div class="hb-binder-title" style="color:#fb7185; cursor:pointer;">
          🔒 该图片包含加密的 HiddenBox 隐写图夹 (点击输入密码解密)
        </div>
      </div>
    `;

    container.onclick = () => {
      promptPasswordForNode(container, payloadBytes, (decryptedResult) => {
        container.remove();
        renderDecryptedImageCard(imgElement, decryptedResult);
      });
    };

    if (imgElement.parentNode) {
      imgElement.parentNode.insertBefore(container, imgElement.nextSibling);
    }
  }

  // ----------------------------------------------------
  // Password Dialog Modal Helper
  // ----------------------------------------------------

  function promptPasswordForNode(targetElement, payloadBytes, onSuccess) {
    const modal = document.createElement('div');
    modal.className = 'hb-modal-overlay';
    modal.innerHTML = `
      <div class="hb-modal-card">
        <div class="hb-modal-title">🔑 输入 HiddenBox 解密口令</div>
        <div style="font-size:11px; color:#94a3b8;">该隐写数据已被 AES-256 加密锁保护</div>
        <input type="password" class="hb-modal-input" placeholder="输入密码..." />
        <div class="hb-modal-btns">
          <button class="hb-modal-btn hb-modal-btn-cancel">取消</button>
          <button class="hb-modal-btn hb-modal-btn-submit">解锁解密</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('.hb-modal-input');
    const cancelBtn = modal.querySelector('.hb-modal-btn-cancel');
    const submitBtn = modal.querySelector('.hb-modal-btn-submit');

    input.focus();

    const closeModal = () => modal.remove();

    cancelBtn.onclick = closeModal;

    const doSubmit = async () => {
      const pwd = input.value;
      if (!pwd) return;

      submitBtn.textContent = '验证中...';
      try {
        const result = await parseHBX1Payload(payloadBytes, pwd);
        closeModal();

        if (onSuccess) {
          onSuccess(result);
        } else {
          targetElement.className = 'hb-decrypted-badge';
          targetElement.innerHTML = `<span class="hb-badge-tag">🔓 HiddenBox已解密</span> <span>${escapeHtml(result.textContent)}</span>`;
          pageStats.textCount++;
        }
      } catch (err) {
        alert(`解密失败: ${err.message}`);
        submitBtn.textContent = '解锁解密';
      }
    };

    submitBtn.onclick = doSubmit;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') doSubmit();
      if (e.key === 'Escape') closeModal();
    };
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ----------------------------------------------------
  // Init & Extension Message Listeners
  // ----------------------------------------------------

  function runFullScan() {
    scanAndDecryptTextNodes();
    scanAndDecryptImages();
  }

  // Load storage settings
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['autoDecryptEnabled', 'detectTextEnabled', 'detectImageEnabled', 'globalPassword'], (res) => {
      if (res.autoDecryptEnabled !== undefined) autoDecryptEnabled = res.autoDecryptEnabled;
      if (res.detectTextEnabled !== undefined) detectTextEnabled = res.detectTextEnabled;
      if (res.detectImageEnabled !== undefined) detectImageEnabled = res.detectImageEnabled;
      if (res.globalPassword) globalPassword = res.globalPassword;

      if (autoDecryptEnabled) {
        runFullScan();
      }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'TRIGGER_SCAN') {
        runFullScan();
        setTimeout(() => {
          sendResponse(pageStats);
        }, 500);
        return true;
      }
      if (request.action === 'GET_PAGE_STATS') {
        sendResponse(pageStats);
      }
    });
  } else {
    runFullScan();
  }
})();
