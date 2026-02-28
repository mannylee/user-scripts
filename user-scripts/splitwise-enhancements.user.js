// ==UserScript==
// @name         Splitwise Enhancements
// @namespace    https://github.com/mannylee
// @version      2026-02-28
// @description  Enhancements to the Splitwise site
// @author       mannylee
// @match        https://secure.splitwise.com/*
// @icon         https://secure.splitwise.com/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==


let SplitwiseEnhancements = {
    mutationObserverTargetNode: document.getElementsByTagName('body')[0],
    mutationObserverConfig: { attributes: true, childList: true, subtree: true },

    load: ()=>{
        SplitwiseEnhancements.log(" v" + GM_info.script.version);

        // Redirect links fixer
        SplitwiseEnhancements.handleNagModal.start();
    },

    handleNagModal: {
        start: ()=>{

            SplitwiseEnhancements.handleNagModal.mutationObserverCallback();

            // Create an observer instance linked to the callback function
            const observer = new MutationObserver(SplitwiseEnhancements.handleNagModal.mutationObserverCallback);

            // Start observing the target node for configured mutations
            observer.observe(SplitwiseEnhancements.mutationObserverTargetNode, SplitwiseEnhancements.mutationObserverConfig);
        },

        mutationObserverCallback: (mutationList, observer) => {

            if(document.querySelectorAll("body.modal-open > div#fullscreen_ad.modal.fade.in").length > 0){
                //modal showing
                window.parent.postMessage('dismiss_nagwall', '*');

                SplitwiseEnhancements.log("Dismissed nag modal");
            }
        }
    },
    log: (value)=>{
        console.info(GM_info.script.name + ": " + value);
    }
};

SplitwiseEnhancements.load();
window.SplitwiseEnhancements = SplitwiseEnhancements;
