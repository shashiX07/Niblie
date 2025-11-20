# Niblie - Smart Page Analyzer

**Niblie** is a cute and powerful Chrome extension that helps you analyze the visible content on any web page. Originally designed as a viewport word counter, it has evolved into a multifunctional tool that detects and analyzes key elements (links, images, videos, tables) in real time. Niblie also supports ad-blocking and autofill functionalities, with a draggable, animated UI for an interactive experience.

---

## 🆕 Version 0.3.0 - Latest Updates

* **🎓 Organization Automation Framework** - Automated Scipts supports for different organization and institutes automations scripts support. 
* **✨ Floating Particles** - Customizable cute animations around badge (hearts, stars, sparkles, custom images/GIFs)
* **🔐 Smart Credential Learning** - Auto-saves login data as you type
* **🎨 Enhanced Cute Theme** - More animation options and particle controls
* **📦 Extensible Architecture** - Easy framework for adding more Organizations/organizations

---

## 🌟 Features

### 🔢 Viewport Word Counter

* Counts words that are visible in the current browser viewport
* Real-time updates when you scroll or resize the window
* Dynamically hides words behind modals or popups

### 🎨 Draggable Animated Badge

* A floating badge shows live word count
* Click it to open a modal with detailed page analytics
* Repositionable and persists user preferences
* Supports cute and modern themes with animations

### 📦 Page Analyzer

* **Link Finder**: Categorizes and lists links (PDFs, docs, socials, etc.)
* **Image Finder**: Detects images, including non-`<img>` sources like CSS backgrounds
* **Video Finder**: Recognizes embedded videos
* **Table Finder**: Finds tables and highlights them in the page

### 🛡️ Ad Blocker (Now Active!)

* Filters out YouTube and Spotify ads

  * YouTube: Blocks or skips video ads
  * Spotify: Mutes or fast-forwards audio ads
* Automatically removes banner ads from websites
* Designed to remain undetectable
* Future support for filter list integrations

### 🎓 Organization Auto-Login

* Automatically fills login credentials for supported Organization portals
* **Currently supports:** IIT Kharagpur ERP
* **Features:**
  * Auto-fills User ID and Password
  * Handles security questions with fuzzy matching
  * Learns new credentials as you type
  * Secure browser-based storage
  * Manual OTP entry for security
* **Extensible:** Add your Organization - see [Organizations/README.md](Organizations/README.md)

### ✨ Floating Particles

* Cute animated particles around the badge
* **5 built-in types:** Hearts, Stars, Sparkles, Flowers, Cute Mix
* **Custom images:** Upload your own PNG or GIF (max 100KB)
* **Adjustable:** Frequency (1-10), Speed (1-5), GIF delay (50-500ms)
* **Milestone celebrations:** Burst of particles on page milestones
* Enable/disable in Badge Style settings

### ✍️ Autofill Engine

* Lets you define your own personal data (e.g., name, email, roll number)
* Auto-fills Google Forms and other web forms using fuzzy label matching
* Supports environment-style bulk paste (`KEY=VALUE`) like Vercel
* Fields are stored persistently using Chrome Storage
* You can import/export your data in JSON format

### ⚙️ Options Page

* Customize badge position, theme, and animation
* Enable/disable specific analyzers (images, links, etc.)
* Control refresh intervals and visibility thresholds
* Paste or export all your autofill data

---

## 🔧 Setup Instructions

You can use Niblie in two ways:

### 1. Manual Installation from ZIP

1. [Download v0.3.0 ZIP release](https://github.com/shashiX07/Niblie/archive/refs/tags/v0.3.0-Niblie.zip)
2. Extract the ZIP
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer Mode** (top-right corner)
5. Click **Load Unpacked** and select the extracted folder
6. Niblie is now active! You’ll see the floating badge on any page.

📁 **During initial setup, a file named `NiblieId.txt` will be downloaded automatically.**
This file contains your extension's unique ID. Please **keep it safe**, especially if you plan to repackage or migrate the extension in the future.

### 2. Clone from GitHub (Recommended for Devs)

```bash
git clone https://github.com/shashix07/niblie.git
cd niblie
```

Then load it in Chrome as an unpacked extension as explained above.

---

## 📁 Folder Structure

```
niblie/
├── manifest.json                           # Extension config
├── background.js                           # Runs on install/init
├── content.js                              # Injects page logic
├── formautofiller.js                       # Smart form auto-filler
├── settings.html/css/js                    # Settings page
├── index.html                              # Landing page
├── modules/
│   ├── wordCounter.js                      # Word counting
│   ├── ui.js                               # Badge UI
│   ├── linkFinder.js                       # Link detection
│   ├── imageFinder.js                      # Image detection
│   ├── videoFinder.js                      # Video detection
│   ├── tableFinder.js                      # Table detection
│   ├── modal.js                            # Modal viewer
│   └── core.js                             # Core utilities
└── adblockers/
    ├── spotify-mute-adblocker.js           # Spotify ad blocker
    └── youtubeblocker.js                   # YouTube ad blocker
```

---

## 📦 Data Setup for Autofill

You can manage your autofill fields via the settings page:

```env
NAME=John Doe
EMAIL=johndoe@example.com
ROLL=21CS1234
COURSE=BTech CSE
LINKEDIN=https://linkedin.com/in/johndoe
GITHUB=https://github.com/johndoe
```

To manually inject autofill data via the DevTools Console:

1. Open your extension's **Settings Page**

   * Or directly open: `chrome-extension://<your-niblie-id-here>/settings.html`

2. Open **DevTools Console** (`Ctrl+Shift+I` or `Cmd+Option+I`)

3. Paste the following:

```js
chrome.storage.sync.set({
  autofillFields: [
    { key: "Name", value: "John Doe" },
    { key: "Email", value: "johndoe@example.com" },
    { key: "Roll", value: "21CS1234" },
    { key: "Course", value: "BTech CSE" }
    //more data as according to your need 
  ]
});
```
👉 Sample format available in releases
---

## 👨‍💻 Developers

* **Modular Design**: Easy to extend with new element finders or badge types
* **Events-based UI**: Auto re-renders on scroll, resize, DOM mutations
* **Ad Blocker System**: Extendable with custom filter rules
* **Autofill**: Ideal for students, developers, or heavy form users

---

## 📌 Notes

* Works on most modern websites
* Does not send any data externally
* Source code is open and customizable

---

## 🤝 Contributing

Niblie is open source and welcomes contributions! Whether you want to fix bugs, add features, improve performance, or enhance documentation, feel free to fork the repository and submit a pull request.

```bash
git clone https://github.com/shashix07/niblie.git
```

Please open an issue first to discuss major changes or new ideas. Let's make Niblie even better together!

---

## 🐞 Bug Reporting

Found a bug or issue? Please report it using this Google Form:

👉 [Submit a Bug Report](https://docs.google.com/forms/d/e/1FAIpQLSd1tO0IiU_vlrK1wqeffiPs82gpMangCQ5xoByH7g8jltvd4w/viewform?usp=dialog)

---

## 📎 Links

* [Download v0.3.0 Release](https://github.com/shashiX07/Niblie/releases/download/v0.3.0-Niblie/Nibliev0.3.0.zip)
* [GitHub Repository](https://github.com/shashix07/Niblie)
* [Landing Page](https://shashix07.github.io/Niblie/)

---

> Made with 💖 by Shashi
