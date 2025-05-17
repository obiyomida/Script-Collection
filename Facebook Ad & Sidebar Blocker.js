// ==UserScript==
// @name         Facebook
// @namespace    http://tampermonkey.net/
// @version      6.0
// @author       ImprovedByGPT
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const BLOCK_KEYWORDS = [
        'sponsor', 'suggest', 'promoted',
        'reels', 'short videos', 'watch', 'live',
        'you may know', 'suggested post', 'more videos'
    ];

    function normalize(text) {
        return text?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
    }

    function fuzzyMatch(text) {
        const lower = normalize(text);
        return BLOCK_KEYWORDS.some(kw => lower.includes(kw));
    }

    function textContentDeep(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let combined = '';
        while (walker.nextNode()) {
            combined += walker.currentNode.textContent + ' ';
        }
        return normalize(combined);
    }

    function scoreElement(node) {
        let score = 0;

        // Check for blocked keywords in various attributes
        const text = textContentDeep(node);
        if (fuzzyMatch(text)) score += 3;

        const aria = normalize(node.getAttribute?.('aria-label') || '');
        if (fuzzyMatch(aria)) score += 2;

        const title = normalize(node.getAttribute?.('title') || '');
        if (fuzzyMatch(title)) score += 2;

        const dataSet = Object.values(node.dataset || {}).join(' ');
        if (fuzzyMatch(dataSet)) score += 1;

        const classList = normalize(node.className || '');
        if (classList.includes('sponsored')) score += 2;

        return score;
    }

    function findPostAncestor(node) {
        let current = node;
        for (let i = 0; i < 15; i++) {
            if (!current || current === document.body) break;

            const role = current.getAttribute?.('role') || '';
            const data = current.dataset || {};
            const cls = normalize(current.className || '');

            const isLikelyPost =
                role === 'article' ||
                data.pagelet?.toLowerCase().includes('feed') ||
                cls.includes('userContentWrapper') ||
                cls.includes('reel') ||
                cls.includes('story') ||
                cls.includes('feed') ||
                cls.includes('video');

            if (isLikelyPost) return current;

            current = current.parentElement;
        }
        return null;
    }

    function hideIfSpam(node) {
        const score = scoreElement(node);
        if (score >= 3) {
            const post = findPostAncestor(node) || node;
            if (post && post.remove) {
                post.remove();
            }
        }
    }

    function scanTree(root) {
        if (!root || root.nodeType !== 1) return;

        const candidates = root.querySelectorAll?.('div[aria-label], section, span, article') || [];
        candidates.forEach(hideIfSpam);
    }

    function observeDOM() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (n.nodeType === 1) scanTree(n);
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
            scanTree(document.body);
        }, 2000);
    }

    setTimeout(() => {
        scanTree(document.body);
        observeDOM();
        autoSweep();
    }, 1500);

})();
