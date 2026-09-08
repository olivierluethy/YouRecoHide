chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openGoalsPage") {
    // Neuen Tab mit der goals.html-Seite öffnen
    chrome.tabs.create({
      url: chrome.runtime.getURL("pages/goals.html"),
    });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "blockSite") {
    // Update the current tab to show the restricted.html page
    chrome.tabs.update(sender.tab.id, {
      url: chrome.runtime.getURL("pages/restricted.html"),
    });
  }
});
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/downloaded.html") });
  }else if (details.reason === "update") {
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/update.html") });
  }
});
// Set a URL to open when the extension is uninstalled
chrome.runtime.setUninstallURL("https://forms.gle/2gDzpa9ckDuRXnTz7");