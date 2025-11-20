// === Spotify AdBlocker v5.0 - WORKING VERSION ===
// Simplified and effective ad blocking

(function () {
    'use strict';
    
    let isEnabled = true;
    let isMuted = false;
    let checkInterval = null;
    let savedVolume = 50;

    // Load settings
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['spotifyAdBlockerEnabled'], (result) => {
            isEnabled = result.spotifyAdBlockerEnabled !== false;
            console.log('[Niblie Spotify] v5.0:', isEnabled ? 'ACTIVE' : 'OFF');
        });

        chrome.storage.onChanged.addListener((changes) => {
            if (changes.spotifyAdBlockerEnabled) {
                isEnabled = changes.spotifyAdBlockerEnabled.newValue !== false;
                if (isEnabled) {
                    startBlocker();
                } else {
                    stopBlocker();
                }
            }
        });
    }

    function isAd() {
        try {
            // Primary detection: Skip button disabled = AD
            const skipBtn = document.querySelector('button[data-testid="control-button-skip-forward"]');
            if (!skipBtn || !skipBtn.hasAttribute('disabled')) {
                return false; // Not an ad if skip is available
            }

            // Secondary check: Progress bar disabled
            const progressBar = document.querySelector('[data-testid="playback-progressbar"]');
            if (progressBar && progressBar.getAttribute('aria-disabled') === 'true') {
                return true; // Skip disabled + seekbar disabled = AD
            }

            // Tertiary check: No artist/track links
            const hasLinks = document.querySelector('[data-testid="context-item-info-artist"] a') || 
                           document.querySelector('[data-testid="context-item-info-title"] a');
            if (!hasLinks) {
                return true; // Skip disabled + no links = AD
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    function handleAudioDuringAd() {
        if (!isEnabled) return;
        
        try {
            const currentAdState = isAdPlaying();

            if (currentAdState && !lastAdState) {
                // Ad just started
                console.log('[Niblie Spotify] 🚫 AD DETECTED - BLOCKING NOW!');
                consecutiveAdChecks = 0;
                muteAudio();
                skipAd();
                removeBannerAds();
            } else if (!currentAdState && lastAdState) {
                // Ad ended - restore normal playback
                console.log('[Niblie Spotify] ✅ Ad ended - Restoring playback');
                unmuteAudio();
                consecutiveAdChecks = 0;
                
                // Reset playback speed in case it was modified
                const audio = document.querySelector('audio');
                if (audio) {
                    try {
                        audio.playbackRate = 1.0;
                    } catch (e) {}
                }
            } else if (currentAdState) {
                // Still in ad - only skip if we've confirmed it multiple times
                consecutiveAdChecks++;
                if (consecutiveAdChecks <= 3) {
                    // Only attempt to skip in first 3 checks (1.5 seconds)
                    skipAd();
                }
                // Keep muted but don't spam skip attempts
                muteAudio();
            }

            lastAdState = currentAdState;
        } catch (error) {
            // Silently fail
        }
    }

    function muteViaUI() {
        if (isMuted) return;
        
        try {
            // Save current volume from slider
            const volumeSlider = document.querySelector('input[data-testid="volume-bar-slider"]');
            if (volumeSlider && volumeSlider.value) {
                savedVolume = parseInt(volumeSlider.value);
            }

            // Set volume to 0 via slider (THIS WORKS)
            if (volumeSlider) {
                volumeSlider.value = '0';
                volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
            }

            isMuted = true;
            console.log('[Niblie] AD MUTED');
        } catch (e) {}
    }

    function unmuteViaUI() {
        if (!isMuted) return;
        
        try {
            // Restore volume via slider
            const volumeSlider = document.querySelector('input[data-testid="volume-bar-slider"]');
            if (volumeSlider) {
                volumeSlider.value = String(savedVolume);
                volumeSlider.dispatchEvent(new Event('input', { bubbles: true }));
                volumeSlider.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Reset playback speed
            const audio = document.querySelector('audio');
            if (audio) {
                try { audio.playbackRate = 1.0; } catch (e) {}
            }

            isMuted = false;
            console.log('[Niblie] AD ENDED - Restored');
        } catch (e) {}
    }

    function blockAd() {
        try {
            const audio = document.querySelector('audio');
            if (!audio) return;

            // Mute first
            muteViaUI();

            // Speed up to 16x
            try {
                audio.playbackRate = 16.0;
            } catch (e) {}

            // Jump near end
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                try {
                    audio.currentTime = Math.max(0, audio.duration - 0.3);
                } catch (e) {}
            }
        } catch (e) {}
    }

    function checkAndBlock() {
        if (!isEnabled) return;

        const adDetected = isAd();

        if (adDetected && !isMuted) {
            console.log('[Niblie] AD DETECTED - BLOCKING');
            blockAd();
        } else if (!adDetected && isMuted) {
            unmuteViaUI();
        } else if (adDetected && isMuted) {
            // Keep blocking
            blockAd();
        }

        // Remove banner ads
        try {
            const banners = document.querySelectorAll('aside[aria-label*="dvertisement"], [data-testid*="ad"]');
            banners.forEach(el => {
                if (el.style.display !== 'none') el.style.display = 'none';
            });
        } catch (e) {}
    }

    function startBlocker() {
        if (checkInterval) return;
        checkInterval = setInterval(checkAndBlock, 500);
        console.log('[Niblie Spotify] v5.0 STARTED');
    }

    function stopBlocker() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        unmuteViaUI();
        console.log('[Niblie Spotify] STOPPED');
    }

    // Auto-start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startBlocker, 2000);
        });
    } else {
        setTimeout(startBlocker, 2000);
    }

    // Cleanup
    window.addEventListener('beforeunload', stopBlocker);
})();
