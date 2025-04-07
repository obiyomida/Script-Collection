// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode (Ultra Stable)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Boost YouTube volume up to 500% (toggleable to 1000%). Audio Only mode. Fully robust against refresh/navigation/lazy loads/reset DOMs on YouTube SPA site changes.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;

    function waitForElements(selectors, callback, timeout = 15000) {
        let attempt = 0;
        const start = performance.now();

        const tryFind = () => {
            const elapsed = performance.now() - start;
            const elements = selectors.map(sel => document.querySelector(sel));

            if (elements.every(el => el)) {
                callback(...elements);
                return;
            }

            if (elapsed > timeout) {
                console.warn("YouTube Enhancer: Timeout reached. Will retry in fallback.");
                setTimeout(() => waitForElements(selectors, callback, timeout), 2000); // Fallback retry
                return;
            }

            attempt++;
            const delay = Math.min(1000, 200 + attempt * 100); // Exponential backoff
            setTimeout(tryFind, delay);
        };

        tryFind();
    }

    function createControls(video, titleContainer) {
        if (!video || !titleContainer || document.querySelector("#custom-controls-container")) return;

        const container = document.createElement("div");
        container.id = "custom-controls-container";
        container.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 10px;
            margin-top: 10px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 10px;
        `;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "1";
        slider.max = maxBoost.toString();
        slider.step = "0.1";
        slider.value = "1";
        slider.style.cssText = `
            width: 150px;
            height: 8px;
            cursor: pointer;
            background: white;
        `;

        const label = document.createElement("span");
        label.innerText = "🔊 100%";
        label.style.cssText = `font-size: 14px; font-weight: bold; color: white;`;

        function createButton(id, text) {
            const btn = document.createElement("button");
            btn.id = id;
            btn.innerText = text;
            btn.style.cssText = `
                padding: 5px 10px;
                font-size: 12px;
                background: transparent;
                color: white;
                border: 1px solid white;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.2s;
            `;
            btn.addEventListener("mouseenter", () => btn.style.background = "rgba(255, 255, 255, 0.2)");
            btn.addEventListener("mouseleave", () => btn.style.background = "transparent");
            return btn;
        }

        const toggleBtn = createButton("toggle-boost-button", `🔄 Max: ${maxBoost * 100}%`);
        toggleBtn.addEventListener("click", () => {
            maxBoost = maxBoost === 5 ? 10 : 5;
            slider.max = maxBoost.toString();
            toggleBtn.innerText = `🔄 Max: ${maxBoost * 100}%`;
        });

        const audioBtn = createButton("audio-only-button", "🎵 Audio Only");
        audioBtn.addEventListener("click", () => {
            audioOnly = !audioOnly;
            video.style.display = audioOnly ? "none" : "block";
            audioBtn.innerText = audioOnly ? "🎥 Show Video" : "🎵 Audio Only";
        });

        if (!video.gainNode) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 1;
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            video.audioCtx = audioCtx;
            video.gainNode = gainNode;
        }

        slider.addEventListener("input", function () {
            const val = parseFloat(this.value);
            video.gainNode.gain.value = val;
            label.innerText = `🔊 ${Math.round(val * 100)}%`;
        });

        container.appendChild(slider);
        container.appendChild(label);
        container.appendChild(toggleBtn);
        container.appendChild(audioBtn);
        titleContainer.parentNode.insertBefore(container, titleContainer);
    }

    function setupEnhancer() {
        waitForElements(["video", "#above-the-fold, #title.ytd-watch-metadata"], (video, titleContainer) => {
            createControls(video, titleContainer);

            // Watch for video element changes (e.g., YouTube replaces it)
            new MutationObserver(() => {
                if (!document.contains(video)) {
                    console.log("YouTube Enhancer: Video replaced, reinitializing...");
                    setupEnhancer();
                }
            }).observe(document.body, { childList: true, subtree: true });

            // Reinsert controls if DOM wipes them
            new MutationObserver(() => {
                if (!document.querySelector("#custom-controls-container")) {
                    console.log("YouTube Enhancer: Controls removed, reinserting...");
                    createControls(video, titleContainer);
                }
            }).observe(titleContainer.parentNode, { childList: true });
        });
    }

    // Watch for navigation between videos
    const observeUrlChange = () => {
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(setupEnhancer, 1000);
            }
        }).observe(document.body, { childList: true, subtree: true });
    };

    window.addEventListener("yt-navigate-finish", () => setTimeout(setupEnhancer, 1000));
    window.addEventListener("yt-page-data-updated", () => setTimeout(setupEnhancer, 1000));
    window.addEventListener("load", setupEnhancer);
    document.addEventListener("DOMContentLoaded", setupEnhancer);

    setupEnhancer();
    observeUrlChange();
})();
