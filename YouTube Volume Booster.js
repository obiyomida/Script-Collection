// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Boost YouTube volume up to 500% (toggleable to 1000%). Adds "Audio Only" mode that hides video.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;

    function waitForElements(selectors, callback, timeout = 10000) {
        const start = performance.now();

        const interval = setInterval(() => {
            const elapsed = performance.now() - start;
            const elements = selectors.map(sel => document.querySelector(sel));

            if (elements.every(el => el)) {
                clearInterval(interval);
                callback(...elements);
            }

            if (elapsed > timeout) {
                clearInterval(interval);
                console.warn("YouTube Enhancer: Required elements not found in time.");
            }
        }, 300);
    }

    function createControls(video, titleContainer) {
        if (document.querySelector("#custom-controls-container")) return;

        let container = document.createElement("div");
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

        let slider = document.createElement("input");
        slider.type = "range";
        slider.id = "volume-booster-slider";
        slider.min = "1";
        slider.max = maxBoost.toString();
        slider.step = "0.1";
        slider.value = "1"; // Always reset to 100%
        slider.style.cssText = `
            width: 150px;
            height: 8px;
            cursor: pointer;
            background: white;
        `;

        let sliderLabel = document.createElement("span");
        sliderLabel.id = "volume-booster-label";
        sliderLabel.innerText = "🔊 100%";
        sliderLabel.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            color: white;
        `;

        function createButton(id, text) {
            let button = document.createElement("button");
            button.id = id;
            button.innerText = text;
            button.style.cssText = `
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

            button.addEventListener("mouseenter", () => {
                button.style.background = "rgba(255, 255, 255, 0.2)";
            });

            button.addEventListener("mouseleave", () => {
                button.style.background = "transparent";
            });

            return button;
        }

        let toggleButton = createButton("toggle-boost-button", `🔄 Max: ${maxBoost * 100}%`);
        toggleButton.addEventListener("click", function () {
            maxBoost = maxBoost === 5 ? 10 : 5;
            slider.max = maxBoost.toString();
            toggleButton.innerText = `🔄 Max: ${maxBoost * 100}%`;
        });

        let audioOnlyButton = createButton("audio-only-button", "🎵 Audio Only");
        audioOnlyButton.addEventListener("click", function () {
            audioOnly = !audioOnly;

            if (audioOnly) {
                video.style.display = "none";
                audioOnlyButton.innerText = "🎥 Show Video";
            } else {
                video.style.display = "block";
                audioOnlyButton.innerText = "🎵 Audio Only";
            }
        });

        if (!video.audioCtx) {
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let source = audioCtx.createMediaElementSource(video);
            let gainNode = audioCtx.createGain();
            gainNode.gain.value = 1;
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            video.audioCtx = audioCtx;
            video.gainNode = gainNode;
        }

        video.gainNode.gain.value = 1;
        slider.addEventListener("input", function () {
            let boostFactor = parseFloat(this.value);
            video.gainNode.gain.value = boostFactor;
            sliderLabel.innerText = `🔊 ${Math.round(boostFactor * 100)}%`;
        });

        container.appendChild(slider);
        container.appendChild(sliderLabel);
        container.appendChild(toggleButton);
        container.appendChild(audioOnlyButton);
        titleContainer.parentNode.insertBefore(container, titleContainer);
    }

    function setupEnhancer() {
        waitForElements(["video", "#above-the-fold, #title.ytd-watch-metadata"], (video, titleContainer) => {
            createControls(video, titleContainer);
        });
    }

    // Detect navigation in YouTube SPA
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(setupEnhancer, 1000);
        }
    }).observe(document.body, { childList: true, subtree: true });

    // Also listen to YouTube navigation events
    window.addEventListener("yt-navigate-finish", () => {
        setTimeout(setupEnhancer, 1000);
    });

    window.addEventListener("load", setupEnhancer);
    document.addEventListener("DOMContentLoaded", setupEnhancer);

    setupEnhancer();
})();
