# 📦 Chrome Web Store Preparation Guide

This document contains everything you need to submit **Debesties Mail** to the Chrome Web Store.

---

## 📝 1. Store Listing Details

### **Short Description (Limit 150 chars)**
Protect your privacy with one-click temporary emails. Auto-fill signup forms and block spam instantly with Debesties Mail.

### **Detailed Description**
**Debesties Mail: Your Personal Privacy Shield.**

Tired of giving away your real email to every website you visit? Fed up with endless spam and newsletters you never subscribed to? Meet your new best friend in privacy.

Debesties Mail allows you to generate high-quality, disposable temporary email addresses in a single click. Our mission is to make privacy approachable, fast, and—most importantly—bestie-friendly.

**🚀 Key Features:**
*   **Instant Generation:** Click the icon and get a fresh, professional temp mail address immediately.
*   **Magic Auto-Fill (⚡):** Our smart "Lightning Bolt" button appears directly in signup forms across the web. Click it to fill the field and move on.
*   **Live Updates:** No need to refresh. Incoming emails appear instantly in the popup.
*   **Privacy-First:** We don't track your real identity. No IP logs, no personal data collection.
*   **Clean Design:** A premium, mint-green interface that feels like part of your modern workflow.

**Perfect for:**
- Developers testing signup flows.
- Coupon hunters and one-time downloads.
- Privacy-conscious users who hate spam.

---

## 🔒 2. Privacy & Permissions Justification

When you upload the extension, Google will ask for justifications for requested permissions. Use these:

*   **`storage`**: 
    > "Used to store the user's active temporary email address and session data locally. This ensures that when a user navigates between tabs or restarts their browser, they don't lose access to their current temporary inbox."
    
*   **`activeTab`**:
    > "Used to conditionally inject the 'Magic Fill' button into the active page when an email input field is detected. This allows the extension to provide a seamless one-click experience on the sites the user is visiting."

*   **`scripting`**:
    > "Required to inject the content script that detects email fields and provides the auto-fill functionality directly within the web page's UI."

---

## 📁 3. Packaging Instructions

1.  Navigate to the `c:\MAMP\htdocs\SwiftInbox\extension` directory.
2.  Select **ONLY** the following items:
    *   `manifest.json`
    *   `popup.html`
    *   `popup.js`
    *   `content.js`
    *   `content.css`
    *   `icons/` (the entire folder)
3.  Right-click and select **"Compress to ZIP file"**.
4.  Name it `debesties-mail-v1.zip`.
5.  **Verify**: Open the ZIP. You should see `manifest.json` immediately (not inside another folder).

---

## 🖼️ 4. Promotional Assets Needed

You will need to upload these separately in the Developer Dashboard:
1.  **Icon (128x128)**: Use `icons/icon-128.png`.
2.  **Screenshots (1280x800)**: Take 3-4 clear screenshots showing:
    *   The popup generating an email.
    *   The "⚡" button appearing in a form (e.g., on a generic signup page).
    *   The "Copied!" notification.
3.  **Tile Image (440x280)**: A clean branding tile with the Debesties logo.

---

## 🌐 5. Privacy Policy URL
Use your production URL: `https://mail.creativeutil.com`
(The "Privacy Policy" link in the footer of your live site is accepted by Google during the review process).
