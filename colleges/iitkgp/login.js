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
      sendOtpBtn: '#getotp'
    },
    delays: {
      fillPassword: 500,
      triggerBlur: 300,
      waitForQuestion: 1500,
      fillAnswer: 500
    }
  };

  // State flags
  let questionHandled = false;
  let credentialsFilled = false;

  /**
   * Get stored data for this site
   */
  function getStoredData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['formData'], (result) => {
        const data = result.formData || {};
        const siteData = data[window.location.hostname] || {};
        resolve(siteData);
      });
    });
  }

  /**
   * Save data for this site
   */
  function saveData(key, value) {
    chrome.storage.local.get(['formData'], (result) => {
      const data = result.formData || {};
      if (!data[window.location.hostname]) {
        data[window.location.hostname] = {};
      }
      data[window.location.hostname][key] = value;
      chrome.storage.local.set({ formData: data }, () => {
        console.log(`[IITKGP] Saved ${key}`);
      });
    });
  }

  /**
   * Fill input field
   */
  function fillField(selector, value) {
    const field = document.querySelector(selector);
    if (field && value) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`[IITKGP] Filled ${selector}`);
      return true;
    }
    return false;
  }

  /**
   * Step 1: Fill Roll No and unfocus it by clicking elsewhere
   */
  async function fillCredentials() {
    if (credentialsFilled) return;

    const data = await getStoredData();
    const userIdField = document.querySelector(CONFIG.selectors.userId);
    const passwordField = document.querySelector(CONFIG.selectors.password);

    if (!userIdField || !passwordField) return;

    // Fill Roll No
    if (data.user_id) {
      fillField(CONFIG.selectors.userId, data.user_id);
      console.log('[IITKGP] Filled user ID');

      // Click on password field to unfocus roll no (this triggers security question)
      setTimeout(() => {
        passwordField.focus();
        passwordField.click();
        console.log('[IITKGP] Clicked password field to unfocus roll no');

        // Wait 2 seconds, then fill password
        setTimeout(() => {
          if (data.password) {
            fillField(CONFIG.selectors.password, data.password);
            credentialsFilled = true;
            console.log('[IITKGP] Filled password, watching for security question...');

            // Start watching for security question
            watchForSecurityQuestion();
          }
        }, 2000); // Wait 2 seconds before filling password
      }, 300); // Small delay before clicking password field
    }
  }

  /**
   * Step 2: Watch for security question to appear
   */
  function watchForSecurityQuestion() {
    let lastQuestion = '';
    let questionStableTimeout = null;

    const observer = new MutationObserver(() => {
      const answerDiv = document.querySelector(CONFIG.selectors.answerDiv);

      if (answerDiv && answerDiv.style.display !== 'none' && !questionHandled) {
        const questionField = document.querySelector(CONFIG.selectors.question);
        const currentQuestion = questionField ? questionField.value.trim() : '';

        // Check if question has changed
        if (currentQuestion && currentQuestion !== lastQuestion) {
          lastQuestion = currentQuestion;
          console.log('[IITKGP] Question detected:', currentQuestion);

          // Clear previous timeout
          if (questionStableTimeout) {
            clearTimeout(questionStableTimeout);
          }

          // Wait for question to stabilize (no more changes for 2 seconds)
          questionStableTimeout = setTimeout(() => {
            const finalQuestion = document.querySelector(CONFIG.selectors.question);
            if (finalQuestion && finalQuestion.value.trim() === lastQuestion) {
              console.log('[IITKGP] Question stabilized:', lastQuestion);
              observer.disconnect();
              handleSecurityQuestion();
            }
          }, 2000); // Wait 2 seconds for question to stabilize
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'value']
    });

    // Also check immediately in case it's already visible
    setTimeout(() => {
      const answerDiv = document.querySelector(CONFIG.selectors.answerDiv);
      const questionField = document.querySelector(CONFIG.selectors.question);

      if (answerDiv && answerDiv.style.display !== 'none' && questionField && !questionHandled) {
        const currentQuestion = questionField.value.trim();
        if (currentQuestion) {
          lastQuestion = currentQuestion;
          console.log('[IITKGP] Initial question check:', currentQuestion);

          questionStableTimeout = setTimeout(() => {
            const finalQuestion = document.querySelector(CONFIG.selectors.question);
            if (finalQuestion && finalQuestion.value.trim() === lastQuestion) {
              console.log('[IITKGP] Question stabilized:', lastQuestion);
              observer.disconnect();
              handleSecurityQuestion();
            }
          }, 2000); // Wait 2 seconds
        }
      }
    }, 2000); // Wait 2 seconds before initial check
  }

  /**
   * Step 3: Handle security question
   */
  async function handleSecurityQuestion() {
    if (questionHandled) {
      console.log('[IITKGP] Question already handled, skipping');
      return;
    }
    questionHandled = true;

    const questionField = document.querySelector(CONFIG.selectors.question);
    const answerField = document.querySelector(CONFIG.selectors.answer);
    const sendOtpBtn = document.querySelector(CONFIG.selectors.sendOtpBtn);

    if (!questionField || !answerField) {
      console.log('[IITKGP] Question or answer field not found');
      questionHandled = false;
      return;
    }

    const question = questionField.value.trim();
    console.log('[IITKGP] Final security question:', question);

    if (!question) {
      console.log('[IITKGP] Empty question');
      questionHandled = false;
      return;
    }

    // Get stored data
    const data = await getStoredData();
    const storedAnswer = data[question];

    if (storedAnswer) {
      // Answer exists in storage, fill it
      console.log('[IITKGP] Found stored answer');
      setTimeout(() => {
        fillField(CONFIG.selectors.answer, storedAnswer);
        console.log('[IITKGP] Filled answer');

        // Click Send OTP button
        setTimeout(() => {
          if (sendOtpBtn) {
            sendOtpBtn.click();
            console.log('[IITKGP] Clicked Send OTP button');
          }
        }, 500); // Wait 500ms before clicking button
      }, 500); // Wait 500ms before filling answer
    } else {
      // Answer not in storage, save it when user fills
      console.log('[IITKGP] Answer not found in storage, will save when user fills it');

      answerField.addEventListener('input', () => {
        const userAnswer = answerField.value.trim();
        if (userAnswer) {
          saveData(question, userAnswer);
          console.log('[IITKGP] Saved answer for future use');
        }
      });
    }
  }

  /**
   * Initialize on page load
   */
  function init() {
    console.log('[IITKGP] Login script initialized');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fillCredentials);
    } else {
      setTimeout(fillCredentials, 500);
    }
  }

  // Start
  init();
})();
