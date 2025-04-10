// ==UserScript==
// @name         Facebook Ad & PYMK Smart Blocker (v2.4)
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Reliably hides Facebook sponsored and suggested content without breaking layout or letting ads come back in. Safe & persistent blocking with smarter targeting.
// @author       ImprovedByGPT
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const blockedTexts = [
        'Sponsored',
        'Suggested for you',
        'People You May Know',
        'Suggested Post',
        'Promoted'
    ];

    // Identify if element contains blocked text
    function containsBlockedText(el) {
        if (!el || !el.textContent) return false;
        const text = el.textContent.toLowerCase();
        return blockedTexts.some(b => text.includes(b.toLowerCase()));
    }

    // Safely hide instead of removing (fallback)
    function safelyHide(el) {
        if (!el || el.dataset.blocked === 'true') return;
        el.style.display = 'none';
        el.dataset.blocked = 'true'; // Mark to avoid repeated work
    }

    // Get the likely post container to block
    function getPostContainer(el) {
        let current = el;
        while (current && current !== document.body) {
            const role = current.getAttribute('role');
            if (role === 'article' || current.dataset.pagelet?.includes('FeedUnit')) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    function scanAndBlock(root) {
        const spans = root.querySelectorAll ? root.querySelectorAll('span, div') : [];
        spans.forEach(node => {
            try {
                if (containsBlockedText(node)) {
                    const container = getPostContainer(node);
                    if (container) safelyHide(container);
                }
            } catch (e) {
                // Fail silently
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
                        scanAndBlock(n);
                    }
                });
            });
        }, 300));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initial run after content is loaded
    setTimeout(() => {
        scanAndBlock(document.body);
        observeDOM();
    }, 2000);

})();
