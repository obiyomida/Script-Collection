// ==UserScript==
// @name         Facebook Ad & Sidebar Blocker (v1.3)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook
// @author       YourName
// @match        *://www.facebook.com/*
// @match        *://web.facebook.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function removeElements() {
        // Block Sponsored posts in News Feed
        let sponsoredPosts = document.querySelectorAll('div:has(span:has-text("Sponsored"))');

        // Block Suggested posts
        let suggestedPosts = document.querySelectorAll('div:has(span:has-text("Suggested for you"))');

        // Block People You May Know (PYMK)
        let pymkSections = document.querySelectorAll('div:has(span:has-text("People You May Know"))');

        // Block Ads in the Chat Sidebar (Right Panel)
        let sidebarAds = document.querySelectorAll('div:has-text("Sponsored"):not([role="menu"])');

        // Block Sidebar Ads (More Specific)
        let sidebarAdSections = document.querySelectorAll('[aria-label="Sponsored"]');

        // Remove all found elements
        [...sponsoredPosts, ...suggestedPosts, ...pymkSections, ...sidebarAds, ...sidebarAdSections].forEach(el => el.remove());
    }

    // Run initially
    removeElements();

    // Observe changes and remove new elements dynamically
    const observer = new MutationObserver(() => removeElements());
    observer.observe(document.body, { childList: true, subtree: true });
})();
