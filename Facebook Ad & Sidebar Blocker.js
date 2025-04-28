// ==UserScript==
// @name         Clean Facebook
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Facebook Sponsor Block
// @author       ImprovedByGPT
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

    const PROTECTED_IDS = ['mount_', 'pagelet_dock', 'pagelet_bluebar'];
    const PROTECTED_ROLES = ['main', 'navigation', 'banner'];

    function reconstructText(node) {
        let text = '';
        function walker(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                text += n.textContent.trim();
            }
            n.childNodes.forEach(walker);
        }
        walker(node);
        return text.toLowerCase();
    }

    function containsBlockedText(node) {
        if (!node) return false;
        const text = reconstructText(node);
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
        for (let i = 0; i < 12; i++) {
            if (!current || current === document.body || isProtected(current)) break;

            const role = current.getAttribute?.('role') || '';
            const data = current.dataset || {};
            const pagelet = data.pagelet || '';

            const isPostLike =
                role === 'article' ||
                pagelet.includes('FeedUnit') ||
                pagelet.includes('Reels') ||
                pagelet.includes('Watch') ||
                current.className?.toLowerCase().includes('story') ||
                current.className?.toLowerCase().includes('feed') ||
                current.className?.toLowerCase().includes('reel');

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
            // Ignore errors
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
        }, 1200); // every 1.2 seconds
    }

    setTimeout(() => {
        removeBlockedContent(document.body);
        observeDOM();
        autoSweep();
    }, 1500);

})();
