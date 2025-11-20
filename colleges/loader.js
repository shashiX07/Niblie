/**
 * College Script Loader
 * Dynamically loads college-specific scripts based on current URL
 */

const CollegeScriptLoader = {
  registry: null,
  loadedScripts: new Set(),
  
  /**
   * Initialize the loader
   */
  async init() {
    console.log('[College Loader] Initializing...');
    
    // Load registry
    this.registry = await this.loadRegistry();
    
    // Detect and load appropriate college scripts
    this.detectAndLoad();
  },
  
  /**
   * Load the college registry
   */
  async loadRegistry() {
    // In production, this would fetch from registry.json
    return {
      colleges: [
        {
          code: 'iitkgp',
          name: 'IIT Kharagpur',
          urlPatterns: ['erp.iitkgp.ac.in'],
          scripts: ['colleges/iitkgp/login.js']
        }
      ],
      matchRules: {
        'erp.iitkgp.ac.in': {
          college: 'iitkgp',
          features: ['autoLogin', 'autoFillForms']
        }
      }
    };
  },
  
  /**
   * Detect current college from URL and load scripts
   */
  detectAndLoad() {
    const currentUrl = window.location.hostname;
    console.log('[College Loader] Current URL:', currentUrl);
    
    // Find matching college
    for (const [pattern, config] of Object.entries(this.registry.matchRules)) {
      if (currentUrl.includes(pattern)) {
        console.log('[College Loader] Matched college:', config.college);
        this.loadCollegeScripts(config.college);
        return;
      }
    }
    
    console.log('[College Loader] No matching college found for this URL');
  },
  
  /**
   * Load scripts for a specific college
   */
  async loadCollegeScripts(collegeCode) {
    const college = this.registry.colleges.find(c => c.code === collegeCode);
    
    if (!college) {
      console.error('[College Loader] College not found:', collegeCode);
      return;
    }
    
    console.log(`[College Loader] Loading scripts for ${college.name}...`);
    
    for (const scriptPath of college.scripts) {
      if (!this.loadedScripts.has(scriptPath)) {
        await this.loadScript(scriptPath);
        this.loadedScripts.add(scriptPath);
      }
    }
  },
  
  /**
   * Load a script dynamically
   */
  loadScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(scriptPath);
      script.onload = () => {
        console.log('[College Loader] Loaded script:', scriptPath);
        resolve();
      };
      script.onerror = () => {
        console.error('[College Loader] Failed to load script:', scriptPath);
        reject();
      };
      document.head.appendChild(script);
    });
  }
};

// Initialize when extension loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CollegeScriptLoader.init());
} else {
  CollegeScriptLoader.init();
}
