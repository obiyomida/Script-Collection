// ==UserScript==
// @name         Facebook Cleaner Pro - Aggressive Smart Mode (v4.1)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Aggressively removes sponsored, suggested, and video junk on Facebook while keeping main page intact. Uses smart filters to avoid layout breakage. Safe + strong cleaning mode.
// @author       obiyomida
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const BLOCK_LABELS = [
        'Sponsored',
        'Suggested for you',
        'People You May Know',
        'Suggested Post',
        'Promoted',
        'Reels and short videos',
        'Watch',
        'Live',
        'Live videos',
        'Shorts',
        'More videos'
    ];

    const PROTECTED_IDS = ['mount_', 'pagelet_dock', 'pagelet_bluebar']; // main app root or header bars
    const PROTECTED_ROLES = ['main', 'navigation', 'banner'];

    function containsBlockedText(node) {
        if (!node || !node.textContent) return false;
        const text = node.textContent.toLowerCase();
        return BLOCK_LABELS.some(label => text.includes(label.toLowerCase()));
    }

    function isProtected(node) {
        if (!node) return true;
        const tag = node.tagName?.toLowerCase();
        const id = (node.id || '').toLowerCase();
        const role = (node.getAttribute?.('role') || '').toLowerCase();

        return (
            tag === 'body' ||
            tag === 'html' ||
            PROTECTED_IDS.some(p => id.startsWith(p)) ||
            PROTECTED_ROLES.includes(role)
        );
    }

    function findRemovableParent(node) {
        let current = node;
        for (let i = 0; i < 10; i++) {
            if (!current || current === document.body || isProtected(current)) break;

            const role = current.getAttribute?.('role') || '';
            const data = current.dataset || {};
            const pagelet = data.pagelet || '';

            const isPostLike =
                role === 'article' ||
                pagelet.includes('FeedUnit') ||
                pagelet.includes('Reels') ||
                pagelet.includes('Watch');

            if (isPostLike && !isProtected(current)) return current;

            current = current.parentElement;
        }
        return null;
    }

    function removeBlockedContent(root) {
        const nodes = root.querySelectorAll ? root.querySelectorAll('span, div, section') : [];
        if (root.nodeType === 1) scanNode(root);
        nodes.forEach(scanNode);
    }

    function scanNode(node) {
        try {
            if (containsBlockedText(node)) {
                const target = findRemovableParent(node);
                if (target && !isProtected(target)) {
                    target.remove();
                }
            }
        } catch (e) {
            // Skip errors silently
        }
    }

    function observeDOM() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (n.nodeType === 1) removeBlockedContent(n);
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function autoSweep() {
        setInterval(() => {
            removeBlockedContent(document.body);
        }, 1000); // runs every second
    }

    setTimeout(() => {
        removeBlockedContent(document.body);
        observeDOM();
        autoSweep();
    }, 1500);

})();
