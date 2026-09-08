// Observer zur Beobachtung von DOM-Änderungen einrichten
function observeDOMForRecommendations(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.body, { childList: true, subtree: true });
}

// Funktion, um das Element zu verstecken oder anzuzeigen
function toggleFeed(hideFeed) {
  const feedElement = document.querySelector(
    '.style-scope ytd-page-manager [role="main"]'
  );

  const abosFeedButton = document.querySelector(
    '.yt-simple-endpoint[title="Abos"]'
  );

  // Check if the elements exist and if the current page is the subscriptions page
  if (
    feedElement &&
    abosFeedButton &&
    window.location.pathname === "/feed/subscriptions"
  ) {
    // Show or hide the feed and the Abos button based on hideFeed
    const displayStyle = hideFeed ? "block" : "none";
    feedElement.style.display = displayStyle;
    abosFeedButton.style.display = displayStyle;
  }
}

/* Interaction Chrome Storage to remove subs page videos */
// Funktion zur Initialisierung des MutationObservers für das Feed-Element
function observeDOMForFeed() {
  const observer = new MutationObserver((mutations) => {
    try {
      // Sicherstellen, dass der Chrome-Storage-Zugriff nur erfolgt, wenn der Kontext gültig ist
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["hideFeed"], (res) => {
          const hideFeed = res.hideFeed ?? false; // Fallback zu false, wenn nicht gesetzt
          toggleFeed(hideFeed); // Überprüfe, ob der Feed angezeigt werden soll
        });
      } else {
        console.error("Chrome Storage API ist nicht verfügbar.");
      }
    } catch (err) {
      console.error("Fehler beim Zugriff auf Chrome Storage: ", err);
    }
  });

  // Beobachte Änderungen an der Seite (dynamische Inhalte)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialen Wert aus dem Storage abrufen und den Feed sofort anpassen
chrome.storage.local.get(["hideFeed"], (res) => {
  const hideFeed = res.hideFeed ?? false;
  toggleFeed(hideFeed); // Feed initial anzeigen/ausblenden
  observeDOMForFeed(); // Beobachte Änderungen am Feed-Element
});

// Echtzeit-Überwachung von Änderungen im Storage
chrome.storage.onChanged.addListener((changes) => {
  if (changes.hideFeed) {
    toggleFeed(changes.hideFeed.newValue); // Ändert den Feed, wenn der Wert sich ändert
  }
});
