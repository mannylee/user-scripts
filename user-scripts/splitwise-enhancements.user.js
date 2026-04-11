// ==UserScript==
// @name         Splitwise Enhancements
// @namespace    https://github.com/mannylee
// @version      2026-04-12
// @description  Enhancements to the Splitwise site
// @author       mannylee
// @match        https://secure.splitwise.com/*
// @icon         https://secure.splitwise.com/favicon.ico
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

let SplitwiseEnhancements = {
    mutationObserverTargetNode: document.getElementsByTagName('body')[0],
    mutationObserverConfig: { attributes: true, childList: true, subtree: true },
    /*
     * Splitwise Category IDs Reference:
     *
     * Entertainment (19)
     *   20 Games, 21 Movies, 22 Music, 23 Other, 24 Sports
     * Food and drink (25)
     *   13 Dining out, 12 Groceries, 38 Liquor, 26 Other
     * Home (27)
     *   39 Electronics, 16 Furniture, 14 Household supplies,
     *   17 Maintenance, 4 Mortgage, 28 Other, 29 Pets, 3 Rent, 30 Services
     * Life (40)
     *   50 Childcare, 41 Clothing, 49 Education, 42 Gifts,
     *   10 Insurance, 43 Medical expenses, 44 Other, 45 Taxes
     * Transportation (31)
     *   46 Bicycle, 32 Bus/train, 15 Car, 33 Gas/fuel, 47 Hotel,
     *   34 Other, 9 Parking, 35 Plane, 36 Taxi
     * Uncategorized (2)
     *   18 General
     * Utilities (1)
     *   48 Cleaning, 5 Electricity, 6 Heat/gas, 11 Other,
     *   37 Trash, 8 TV/Phone/Internet, 7 Water
     */
    customCategoryMap: {
        "^grab$": 36,          // Taxi
        "^gojek$": 36,         // Taxi
        "^tada$": 36,          // Taxi
        "^rud(\\b|$)": 23,     // Entertainment > Other (RUD, RUD Medini, RUD <location>)
        "^go[- ]?kart(ing)?$": 23, // Entertainment > Other
    },

    load: ()=>{
        SplitwiseEnhancements.log(" v" + GM_info.script.version);

        SplitwiseEnhancements.handleNagModal.start();
        SplitwiseEnhancements.patchGuessCategory();
    },

    patchGuessCategory: () => {
        // Splitwise's Backbone model captures a direct reference to guess_category
        // at class definition time (guessCategoryFromDescription: guess_category),
        // so we must patch the prototype method, not the global function.
        const proto = App.Models.Expense.prototype;

        if (typeof proto.guessCategoryFromDescription !== 'function') {
            SplitwiseEnhancements.log("WARNING: guessCategoryFromDescription not found on Expense prototype, skipping patch");
            return;
        }

        const _original = proto.guessCategoryFromDescription;
        proto.guessCategoryFromDescription = function(description) {
            if (description != null) {
                const lower = description.toLowerCase();
                for (const [pattern, categoryId] of Object.entries(SplitwiseEnhancements.customCategoryMap)) {
                    if (new RegExp(pattern).test(lower)) {
                        return categoryId;
                    }
                }
            }
            return _original.call(this, description);
        };

        SplitwiseEnhancements.log("Patched guessCategoryFromDescription with " + Object.keys(SplitwiseEnhancements.customCategoryMap).length + " custom mapping(s)");
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
