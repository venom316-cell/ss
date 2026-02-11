# 🔥 Firebase Setup Instructions

## Why you need this:
**Without Firebase configured, answers from your phone are saved ONLY on your phone's browser. They won't appear on your computer's admin page.**

## Quick Setup Steps:

### 1. Create Firebase Project
1. Go to: https://console.firebase.google.com
2. Click **"Add project"** or **"Create a project"**
3. Give it a name (e.g., "romantic-proposal")
4. Click **Continue** → **Continue** → **Create project**

### 2. Enable Firestore Database
1. In Firebase Console, click **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for now, this is fine)
4. Select a location (choose closest to you)
5. Click **"Enable"**

### 3. Get Your Firebase Config
1. In Firebase Console, click the **⚙️ gear icon** (top left) → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **</> (Web)** icon to add a web app
4. Give it a nickname (e.g., "proposal-web")
5. Click **"Register app"**
6. **COPY the config object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Paste Config into script.js
1. Open `script.js` in your code editor
2. Find the `firebaseConfig` object (around line 7)
3. **REPLACE** all the placeholder values with your real Firebase config
4. Save the file

### 5. Test It!
1. Open `index.html` on your phone
2. Click Accept or Reject
3. Check the status message - it should say "Saved to cloud! ✅"
4. Open `admin.html` on your computer
5. Enter password and click Refresh
6. You should now see the answer from your phone! 🎉

## Troubleshooting:

**If answers still don't appear:**
- Check browser console (F12) for error messages
- Make sure Firestore is in "test mode" (allows read/write)
- Make sure you saved `script.js` after updating the config
- Refresh both pages after making changes

**If you see "Firebase is NOT configured" error:**
- Double-check that you replaced ALL placeholder values in `firebaseConfig`
- Make sure there are no typos in the config values
- Check browser console for specific error messages

---

**Once Firebase is configured, all answers from ANY device will appear in your admin page!** 💖
