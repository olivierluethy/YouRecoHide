"use strict";

function updateToggleText(hideFeed) {
  const toggleElement = document.getElementById("toggOnOff");
  toggleElement.innerHTML = hideFeed
    ? "Display Subs <strong>On</strong>"
    : "Display Subs <strong>Off</strong>";
}

// Redirect auf Zielsetzungsseite
document
  .getElementById("redirectButton")
  .addEventListener("click", function () {
    // Erstelle einen neuen Tab mit der Optionsseite
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/goals.html") });
  });

document.getElementById("goToFAQ").addEventListener("click", function(){
  chrome.tabs.create({ url: chrome.runtime.getURL("/pages/FAQ.html") });
})

document.addEventListener("DOMContentLoaded", () => {
  const checkboxSubs = document.getElementById("checkbox-subs");

  // Initialen Wert aus dem Storage abrufen
  chrome.storage.local.get(["hideFeed"], (res) => {
    const hideFeed = res.hideFeed ?? false; // Setzt auf false, wenn nicht gesetzt
    checkboxSubs.checked = hideFeed;
    updateToggleText(hideFeed);
  });

  // Event Listener für Änderungen an der Checkbox
  checkboxSubs.addEventListener("change", () => {
    const isChecked = checkboxSubs.checked;
    chrome.storage.local.set({ hideFeed: isChecked }); // Speichern in Storage
    updateToggleText(isChecked); // Aktualisiere den Text sofort
  });
});