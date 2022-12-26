// ==UserScript==
// @name         Re-enable Clipboard
// @namespace    https://github.com/mannylee
// @version      1.0
// @description  Take back clipboard control for sites that try to disable it
// @author       Manny Lee
// @match        */*
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var allowPaste = function(e){
        e.stopImmediatePropagation();
        return true;
    };
    document.addEventListener('paste', allowPaste, true);

})();