# 🎓 College Automation Framework

Add automation scripts for your college portal - auto-login, attendance, and more.

## 📁 Structure

```
colleges/
├── registry.json       # Maps URLs to colleges
├── loader.js          # Dynamic loader
└── [college-code]/    # Your college folder
    ├── config.json    # Configuration
    └── login.js       # Auto-login script
```

## 🏫 Supported Colleges

- **IIT Kharagpur** (`iitkgp`) - Auto-login + security questions

## 🚀 Quick Start

### 1. Create Folder
```
colleges/mycollege/
```

### 2. Create config.json
```json
{
  "name": "My College",
  "code": "mycollege",
  "urls": {
    "login": "https://erp.mycollege.edu/login"
  },
  "selectors": {
    "userId": "#username",
    "password": "#password"
  }
}
```

### 3. Create login.js
```javascript
(function() {
  'use strict';
  
  if (window.__MYCOLLEGE_LOGIN_INIT__) return;
  window.__MYCOLLEGE_LOGIN_INIT__ = true;

  function loadCredentials() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('autofillFields', (data) => {
        const fields = data.autofillFields || [];
        const creds = { userId: '', password: '' };
        
        fields.forEach(f => {
          if (f.key === 'mycollege_user_id') creds.userId = f.value;
          if (f.key === 'mycollege_password') creds.password = f.value;
        });
        
        resolve(creds);
      });
    });
  }

  function saveCredentials(userId, password) {
    chrome.storage.sync.get('autofillFields', (data) => {
      let fields = data.autofillFields || [];
      
      const updateField = (key, value) => {
        const idx = fields.findIndex(f => f.key === key);
        idx >= 0 ? fields[idx].value = value : fields.push({ key, value });
      };
      
      updateField('mycollege_user_id', userId);
      updateField('mycollege_password', password);
      
      chrome.storage.sync.set({ autofillFields: fields });
    });
  }

  async function fillForm() {
    const creds = await loadCredentials();
    const userInput = document.querySelector('#username');
    const passInput = document.querySelector('#password');
    
    if (userInput && creds.userId) {
      userInput.value = creds.userId;
      userInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    if (passInput && creds.password) {
      passInput.value = creds.password;
      passInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  setTimeout(fillForm, 500);
})();
```

### 4. Update registry.json
```json
{
  "colleges": [
    {
      "code": "mycollege",
      "name": "My College",
      "matchRules": {
        "urlPatterns": ["erp.mycollege.edu"]
      },
      "scripts": ["login.js"]
    }
  ]
}
```

### 5. Update manifest.json
```json
{
  "matches": ["*://erp.mycollege.edu/*"],
  "js": ["colleges/loader.js", "colleges/mycollege/login.js"]
}
```

## 💾 Storage Format

Use `autofillFields` array with `key/value` structure:

```javascript
[
  { key: 'mycollege_user_id', value: '12345' },
  { key: 'mycollege_password', value: 'secret' }
]
```

**Key naming:** `[collegecode]_[fieldname]`

## ✅ Best Practices

- ✅ Use IIFE wrapper
- ✅ Check init flag to prevent duplicates
- ✅ Prefix keys with college code
- ✅ Dispatch input/change/blur events
- ✅ Silent operation (no popups)
- ✅ HTTPS only
- ❌ Never log passwords

## 📚 Example

See `colleges/iitkgp/` for complete implementation with security questions.

## 🤝 Contributing

1. Test thoroughly
2. Follow structure above
3. Submit PR with college code

**Questions?** Open an issue with tag `college-automation`.
