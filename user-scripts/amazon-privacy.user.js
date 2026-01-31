// ==UserScript==
// @name         Amazon Privacy
// @namespace    https://gitlab.aws.dev/mannylee
// @version      2026-01-31
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
        // URL is a "Send to Kindle email" page
        const kindleUrl = AmazonPrivacy.common.extractSendToKindleFromLocation();
        if (kindleUrl && kindleUrl !== window.location.href) {
            AmazonPrivacy.consoleInfo(
                "Redirecting Send-to-Kindle email URL:\n" +
                window.location.href + "\n→ " + kindleUrl
            );

            window.location.replace(kindleUrl);
            AmazonPrivacy.common.incrementCounter('urlsCleaned', 1);
            return;
        }

        // URL location is a product dp page
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
        if (!(a instanceof HTMLAnchorElement) || a.classList.contains("clean-url") || !a.hasAttribute("href")){
            a.classList.add("clean-url");
            return;
        }

        const href = a.getAttribute("href");
        let newHref = href;

        // 1. Handle /dp/ product links (your existing logic, fixed)
        const dpMatch = href.match(/\/dp\/[A-Z0-9]+(?:[/?]|$)/i);
        if (dpMatch) {
            const productIdPart = dpMatch[0].replace(/[/?]$/, '');
            const startIndex = href.indexOf(dpMatch[0]);
            newHref = href.substring(0, startIndex) + productIdPart;
        }
        // 2. Handle query string tracking params (search/category/deals)
        else if (href.includes('?')) {
            newHref = AmazonPrivacy.common.cleanQueryString(href);
        }

        if (newHref !== href) {
            a.setAttribute("href", newHref);
            Object.defineProperty(a, 'href', {
                writable: false
            });

            AmazonPrivacy.common.incrementCounter('aLinksCleaned', 1);
        }

        a.classList.add("clean-url");
    },

    cleanAllLinks: () => {
        // Broader selector: ALL links with query strings OR /dp/
        const links = document.querySelectorAll(`a[href*="/dp/"]:not(.clean-url),
a[href*="?"]:not(.clean-url),
a[href*="/s/"]:not(.clean-url),
a[href*="/alm/"]:not(.clean-url),
a[href*="/b/"]:not(.clean-url),
a[href*="/gp/goldbox"]:not(.clean-url)
`);


        links.forEach(AmazonPrivacy.cleanLinkElement);
    },


    observePageChanges: () => {
        const observer = new MutationObserver(() => {
            try {
                AmazonPrivacy.cleanAllLinks();
                AmazonPrivacy.removeCookieBanner();
                AmazonPrivacy.removeSponsoredContent();
                AmazonPrivacy.cleanUrl();
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
        extractSendToKindleFromLocation: () => {
            try {
                const url = new URL(window.location.href);

                if (url.pathname !== '/gp/f.html') return null;

                const encodedU = url.searchParams.get('U');
                if (!encodedU) return null;

                const decodedU = decodeURIComponent(encodedU);

                if (!decodedU.includes('/sendtokindle/verification/confirm/')) {
                    return null;
                }

                const cleanUrl = new URL(decodedU);
                return cleanUrl.origin + cleanUrl.pathname;
            } catch (e) {
                return null;
            }
        },

        cleanQueryString: (url) => {
            let urlObj;
            try {
                urlObj = new URL(url);
            } catch (e) {
                const baseDomain = window.location.href;
                urlObj = new URL(url, baseDomain);
            }

            const trackingParams = [
                '_encoding', 'bbn', 'content-id', 'crid', 'dc', 'pd_rd_r',
                'pd_rd_w', 'pd_rd_wg', 'pf_rd_i', 'pf_rd_m', 'pf_rd_p',
                'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'qid', 'ref', 'ref_',
                'rnid', 'sprefix', 'utm_medium', 'utm_source'
            ];

            // Clean query params
            const params = new URLSearchParams(urlObj.search);
            for (const param of trackingParams) {
                if (param !== 'bubble-id') {
                    params.delete(param);
                }
            }
            urlObj.search = params.toString();

            // Clean path tracking (remove /ref=... segments)
            let pathname = urlObj.pathname;
            const refIndex = pathname.indexOf('/ref=');
            if (refIndex !== -1) {
                pathname = pathname.slice(0, refIndex);
            }
            urlObj.pathname = pathname;

            // FIXED: Return full URL - urlObj.search already has ? if needed
            return urlObj.origin + urlObj.pathname + urlObj.search;
        },

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
