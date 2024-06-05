// ==UserScript==
// @name         Cathay Pacific Scroll Fixer
// @namespace    https://github.com/mannylee
// @version      2024.06.05
// @description  Fix forms on the Cathay Pacific site
// @author       1con1c
// @match        https://www.cathaypacific.com/*
// @icon         https://github.githubassets.com/favicons/favicon-dark.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==



console.log(GM_info.script.name);
document.querySelector("html").style.overflowY = "unset"
document.querySelector("html").style.overflow = "auto"
document.querySelector("body").style.overflow = "auto"
document.querySelector("body").style.height = "100vh"
