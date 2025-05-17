// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode (Optimized)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Boost YouTube volume up to 500%/1000%.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;
    let isEnhancing = false;

    const waitForElements = (selectors, callback, timeout = 15000) => {
        const start = performance.now();

        const check = () => {
            const elements = selectors.map(sel => document.querySelector(sel));
            if (elements.every(Boolean)) return callback(...elements);
            if (performance.now() - start > timeout) return;
            setTimeout(check, 300);
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

            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "visible" && ctx.state === "suspended") {
                    ctx.resume();
                }
            });

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
        if (isEnhancing) return;
        isEnhancing = true;
        setTimeout(() => isEnhancing = false, 3000);

        waitForElements(["video", "#above-the-fold, #title.ytd-watch-metadata"], (video, titleContainer) => {
            createControls(video, titleContainer);

            const videoObserver = new MutationObserver(() => {
                if (!document.contains(video)) {
                    videoObserver.disconnect();
                    setupEnhancer();
                }
            });
            videoObserver.observe(document.body, { childList: true, subtree: true });

            const controlObserver = new MutationObserver(() => {
                if (!document.querySelector("#custom-controls-container")) {
                    controlObserver.disconnect();
                    createControls(video, titleContainer);
                }
            });
            controlObserver.observe(titleContainer.parentNode, { childList: true });
        });
    };

    const observeUrlChange = () => {
        let debounceTimer;
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    lastUrl = location.href;
                    setupEnhancer();
                }, 500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    window.addEventListener("yt-navigate-finish", () => setTimeout(setupEnhancer, 1000));
    setupEnhancer();
    observeUrlChange();
})();
