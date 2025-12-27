// ==UserScript==
// @name         Amazon Privacy
// @namespace    https://gitlab.aws.dev/mannylee
// @version      2025-12-27
// @description  Clean and privacy‑enhance Amazon URLs and page content.
// @author       mannylee
// @match        https://www.amazon.ae/*
// @match        https://www.amazon.ca/*
// @match        https://www.amazon.cn/*
// @match        https://www.amazon.co.jp/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.com/*
// @match        https://www.amazon.com.au/*
// @match        https://www.amazon.com.be/*
// @match        https://www.amazon.com.br/*
// @match        https://www.amazon.com.co/*
// @match        https://www.amazon.com.mx/*
// @match        https://www.amazon.com.tr/*
// @match        https://www.amazon.de/*
// @match        https://www.amazon.eg/*
// @match        https://www.amazon.es/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.in/*
// @match        https://www.amazon.it/*
// @match        https://www.amazon.nl/*
// @match        https://www.amazon.pl/*
// @match        https://www.amazon.sa/*
// @match        https://www.amazon.se/*
// @match        https://www.amazon.sg/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

var AmazonPrivacy = {
    config: {
        dpPattern: /\/dp\/[A-Z0-9]+(?:[/?]|$)/i
    },
    variables: {},

    load: () => {
        try {
            AmazonPrivacy.consoleInfo(GM_info.script.version + " loaded!");

            // Initial cleanup
            AmazonPrivacy.cleanUrl();
            AmazonPrivacy.cleanAllLinks();
            AmazonPrivacy.removeCookieBanner();
            AmazonPrivacy.removeSponsoredContent();

            // Observe dynamic changes
            AmazonPrivacy.observePageChanges();
        } catch (e) {
            console.error('AmazonPrivacy.load error:', e);
        }
    },

    removeCookieBanner: () => {
        const els = document.querySelectorAll('form#cos-banner');
        if (els.length > 0) {
            els.forEach(el => el.remove());
            AmazonPrivacy.common.incrementCounter('sponsoredProductsRemoved', els.length);
        }
    },

    removeSponsoredContent: () => {
        const els = document.querySelectorAll('div[id^="sp_detail"]');
        let removed = 0;
        els.forEach(el => {
            const parent = el.closest(
                'div.celwidget[id^="sims-simsContainer_feature_div_"], div.celwidget[id^="sims-sponsoredProducts"]'
            );
            if (parent) {
                parent.remove();
                removed++;
            }
        });
        if (removed > 0) {
            AmazonPrivacy.common.incrementCounter('sponsoredProductsRemoved', removed);
        }
    },

    cleanUrl: () => {
        const match = window.location.href.match(AmazonPrivacy.config.dpPattern);
        if (match) {
            const startIndex = window.location.href.indexOf(match[0]);
            const productIdPart = match[0].replace(/[/?]$/, '');
            const newUrl = window.location.href.substring(0, startIndex) + productIdPart;

            if (newUrl !== window.location.href) {
                AmazonPrivacy.consoleInfo("Replacing url:\nOld: " + window.location.href + "\nNew: " + newUrl);
                window.history.replaceState({}, '', newUrl);
                AmazonPrivacy.common.incrementCounter('urlsCleaned', 1);
            }
        }
    },

    cleanLinkElement: (a) => {
        if (!(a instanceof HTMLAnchorElement)) return;
        if (a.classList.contains("clean-url")) return;
        if (!a.hasAttribute("href")) return;

        const href = a.getAttribute("href");
        const match = href.match(AmazonPrivacy.config.dpPattern);
        if (!match) return;

        const productIdPart = match[0].replace(/[/?]$/, '');
        const startIndex = href.indexOf(match[0]);
        const newHref = href.substring(0, startIndex) + productIdPart;

        if (newHref !== href) {
            a.setAttribute("href", newHref);
            AmazonPrivacy.common.incrementCounter('aLinksCleaned', 1);
        }

        a.classList.add("clean-url");
    },

    cleanAllLinks: () => {
        const links = document.querySelectorAll(
            'a[href*="/dp/"]:not(.clean-url):not([href^="http"]):not([href^="#"])'
        );
        links.forEach(AmazonPrivacy.cleanLinkElement);
    },

    observePageChanges: () => {
        const observer = new MutationObserver(() => {
            try {
                AmazonPrivacy.cleanAllLinks();
                AmazonPrivacy.removeCookieBanner();
                AmazonPrivacy.removeSponsoredContent();
            } catch (e) {
                console.error('AmazonPrivacy.observePageChanges callback error:', e);
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        AmazonPrivacy.variables.linkObserver = observer;
    },

    common: {
        defaultCounters: {
            sponsoredProductsRemoved: 0,
            aLinksCleaned: 0,
            urlsCleaned: 0
        },

        getCounters: () => {
            const counters = {};
            const defs = AmazonPrivacy.common.defaultCounters;
            for (const key in defs) {
                if (Object.prototype.hasOwnProperty.call(defs, key)) {
                    counters[key] = GM_getValue(key, defs[key]);
                }
            }
            return counters;
        },

        saveCounters: (counters) => {
            for (const key in counters) {
                if (Object.prototype.hasOwnProperty.call(counters, key)) {
                    GM_setValue(key, counters[key]);
                }
            }
        },

        incrementCounter: (key, amount = 1) => {
            try {
                const current = GM_getValue(key, 0);
                const updated = current + Number(amount);
                GM_setValue(key, updated);
                // console.info(`Counter updated: ${key} +${amount} → ${updated}`);
            } catch (e) {
                console.error('incrementCounter error for key', key, e);
            }
        },

        retryWithInterval: (callback, interval = 500, maxTries = 10) => {
            return new Promise((resolve) => {
                let counter = 0;
                const intervalId = setInterval(() => {
                    const shouldStop = callback();
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

unsafeWindow.AmazonPrivacy = AmazonPrivacy;
AmazonPrivacy.load();
