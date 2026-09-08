// Funktion, um ein Element anhand eines Selektors auszublenden
function hideElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.display = "none";
  }
}

// Funktion, um mehrere Elemente anhand eines Selektors auszublenden
function hideElements(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.style.display = "none";
  });
}

// Hauptfunktion, um YouTube-Videovorschläge, Playlists und die Tablist auszublenden
function hideYouTubeRecommendations() {
  hideElements("#secondary #related ytd-compact-video-renderer"); // Empfehlungen ausblenden
  keepPlaylistAlive("Dein Kanalname"); // Fremde Playlists ausblenden
  hideElement("ytd-watch-next-secondary-results-renderer"); // Tablist ausblenden
  hideElement('.yt-simple-endpoint[title="Shorts"]'); // Shorts ausblenden
  hideElement('.yt-simple-endpoint[title="Startseite"]'); // Startseite ausblenden
  hideElement(".style-scope.ytd-guide-renderer:nth-child(3)"); // Entdecken ausblenden
  hideElement(".sbdd_b"); // Remove recommendations as you type at the search prompt
  hideElement(
    "ytd-notification-topbar-button-renderer.style-scope.ytd-masthead"
  ); // Remove notification button
}
// YouTube Video Vorschläge ausblenden am Ende eines Videos
// Funktion, um YouTube Videoempfehlungen am Ende eines Videos auszublenden
// Remove video recommendation displayed inside video view
function compareVideoWithGoals() {
  // Überprüfen, ob die aktuelle URL ein YouTube-Video ist
  const isVideoPage = () =>
    window.location.href.includes("youtube.com/watch?v=");

  // Funktion zum Ausblenden der Videoempfehlungen
  const hideRecommendations = () => {
    const distOnVid = document.querySelector(".ytp-endscreen-content");
    if (distOnVid) {
      distOnVid.style.display = "none";
    }
  };

  // Initiales Überprüfen der URL
  if (isVideoPage()) {
    hideRecommendations();
  }

  // Observer, um Änderungen der URL zu überwachen
  const observer = new MutationObserver(() => {
    if (isVideoPage()) {
      hideRecommendations();
    }
  });

  // Observer-Konfiguration
  observer.observe(document.body, { childList: true, subtree: true });
}

// Call the function to start the observer
compareVideoWithGoals();

// Remove search recommendations when searching in the search bar
const searchRecommendations = document.querySelector(
  'div[role="listbox"]'
);

if(searchRecommendations){
  searchRecommendations.remove();
}