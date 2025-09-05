// ==UserScript==
// @name         Amazon URL Cleanser
// @namespace    https://gitlab.aws.dev/mannylee
// @version      2025-09-05
// @description  Clean Amazon listing URLs
// @author       mannylee
// @match        https://www.amazon.com/*
// @match        https://www.amazon.ca/*
// @match        https://www.amazon.com.mx/*
// @match        https://www.amazon.com.br/*
// @match        https://www.amazon.de/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.it/*
// @match        https://www.amazon.es/*
// @match        https://www.amazon.pl/*
// @match        https://www.amazon.nl/*
// @match        https://www.amazon.se/*
// @match        https://www.amazon.ae/*
// @match        https://www.amazon.sa/*
// @match        https://www.amazon.com.au/*
// @match        https://www.amazon.co.jp/*
// @match        https://www.amazon.sg/*
// @match        https://www.amazon.com.tr/*
// @match        https://www.amazon.in/*
// @match        https://www.amazon.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM.xmlHttpRequest
// ==/UserScript==

var AmazonUrlCleanser = {
    config: {
        dpPattern: /\/dp\/[A-Z0-9]+(?:[/?]|$)/i
    },
    variables: {
    },

    load: ()=>{
        AmazonUrlCleanser.consoleInfo(GM_info.script.version + " loaded!");

        // Check for redirection to new spoofed URLs
        AmazonUrlCleanser.cleanUrl();
    },

    cleanUrl: ()=>{
        // Regular expression to match /dp/{product-id} followed by either / or ? or end of string

        const match = window.location.href.match(AmazonUrlCleanser.config.dpPattern);
        if (match) {
            // Get the index where the pattern starts
            const startIndex = window.location.href.indexOf(match[0]);
            // Get just the /dp/XXXXX part without the trailing / or ?
            const productIdPart = match[0].replace(/[/?]$/, '');


            let newUrl = window.location.href.substring(0, startIndex) + productIdPart;
            AmazonUrlCleanser.consoleInfo("Replacing url:\nOld: " + window.location.href + "\nNew: " + newUrl);
            window.history.replaceState({}, '', newUrl);
        }
    },
    common: {

        retryWithInterval: (callback, interval = AmazonUrlCleanser.config.defaultUiInterval, maxTries = AmazonUrlCleanser.config.defaultUiIntervalRetries)=>{
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


    consoleInfo: (message)=>{
        console.info(GM_info.script.name + "\n" + message);
    }
};
unsafeWindow.AmazonUrlCleanser = AmazonUrlCleanser;
unsafeWindow.AmazonUrlCleanser.load();
