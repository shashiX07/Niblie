/**
 * Ad Blocker UI Module
 * Handles modal popups and badge animations
 */

const BlockerUI = {
  modalTimeout: null,
  currentModal: null,

  /**
   * Shows modal asking user to enable ad blocker
   * @param {string} platform Platform name
   */
  async showEnableModal(platform) {
    const settings = await AdBlockerStorage.getSettings();
    if (!settings.ui.showModal) return;

    // Don't show if already enabled
    const isEnabled = await AdBlockerStorage.isEnabledForPlatform(platform);
    if (isEnabled) return;

    this.createEnableModal(platform, settings.ui.modalTimeout);
  },

  /**
   * Creates the enable ad blocker modal
   * @param {string} platform Platform identifier
   * @param {number} timeout Timeout in seconds
   */
  createEnableModal(platform, timeout = 44) {
    // Remove existing modal if any
    if (this.currentModal) {
      this.currentModal.remove();
    }

    const platformName = PlatformDetector.getPlatformDisplayName(platform);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'niblie-adblocker-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'niblie-modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      transform: translateY(-20px);
      transition: transform 0.3s ease;
    `;

    // Create content
    modalContent.innerHTML = `
      <div style="margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="color: #4285f4;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      </div>
      <h3 style="margin: 0 0 15px 0; color: #202124; font-size: 18px; font-weight: 500;">
        Enable ${platformName} Ad Blocker?
      </h3>
      <p style="margin: 0 0 20px 0; color: #5f6368; line-height: 1.4;">
        We detected you're on ${platformName}. Enable ad blocking for a better browsing experience?
      </p>
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <input type="checkbox" id="niblie-enable-adblocker" style="margin-right: 8px;">
          <span style="color: #202124;">Enable ${platformName} ad blocker</span>
        </label>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="niblie-modal-enable" style="
          background: #4285f4;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        ">Enable</button>
        <button id="niblie-modal-dismiss" style="
          background: #f1f3f4;
          color: #5f6368;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
        ">Not now</button>
      </div>
      <div style="margin-top: 15px; font-size: 12px; color: #9aa0a6;">
        Auto-closes in <span id="niblie-countdown">${timeout}</span>s
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    this.currentModal = modal;

    // Show modal with animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modalContent.style.transform = 'translateY(0)';
    }, 10);

    // Set up event listeners
    const enableBtn = modal.querySelector('#niblie-modal-enable');
    const dismissBtn = modal.querySelector('#niblie-modal-dismiss');
    const checkbox = modal.querySelector('#niblie-enable-adblocker');
    const countdown = modal.querySelector('#niblie-countdown');

    enableBtn.addEventListener('click', async () => {
      if (checkbox.checked) {
        await AdBlockerStorage.updatePlatformSettings(platform, { enabled: true });
        this.initializePlatformBlocker(platform);
      }
      this.closeModal();
    });

    dismissBtn.addEventListener('click', () => {
      this.closeModal();
    });

    // Auto-close countdown
    let timeLeft = timeout;
    this.modalTimeout = setInterval(() => {
      timeLeft--;
      countdown.textContent = timeLeft;
      
      if (timeLeft <= 0) {
        this.closeModal();
      }
    }, 1000);
  },

  /**
   * Closes the current modal
   */
  closeModal() {
    if (this.modalTimeout) {
      clearInterval(this.modalTimeout);
      this.modalTimeout = null;
    }

    if (this.currentModal) {
      this.currentModal.style.opacity = '0';
      setTimeout(() => {
        if (this.currentModal) {
          this.currentModal.remove();
          this.currentModal = null;
        }
      }, 300);
    }
  },

  /**
   * Initializes platform-specific ad blocker
   * @param {string} platform Platform identifier
   */
  async initializePlatformBlocker(platform) {
    switch (platform) {
      case 'youtube':
        if (window.YouTubeBlocker) await window.YouTubeBlocker.init();
        break;
      case 'spotify':
        if (window.SpotifyBlocker) await window.SpotifyBlocker.init();
        break;
      case 'hotstar':
        if (window.HotstarBlocker) await window.HotstarBlocker.init();
        break;
      case 'general':
        if (window.WebBlocker) await window.WebBlocker.init();
        break;
    }
  }
};

// Make globally available
window.BlockerUI = BlockerUI;