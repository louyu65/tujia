# 🔓 HiddenBox 隐写与图夹解密助手 (Chrome / Edge 浏览器插件)

HiddenBox 官方配套浏览器插件，支持全网网页中隐写数据与多图隐写图夹的**原位自动检测、一键解密替换与交互式密码解锁**。

---

## ✨ 核心功能亮点

1. **⚡ 网页原位自动解密 (In-Place Auto-Decryption)**：
   - 自动扫描网页 DOM 节点中的零宽字符（Zero-Width Space）、Unicode 变体选择器与隐写文案。
   - 解密后直接替换原有的隐藏文本，并以醒目的 `[🔓 HiddenBox已解密]` 标签进行原位标注。

2. **📦 隐写图夹与 Polyglot 容器智能还原 (Stego Image Binder Unpacker)**：
   - 自动提取网页中 `<img>` 嵌入的 HiddenBox 多图图夹。
   - 在网页图片下方直接展开专属相册卡片，预览图夹内的所有秘密照片，并支持一键**`📥 下载照片`**！

3. **🔑 密码保护解密弹窗 (Password Unlock Modal)**：
   - 对于加了 AES-256 安全锁的隐写文本或图夹，自动标记为 `[🔒 隐写数据已加密 - 点击解密]`。
   - 用户点击后弹出原位密码输入框，输入正确口令后完成解密！
   - 支持在插件 Popup 弹窗中配置**全局默认密码**，自动带入解锁。

---

## 🛠️ 安装与使用教程 (开发者模式加载)

1. 打开 Chrome 或 Edge 浏览器，访问扩展程序管理页面：
   - Chrome 浏览器地址栏输入: `chrome://extensions/`
   - Edge 浏览器地址栏输入: `edge://extensions/`
2. 在右上角开启 **「开发者模式 (Developer mode)」**。
3. 点击 **「加载已解压的扩展程序 (Load unpacked)」** 按钮。
4. 选择本项目根目录下的 **`extension`** 文件夹（即包含 `manifest.json` 的目录）。
5. 安装成功后，点击浏览器右上角的扩展图标，即可自由开启/关闭自动扫描与手动触发！
