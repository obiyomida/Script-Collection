// ==UserScript==
// @name         Facebook Ad & PYMK Ultimate Blocker (v2.2)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook more reliably and efficiently
// @author       obiyomida
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // List of keywords to block
    const blockedTexts = [
        'Sponsored',
        'Suggested for you',
        'People You May Know',
        'Suggested Post',
        'Promoted'
    ];

    // Utility: Check if element contains any blocked keyword (case-insensitive)
    function containsBlockedText(el) {
        return blockedTexts.some(text =>
            el.textContent && el.textContent.toLowerCase().includes(text.toLowerCase())
        );
    }

    // Scan and remove unwanted content within a given root
    function scanAndRemove(root) {
        const divs = root.querySelectorAll ? root.querySelectorAll('div') : [];
        if (root.tagName === 'DIV') {
            // Include root if it's a <div>
            scanDiv(root);
        }

        divs.forEach(scanDiv);
    }

    function scanDiv(div) {
        try {
            if (containsBlockedText(div)) {
                if (div.offsetHeight > 0 && div.offsetWidth > 0) {
                    // Uncomment the line below to debug
                    // console.log('Removed unwanted element:', div);
                    div.remove();
                }
            }
        } catch (e) {
            // Ignore errors gracefully
        }
    }

    // Debounce utility to reduce frequency of mutation callbacks
    function debounce(fn, delay) {
        let timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(fn, delay);
        };
    }

    // Schedule scan using idle time if supported
    function scheduleRemoveUnwanted() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => scanAndRemove(document.body), { timeout: 300 });
        } else {
            setTimeout(() => scanAndRemove(document.body), 300);
        }
    }

    // Start observing after DOM loads
    setTimeout(() => {
        scheduleRemoveUnwanted();

        const observer = new MutationObserver(debounce((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        scanAndRemove(node);
                    }
                });
            });
        }, 300));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 2000);

})();
