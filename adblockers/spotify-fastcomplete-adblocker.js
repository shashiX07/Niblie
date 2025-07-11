// === Spotify AdBlocker (Fast-Complete Ads) ===
// Author: You

(function () {
    let lastAdDetected = false;

    function isAdPlaying() {
        const adFlag = document.querySelector('.main-nowPlayingBar-nowPlaying .adSlot');
        const adText = document.querySelector('.track-info__name')?.innerText.toLowerCase();
        return (
            adFlag !== null ||
            (adText && (adText.includes('ad') || adText.includes('advertisement')))
        );
    }

    function fastCompleteAd() {
        const audio = document.querySelector('audio');
        const nextBtn = document.querySelector('[data-testid="control-button-skip-forward"]');

        if (!audio) return;

        if (isAdPlaying()) {
            if (!lastAdDetected) console.log('[Spotify AdBlocker] Ad detected — fast completing...');
            lastAdDetected = true;

            try {
                audio.currentTime = audio.duration;
            } catch (err) {
                nextBtn?.click();
            }
        } else {
            lastAdDetected = false;
        }
    }

    function removeBannerAds() {
        const adSelectors = [
            '[data-testid="ad-banner"]',
            '[data-testid="ad-slot"]',
            '[data-testid="leaderboard-ad"]',
            '.advertisement'
        ];
        adSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.remove());
        });
    }

    function runBlocker() {
        removeBannerAds();
        fastCompleteAd();
    }

    document.addEventListener('DOMContentLoaded', () => {
        setInterval(() => {
            requestIdleCallback(runBlocker, { timeout: 200 });
        }, 1000);
    });
})();
