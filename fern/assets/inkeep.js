const searchButtonContainerIds = [
    "fern-search-bar",
    "fern-search-button",
];

// Define the base settings
const inkeepSettings = {
  isOpen: true,
  baseSettings: {
      apiKey: "a58574ddc0e41c75990d1c0e890ad3c8725dc9e7c8ee3d3e",
      integrationId: "clthv1rgg000sdjil26l2vg03",
      organizationId: "org_SGvQFUfKzrYkf8z8",
      primaryBrandColor: "#5DFECA"
  },
  aiChatSettings: {
      chatSubjectName: "Vapi",
      botAvatarSrcUrl: "https://storage.googleapis.com/organization-image-assets/vapi-botAvatarSrcUrl-1709929183314.png",
      botAvatarDarkSrcUrl: "https://storage.googleapis.com/organization-image-assets/vapi-botAvatarDarkSrcUrl-1709929110474.png",
      getHelpCallToActions: [
          {
              name: "Contact Us",
              url: "mailto:support@vapi.ai",
              icon: {
                  builtIn: "IoMail"
              }
          }
      ],
      quickQuestions: [
          "What voices are supported?",
          "What languages are supported?",
          "How do I connect a custom LLM?",
          "How do I fetch the prompt dynamically?"
      ]
  }
};

// Function to initialize search containers
function initializeSearchContainers() {
  // Clone and replace search buttons to remove existing listeners
  // Only process elements that exist
  const clonedSearchButtonContainers = searchButtonContainerIds
      .map((id) => {
          const originalElement = document.getElementById(id);
          if (!originalElement) {
              console.log(`Search container ${id} not found, skipping...`);
              return null;
          }
          const clonedElement = originalElement.cloneNode(true);
          originalElement.parentNode.replaceChild(clonedElement, originalElement);
          return clonedElement;
      })
      .filter(Boolean); // Remove null entries

  return clonedSearchButtonContainers;
}

// Function to initialize Inkeep
function initializeInkeep() {
  // Color mode sync settings
  const colorModeSettings = {
      observedElement: document.documentElement,
      isDarkModeCallback: (el) => {
          return el.classList.contains("dark");
      },
      colorModeAttribute: "class",
  };

  // Initialize the chat button
  Inkeep().embed({
      componentType: "ChatButton",
      colorModeSync: colorModeSettings,
      properties: inkeepSettings,
  });

  // Initialize the search modal
  const inkeepSearchModal = Inkeep({
      ...inkeepSettings.baseSettings,
  }).embed({
      componentType: "CustomTrigger",
      colorModeSync: colorModeSettings,
      properties: {
          ...inkeepSettings,
          isOpen: false,
          onClose: () => {
              inkeepSearchModal.render({
                  isOpen: false,
              });
          },
      },
  });

  // Get search containers after DOM is ready
  const clonedSearchButtonContainers = initializeSearchContainers();

  // Add click listeners to search buttons
  clonedSearchButtonContainers.forEach((trigger) => {
      trigger.addEventListener("click", function () {
          inkeepSearchModal.render({
              isOpen: true,
          });
      });
  });

  // Add keyboard shortcut listener
  window.addEventListener(
      "keydown",
      (event) => {
          if (
              (event.metaKey || event.ctrlKey) &&
              (event.key === "/")
          ) {
              event.stopPropagation();
              inkeepSearchModal.render({ isOpen: true });
              return false;
          }
      },
      true
  );
}

// Create and inject the Inkeep script
const inkeepScript = document.createElement("script");
inkeepScript.type = "module";
inkeepScript.src = "https://unpkg.com/@inkeep/widgets-embed@latest/dist/embed.js";

// Wait for both DOM content and Inkeep script to load
let domReady = false;
let scriptLoaded = false;

function tryInitialize() {
  if (domReady && scriptLoaded) {
      initializeInkeep();
  }
}

// Handle DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  domReady = true;
  tryInitialize();
});

// Handle script load
inkeepScript.addEventListener("load", () => {
  scriptLoaded = true;
  tryInitialize();
});

// Handle case where DOMContentLoaded has already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  domReady = true;
  tryInitialize();
}

// Inject the script
document.body.appendChild(inkeepScript);