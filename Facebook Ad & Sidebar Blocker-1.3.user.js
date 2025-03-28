
Tampermonkey® by Jan Biniok
v5.3.3
	
Facebook Ad & PYMK Ultimate Blocker (v2.0)
by YourName
1
// ==UserScript==
2
// @name         Facebook Ad & PYMK Ultimate Blocker (v2.0)
3
// @namespace    http://tampermonkey.net/
4
// @version      2.0
5
// @description  Aggressively blocks Sponsored Posts, Suggested Posts, PYMK, and Sidebar Ads on Facebook
6
// @author       YourName
7
// @match        *://www.facebook.com/*
8
// @match        *://web.facebook.com/*
9
// @grant        none
10
// @run-at       document-end
11
// ==/UserScript==
12
​
13
(function() {
14
    'use strict';
15
​
16
    function removeElements() {
17
        // Block Sponsored posts in News Feed
18
        let sponsoredPosts = document.querySelectorAll('[aria-label="Sponsored"], div[data-testid="story"] [aria-label="Sponsored"], div[aria-label="Promoted"]');
19
​
20
        // Block Suggested posts
21
        let suggestedPosts = document.querySelectorAll('div:has(span:contains("Suggested for you")), div[data-testid="prefilled_tiny_feedback_like_button"], div[data-testid="feed_story_content"]:has(div[aria-label="Suggested for you"])');
22
​
23
        // Block "People You May Know" (PYMK) - Feed
24
        let pymkFeed = document.querySelectorAll('div[aria-label="People You May Know"], [data-testid="facepile"] > a[href*="/friends/requests"]');
25
​
26
        // Block PYMK in Sidebar & Other Sections
27
        let pymkSidebar = document.querySelectorAll('[aria-label="People You May Know"], div[data-testid="friend_requests_list"]:has(a[href*="/friends/requests"]), div[aria-label="Add friend"]');
28
​
29
        // Block Ads in the Chat Sidebar (Right Panel)
30
        let sidebarAds = document.querySelectorAll('div:has(span:contains("Sponsored")), [aria-label="Sponsored"]');
31
​
32
        // Remove all found elements
33
        [...sponsoredPosts, ...suggestedPosts, ...pymkFeed, ...pymkSidebar, ...sidebarAds].forEach(el => el.remove());
34
    }
35
​
36
    // Run initially
37
    removeElements();
38
​
39
    // Observe changes and remove new elements dynamically
40
    const observer = new MutationObserver((mutationsList) => {
41
        for (let mutation of mutationsList) {
42
            if (mutation.type === 'childList') {
43
                mutation.addedNodes.forEach(node => {
44
                    if (node.nodeType === Node.ELEMENT_NODE) {
45
                        // Check each newly added node for sponsored or suggested content
46
                        removeElements();
47
                    }
48
                });
49
            }
50
        }
