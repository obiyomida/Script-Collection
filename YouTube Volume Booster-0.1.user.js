// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Boost YouTube volume up to 500% with a toggle for 1000%. Also adds an "Audio Only" mode that hides video and shows only the thumbnail.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;

    function createControls() {
        let video = document.querySelector("video");
        let controls = document.querySelector(".ytp-left-controls");
        let thumbnail = document.querySelector("meta[property='og:image']")?.content;

        if (!video || !controls || document.querySelector("#volume-booster-container")) return;

        localStorage.setItem("ytVolumeBoost", "1");

        let container = document.createElement("div");
        container.id = "volume-booster-container";
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-left: 20px;
            gap: 10px;
        `;

        let slider = document.createElement("input");
        slider.type = "range";
        slider.id = "volume-booster-slider";
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

        let sliderLabel = document.createElement("span");
        sliderLabel.id = "volume-booster-label";
        sliderLabel.innerText = "🔊 100%";
        sliderLabel.style.cssText = `
            font-size: 14px;
            color: white;
            font-weight: bold;
        `;

        let toggleButton = document.createElement("button");
        toggleButton.id = "toggle-boost-button";
        toggleButton.innerText = "🔄500%";
        toggleButton.style.cssText = `
            padding: 5px 10px;
            font-size: 12px;
            color: white;
            background: transparent;
            border: 1px solid white;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        `;

        toggleButton.addEventListener("mouseenter", () => {
            toggleButton.style.background = "rgba(255, 255, 255, 0.2)";
        });

        toggleButton.addEventListener("mouseleave", () => {
            toggleButton.style.background = "transparent";
        });

        toggleButton.addEventListener("click", function() {
            maxBoost = maxBoost === 5 ? 10 : 5;
            slider.max = maxBoost.toString();
            toggleButton.innerText = `🔄: ${maxBoost * 100}%`;
        });

        let audioOnlyButton = document.createElement("button");
        audioOnlyButton.id = "audio-only-button";
        audioOnlyButton.innerText = "🎵";
        audioOnlyButton.style.cssText = `
            padding: 5px 10px;
            font-size: 12px;
            color: white;
            background: transparent;
            border: 1px solid white;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        `;

        audioOnlyButton.addEventListener("mouseenter", () => {
            audioOnlyButton.style.background = "rgba(255, 255, 255, 0.2)";
        });

        audioOnlyButton.addEventListener("mouseleave", () => {
            audioOnlyButton.style.background = "transparent";
        });

        audioOnlyButton.addEventListener("click", function() {
            audioOnly = !audioOnly;
            if (audioOnly) {
                video.style.display = "none";
                let thumb = document.createElement("img");
                thumb.id = "video-thumbnail";
                thumb.src = thumbnail;
                thumb.style.cssText = `
                    width: 100%;
                    max-width: 640px;
                    display: block;
                    margin: auto;
                `;
                video.parentNode.insertBefore(thumb, video.nextSibling);
                audioOnlyButton.innerText = "🎥";
            } else {
                video.style.display = "block";
                document.querySelector("#video-thumbnail")?.remove();
                audioOnlyButton.innerText = "🎵";
            }
        });

        if (!video.audioCtx) {
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let source = audioCtx.createMediaElementSource(video);
            let gainNode = audioCtx.createGain();
            gainNode.gain.value = parseFloat(localStorage.getItem("ytVolumeBoost")) || 1;
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            video.audioCtx = audioCtx;
            video.gainNode = gainNode;
        }

        video.gainNode.gain.value = 1;
        slider.value = "1";
        sliderLabel.innerText = "🔊 100%";

        slider.addEventListener("input", function() {
            let boostFactor = parseFloat(this.value);
            video.gainNode.gain.value = boostFactor;
            sliderLabel.innerText = `🔊 ${Math.round(boostFactor * 100)}%`;
            localStorage.setItem("ytVolumeBoost", boostFactor.toString());
        });

        container.appendChild(slider);
        container.appendChild(sliderLabel);
        controls.appendChild(container);
        controls.appendChild(toggleButton);
        controls.appendChild(audioOnlyButton);
    }

    function checkForVideo() {
        let video = document.querySelector("video");
        if (video) {
            createControls();
        }
    }

    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(checkForVideo, 1000);
        }
    }).observe(document.body, { childList: true, subtree: true });

    checkForVideo();
})();
