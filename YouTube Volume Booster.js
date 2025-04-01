// ==UserScript==
// @name         YouTube Volume Booster + Audio Only Mode
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Boost YouTube volume up to 500% (toggleable to 1000%). Adds "Audio Only" mode that hides video and shows only the thumbnail. Controls are placed between video and title.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;
    let audioOnly = false;

    function getThumbnail() {
        const videoId = new URL(location.href).searchParams.get("v");
        return videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : "";
    }

    function updateThumbnail() {
        let thumbnailImg = document.querySelector("#video-thumbnail");
        if (audioOnly && thumbnailImg) {
            let newThumb = getThumbnail();
            if (thumbnailImg.src !== newThumb) {
                thumbnailImg.src = newThumb;
            }
        }
    }

    function createControls() {
        let video = document.querySelector("video");
        let titleContainer = document.querySelector("#above-the-fold, #title.ytd-watch-metadata");

        if (!video || !titleContainer || document.querySelector("#custom-controls-container")) return;

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
        slider.value = "1"; // Default to 100%
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

        let toggleButton = createButton("toggle-boost-button", "🔄 Max: 500%");
        toggleButton.addEventListener("click", function () {
            maxBoost = maxBoost === 5 ? 10 : 5;
            slider.max = maxBoost.toString();
            toggleButton.innerText = `🔄 Max: ${maxBoost * 100}%`;
        });

        let audioOnlyButton = createButton("audio-only-button", "🎵 Audio Only");
        audioOnlyButton.addEventListener("click", function () {
            audioOnly = !audioOnly;
            let thumb = document.querySelector("#video-thumbnail");
            if (audioOnly) {
                video.style.display = "none";
                if (!thumb) {
                    thumb = document.createElement("img");
                    thumb.id = "video-thumbnail";
                    thumb.src = getThumbnail();
                    thumb.style.cssText = `
                        width: 100%;
                        max-width: 640px;
                        display: block;
                        margin: auto;
                    `;
                    video.parentNode.insertBefore(thumb, video.nextSibling);
                }
                audioOnlyButton.innerText = "🎥 Show Video";
            } else {
                video.style.display = "block";
                document.querySelector("#video-thumbnail")?.remove();
                audioOnlyButton.innerText = "🎵 Audio Only";
            }
        });

        if (!video.audioCtx) {
            let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            let source = audioCtx.createMediaElementSource(video);
            let gainNode = audioCtx.createGain();
            gainNode.gain.value = 1; // Default to 100%
            source.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            video.audioCtx = audioCtx;
            video.gainNode = gainNode;
        }

        video.gainNode.gain.value = 1; // Reset to 100% for every new video
        slider.value = "1";
        sliderLabel.innerText = "🔊 100%";

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

    function checkForVideo() {
        let video = document.querySelector("video");
        if (video) {
            createControls();
        }
    }

    function retryUntilLoaded() {
        if (document.readyState === "complete") {
            checkForVideo();
        } else {
            setTimeout(retryUntilLoaded, 500);
        }
    }

    // Run script as early as possible
    document.addEventListener("DOMContentLoaded", retryUntilLoaded);
    window.onload = retryUntilLoaded;

    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            document.querySelector("#video-thumbnail")?.remove();
            setTimeout(checkForVideo, 500);
        }
    }).observe(document.body, { childList: true, subtree: true });

    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            document.querySelector("#video-thumbnail")?.remove();
            updateThumbnail();
        }
    }, 500);

    retryUntilLoaded();
})();
