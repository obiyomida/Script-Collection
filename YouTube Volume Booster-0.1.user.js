// ==UserScript==
// @name         YouTube Volume Booster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Boost YouTube volume up to 500% by default, with a toggle button to increase limit to 1000%.
// @author       obiyomida
// @match        *://www.youtube.com/watch*
// @match        *://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastUrl = location.href;
    let maxBoost = 5;

    function createVolumeControls() {
        let video = document.querySelector("video");
        let controls = document.querySelector(".ytp-left-controls");

        if (!video || !controls) return;

        document.querySelector("#volume-booster-container")?.remove();
        document.querySelector("#toggle-boost-button")?.remove();

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
            width: 300px;
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
        toggleButton.innerText = "🔄 Max: 500%";
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
            toggleButton.innerText = `🔄 Max: ${maxBoost * 100}%`;
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
    }

    function checkForVideo() {
        let video = document.querySelector("video");
        if (video) {
            createVolumeControls();
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
