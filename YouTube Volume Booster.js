// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode (Ultra Stable)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Boost YouTube volume up to 500%/1000%. Toggleable Audio Only mode. Works across YouTube SPA navigation.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;

    const waitForElements = (selectors, callback, timeout = 15000) => {
        const start = performance.now();

        const check = () => {
            const elements = selectors.map(sel => document.querySelector(sel));
            if (elements.every(Boolean)) return callback(...elements);
            if (performance.now() - start > timeout) return setTimeout(() => waitForElements(selectors, callback, timeout), 2000);
            requestIdleCallback(check, { timeout: 1000 });
        };

        check();
    };

    const createButton = (id, text, onClick) => {
        const btn = document.createElement("button");
        Object.assign(btn, { id, innerText: text });
        Object.assign(btn.style, {
            padding: "5px 10px",
            fontSize: "12px",
            background: "transparent",
            color: "white",
            border: "1px solid white",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "background 0.2s"
        });
        btn.onmouseenter = () => btn.style.background = "rgba(255,255,255,0.2)";
        btn.onmouseleave = () => btn.style.background = "transparent";
        btn.onclick = onClick;
        return btn;
    };

    const createControls = (video, titleContainer) => {
        if (!video || !titleContainer || document.querySelector("#custom-controls-container")) return;

        const container = document.createElement("div");
        container.id = "custom-controls-container";
        Object.assign(container.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "15px",
            padding: "10px",
            marginTop: "10px",
            background: "rgba(0,0,0,0.6)",
            borderRadius: "10px"
        });

        const slider = Object.assign(document.createElement("input"), {
            type: "range",
            min: "1",
            max: maxBoost.toString(),
            step: "0.1",
            value: "1"
        });
        slider.style.cssText = "width: 150px; height: 8px; cursor: pointer; background: white;";

        const label = document.createElement("span");
        label.innerText = "🔊 100%";
        label.style.cssText = "font-size: 14px; font-weight: bold; color: white;";

        const toggleBtn = createButton("toggle-boost", `🔄 Max: ${maxBoost * 100}%`, () => {
            maxBoost = maxBoost === 5 ? 10 : 5;
            slider.max = maxBoost.toString();
            toggleBtn.innerText = `🔄 Max: ${maxBoost * 100}%`;
        });

        const audioBtn = createButton("audio-only", "🎵 Audio Only", () => {
            audioOnly = !audioOnly;
            video.style.display = audioOnly ? "none" : "block";
            audioBtn.innerText = audioOnly ? "🎥 Show Video" : "🎵 Audio Only";
        });

        if (!video.gainNode) {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const source = ctx.createMediaElementSource(video);
            const gainNode = ctx.createGain();
            gainNode.gain.value = 1;
            source.connect(gainNode).connect(ctx.destination);

            setInterval(() => ctx.state === "suspended" && ctx.resume(), 5000);

            video.audioCtx = ctx;
            video.gainNode = gainNode;
        }

        slider.oninput = () => {
            const val = parseFloat(slider.value);
            video.gainNode.gain.value = val;
            label.innerText = `🔊 ${Math.round(val * 100)}%`;
        };

        [slider, label, toggleBtn, audioBtn].forEach(el => container.appendChild(el));
        titleContainer.parentNode.insertBefore(container, titleContainer);
    };

    const setupEnhancer = () => {
        waitForElements(["video", "#above-the-fold, #title.ytd-watch-metadata"], (video, titleContainer) => {
            createControls(video, titleContainer);

            new MutationObserver(() => {
                if (!document.contains(video)) {
                    console.log("YouTube Enhancer: Video replaced, reinitializing...");
                    setupEnhancer();
                }
            }).observe(document.body, { childList: true, subtree: true });

            new MutationObserver(() => {
                if (!document.querySelector("#custom-controls-container")) {
                    console.log("YouTube Enhancer: Controls removed, reinserting...");
                    createControls(video, titleContainer);
                }
            }).observe(titleContainer.parentNode, { childList: true });
        });
    };

    const observeUrlChange = () => {
        new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                setTimeout(setupEnhancer, 1000);
            }
        }).observe(document.body, { childList: true, subtree: true });
    };

    ["yt-navigate-finish", "yt-page-data-updated", "load", "DOMContentLoaded"].forEach(evt =>
        window.addEventListener(evt, () => setTimeout(setupEnhancer, 1000))
    );

    setupEnhancer();
    observeUrlChange();
})();
