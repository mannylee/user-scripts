// ==UserScript==
// @name         YouTube Enhancements
// @namespace    https://gitlab.aws.dev/mannylee
// @version      2025-12-06
// @description  Provides enhancements for YouTube
// @author       mannylee
// @match        https://*.youtube.com/*
// @icon         https://www.youtube.com/s/desktop/31c2c151/img/favicon_144x144.png
// @run-at       document-idle
// @grant        unsafeWindow
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

var YouTubeEnhancements = {
    config: {
        defaultUiInterval: 500,
        defaultUiIntervalRetries: 10,
        observerCheckInterval: 2000
    },
    variables: {
        popupObserver: null,
        popupContainer: null
    },

    load: async () => {
        YouTubeEnhancements.consoleInfo(GM_info.script.version + " loaded!");

        // Track script load
        await YouTubeEnhancements.common.incrementMetric('scriptLoaded');

        // Start monitoring for the popup container
        YouTubeEnhancements.initializePopupMonitor();
    },

    initializePopupMonitor: () => {
        // Try to find the popup container
        YouTubeEnhancements.common.retryWithInterval(async () => {
            const popupContainer = document.querySelector('ytd-popup-container');
            if (popupContainer) {
                YouTubeEnhancements.variables.popupContainer = popupContainer;
                YouTubeEnhancements.consoleInfo("Found ytd-popup-container, setting up observer");
                await YouTubeEnhancements.common.incrementMetric('observerHooked');
                YouTubeEnhancements.setupPopupObserver(popupContainer);
                return true;
            }
            return false;
        }, YouTubeEnhancements.config.observerCheckInterval, 30).then(async () => {
            // If we exhausted retries without finding the container, track failure
            if (!YouTubeEnhancements.variables.popupContainer) {
                await YouTubeEnhancements.common.incrementMetric('observerFailed');
                YouTubeEnhancements.consoleInfo("Failed to find ytd-popup-container after retries");
            }
        });
    },

    setupPopupObserver: (popupContainer) => {
        // Create a MutationObserver to watch for changes in the popup container
        YouTubeEnhancements.variables.popupObserver = new MutationObserver((mutations) => {
            YouTubeEnhancements.checkForContinueWatchingPrompt();
        });

        // Start observing the popup container for changes
        YouTubeEnhancements.variables.popupObserver.observe(popupContainer, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });

        YouTubeEnhancements.consoleInfo("Popup observer initialized");
    },

    checkForContinueWatchingPrompt: () => {
        // First check if the dialog is actually visible
        const dialog = document.querySelector('tp-yt-paper-dialog[role="dialog"]');
        
        // Check if dialog exists and is visible (not display:none and not aria-hidden)
        if (!dialog || dialog.style.display === 'none' || dialog.getAttribute('aria-hidden') === 'true') {
            return;
        }

        // Look for the "Video paused. Continue watching?" text
        const textElements = document.querySelectorAll('yt-formatted-string.line-text');
        
        for (const element of textElements) {
            if (element.textContent.includes('Video paused. Continue watching?')) {
                YouTubeEnhancements.consoleInfo("Found 'Continue watching?' prompt, attempting to click Yes button");
                YouTubeEnhancements.clickYesButton();
                break;
            }
        }
    },

    clickYesButton: async () => {
        // Find the Yes button within the confirm dialog
        const yesButton = document.querySelector(
            'yt-confirm-dialog-renderer button.yt-spec-button-shape-next[aria-label="Yes"]'
        );

        if (yesButton) {
            YouTubeEnhancements.consoleInfo("Clicking Yes button");
            yesButton.click();
            await YouTubeEnhancements.common.incrementMetric('buttonClicked');
        } else {
            YouTubeEnhancements.consoleInfo("Yes button not found, retrying...");
            // Retry a few times in case the button hasn't rendered yet
            YouTubeEnhancements.common.retryWithInterval(async () => {
                const retryButton = document.querySelector(
                    'yt-confirm-dialog-renderer button.yt-spec-button-shape-next[aria-label="Yes"]'
                );
                if (retryButton) {
                    YouTubeEnhancements.consoleInfo("Clicking Yes button (retry)");
                    retryButton.click();
                    await YouTubeEnhancements.common.incrementMetric('buttonClicked');
                    return true;
                }
                return false;
            });
        }
    },

    common: {
        incrementMetric: async (metricName) => {
            const currentValue = await GM.getValue(metricName, 0);
            const newValue = currentValue + 1;
            await GM.setValue(metricName, newValue);
            YouTubeEnhancements.consoleInfo(`${metricName}: ${newValue}`);
        },

        getMetrics: async () => {
            return {
                scriptLoaded: await GM.getValue('scriptLoaded', 0),
                observerHooked: await GM.getValue('observerHooked', 0),
                observerFailed: await GM.getValue('observerFailed', 0),
                buttonClicked: await GM.getValue('buttonClicked', 0)
            };
        },

        retryWithInterval: (callback, interval = YouTubeEnhancements.config.defaultUiInterval, maxTries = YouTubeEnhancements.config.defaultUiIntervalRetries) => {
            return new Promise((resolve) => {
                let counter = 0;
                const intervalId = setInterval(async () => {
                    const shouldStop = await callback();
                    counter++;

                    if (shouldStop || counter === maxTries) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, interval);
            });
        }
    },

    consoleInfo: (message) => {
        console.info(GM_info.script.name + "\n" + message);
    }
};

unsafeWindow.YouTubeEnhancements = YouTubeEnhancements;
unsafeWindow.YouTubeEnhancements.load();
