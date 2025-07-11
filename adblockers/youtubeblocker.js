// === YouTube AdBlocker Script ===
// Auto-removes, skips, and fast-forwards YouTube ads effectively

(function () {
    const SELECTORS = {
        skipBtn: '.ytp-ad-skip-button.ytp-button',
        adContainers: [
            '.ad-showing',
            '.ytp-ad-module',
            '.ytp-ad-player-overlay',
            '.ytp-ad-overlay-container',
            '.ytp-ad-image-overlay',
            '#player-ads',
            '.video-ads',
            'ytd-promoted-video-renderer',
            'ytd-display-ad-renderer',
        ]
    };

    function removeAdElements() {
        // Remove all ad-related elements from DOM
        for (const selector of SELECTORS.adContainers) {
            document.querySelectorAll(selector).forEach(el => el.remove());
        }

        // Auto-click skip button
        const skipBtn = document.querySelector(SELECTORS.skipBtn);
        if (skipBtn) {
            skipBtn.click();
        }

        // Fast-forward video if ad is playing
        const video = document.querySelector('video');
        const adContainer = document.querySelector('.ad-showing');
        if (video && adContainer && !video.paused && video.duration > 0) {
            video.currentTime = video.duration;
        }
    }

    function observeDOMChanges() {
        const observer = new MutationObserver(() => {
            requestIdleCallback(removeAdElements, { timeout: 200 });
        });

        observer.observe(document, { childList: true, subtree: true });
    }

    function runPeriodically() {
        // Use requestIdleCallback for smooth performance
        setInterval(() => {
            requestIdleCallback(removeAdElements, { timeout: 200 });
        }, 1000);
    }

    // Kick off ad blocking
    document.addEventListener('DOMContentLoaded', () => {
        removeAdElements();
        observeDOMChanges();
        runPeriodically();
    });
})();
