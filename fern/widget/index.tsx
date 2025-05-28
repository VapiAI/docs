import React from "react";
import ReactDOM from "react-dom/client";
import reactToWebComponent from "react-to-webcomponent";
import VoiceAgentWidget from "./voice-widget";

const tagName = "vapi-voice-agent-widget";
console.log('[widget-webcomponent] Checking for custom element', tagName);
if (!customElements.get(tagName)) {
  const WebComponent = reactToWebComponent(VoiceAgentWidget, React, ReactDOM, {
    props: ["apiKey", "apikey"]
  });
  customElements.define(tagName, WebComponent);
  console.log('[widget-webcomponent] Custom element defined:', tagName);
} else {
  console.log('[widget-webcomponent] Custom element already defined:', tagName);
} 