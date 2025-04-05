// ==UserScript==
// @name         Facebook Ad & PYMK Ultimate Blocker (v2.1)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook more reliably
// @author       obiyomida
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Utility: Check if element contains specific text (case-insensitive)
    function containsText(el, text) {
        return el.textContent && el.textContent.toLowerCase().includes(text.toLowerCase());
    }

    // Detect and remove unwanted sections
    function removeUnwanted() {
        const allDivs = document.querySelectorAll('div');

        allDivs.forEach(div => {
            try {
                if (
                    containsText(div, 'Sponsored') ||
                    containsText(div, 'Suggested for you') ||
                    containsText(div, 'People You May Know') ||
                    containsText(div, 'Suggested Post') ||
                    containsText(div, 'Promoted')
                ) {
                    // Optionally add a check for ad-like structure
                    if (div.offsetHeight > 0 && div.offsetWidth > 0) {
                        div.remove();
                    }
                }
            } catch (e) {
                // ignore errors
            }
        });
    }

    // Debounce utility to limit rapid calls
    function debounce(fn, delay) {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(fn, delay);
        };
    }

    // Initial run after DOM settles
    setTimeout(() => {
        removeUnwanted();

        const observer = new MutationObserver(debounce(() => {
            removeUnwanted();
        }, 300));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 2000); // wait 2s to let FB load initial content

})();
