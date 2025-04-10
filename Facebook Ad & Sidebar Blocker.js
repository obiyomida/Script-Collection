// ==UserScript==
// @name         Facebook Ad & PYMK Smart Cleaner (v2.5)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Fully removes Sponsored/PYMK/Suggested content from Facebook without breaking the homepage. Includes QOL improvements and efficient scanning.
// @author       obiyomida
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // === Config ===
    const DEBUG = false; // Set to true to see logs in console
    const blockedTexts = [
        'Sponsored',
        'Suggested for you',
        'People You May Know',
        'Suggested Post',
        'Promoted'
    ];

    // === Utilities ===
    function log(...args) {
        if (DEBUG) console.log('[FB Blocker]', ...args);
    }

    function containsBlockedText(el) {
        if (!el || !el.textContent) return false;
        const text = el.textContent.toLowerCase();
        return blockedTexts.some(keyword => text.includes(keyword.toLowerCase()));
    }

    function isPostContainer(el) {
        const role = el.getAttribute?.('role') || '';
        const pagelet = el.dataset?.pagelet || '';
        return role === 'article' || pagelet.includes('FeedUnit');
    }

    function isSafeToRemove(el) {
        const tag = el.tagName?.toLowerCase();
        const id = el.id?.toLowerCase() || '';
        const isBigContainer = el.offsetHeight > 1200 && el.offsetWidth > 1200;
        const isRoot = id.startsWith('mount_') || tag === 'main' || tag === 'html' || tag === 'body';
        return !isBigContainer && !isRoot;
    }

    function findRemovableContainer(el) {
        let current = el;
        for (let i = 0; i < 10; i++) { // don't climb too far
            if (!current || current === document.body) break;
            if (isPostContainer(current) && isSafeToRemove(current)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    function removeUnwantedContent(root) {
        const spans = root.querySelectorAll ? root.querySelectorAll('span, div') : [];

        spans.forEach(node => {
            try {
                if (containsBlockedText(node)) {
                    const target = findRemovableContainer(node);
                    if (target) {
                        log('Removed blocked content:', target);
                        target.remove();
                    }
                }
            } catch (e) {
                log('Error during scan:', e);
            }
        });
    }

    const debounce = (fn, delay) => {
        let timeout;
        return function () {
            clearTimeout(timeout);
            timeout = setTimeout(fn, delay);
        };
    };

    function observeDOM() {
        const observer = new MutationObserver(debounce((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (n.nodeType === 1) {
                        removeUnwantedContent(n);
                    }
                });
            });
        }, 200));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function initialCleanup() {
        removeUnwantedContent(document.body);
    }

    // === Init ===
    setTimeout(() => {
        initialCleanup();
        observeDOM();
        log('Facebook Ad/PYMK Smart Cleaner initialized.');
    }, 2000); // wait for initial render to stabilize

})();
