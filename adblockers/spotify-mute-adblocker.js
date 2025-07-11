// === Spotify AdBlocker for Web Player (Mute Strategy) ===
// Author: You

(function () {
    let lastAdDetected = false;

    function isAdPlaying() {
        const adFlag = document.querySelector('.main-nowPlayingBar-nowPlaying .adSlot');
        const trackInfo = document.querySelector('.now-playing');
        const adText = document.querySelector('.track-info__name')?.innerText.toLowerCase();

        return (
            adFlag !== null ||
            (adText && adText.includes('advertisement')) ||
            (trackInfo && trackInfo.innerText.toLowerCase().includes('ad'))
        );
    }

    function muteDuringAd() {
        const video = document.querySelector('video, audio');
        const volumeBtn = document.querySelector('[data-testid="volume-bar"]');

        if (!video || !volumeBtn) return;

        if (isAdPlaying()) {
            if (!lastAdDetected) console.log('[Spotify AdBlocker] Ad detected — muting...');
            video.muted = true;
            lastAdDetected = true;
        } else {
            if (lastAdDetected) console.log('[Spotify AdBlocker] Ad ended — unmuting...');
            video.muted = false;
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
        muteDuringAd();
    }

    document.addEventListener('DOMContentLoaded', () => {
        setInterval(() => {
            requestIdleCallback(runBlocker, { timeout: 200 });
        }, 1000);
    });
})();
