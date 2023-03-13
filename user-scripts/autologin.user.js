// ==UserScript==
// @name         Autologin
// @namespace    https://github.com/mannylee
// @version      2023.03.13
// @description  Autologin to certain sites
// @author       1con1c
// @match        https://my.allianzcare.com/myhealth/1/login
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// @run-at       document-start
// ==/UserScript==



(function() {
    'use strict';

    let CONFIG = {
        clicked: false,
        count: 0,
        retries: 10,
        retryInterval: 800
    };

    let SITES = {
        allianz: {
            regex: /^https:\/\/my.allianzcare.com\/myhealth\/1\/login/i,
            clickId: 'loginButton'
        }
    };


    // Check list of websites for match
    Object.keys(SITES).forEach(key=>{

        if(SITES[key].regex.test(window.location.href)){
            if(SITES[key].hasOwnProperty('customFunction')){
               SITES[key].customFunction();
            } else {
                setInterval(()=>{
                    if(document.getElementById(SITES[key].clickId) !== null && !CONFIG.clicked){
                        document.getElementById(SITES[key].clickId).click();
                        CONFIG.clicked = true;
                        console.log("clicked");
                    }
                }, CONFIG.retryInterval);
            }
        }
    });


})();