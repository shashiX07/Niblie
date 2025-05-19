/**
 * Simple build script to bundle the modular files into a single content.js
 * Run with Node.js: node build.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  entry: './modules/',
  output: './dist/content.bundle.js',
  modules: [
    'core.js',
    'word-count.js',
    'links.js',
    'images.js',
    'videos.js',
    'ui.js',
    'utils.js',
    'url.js'
  ]
};

// Ensure output directory exists
const outputDir = path.dirname(config.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read main content.js file
const mainContent = fs.readFileSync('./content.js', 'utf8');

// Read and concatenate all module files
let bundleContent = '/* Bundled content.js - generated ' + new Date().toISOString() + ' */\n\n';
bundleContent += '/* Main content */\n';
bundleContent += mainContent;
bundleContent += '\n\n/* Modules */\n';

// Add each module
config.modules.forEach(module => {
  try {
    const modulePath = path.join(config.entry, module);
    const moduleContent = fs.readFileSync(modulePath, 'utf8');
    
    bundleContent += '\n/* Module: ' + module + ' */\n';
    bundleContent += moduleContent;
  } catch (err) {
    console.error(`Error processing module ${module}:`, err);
  }
});

// Write the bundle
fs.writeFileSync(config.output, bundleContent);
console.log(`Bundle created at ${config.output}`);