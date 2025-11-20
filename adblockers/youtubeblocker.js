// === YouTube AdBlocker - Undetectable Version ===
// Mimics natural user behavior to bypass detection

(function () {
    'use strict';

    // Randomize timing to appear human-like
    const randomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    const SELECTORS = {
        video: 'video',
        skipBtn: ['.ytp-ad-skip-button', '.ytp-skip-ad-button'],
        adModule: '.ytp-ad-module',
        adOverlay: ['.ytp-ad-player-overlay', '.ytp-ad-overlay-container'],
        adText: ['.ytp-ad-text', '.ytp-ad-preview-text']
    };

    let isProcessing = false;
    let originalPlaybackRate = 1;

    // Check if ad is playing without triggering detection
    function isAdPlaying() {
        const video = document.querySelector(SELECTORS.video);
        if (!video) return false;

        // Check multiple signals naturally
        const adModule = document.querySelector(SELECTORS.adModule);
        const adText = document.querySelector(SELECTORS.adText.join(','));
        const playerContainer = document.querySelector('.html5-video-player');
        
        return !!(
            adModule?.offsetHeight > 0 ||
            adText?.offsetHeight > 0 ||
            playerContainer?.classList.contains('ad-showing') ||
            playerContainer?.classList.contains('ad-interrupting')
        );
    }

    // Silently speed through ad
    async function handleAd() {
        if (isProcessing) return;
        isProcessing = true;

        try {
            const video = document.querySelector(SELECTORS.video);
            if (!video) return;

            // Save original rate
            if (!originalPlaybackRate || originalPlaybackRate === 1) {
                originalPlaybackRate = video.playbackRate || 1;
            }

            // Gradually increase speed (looks natural)
            if (video.playbackRate < 16) {
                video.playbackRate = 16;
            }

            // Wait a bit before trying to skip
            await new Promise(resolve => setTimeout(resolve, randomDelay(100, 300)));

            // Try to find and click skip button naturally
            for (const selector of SELECTORS.skipBtn) {
                const skipBtn = document.querySelector(selector);
                if (skipBtn && skipBtn.offsetHeight > 0) {
                    // Add small random delay before clicking
                    await new Promise(resolve => setTimeout(resolve, randomDelay(50, 150)));
                    skipBtn.click();
                    break;
                }
            }

            // If still playing ad, jump near end
            if (isAdPlaying() && video.duration > 0 && isFinite(video.duration)) {
                await new Promise(resolve => setTimeout(resolve, randomDelay(100, 200)));
                video.currentTime = Math.max(0, video.duration - 0.1);
            }

        } catch (e) {
            // Silently handle errors
        } finally {
            isProcessing = false;
        }
    }

    // Reset playback speed when ad ends
    function resetPlaybackSpeed() {
        const video = document.querySelector(SELECTORS.video);
        if (video && !isAdPlaying()) {
            if (video.playbackRate !== originalPlaybackRate) {
                video.playbackRate = originalPlaybackRate || 1;
            }
        }
    }

    // Hide overlay ads without removing them (less detectable)
    function hideOverlays() {
        SELECTORS.adOverlay.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.style.display !== 'none') {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                }
            });
        });
    }

    // Main check function with random intervals
    async function checkAndHandle() {
        if (isAdPlaying()) {
            await handleAd();
            hideOverlays();
        } else {
            resetPlaybackSpeed();
        }
    }

    // Use variable intervals to avoid pattern detection
    function startMonitoring() {
        const check = async () => {
            await checkAndHandle();
            // Random interval between 800ms - 1500ms
            setTimeout(check, randomDelay(800, 1500));
        };
        check();
    }

    // Watch for video events naturally
    function attachVideoListeners() {
        const video = document.querySelector(SELECTORS.video);
        if (video && !video.dataset.adBlockerAttached) {
            video.dataset.adBlockerAttached = 'true';
            
            // Listen to natural video events
            ['playing', 'timeupdate'].forEach(event => {
                video.addEventListener(event, () => {
                    if (isAdPlaying()) {
                        setTimeout(handleAd, randomDelay(100, 300));
                    }
                }, { passive: true });
            });
        }
    }

    // Observe DOM changes subtly
    const observer = new MutationObserver((mutations) => {
        // Don't process every mutation - batch them
        if (mutations.some(m => m.addedNodes.length > 0)) {
            setTimeout(() => {
                attachVideoListeners();
                if (isAdPlaying()) {
                    handleAd();
                }
            }, randomDelay(200, 500));
        }
    });

    // Initialize everything
    function init() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Start monitoring after random delay
        setTimeout(() => {
            attachVideoListeners();
            startMonitoring();
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }, randomDelay(1000, 2000));
    }

    init();
})();
