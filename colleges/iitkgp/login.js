/**
 * IIT Kharagpur ERP Auto-Login Script
 * Automatically fills login credentials and handles security questions
 * Uses formautofiller.js data structure (key/value pairs)
 */

(function() {
  'use strict';
  
  // Prevent multiple initializations
  if (window.__IITKGP_LOGIN_INITIALIZED__) {
    console.log('[IITKGP] Already initialized, skipping');
    return;
  }
  window.__IITKGP_LOGIN_INITIALIZED__ = true;

  // Configuration
  const CONFIG = {
    selectors: {
      userId: '#user_id',
      password: '#password',
      answerDiv: '#answer_div',
      question: '#question',
      answer: '#answer',
      sendOtpBtn: '#getotp',
      otpInput: '#email_otp1'
    },
    delays: {
      fill: 500,        // Delay before filling
      save: 3000,       // Debounce for saving
      clickOtp: 800     // Delay before clicking Send OTP
    }
  };

  // State flags
  let hasFilledCredentials = false;
  let hasHandledSecurityQuestion = false;
  let securityQuestionObserver = null;

  /**
   * Fuzzy match two strings
   */
  function fuzzyMatch(a, b) {
    if (!a || !b) return false;
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normA = normalize(a);
    const normB = normalize(b);
    return normA.includes(normB) || normB.includes(normA);
  }

  // Password encryption/decryption removed - store plain text

  /**
   * Load credentials from formAutofiller storage (key/value structure)
   */
  function loadCredentials() {
    return new Promise((resolve) => {
      chrome.storage.sync.get('autofillFields', (data) => {
        const fields = data.autofillFields || [];
        const credentials = {
          userId: '',
          password: '',
          securityAnswers: {}
        };
        
        // Parse autofillFields array (using key/value structure like formautofiller.js)
        fields.forEach(field => {
          if (!field.key || !field.value) return;
          
          // Match user ID
          if (fuzzyMatch(field.key, 'iitkgp_user_id') || 
              fuzzyMatch(field.key, 'stakeholder code') ||
              fuzzyMatch(field.key, 'roll number') ||
              fuzzyMatch(field.key, 'user id')) {
            credentials.userId = field.value;
          }
          // Match password
          else if (fuzzyMatch(field.key, 'iitkgp_password') || 
                   fuzzyMatch(field.key, 'iitkgp pass')) {
            credentials.password = field.value;
          }
          // Match security questions
          else if (field.key.toLowerCase().includes('youtuber') || 
                   field.key.toLowerCase().includes('movie') || 
                   field.key.toLowerCase().includes('pet')) {
            credentials.securityAnswers[field.key] = field.value;
          }
        });
        
        console.log('[IITKGP] Loaded credentials:', {
          hasUserId: !!credentials.userId,
          hasPassword: !!credentials.password,
          securityAnswersCount: Object.keys(credentials.securityAnswers).length
        });
        
        resolve(credentials);
      });
    });
  }

  /**
   * Save credentials to formAutofiller storage (key/value structure)
   */
  function saveCredentials(userId, password, securityQuestion, securityAnswer) {
    chrome.storage.sync.get('autofillFields', (data) => {
      let fields = data.autofillFields || [];
      
      // Update or add user ID
      if (userId) {
        const userIdIndex = fields.findIndex(f => f.key === 'iitkgp_user_id');
        if (userIdIndex >= 0) {
          fields[userIdIndex].value = userId;
        } else {
          fields.push({ key: 'iitkgp_user_id', value: userId });
        }
      }
      
      // Update or add password
      if (password) {
        const passwordIndex = fields.findIndex(f => f.key === 'iitkgp_password');
        if (passwordIndex >= 0) {
          fields[passwordIndex].value = password;
        } else {
          fields.push({ key: 'iitkgp_password', value: password });
        }
      }
      
      // Update or add security answer (use actual question text as key)
      if (securityQuestion && securityAnswer) {
        const answerIndex = fields.findIndex(f => f.key === securityQuestion);
        if (answerIndex >= 0) {
          fields[answerIndex].value = securityAnswer;
        } else {
          fields.push({ key: securityQuestion, value: securityAnswer });
        }
      }
      
      chrome.storage.sync.set({ autofillFields: fields }, () => {
        console.log('[IITKGP] Saved to autofillFields');
      });
    });
  }

  /**
   * Fill input field with proper event triggering
   */
  function fillInput(input, value) {
    if (!input) return;
    
    // For password type inputs, temporarily change to text to fill properly
    const originalType = input.type;
    if (originalType === 'password') {
      input.type = 'text';
    }
    
    // Set value
    input.value = value;
    
    // Trigger all necessary events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // Restore password type after a short delay
    if (originalType === 'password') {
      setTimeout(() => {
        input.type = originalType;
      }, 100);
    }
  }

  /**
   * Fill login form with saved credentials
   */
  async function fillLoginForm() {
    if (hasFilledCredentials) {
      console.log('[IITKGP] Already filled, skipping');
      return;
    }
    
    const credentials = await loadCredentials();
    
    // Fill user ID (note: this is type="password" in the DOM!)
    const userIdInput = document.querySelector(CONFIG.selectors.userId);
    if (userIdInput && credentials.userId) {
      fillInput(userIdInput, credentials.userId);
      console.log('[IITKGP] Filled user ID');
      hasFilledCredentials = true;
    }
    
    // Fill password
    const passwordInput = document.querySelector(CONFIG.selectors.password);
    if (passwordInput && credentials.password) {
      fillInput(passwordInput, credentials.password);
      console.log('[IITKGP] Filled password');
    }
  }

  /**
   * Monitor user input and save credentials
   */
  function monitorUserInput() {
    let saveTimeout;
    
    const userIdInput = document.querySelector(CONFIG.selectors.userId);
    const passwordInput = document.querySelector(CONFIG.selectors.password);
    
    if (!userIdInput || !passwordInput) return;
    
    const saveData = () => {
      const userId = userIdInput.value.trim();
      const password = passwordInput.value.trim();
      
      if (userId && password) {
        saveCredentials(userId, password, null, null);
        console.log('[IITKGP] Saved user credentials');
      }
    };
    
    // Monitor both fields
    [userIdInput, passwordInput].forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveData, CONFIG.delays.save);
      }, { passive: true });
      
      input.addEventListener('blur', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveData, 1000);
      }, { passive: true });
    });
  }

  /**
   * Handle security question
   */
  async function handleSecurityQuestion() {
    if (hasHandledSecurityQuestion) {
      console.log('[IITKGP] Already handled security question');
      return;
    }
    
    const answerDiv = document.querySelector(CONFIG.selectors.answerDiv);
    const questionLabel = document.querySelector(CONFIG.selectors.question);
    const answerInput = document.querySelector(CONFIG.selectors.answer);
    
    // Check if security question is visible
    if (!answerDiv || answerDiv.classList.contains('hidden')) {
      return;
    }
    
    if (!questionLabel || !answerInput) {
      return;
    }
    
    const questionText = questionLabel.textContent.trim();
    if (!questionText) return;
    
    console.log('[IITKGP] Security question detected:', questionText);
    
    const credentials = await loadCredentials();
    let foundAnswer = null;
    
    // Try to find matching answer using fuzzy match
    for (const [savedQuestion, answer] of Object.entries(credentials.securityAnswers)) {
      if (fuzzyMatch(questionText, savedQuestion)) {
        foundAnswer = answer;
        console.log('[IITKGP] Found matching answer');
        break;
      }
    }
    
    if (foundAnswer) {
      // Fill the answer
      fillInput(answerInput, foundAnswer);
      console.log('[IITKGP] Filled security answer');
      
      // Click Send OTP button
      setTimeout(() => {
        const otpButton = document.querySelector(CONFIG.selectors.sendOtpBtn);
        if (otpButton && !otpButton.disabled) {
          otpButton.click();
          console.log('[IITKGP] Clicked Send OTP');
        }
      }, CONFIG.delays.clickOtp);
      
      hasHandledSecurityQuestion = true;
    } else {
      // Answer not found - monitor for user input
      console.log('[IITKGP] No answer found, will learn when user enters');
      monitorSecurityAnswer(questionText, answerInput);
    }
  }

  /**
   * Monitor security answer input for new questions
   */
  function monitorSecurityAnswer(questionText, answerInput) {
    let saveTimeout;
    
    const saveAnswer = () => {
      const answer = answerInput.value.trim();
      if (answer) {
        saveCredentials(null, null, questionText, answer);
        console.log('[IITKGP] Learned new security answer for:', questionText);
      }
    };
    
    // Save when user types
    answerInput.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveAnswer, CONFIG.delays.save);
    }, { once: false, passive: true });
    
    // Save when user clicks Send OTP
    const otpButton = document.querySelector(CONFIG.selectors.sendOtpBtn);
    if (otpButton) {
      otpButton.addEventListener('click', () => {
        clearTimeout(saveTimeout);
        saveAnswer();
      }, { once: true, passive: true });
    }
  }

  /**
   * Setup security question observer
   */
  function setupSecurityQuestionObserver() {
    const answerDiv = document.querySelector(CONFIG.selectors.answerDiv);
    if (!answerDiv) return;
    
    // Create observer to watch for class changes
    securityQuestionObserver = new MutationObserver(() => {
      handleSecurityQuestion();
    });
    
    securityQuestionObserver.observe(answerDiv, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Also check immediately
    handleSecurityQuestion();
  }

  /**
   * Initialize auto-login
   */
  async function init() {
    try {
      console.log('[IITKGP] Initializing auto-login...');
      
      // Wait a bit for DOM to be ready
      setTimeout(async () => {
        // Fill login form
        await fillLoginForm();
        
        // Monitor user input
        monitorUserInput();
        
        // Setup security question observer
        setupSecurityQuestionObserver();
        
        console.log('[IITKGP] Auto-login initialized');
      }, CONFIG.delays.fill);
      
      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        if (securityQuestionObserver) {
          securityQuestionObserver.disconnect();
        }
      });
      
    } catch (error) {
      console.error('[IITKGP] Initialization error:', error);
    }
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
