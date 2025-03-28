// ==UserScript==
// @name         Facebook Ad & PYMK Ultimate Blocker (v2.0)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Aggressively blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook
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
        let sponsoredPosts = document.querySelectorAll('[aria-label="Sponsored"], div[data-testid="story"] [aria-label="Sponsored"], div[aria-label="Promoted"]');
        
        // Block Suggested posts
        let suggestedPosts = document.querySelectorAll('div:has(span:contains("Suggested for you")), div[data-testid="prefilled_tiny_feedback_like_button"], div[data-testid="feed_story_content"]:has(div[aria-label="Suggested for you"])');
        
        // Block "People You May Know" (PYMK) - Feed
        let pymkFeed = document.querySelectorAll('div[aria-label="People You May Know"], [data-testid="facepile"] > a[href*="/friends/requests"]');
        
        // Block PYMK in Sidebar & Other Sections
        let pymkSidebar = document.querySelectorAll('[aria-label="People You May Know"], div[data-testid="friend_requests_list"]:has(a[href*="/friends/requests"]), div[aria-label="Add friend"]');
        
        // Block Ads in the Chat Sidebar (Right Panel)
        let sidebarAds = document.querySelectorAll('div:has(span:contains("Sponsored")), [aria-label="Sponsored"]');

        // Remove all found elements
        [...sponsoredPosts, ...suggestedPosts, ...pymkFeed, ...pymkSidebar, ...sidebarAds].forEach(el => el.remove());
    }

    // Run initially
    removeElements();

    // Observe changes and remove new elements dynamically
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check each newly added node for sponsored or suggested content
                        removeElements();
                    }
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributeFilter: ['aria-label', 'data-testid'] });
})();
