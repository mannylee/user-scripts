// ==UserScript==
// @name         TorrentGalaxy Improvements
// @namespace    https://github.com/mannylee
// @version      2024.06.11
// @description  Improvements to the TorrentGalaxy site
// @author       mannylee
// @match        https://torrentgalaxy.to/*
// @icon         https://torrentgalaxy.to/common/favicon/ms-icon-144x144.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==


let TGImprovements = {
    CONFIG: {
        clicked: false,
        count: 0,
        retries: 10,
        retryInterval: 800,
        log: []
    },
    initialise: ()=>{
        console.info(GM_info.script.name + " " + GM_info.script.version);
        TGImprovements.fixTableLinks();
    },

    fixTableLinks: ()=>{
        setInterval(()=>{
            if(!TGImprovements.CONFIG.clicked || TGImprovements.CONFIG.count > TGImprovements.CONFIG.retries){
                if($(".tgxtable > .tgxtablerow > .tgxtablecell.clickable-row.click.textshadow.rounded.txlight").length > 0){
                    TGImprovements.CONFIG.clicked = true;

                    // Disable page redirect on torrents page
                    $(".tgxtable > .tgxtablerow > .tgxtablecell.clickable-row.click.textshadow.rounded.txlight").off();
                    $(".tgxtable > .tgxtablerow > .tgxtablecell.clickable-row.click.textshadow.rounded.txlight > div > a").prop("target", "_blank");

                    TGImprovements.log("Found and applied table link fix to " + $(".tgxtable > .tgxtablerow > .tgxtablecell.clickable-row.click.textshadow.rounded.txlight").length + " rows in " + (TGImprovements.CONFIG.count+1) + " iteration(s)");
                }
                TGImprovements.CONFIG.count++;
            }
        }, TGImprovements.CONFIG.retryInterval);
    },
    log: (value)=>{
        TGImprovements.CONFIG.log.push(value);
    }
};

TGImprovements.initialise();
window.TGImprovements = TGImprovements;
