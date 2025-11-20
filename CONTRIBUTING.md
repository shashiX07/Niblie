# Contributing to Niblie

Thank you for your interest in contributing to Niblie! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Submitting Changes](#submitting-changes)
9. [Module Development](#module-development)
10. [Ad Blocker Development](#ad-blocker-development)
11. [Documentation](#documentation)
12. [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together and help each other
- **Be Professional**: Keep discussions focused and constructive
- **Be Patient**: Everyone learns at their own pace

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory remarks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- **Chrome Browser**: Version 88 or higher
- **Text Editor**: VS Code recommended
- **Git**: For version control
- **Node.js**: (Optional) For build tools

### Finding Issues to Work On

1. Browse [open issues](https://github.com/shashix07/Niblie/issues)
2. Look for labels:
   - `good first issue`: Great for newcomers
   - `help wanted`: Need community assistance
   - `bug`: Something isn't working
   - `enhancement`: New feature or improvement
   - `documentation`: Documentation improvements

### Claiming an Issue

1. Comment on the issue expressing your interest
2. Wait for maintainer approval
3. Fork the repository
4. Start working on your branch

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Niblie.git
cd Niblie

# Add upstream remote
git remote add upstream https://github.com/shashix07/Niblie.git
```

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Niblie` directory
5. Extension should now be loaded and active

### 3. Development Mode

```bash
# Keep the extension directory open in your editor
code .

# Make changes to files
# Reload extension in chrome://extensions/ to see changes
```

### 4. Enable Console Logging

Open Chrome DevTools:
- **Background Worker**: Click "service worker" link in extension details
- **Content Scripts**: Open DevTools on any webpage (F12)
- **Options Page**: Right-click extension icon → Inspect popup

## Project Structure

```
Niblie/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Background service worker
├── content.js                 # Main content script orchestrator
├── build.js                   # Build and packaging script
├── formautofiller.js          # Form autofill functionality
├── setup.html                 # Settings/options page
├── options.js                 # Settings page logic
├── options.css                # Settings page styles
├── README.md                  # Project readme
├── ARCHITECTURE.md            # Architecture documentation
├── CONTRIBUTING.md            # This file
├── CHANGELOG.md               # Version history
│
├── modules/                   # Functional modules
│   ├── core.js               # Core utilities
│   ├── ui.js                 # UI rendering
│   ├── modal.js              # Modal dialogs
│   ├── moduleLoader.js       # Module loading system
│   ├── linkFinder.js         # Link extraction
│   ├── imageFinder.js        # Image finder
│   ├── videoFinder.js        # Video detection
│   ├── tableFinder.js        # Table extraction
│   ├── linkAnalyzer.js       # Link analysis
│   └── wordCounter.js        # Word counting
│
└── adblockers/                # Ad blocker modules
    ├── spotify-mute-adblocker.js          # Spotify v4.0
    ├── spotify-fastcomplete-adblocker.js  # Spotify fast skip
    └── youtubeblocker.js                  # YouTube blocker
```

## Development Workflow

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, readable code
- Follow coding standards (see below)
- Test thoroughly
- Document your changes

### 3. Commit Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new link analyzer feature"

# Or for bug fixes
git commit -m "fix: resolve tab switching issue"
```

**Commit Message Format:**
```
<type>: <subject>

<body> (optional)

<footer> (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 4. Push Changes

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template
5. Submit the pull request

## Coding Standards

### JavaScript Style Guide

#### General Principles

- **Use const/let**: Never use `var`
- **Semicolons**: Always use semicolons
- **Quotes**: Use single quotes for strings
- **Indentation**: 4 spaces (no tabs)
- **Line Length**: Max 100 characters
- **Comments**: Write clear comments for complex logic

#### Naming Conventions

```javascript
// Constants - UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_ENDPOINT = 'https://api.example.com';

// Variables and functions - camelCase
let userName = 'John';
function getUserData() { }

// Classes - PascalCase
class ModuleLoader { }

// Private properties - prefix with underscore
let _privateVariable = 'secret';
```

#### Function Declarations

```javascript
// Prefer function declarations for named functions
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// Use arrow functions for callbacks
items.forEach(item => {
    console.log(item.name);
});

// Document complex functions
/**
 * Detects if an advertisement is currently playing
 * @returns {boolean} True if ad is detected, false otherwise
 */
function isAdPlaying() {
    // Implementation
}
```

#### Error Handling

```javascript
// Always use try-catch for risky operations
try {
    const data = JSON.parse(jsonString);
    processData(data);
} catch (error) {
    console.error('[Niblie] Parse error:', error);
    // Handle gracefully
}

// Check for null/undefined before accessing properties
if (element && element.querySelector) {
    const child = element.querySelector('.class');
}
```

#### Console Logging

```javascript
// Use consistent prefixes
console.log('[Niblie] Module loaded');
console.error('[Niblie] Failed to load settings:', error);
console.warn('[Niblie] Deprecated function used');

// For specific components
console.log('[Niblie Spotify] Ad detected via Method 1');
console.log('[Niblie UI] Modal opened');
```

### HTML/CSS Standards

#### HTML

- Use semantic HTML5 elements
- Proper indentation (2 spaces)
- Close all tags
- Use meaningful class names
- Add ARIA labels for accessibility

```html
<!-- Good -->
<button class="save-button" aria-label="Save settings">
    Save Settings
</button>

<!-- Bad -->
<div onclick="save()">Save</div>
```

#### CSS

- Use classes over IDs for styling
- Follow BEM naming convention (optional)
- Group related properties
- Use CSS custom properties for theming

```css
/* Good */
.button-primary {
    display: inline-block;
    padding: 10px 20px;
    
    background: var(--primary-color);
    color: white;
    
    border: none;
    border-radius: 4px;
    
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Avoid deep nesting */
.container .header .nav .item { } /* Too specific */
```

### Content Security Policy (CSP)

**CRITICAL**: Never use inline scripts or styles in HTML files.

```html
<!-- Bad - Violates CSP -->
<button onclick="handleClick()">Click</button>
<script>
    function handleClick() { }
</script>

<!-- Good - External scripts only -->
<button id="myButton">Click</button>
<script src="script.js"></script>
```

In `script.js`:
```javascript
document.getElementById('myButton').addEventListener('click', handleClick);
function handleClick() { }
```

## Testing Guidelines

### Manual Testing Checklist

Before submitting a PR, test:

#### General Functionality
- [ ] Extension loads without errors
- [ ] No console errors in background worker
- [ ] No console errors in content scripts
- [ ] Settings page loads correctly
- [ ] All tabs switch properly

#### Feature-Specific Testing
- [ ] New feature works as intended
- [ ] Feature doesn't break existing functionality
- [ ] Settings save and load correctly
- [ ] Badge updates properly
- [ ] UI renders correctly

#### Cross-Browser Testing
- [ ] Chrome (primary)
- [ ] Edge (Chromium-based)
- [ ] Brave (if applicable)

#### Performance Testing
- [ ] No memory leaks
- [ ] No excessive CPU usage
- [ ] Quick load times
- [ ] Smooth animations

### Testing Ad Blockers

#### Spotify Ad Blocker Testing

1. **Setup**:
   - Open Spotify Web Player (`open.spotify.com`)
   - Wait for an ad to play (free account required)

2. **Test Detection**:
   - Check console for `[Niblie Spotify] Ad detected via Method X`
   - Verify detection within 500ms of ad start

3. **Test Muting**:
   - Confirm audio mutes immediately
   - Check console for `MUTED (all methods applied)`
   - Verify volume returns after ad

4. **Test Skipping**:
   - Confirm ad plays at 16x speed
   - Verify track changes within 1-2 seconds
   - Check console for skip method logs

5. **Test Cleanup**:
   - Disable ad blocker in settings
   - Verify normal playback resumes
   - Check for proper cleanup

## Submitting Changes

### Pull Request Checklist

Before submitting:

- [ ] Code follows style guidelines
- [ ] No console errors
- [ ] Tested in Chrome
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Enhancement
- [ ] Documentation

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tested thoroughly
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. **Automated Checks**: (if configured) Linting, build verification
2. **Maintainer Review**: Code review by project maintainers
3. **Testing**: Thorough testing of changes
4. **Feedback**: Address any review comments
5. **Approval**: Maintainer approves PR
6. **Merge**: Changes merged into main branch

## Module Development

### Creating a New Module

1. **Create Module File**

```javascript
// modules/myNewModule.js

(function() {
    'use strict';
    
    // Module configuration
    const MODULE_NAME = 'myNewModule';
    const MODULE_VERSION = '1.0.0';
    
    // Module initialization
    function init() {
        console.log(`[Niblie] ${MODULE_NAME} initialized`);
        setupEventListeners();
    }
    
    // Main module logic
    function execute() {
        try {
            const results = analyzeContent();
            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error(`[Niblie] ${MODULE_NAME} error:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Helper functions
    function analyzeContent() {
        // Your logic here
        return [];
    }
    
    function setupEventListeners() {
        // Event listeners if needed
    }
    
    // Cleanup
    function cleanup() {
        // Remove listeners, clear timers, etc.
    }
    
    // Export module API
    window.NiblieModules = window.NiblieModules || {};
    window.NiblieModules[MODULE_NAME] = {
        init,
        execute,
        cleanup,
        version: MODULE_VERSION
    };
})();
```

2. **Register in manifest.json**

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["modules/myNewModule.js"],
      "run_at": "document_end"
    }
  ]
}
```

3. **Add to Module Loader**

Update `moduleLoader.js` to include your module.

4. **Add Settings UI**

Add toggle in `setup.html` settings page.

### Module Best Practices

- **Single Responsibility**: Each module should do one thing well
- **No Dependencies**: Modules should be independent
- **Error Handling**: Always wrap risky operations in try-catch
- **Performance**: Minimize DOM queries, cache when possible
- **Memory**: Clean up listeners and timers
- **Logging**: Use consistent log prefixes

## Ad Blocker Development

### Creating a New Ad Blocker

1. **Create Blocker File**

```javascript
// adblockers/myservice-adblocker.js

(function() {
    'use strict';
    
    let isEnabled = false;
    
    // Load settings
    chrome.storage.sync.get(['adBlockers'], (data) => {
        isEnabled = data.adBlockers?.myService || false;
        if (isEnabled) {
            init();
        }
    });
    
    function init() {
        console.log('[Niblie MyService] Ad blocker initialized');
        startMonitoring();
    }
    
    function startMonitoring() {
        // Your detection logic
        setInterval(checkForAds, 500);
    }
    
    function checkForAds() {
        if (isAdPlaying()) {
            blockAd();
        }
    }
    
    function isAdPlaying() {
        // Detection logic
        return false;
    }
    
    function blockAd() {
        // Blocking logic
        console.log('[Niblie MyService] Ad blocked');
    }
    
    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.adBlockers) {
            const newState = changes.adBlockers.newValue?.myService;
            if (newState !== isEnabled) {
                isEnabled = newState;
                if (isEnabled) {
                    init();
                } else {
                    cleanup();
                }
            }
        }
    });
    
    function cleanup() {
        // Clean up
    }
})();
```

2. **Add to manifest.json**

```json
{
  "content_scripts": [
    {
      "matches": ["*://*.myservice.com/*"],
      "js": ["adblockers/myservice-adblocker.js"],
      "run_at": "document_end",
      "all_frames": true
    }
  ]
}
```

3. **Add Settings Toggle**

Add toggle in `setup.html` Ad Blockers tab.

### Ad Blocker Best Practices

- **Multiple Detection Methods**: Implement fallbacks
- **Aggressive but Safe**: Don't break the site
- **Performance**: Optimize check intervals
- **User Control**: Always provide enable/disable toggle
- **Logging**: Log detection and blocking actions
- **Testing**: Test extensively with free accounts

### Detection Strategies

1. **UI Element Detection**: Look for disabled skip buttons, ad labels
2. **Content Analysis**: Check track names, durations
3. **Audio Analysis**: Monitor audio element properties
4. **Network Monitoring**: Check request URLs (advanced)
5. **Timing Patterns**: Detect ad duration patterns

### Blocking Strategies

1. **Audio Muting**: Multiple muting methods
2. **Speed Manipulation**: Increase playback speed
3. **Time Jumping**: Skip to end of ad
4. **UI Manipulation**: Click skip buttons programmatically
5. **Element Removal**: Remove ad UI elements

## Documentation

### Code Documentation

- **Inline Comments**: Explain complex logic
- **Function Documentation**: Document parameters and return values
- **Module Documentation**: Explain module purpose and usage

```javascript
/**
 * Calculates the optimal position for the badge based on user settings
 * @param {string} position - Position setting ('top-right', 'top-left', etc.)
 * @param {Object} viewport - Viewport dimensions {width, height}
 * @returns {Object} Coordinates {x, y} in pixels
 */
function calculateBadgePosition(position, viewport) {
    // Implementation
}
```

### Update Documentation Files

When making changes, update:

- **README.md**: User-facing features
- **ARCHITECTURE.md**: Technical architecture
- **CHANGELOG.md**: Version history
- **Code comments**: Inline documentation

### Writing Good Documentation

- **Clear and Concise**: Get to the point
- **Examples**: Provide code examples
- **Visual Aids**: Use diagrams when helpful
- **Keep Updated**: Update docs with code changes

## Community

### Getting Help

- **GitHub Issues**: Ask questions, report bugs
- **Discussions**: General discussions and ideas
- **Code Review**: Learn from PR reviews

### Communication Channels

- **GitHub**: Primary communication platform
- **Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions
- **Discussions**: General questions and ideas

### Recognition

Contributors are recognized in:
- CHANGELOG.md for specific contributions
- GitHub contributor stats
- Special thanks in releases

## License

By contributing to Niblie, you agree that your contributions will be licensed under the same license as the project.

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label
4. Be patient and respectful

---

**Thank you for contributing to Niblie!** 🎉

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in helping make Niblie better for everyone.

**Happy Coding!**

---

**Last Updated**: November 20, 2025  
**Maintainers**: @shashix07  
**Repository**: https://github.com/shashix07/Niblie
