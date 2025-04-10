// ==UserScript==
// @name         Facebook Ad & PYMK Smart Remover (v2.5)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Reliably removes Facebook Sponsored/PYMK/Suggested content without breaking layout. Clean, safe, and customizable with smart post detection and performance tweaks.
// @author       obiyomida
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // === Block Configuration ===
    const blockedTexts = [
        'Sponsored',
        'Suggested for you',
        'People You May Know',
        'Suggested Post',
        'Promoted'
    ];

    const SCAN_DELAY = 300;
    const INITIAL_DELAY = 2000;

    // === Helpers ===

    // Checks if the element or its text includes blocked phrases
    function containsBlockedText(el) {
        if (!el || !el.textContent) return false;
        const text = el.textContent.toLowerCase();
        return blockedTexts.some(b => text.includes(b.toLowerCase()));
    }

    // Determines if a node is a valid container for removal (post/suggestion block)
    function getRemovableContainer(el) {
        let node = el;
        while (node && node !== document.body) {
            const role = node.getAttribute('role');
            const isPost = role === 'article' || node.dataset.pagelet?.includes('FeedUnit');
            const isCard = node.classList?.contains('x1lliihq'); // FB card container class (subject to change)

            if (isPost || isCard) {
                const isSafe = node.offsetHeight < 1200 && node.offsetWidth < 1200;
                if (isSafe) return node;
            }

            // Prevent removing core containers
            if (node.tagName === 'MAIN' || node.id?.startsWith('mount_')) break;

            node = node.parentElement;
        }
        return null;
    }

    // Scans and removes any matched element
    function scanAndRemove(root) {
        const nodes = root.querySelectorAll ? root.querySelectorAll('span, div') : [];
        if (root.nodeType === 1) checkAndRemove(root); // also check root itself
        nodes.forEach(checkAndRemove);
    }

    // Core removal logic
    function checkAndRemove(node) {
        try {
            if (containsBlockedText(node)) {
                const container = getRemovableContainer(node);
                if (container && !container.dataset.cleaned) {
                    container.remove();
                }
            }
        } catch (e) {
            // Silent fail
        }
    }

    // Debounce for mutation observer
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Observe DOM changes and scan additions
    function observeDOM() {
        const observer = new MutationObserver(debounce((mutations) => {
            mutations.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (n.nodeType === 1) {
                        scanAndRemove(n);
                    }
                });
            });
        }, SCAN_DELAY));

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start up after initial FB content loads
    setTimeout(() => {
        scanAndRemove(document.body);
        observeDOM();
    }, INITIAL_DELAY);
})();
