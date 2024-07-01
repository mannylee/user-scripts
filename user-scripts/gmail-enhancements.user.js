// ==UserScript==
// @name         Gmail Enhancements
// @namespace    https://github.com/mannylee
// @version      2024.07.01
// @description  Enhancements to the Gmail site
// @author       1con1c
// @match        https://*.mail.google.com/*
// @icon         https://www.google.com/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==


let GmailEnhancements = {
    mutationObserverTargetNode: document.getElementsByTagName('body')[0],
    mutationObserverConfig: { attributes: true, childList: true, subtree: true },

    load: ()=>{
        GmailEnhancements.log(" v" + GM_info.script.version);

        // Redirect links fixer
        GmailEnhancements.monitorRedirectLinks.start();
    },

    monitorRedirectLinks: {
        start: ()=>{

            GmailEnhancements.monitorRedirectLinks.mutationObserverCallback();

            // Create an observer instance linked to the callback function
            const observer = new MutationObserver(GmailEnhancements.monitorRedirectLinks.mutationObserverCallback);

            // Start observing the target node for configured mutations
            observer.observe(GmailEnhancements.mutationObserverTargetNode, GmailEnhancements.mutationObserverConfig);
        },

        mutationObserverCallback: (mutationList, observer) => {
            document.querySelectorAll("a[data-saferedirecturl]").forEach((link)=>{
                GmailEnhancements.log(link.dataset.saferedirecturl);
                link.removeAttribute("data-saferedirecturl");
                link.classList.add(GM_info.script.name);
            });
        }
    },
    log: (value)=>{
        console.info(GM_info.script.name + ": " + value);
    }
};

GmailEnhancements.load();
window.GmailEnhancements = GmailEnhancements;
