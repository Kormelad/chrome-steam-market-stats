chrome.webRequest.onCompleted.addListener((details) => {
  chrome.runtime.sendMessage({
    url: details.url
  });
}, {
  urls: [
    "https://steamcommunity.com/market/itemordershistogram*"
  ]
});
