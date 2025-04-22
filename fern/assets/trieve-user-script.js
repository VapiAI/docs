// ==UserScript==
// @name         Vapi
// @namespace    http://tampermonkey.net/
// @version      2025-01-16
// @description  try to take over the world!
// @author       You
// @match        https://docs.vapi.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vapi.ai
// @grant        none
// ==/UserScript==

const removeAllClickListeners = (element) => {
  try {
    const newElement = element?.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);
    return newElement;
  } catch (e) {
    return element;
  }
};

const makeDefaultSearchTrieve = async () => {
  let defaultSearchBar = null;
  try {
    let retries = 0;
    while (!defaultSearchBar && retries < 10) {
      for (const el of document.querySelectorAll("*")) {
        if (el.querySelector('[aria-label="Search"], #fern-search-button')) {
          defaultSearchBar = el.querySelector(
            '[aria-label="Search"], #fern-search-button'
          );
          break;
        } else {
          console.log("Default search bar not found");
        }
      }
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    if (defaultSearchBar?.hasAttribute("disabled")) {
      defaultSearchBar.removeAttribute("disabled");
    }
    defaultSearchBar = removeAllClickListeners(defaultSearchBar);

    defaultSearchBar.onclick = () => {
      const event = new CustomEvent("trieve-open-with-text", {
        detail: { text: "" },
      });
      window.dispatchEvent(event);
    };
  } catch (e) {
    console.error(e);
  }

  return !!defaultSearchBar;
};

try {
  let defaultSearchBar = null;
  let retries = 0;
  let sleepTime = 50;
  while (!retries < 10) {
    defaultSearchBar = await makeDefaultSearchTrieve();
    if (defaultSearchBar) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
    sleepTime = Math.min(sleepTime * 2, 500);
    retries++;
  }
} catch (e) {
  console.error(e);
}

(async function () {
  "use strict";
  try {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.trieve.ai/stable/search-component/index.css";
    document.head.appendChild(link);
  } catch (e) {
    console.error(e);
  }
  import("https://cdn.trieve.ai/stable/search-component/vanilla/index.js").then(
    async (module) => {
      try {
        const { renderToDiv } = module;
        const root = document.createElement("div");
        root.classList.add("trigger");
        document.body.appendChild(root);
        const colorScheme = document.documentElement?.style?.colorScheme;
        const brandColor = colorScheme === "dark" ? "#47ffb6d5" : "#00551dcd";

        renderToDiv(root, {
          apiKey: "tr-hZMKSsTf3ML9hJbAAqPO8K91p9IVe9Oc",
          datasetId: "d3493dc0-2b5c-4c6e-a8ee-b18feeed5b06",
          baseUrl: "https://api.trieve.ai",
          type: "docs",
          analytics: true,
          theme: colorScheme === "dark" ? "dark" : null,
          brandLogoImgSrcUrl:
            "https://storage.googleapis.com/organization-image-assets/vapi-botAvatarDarkSrcUrl-1709929110474.png",
          brandName: "Vapi",
          brandColor: brandColor,
          placeholder: "How can I help?",
          defaultSearchQueries: ["quickstart", "assistant", "tools"],
          defaultAiQuestions: [
            "What voices are supported?",
            "What languages are supported?",
            "How do I connect a custom LLM?",
            "How do I fetch the prompt dynamically?",
          ],
          defaultSearchMode: "search",
          showFloatingButton: "true",
          cssRelease: "none",
          hideOpenButton: true,
        });
      } catch (e) {
        console.error(e);
      }
    },
    (error) => {
      console.error("Failed to load module:", error);
    }
  );
})();
