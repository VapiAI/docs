document.addEventListener('click', function () {
  function isPlaygroundEndpointButtonVisible() {
    const playgroundEndpoint = document.querySelector('.playground-endpoint .fern-button.outlined');
    return playgroundEndpoint;
  }

  function clickPlaygroundEndpointButton() {
    const playgroundEndpointButton = document.querySelector('.playground-endpoint .fern-button.outlined');
    if (playgroundEndpointButton) {
      playgroundEndpointButton.click();
    }
  }

  const playgroundEndpoint = document.querySelector('.fern-header-container .fern-button');
  fernHeaderButtons.forEach(button => {
    button.addEventListener('click', function () {
      if (isPlaygroundEndpointButtonVisible()) {
        clickPlaygroundEndpointButton();
      }
    });
  });

  const fernHeaderButtons = document.querySelectorAll('.fern-header .fern-button');
  fernHeaderButtons.forEach(button => {
    button.addEventListener('click', function () {
      if (isPlaygroundEndpointButtonVisible()) {
        clickPlaygroundEndpointButton();
      }
    });
  });
  
  const fernHeaderTabs = document.querySelectorAll('.fern-header-container .fern-header-tab-button');
  fernHeaderTabs.forEach(button => {
    button.addEventListener('click', function () {
      if (isPlaygroundEndpointButtonVisible()) {
        clickPlaygroundEndpointButton();
      }
    });
  });
});
