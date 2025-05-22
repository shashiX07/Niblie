/**
 * Module loader utility to ensure proper loading order
 */

// Create a global registry for our modules
window.ExtModules = window.ExtModules || {};

// Helper to check if a module exists
function isModuleLoaded(moduleName) {
  return window[moduleName] !== undefined || 
         (window.ExtModules && window.ExtModules[moduleName] !== undefined);
}

// Helper to wait for module to be available
function waitForModule(moduleName, maxAttempts = 10) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (isModuleLoaded(moduleName)) {
        clearInterval(checkInterval);
        resolve(window[moduleName] || window.ExtModules[moduleName]);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error(`Module ${moduleName} failed to load after ${maxAttempts} attempts`));
      }
    }, 200);
  });
}

// Expose to global scope
window.ModuleLoader = {
  isModuleLoaded,
  waitForModule
};

console.log('ModuleLoader initialized');