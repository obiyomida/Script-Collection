// ==UserScript==
// @name         Block Sponsored Ads
// @namespace    http://tampermonkey.net/
// @version      5.2
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

    const PROTECTED_IDS = ['mount_', 'pagelet_dock', 'pagelet_bluebar'];
    const PROTECTED_ROLES = ['main', 'navigation', 'banner'];

    function reconstructText(node) {
        let text = '';
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
            text += walker.currentNode.textContent.trim() + ' ';
        }
        return text.toLowerCase();
    }

    function containsBlockedText(node) {
        if (!node) return false;
        const text = reconstructText(node);
        return BLOCK_LABELS.some(label => text.includes(label.toLowerCase()));
    }

    function containsBlockedAria(node) {
        const aria = node.getAttribute?.('aria-label') || '';
        return BLOCK_LABELS.some(label => aria.toLowerCase().includes(label.toLowerCase()));
    }

    function containsBlockedTitleOrData(node) {
        const title = node.getAttribute?.('title') || '';
        const datasetValues = Object.values(node.dataset || {}).join(' ');
        const combined = (title + ' ' + datasetValues).toLowerCase();
        return BLOCK_LABELS.some(label => combined.includes(label.toLowerCase()));
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
        for (let i = 0; i < 14; i++) {
            if (!current || current === document.body || isProtected(current)) break;

            const role = current.getAttribute?.('role') || '';
            const data = current.dataset || {};
            const pagelet = data.pagelet || '';
            const classList = current.className?.toLowerCase();

            const isLikelyPost =
                role === 'article' ||
                pagelet.includes('FeedUnit') ||
                classList?.includes('feed') ||
                classList?.includes('story') ||
                classList?.includes('reel') ||
                classList?.includes('video');

            if (isLikelyPost && !isProtected(current)) return current;

            current = current.parentElement;
        }
        return null;
    }

    function scanNode(node) {
        try {
            if (
                containsBlockedText(node) ||
                containsBlockedAria(node) ||
                containsBlockedTitleOrData(node)
            ) {
                const target = findRemovableParent(node);
                if (target && !isProtected(target)) {
                    target.remove();
                }
            }
        } catch (e) {
            // Silent fail
        }
    }

    function removeBlockedContent(root) {
        const nodes = root.querySelectorAll?.('[aria-label], [title], span, div, section') || [];
        if (root.nodeType === 1) scanNode(root);
        nodes.forEach(scanNode);
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
        }, 1500);
    }

    setTimeout(() => {
        removeBlockedContent(document.body);
        observeDOM();
        autoSweep();
    }, 2000);

})();
