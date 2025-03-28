// ==UserScript==
// @name         Facebook Ad & PYMK Ultimate Blocker (v1.5)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook
// @author       obiyomida
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

        // Block "People You May Know" (PYMK) - Feed
        let pymkFeed = document.querySelectorAll('div:has-text("People You May Know"), div:has(span:has-text("People You May Know"))');

        // Block PYMK in Sidebar & Other Sections
        let pymkSidebar = document.querySelectorAll('[aria-label="People You May Know"], div:has(a:has-text("Add friend"))');

        // Block Ads in the Chat Sidebar (Right Panel)
        let sidebarAds = document.querySelectorAll('div:has-text("Sponsored"):not([role="menu"])');

        // Block Sidebar Ad Section more accurately
        let sidebarAdSections = document.querySelectorAll('[aria-label="Sponsored"]');

        // Remove all found elements
        [...sponsoredPosts, ...suggestedPosts, ...pymkFeed, ...pymkSidebar, ...sidebarAds, ...sidebarAdSections].forEach(el => el.remove());
    }

    // Run initially
    removeElements();

    // Observe changes and remove new elements dynamically
    const observer = new MutationObserver(() => removeElements());
    observer.observe(document.body, { childList: true, subtree: true });
})();
