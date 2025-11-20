# Niblie Architecture

## Overview

Niblie is a Chrome extension built with Manifest V3 that provides intelligent content analysis, ad blocking, and form autofill capabilities. The architecture follows a modular design pattern with clear separation of concerns between content scripts, background workers, and UI components.

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  setup.html  │  │  options.js  │  │  popup.html  │      │
│  │  (Settings)  │  │ (Tab Logic)  │  │  (Badge UI)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Background Service Worker                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               background.js                           │  │
│  │  - Extension lifecycle management                     │  │
│  │  - Message passing hub                                │  │
│  │  - Badge updates                                      │  │
│  │  - Settings storage                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Content Scripts Layer                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  content.js (Main Orchestrator)                       │  │
│  │  - Initializes all modules                            │  │
│  │  - Coordinates module communication                   │  │
│  │  - Handles page lifecycle                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  moduleLoader.js (Dynamic Module System)             │  │
│  │  - Loads modules based on user settings               │  │
│  │  - Manages module dependencies                        │  │
│  │  - Provides module lifecycle hooks                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Functional Modules                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  core.js    │  │  ui.js      │  │  modal.js   │        │
│  │  (Utilities)│  │  (UI Layer) │  │  (Dialogs)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ linkFinder  │  │ imageFinder │  │ videoFinder │        │
│  │  .js        │  │  .js        │  │  .js        │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ tableFinder │  │linkAnalyzer │  │wordCounter  │        │
│  │  .js        │  │  .js        │  │  .js        │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ad Blocker Modules                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  spotify-mute-adblocker.js                            │  │
│  │  - 8 detection methods                                │  │
│  │  - 10 muting methods                                  │  │
│  │  - 5 skip methods                                     │  │
│  │  - Real-time audio monitoring                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  spotify-fastcomplete-adblocker.js                    │  │
│  │  - Fast skip implementation                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  youtubeblocker.js                                    │  │
│  │  - YouTube ad detection and removal                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Background Service Worker (`background.js`)

The background service worker is the extension's command center, running independently of any web pages.

**Responsibilities:**
- **Lifecycle Management**: Handles extension installation, updates, and uninstallation
- **Message Router**: Receives messages from content scripts and forwards them appropriately
- **Badge Management**: Updates extension icon badge with counts and styles
- **Storage Management**: Manages Chrome storage API for settings persistence
- **Event Coordination**: Listens to browser events (tab updates, navigation, etc.)

**Key Functions:**
- `chrome.runtime.onInstalled`: Initial setup and default settings
- `chrome.runtime.onMessage`: Message passing hub
- `chrome.action.setBadgeText/BackgroundColor`: Badge updates

### 2. Content Scripts Layer

#### 2.1 Main Orchestrator (`content.js`)

The entry point for all page interactions, injected into every webpage.

**Responsibilities:**
- Initialize module system
- Coordinate between modules
- Handle page lifecycle events
- Manage DOM ready state
- Send results to background worker

**Flow:**
1. Wait for DOM ready
2. Load user settings from storage
3. Initialize moduleLoader
4. Activate enabled modules
5. Collect and aggregate results
6. Send badge update to background

#### 2.2 Module Loader (`moduleLoader.js`)

Dynamic module loading system that manages dependencies and lifecycle.

**Responsibilities:**
- Load modules based on user preferences
- Resolve module dependencies
- Provide initialization hooks
- Handle module errors gracefully
- Support lazy loading

**Module Interface:**
```javascript
{
  name: 'moduleName',
  init: function() { /* initialization */ },
  execute: function() { /* main logic */ },
  cleanup: function() { /* teardown */ }
}
```

### 3. Functional Modules

#### 3.1 Core Module (`core.js`)

Shared utilities and helper functions used across all modules.

**Provides:**
- DOM manipulation helpers
- String processing utilities
- Validation functions
- Common patterns and constants

#### 3.2 UI Module (`ui.js`)

Handles all user interface rendering and interactions.

**Responsibilities:**
- Create floating panels
- Render results in clean UI
- Handle user interactions
- Apply theme styling
- Manage animations

#### 3.3 Modal Module (`modal.js`)

Creates and manages modal dialogs for displaying detailed information.

**Features:**
- Customizable modal templates
- Responsive design
- Keyboard navigation (ESC to close)
- Backdrop blur effects
- Animation transitions

#### 3.4 Content Finder Modules

**Link Finder (`linkFinder.js`)**
- Extracts all links from the page
- Filters internal vs external links
- Categorizes by domain
- Provides link metadata (text, href, title)

**Image Finder (`imageFinder.js`)**
- Finds all images on the page
- Extracts image sources and alt text
- Handles lazy-loaded images
- Provides image dimensions

**Video Finder (`videoFinder.js`)**
- Detects video elements
- Extracts video sources
- Identifies embedded videos (YouTube, Vimeo, etc.)
- Provides video metadata

**Table Finder (`tableFinder.js`)**
- Locates all tables in the DOM
- Extracts table structure
- Converts tables to data objects
- Handles complex nested tables

**Link Analyzer (`linkAnalyzer.js`)**
- Deep analysis of link patterns
- Identifies suspicious links
- Checks for broken links
- Provides SEO insights

**Word Counter (`wordCounter.js`)**
- Counts words on the page
- Calculates reading time
- Identifies keyword density
- Provides text statistics

### 4. Ad Blocker Modules

#### 4.1 Spotify Mute Ad Blocker (`spotify-mute-adblocker.js`)

Ultra-aggressive ad blocking system with multiple detection and muting strategies.

**Detection Methods (8):**
1. **Skip Button Detection**: Checks if skip button is disabled (primary method)
2. **Next Button Detection**: Verifies next button disabled state
3. **Track Name Analysis**: Detects "spotify", "advertisement", "ad", "sponsor" in track name
4. **Seekbar State**: Checks if progressbar is disabled
5. **Artist Link Check**: No artist link + short duration (< 60s)
6. **Audio Source Pattern**: Matches ad-related URLs in audio src
7. **Duration Pattern**: 10-35 second tracks with disabled skip button
8. **UI Ad Elements**: Searches for ad-related class/id/data-testid attributes

**Muting Methods (10):**
1. Direct `audio.volume = 0`
2. Set `audio.muted = true`
3. `setAttribute('volume', '0')`
4. `Object.defineProperty` to force volume = 0
5. Maximum playback speed (16x)
6. Jump to end of track
7. Pause/play manipulation
8. UI volume button click
9. Volume slider manipulation with events
10. AudioContext gain node muting + UI opacity reduction

**Skip Methods (5):**
1. Maximum playback speed (16x)
2. Triple jump to end with retry logic
3. Force click next button (remove disabled state temporarily)
4. Dispatch MediaTrackNext keyboard event
5. Click progress bar at the end

**Architecture:**
```javascript
// State Management
let isEnabled = false;
let lastAdState = false;
let originalVolume = 1.0;
let adCheckInterval = null;
let audioObserver = null;
let mutationObserver = null;
let consecutiveAdChecks = 0;
let lastTrackUrl = '';

// Main Loop (500ms interval)
function init() {
  adCheckInterval = setInterval(() => {
    if (isAdPlaying()) {
      muteAudio();
      skipAd();
    } else {
      unmuteAudio();
    }
  }, 500);
  
  // Instant detection via audio events
  setupAudioObserver();
}
```

#### 4.2 Spotify Fast Complete Ad Blocker

Alternative implementation focused on speed optimization.

#### 4.3 YouTube Blocker

Removes YouTube advertisements and promotional content.

### 5. Form Autofill System (`formautofiller.js`)

Intelligent form filling based on user-defined templates.

**Features:**
- Custom field definitions
- Pattern matching for field detection
- Automatic form detection
- One-click autofill
- Secure storage of field values

**Flow:**
1. Detect forms on page load
2. Match fields to user templates
3. Show autofill indicator
4. Fill on user action
5. Validate filled data

### 6. Settings UI

#### 6.1 Settings Page (`setup.html` + `options.js`)

Modern Material Design interface for extension configuration.

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                    Header                            │
│  [Logo] Niblie - Intelligent Content Assistant      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Tab Navigation (Horizontal)                         │
│  [Badge Style] [Ad Blockers] [Advanced] [Form] [About] │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                  Tab Content                         │
│  ┌───────────────────────────────────────────────┐  │
│  │  Badge Style Tab:                             │  │
│  │  - Position Grid (3x3)                        │  │
│  │  - Visibility Toggle                          │  │
│  │  - Color Style (Solid/Gradient)               │  │
│  │  - Cute Theme Options                         │  │
│  │  - Live Preview                               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                    Footer                            │
│              [Save Settings] Status                  │
└─────────────────────────────────────────────────────┘
```

**Tab System:**
- Horizontal navigation with smooth transitions
- Material Design principles
- Responsive layout
- Live preview for badge settings
- No inline scripts (CSP compliant)

**JavaScript Architecture (`options.js`):**
```javascript
// DOMContentLoaded wrapper
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.tab-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Activate tab logic
    });
  });
  
  // Color style switching
  // Live value updates
  // Autofill field rendering
  // Settings save/load
});
```

## Data Flow

### 1. Page Load Flow

```
User visits webpage
        ↓
content.js injected
        ↓
Load settings from chrome.storage
        ↓
Initialize moduleLoader
        ↓
Load enabled modules
        ↓
Execute module logic
        ↓
Collect results
        ↓
Send to background.js
        ↓
Update badge
```

### 2. Ad Detection Flow (Spotify)

```
Spotify page loads
        ↓
spotify-mute-adblocker.js injected
        ↓
Load enabled state from storage
        ↓
Start 500ms check interval
        ↓
Setup audio event listeners
        ↓
┌─────────────────────┐
│  Every 500ms:       │
│  1. Run 8 detection │
│  2. If ad detected: │
│     - Apply 10 mute │
│     - Apply 5 skip  │
│  3. If no ad:       │
│     - Restore audio │
└─────────────────────┘
```

### 3. Settings Update Flow

```
User changes setting in options page
        ↓
Click "Save Settings"
        ↓
Validate input
        ↓
Save to chrome.storage.sync
        ↓
Show success message
        ↓
Background receives storage change
        ↓
Notify active content scripts
        ↓
Content scripts reload settings
        ↓
Apply new configuration
```

## Message Passing

Niblie uses Chrome's message passing API for component communication.

### Message Types:

```javascript
// Badge update from content script
{
  action: 'updateBadge',
  count: 42,
  tabId: 123
}

// Settings change notification
{
  action: 'settingsUpdated',
  settings: { ... }
}

// Module result
{
  action: 'moduleResult',
  module: 'linkFinder',
  data: [ ... ]
}
```

## Storage Schema

```javascript
{
  // Badge Settings
  badgePosition: 'top-right',
  badgeVisibility: true,
  badgeColorStyle: 'solid',
  badgeColor: '#4285f4',
  badgeGradientStart: '#667eea',
  badgeGradientEnd: '#764ba2',
  badgeSize: 70,
  badgeOpacity: 90,
  badgeBorderRadius: 50,
  badgeRotation: 0,
  cuteTheme: {
    enabled: false,
    style: 'minimal'
  },
  
  // Ad Blocker Settings
  adBlockers: {
    spotifyMute: true,
    spotifyFast: false,
    youtube: true
  },
  
  // Module Settings
  modules: {
    linkFinder: true,
    imageFinder: true,
    videoFinder: false,
    tableFinder: true,
    linkAnalyzer: false,
    wordCounter: true
  },
  
  // Form Autofill
  autofillFields: [
    {
      id: 'field-1',
      name: 'Email',
      value: 'user@example.com',
      selector: 'input[type="email"]'
    }
  ]
}
```

## Security Considerations

### Content Security Policy (CSP)

- **No inline scripts**: All JavaScript in external files
- **script-src 'self'**: Only load scripts from extension
- **No eval()**: No dynamic code execution
- **Secure storage**: Use chrome.storage.sync with encryption

### Permissions

```json
{
  "permissions": [
    "storage",        // Settings persistence
    "activeTab",      // Current tab access
    "scripting"       // Content script injection
  ],
  "host_permissions": [
    "*://open.spotify.com/*",  // Spotify ad blocking
    "<all_urls>"               // Content analysis
  ]
}
```

### Privacy

- **No external requests**: All processing happens locally
- **No data collection**: No analytics or tracking
- **User control**: All features opt-in
- **Secure defaults**: Privacy-first configuration

## Performance Optimization

### 1. Lazy Loading
- Modules load only when enabled
- Content scripts inject on-demand
- Settings loaded once and cached

### 2. Efficient DOM Queries
- Query selectors cached when possible
- MutationObserver for dynamic content
- Debouncing for expensive operations

### 3. Background Worker
- Service worker sleeps when inactive
- Event-driven architecture
- Minimal memory footprint

### 4. Ad Blocker Optimization
- 500ms check interval (balance between speed and performance)
- Audio event listeners for instant detection
- Early exit conditions in detection logic
- Cached DOM queries for frequently accessed elements

## Error Handling

### Try-Catch Blocks
All critical operations wrapped in try-catch with logging.

### Graceful Degradation
- Module failures don't crash entire extension
- Missing DOM elements handled gracefully
- Storage errors fall back to defaults

### Console Logging
- `[Niblie]` prefix for all extension logs
- `[Niblie Spotify]` for ad blocker logs
- Debug information for troubleshooting

## Build System (`build.js`)

Simple build script for packaging the extension.

**Features:**
- Validates manifest.json
- Checks file integrity
- Creates distributable package
- Generates changelog

## Future Architecture Considerations

### Planned Enhancements
1. **Service Worker Storage**: Migrate to IndexedDB for large datasets
2. **Module Marketplace**: Plugin system for third-party modules
3. **AI Integration**: Smart content analysis with ML models
4. **Sync Across Devices**: Cloud sync for settings
5. **Performance Dashboard**: Real-time metrics and analytics

### Scalability
- Modular design supports easy addition of new features
- Message passing allows distributed processing
- Storage schema versioning for migrations
- API abstraction for Chrome updates

---

**Version**: 0.5.0  
**Last Updated**: November 20, 2025  
**Maintained by**: Niblie Development Team
