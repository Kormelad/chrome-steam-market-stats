chrome.webRequest.onCompleted.addListener(async (details) => {
  await chrome.storage.session.set({
    histogramUrl: details.url
  });
}, {
  urls: [
    "https://steamcommunity.com/market/itemordershistogram*"
  ]
});
