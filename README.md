# Niblie - Smart Page Analyzer

**Niblie** is a cute and powerful Chrome extension that helps you analyze the visible content on any web page. Originally designed as a viewport word counter, it has evolved into a multifunctional tool that detects and analyzes key elements (links, images, videos, tables) in real time. Niblie also supports ad-blocking functionalities and a draggable, animated UI for an interactive experience.

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

### 🛡️ Ad Blocker Support *(Coming Soon)*

* Filters out common ad elements using selectors
* Planned integration with public ad-block filter lists
* Toggle ad blocker on/off via options page

### ⚙️ Options Page

* Customize badge position, theme, and animation
* Enable/disable specific analyzers (images, links, etc.)
* Control refresh intervals and visibility thresholds

---

## 🔧 Setup Instructions

You can use Niblie in two ways:

### 1. Manual Installation from ZIP

1. [Download the latest ZIP release](https://github.com/shashiX07/Niblie/releases/download/chrome-extension/Niblie.zip)&#x20;
2. Extract the ZIP
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer Mode** (top-right corner)
5. Click **Load Unpacked** and select the extracted folder
6. Niblie is now active! You’ll see the floating badge on any page.

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
├── manifest.json          # Extension config
├── background.js          # Runs on install/init
├── content.js             # Injects all page-related logic
├── wordCounter.js         # Viewport-based word counting
├── ui.js                  # UI badge + theme logic
├── linkFinder.js          # Finds & categorizes links
├── imageFinder.js         # Finds all images
├── videoFinder.js         # Detects videos
├── tableFinder.js         # Highlights tables
├── modal.js               # Custom modal viewer
├── index.html/css/js      # Settings UI
└── assets/                # Icons, images, themes
```

---

## 👨‍💻 Developers

* **Modular Design**: Easy to extend with new element finders or badge types
* **Events-based UI**: Auto re-renders on scroll, resize, DOM mutations
* **Ad Blocker Roadmap**: Planned support for filter lists, custom rules, and dynamic blocking

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

## 📎 Links

* [Download ZIP](https://github.com/shashiX07/Niblie/releases/download/chrome-extension/Niblie.zip)&#x20;
* [GitHub Repository](https://github.com/shashix07/Niblie)&#x20;

---

> Made with 💖 by Shashi
