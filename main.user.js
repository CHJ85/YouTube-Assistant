// ==UserScript==
// @name         YouTube Assistant - Additional features and keyboard shortcuts
// @namespace    https://github.com/chj85/YouTube-Assistant
// @author       CHJ85
// @version      1.8
// @description  Add additional features and keyboard shortcuts to improve your viewing experience on YouTube.
// @match        *://*.youtube.com/*
// @license      MIT
// @run-at       document-end
// @icon         https://img.uxwing.com/wp-content/themes/uxwing/download/brands-social-media/youtube-app-icon.svg
// ==/UserScript==

(function() {
  'use strict';

  /* ----------------------------- */
  /* Aspect Ratio Control */
  /* ----------------------------- */

  let currentRatio = null;
  const aspectRatios = ["↔", "4:3", "16:9", "9:16", "3:2", "21:9"];
  let aspectRatiosIndex = 0;
  const videoElemAttr = "data-aspectRatio-userscript";
  const buttonhtml = `<button id="aspectratioSwitcher" class="ytp-button" title="Aspect Ratio">↔</button>`;
  const csshtml = `
    <style>
    #aspectratioSwitcher {
        top: -13px;
        position: relative;
        text-align: center;
        font-size: 25px;
    }
    .ytp-big-mode #aspectratioSwitcher {
        font-size: 182%;
        top: -19px;
    }

    #movie_player[data-aspectRatio-userscript="16:9"] #aspectratioSwitcher,
    #movie_player[data-aspectRatio-userscript="9:16"] #aspectratioSwitcher,
    #movie_player[data-aspectRatio-userscript="4:3"] #aspectratioSwitcher,
    #movie_player[data-aspectRatio-userscript="3:2"] #aspectratioSwitcher,
    #movie_player[data-aspectRatio-userscript="21:9"] #aspectratioSwitcher {
        font-size: unset;
    }

    .html5-main-video { transition: .2s; }

    #movie_player[data-aspectRatio-userscript="16:9"] .html5-main-video { transform: scale(1.335,1)!important; }
    #movie_player[data-aspectRatio-userscript="4:3"] .html5-main-video { transform: scale(.75,1)!important; }
    #movie_player[data-aspectRatio-userscript="9:16"] .html5-main-video { transform: scale(1.77,1)!important; }
    #movie_player[data-aspectRatio-userscript="3:2"] .html5-main-video { transform: scale(1.5,1)!important; }
    #movie_player[data-aspectRatio-userscript="21:9"] .html5-main-video { transform: scale(1.19,1)!important; }
    </style>
  `;

  const anchorElem = document.documentElement.querySelector(".ytp-button.ytp-settings-button, .ytp-subtitles-button.ytp-button");
  anchorElem.insertAdjacentHTML("beforebegin", buttonhtml + csshtml);

  const buttonElem = document.querySelector("#aspectratioSwitcher");
  buttonElem.addEventListener("click", aspectRatioSwitch);

  function aspectRatioSwitch() {
    const videoElem = document.getElementById("movie_player");

    aspectRatiosIndex = (aspectRatiosIndex + 1) % aspectRatios.length;
    currentRatio = aspectRatios[aspectRatiosIndex];
    videoElem.setAttribute(videoElemAttr, currentRatio);
    buttonElem.textContent = currentRatio;
  }

  /* ---------------------------- */
  /* Brightness Control */
  /* ---------------------------- */

  const LANGUAGE_DEFAULT = "en-US";

  const LANGUAGE_RESOURCES = {
    [LANGUAGE_DEFAULT]: {
      brightness: "Brightness"
    }
  };

  let resources, brightness, video, settingsMenu, speedOption, brightnessOption, text;

  function init() {
    const lang = document.documentElement.lang;
    resources = LANGUAGE_RESOURCES[lang] || LANGUAGE_RESOURCES[LANGUAGE_DEFAULT];
    video = document.querySelector("video");
    settingsMenu = document.querySelector("div.ytp-settings-menu");
    brightness = parseInt(localStorage.getItem("lwchris.youtube_brightness_option.brightness") || "100", 10);
    setBrightness(brightness);
    addObserver();

    // Attach the event listeners to the video player element
    const videoPlayer = document.getElementById("movie_player");
    videoPlayer.addEventListener("keydown", handleKeydown);
    videoPlayer.addEventListener("keyup", handleKeyup);
  }

  function addObserver() {
    const observer = new MutationObserver(menuPopulated);
    const config = { attributes: false, childList: true, subtree: true };
    observer.observe(settingsMenu, config);
  }

  function injectMenuOption() {
    if (brightnessOption || !speedOption) {
      return;
    }

    brightnessOption = speedOption.cloneNode(true);

    const label = brightnessOption.querySelector(".ytp-menuitem-label");
    label.textContent = resources.brightness;

    const path = brightnessOption.querySelector("path");
    path.setAttribute(
      "d",
      "M12 9c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0-2c-2.762 0-5 2.238-5 5s2.238 5 5 5 5-2.238 5-5-2.238-5-5-5zm0-2c.34 0 .672.033 1 .08v-2.08h-2v2.08c.328-.047.66-.08 1-.08zm-4.184 1.401l-1.472-1.473-1.414 1.415 1.473 1.473c.401-.537.876-1.013 1.413-1.415zm9.782 1.414l1.473-1.473-1.414-1.414-1.473 1.473c.537.402 1.012.878 1.414 1.414zm-5.598 11.185c-.34 0-.672-.033-1-.08v2.08h2v-2.08c-.328.047-.66.08-1 .08zm4.185-1.402l1.473 1.473 1.415-1.415-1.473-1.472c-.403.536-.879 1.012-1.415 1.414zm-11.185-5.598c0-.34.033-.672.08-1h-2.08v2h2.08c-.047-.328-.08-.66-.08-1zm13.92-1c.047.328.08.66.08 1s-.033.672-.08 1h2.08v-2h-2.08zm-12.519 5.184l-1.473 1.473 1.414 1.414 1.473-1.473c-.536-."
    );

    text = brightnessOption.querySelector(".ytp-menuitem-content");
    text.textContent = brightness + "%";

    brightnessOption.setAttribute("aria-haspopup", "false");
    brightnessOption.addEventListener("click", optionClicked);

    speedOption.parentNode.insertBefore(brightnessOption, speedOption);

    const isBigPlayer = video.classList.contains("ytp-big-mode");
    const panel = settingsMenu.querySelector(".ytp-panel");
    const panelMenu = settingsMenu.querySelector(".ytp-panel-menu");

    const newHeight = `calc(${panel.style.height} + ${isBigPlayer ? 49 : 40}px)`;
    settingsMenu.style.height = newHeight;
    panel.style.height = newHeight;
    panelMenu.style.height = newHeight;
  }

  function optionClicked() {
    brightness += 20;
    if (brightness > 100) {
      brightness = 20;
    }
    setBrightness(brightness);
  }

  function setBrightness(b) {
    video.style.opacity = b / 100;
    if (text) {
      text.textContent = b + "%";
    }
    try {
      if (b === 100) {
        localStorage.removeItem("lwchris.youtube_brightness_option.brightness");
      } else {
        localStorage.setItem("lwchris.youtube_brightness_option.brightness", b);
      }
    } catch {
      console.log("Persisting brightness failed");
    }
  }

  function menuPopulated() {
    const menuItems = settingsMenu.querySelectorAll(".ytp-menuitem");
    speedOption = null;
    for (const item of menuItems) {
      const icon = item.querySelector("path");
      if (icon && icon.getAttribute("d").startsWith("M10,8v8l6-4L10,8L10,8z")) {
        speedOption = item;
        break;
      }
    }

    if (speedOption) {
      injectMenuOption();
      observer.disconnect();
    }
  }

  init();

  /* ------------------------ */
  /* Expend Speed Control */
  /* ------------------------ */

  function updateAvailablePlaybackRates() {
    let path = "";

    function findAvailablePlaybackRates(objectToSave, prep) {
      let count = 0;
      for (let i in objectToSave) {
        if (Object.keys(objectToSave)[count] && objectToSave[Object.keys(objectToSave)[count]]) {
          if (Object.keys(objectToSave)[count] === "getAvailablePlaybackRates") {
            path = (prep === "" ? "" : prep + ".") + Object.keys(objectToSave)[count];
          }
          if (path !== "") return;

          const objOfObj = objectToSave[Object.keys(objectToSave)[count]];

          if (typeof objOfObj !== "undefined" && objectToSave[i].constructor.name === "Function" && Object.keys(objOfObj).length !== 0) {
            let incount = 0;
            for (let j in objOfObj) {
              if (typeof objOfObj !== "undefined") {
                findAvailablePlaybackRates(objOfObj[j], (prep === "" ? "" : prep + ".") + Object.keys(objectToSave)[count] + "." + Object.keys(objOfObj)[incount]);
              }
              if (path !== "") return;
              incount++;
            }
          }
        }
        count++;
      }
    }

    findAvailablePlaybackRates(_yt_player, "");
    console.log("Path detected at _yt_player." + path);

    function setAvailablePlaybackRates(path, index, splitted) {
      if (splitted.length - 1 === index) {
        path[splitted[index]] = function() {
          return [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 10];
        };
      } else setAvailablePlaybackRates(path[splitted[index]], index + 1, splitted);
    }

    setAvailablePlaybackRates(_yt_player, 0, path.split("."));
  }

  function runUpdateAvailablePlaybackRates() {
    if (typeof _yt_player === "undefined") {
      const interval = setInterval(() => {
        if (typeof _yt_player !== "undefined") {
          clearInterval(interval);
          updateAvailablePlaybackRates();
        }
      }, 5);
    } else {
      updateAvailablePlaybackRates();
    }
  }

  function run() {
    runUpdateAvailablePlaybackRates();
  }

  window.addEventListener("yt-navigate-finish", run);
  window.addEventListener("spfdone", run);

  run();

  /* ----------------------------- */
  /* Surround Sound Effect */
  /* ----------------------------- */

  let equalizerEnabled = false;

  function applySurroundSoundEffect() {
    const context = new AudioContext();
    const source = context.createMediaElementSource(video);

    const splitter = context.createChannelSplitter(2);
    const merger = context.createChannelMerger(2);

    const leftDelay = context.createDelay();
    const rightDelay = context.createDelay();

    leftDelay.delayTime.value = 0;
    rightDelay.delayTime.value = 0.01;

    source.connect(splitter);
    splitter.connect(leftDelay, 0);
    splitter.connect(rightDelay, 1);
    leftDelay.connect(merger, 0, 0);
    rightDelay.connect(merger, 0, 1);
    merger.connect(context.destination);
  }

  function toggleEqualizer() {
    if (equalizerEnabled) {
      resetAudioContext();
      equalizerEnabled = false;
      console.log("Surround deactivated");
    } else {
      applySurroundSoundEffect();
      equalizerEnabled = true;
      console.log("Surround activated");
    }
  }

  /* ---------------------- */
  /* Black and White Toggle */
  /* ---------------------- */

  let isBlackAndWhite = false;

  function toggleBlackAndWhite() {
    if (video) {
      if (!isBlackAndWhite) {
        video.style.filter = 'grayscale(100%)';
        isBlackAndWhite = true;
      } else if (video.style.filter === 'grayscale(100%)') {
        video.style.filter = 'sepia(100%)';
      } else if (video.style.filter === 'sepia(100%)') {
        video.style.filter = 'invert(100%)';
      } else {
        video.style.filter = 'none';
        isBlackAndWhite = false;
      }
    }
  }

  let hueIntervalId;
  let preventSeeking = false;
  let currentHue = 0;

  function toggleHueColorCycling() {
    const videoElem = document.querySelector("video");
    if (videoElem) {
      currentHue = (currentHue + 1) % 360;
      videoElem.style.filter = `hue-rotate(${currentHue}deg)`;
    }
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "ArrowUp") {
      event.preventDefault(); // Prevent default scrolling behavior
      toggleEqualizer();
    } else if ((event.ctrlKey || event.metaKey) && event.key === "ArrowDown") {
      event.preventDefault(); // Prevent default scrolling behavior
      toggleBlackAndWhite();
    } else if ((event.ctrlKey || event.metaKey) && event.key === ",") {
      event.preventDefault(); // Prevent default seeking behavior
      if (!preventSeeking) {
        preventSeeking = true;
        hueIntervalId = setInterval(toggleHueColorCycling, 5); // Faster color fading (every 5ms)
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key === "ArrowRight") {
      event.preventDefault(); // Prevent default seeking behavior
      video.currentTime += 30; // Jump 30 seconds forward
    }
  }

  // Add autofocus attribute to the video element
  const videoElement = document.querySelector("video");
  videoElement.setAttribute("autofocus", "true");

  function handleKeyup(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === ",") {
      event.preventDefault(); // Prevent default seeking behavior
      preventSeeking = false;
      clearInterval(hueIntervalId);
    }
  }

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyup);

})();

// Retrieve the ad blocking state from localStorage or set it to true by default
let adBlockEnabled = localStorage.getItem('adBlockEnabled') === null || localStorage.getItem('adBlockEnabled') === 'true';

// Function to block ads based on ad domains
function blockAds() {
  const adElements = document.querySelectorAll('a[href*="' + adDomains.join('"], a[href*="') + '"]');
  adElements.forEach((adElement) => {
    adElement.style.display = 'none';
  });
}

// Function to unblock ads
function unblockAds() {
  const adElements = document.querySelectorAll('a[href*="' + adDomains.join('"], a[href*="') + '"]');
  adElements.forEach((adElement) => {
    adElement.style.display = 'block';
  });
}

// Function to toggle the ad blocking functionality
function toggleAdBlock() {
  adBlockEnabled = !adBlockEnabled;
  localStorage.setItem('adBlockEnabled', adBlockEnabled.toString());
  updateToggleButton();
  if (adBlockEnabled) {
    blockAds();
  } else {
    unblockAds();
  }
}

// Function to update the toggle button text based on the ad blocking state
function updateToggleButton() {
  toggleButton.textContent = adBlockEnabled ? 'Block Ads' : 'Show Ads';
  toggleButton.style.background = adBlockEnabled ? '#ff0000' : '#cccccc';
}

// List of ad domains to block
const adDomains = [
  'googlesyndication.com',
  'doubleclick.net',
  'doubleclick.com',
  'adserver.com',
  'adnetwork.net',
  'advertiser.org',
  'google-analytics.com',
  'omniture.com',
  'intellitxt.com',
  'quantserve.com',
  '2o7.net',
  '207.net',
  'ad.googlevideo.com',
  'googleadservices.com',
  'redirector.googlevideo.com',
  'googlehosted.l.googleusercontent.com',
  'fwmrm.net',
  '2mdn.net',
  'ad.youtube.com',
  'ads.youtube.com',
  'adservice.google.com',
  'analytic-google.com',
  'eligibility-panelresearch.googlevideo.com',
  'adform.net',
  'googleadapis.l.google.com',
  'innovid.com'
];

// Create the toggle button
const toggleButton = document.createElement('button');
toggleButton.id = 'adBlockToggle';
toggleButton.style.position = 'fixed';
toggleButton.style.top = '50px';
toggleButton.style.right = '10px';
toggleButton.style.zIndex = '9999';
toggleButton.style.padding = '10px';
toggleButton.style.fontWeight = 'bold';
toggleButton.style.color = '#ffffff';
toggleButton.style.cursor = 'pointer';
toggleButton.addEventListener('click', toggleAdBlock);
updateToggleButton();

// Append the toggle button to the document body
document.body.appendChild(toggleButton);

// Function to handle the fullscreen change event
function handleFullscreenChange() {
  if (document.fullscreenElement) {
    toggleButton.style.display = 'none'; // Hide the toggle button in full-screen mode
  } else {
    toggleButton.style.display = 'block'; // Show the toggle button when exiting full-screen mode
  }
}

// Listen for the fullscreen change event
document.addEventListener('fullscreenchange', handleFullscreenChange);

// Block or unblock ads based on the initial state
if (adBlockEnabled) {
  blockAds();
} else {
  unblockAds();
}
