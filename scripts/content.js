"use strict";
redirectToSubscriptions();
cheatingRedirect();
observeDOMForRecommendations(hideYouTubeRecommendations);
hideYouTubeRecommendations();
addLogoClickListener();

// Set an interval to check for various conditions every second
let intervalId = null; // Globale Variable für das Intervall

const generalIntuitiveBlocking = setInterval(() => {
  console.log("General Blocking is ON!");
  hideNewnessDots();
  document.title = document.title.replace(/\s*\(\d+\)/g, "");

  // Überprüfen, ob wir auf der Suchseite sind
  if (window.location.href.includes("https://www.youtube.com/results")) {
    noGoalStopper();
  } else {
    // Wenn wir die Suchseite verlassen, stoppe das Intervall
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null; // Setze es zurück
      console.log("Stopped noGoalStopper interval.");
      const searchResults = document.querySelector("#primary");
      if (searchResults) {
        searchResults.style.display = "none";
      }
    }
  }
}, 1000);

function hideNewnessDots() {
  const newnessDots = document.querySelectorAll("#newness-dot");
  newnessDots.forEach((dot) => {
    dot.style.display = "none";
  });
}

function noGoalStopper() {
  if (intervalId !== null) return; // Verhindere, dass ein neues Intervall gestartet wird, wenn bereits aktiv

  intervalId = setInterval(() => {
    console.log("We are listening to your goals");

    chrome.storage.sync.get("goals", function (data) {
      const goals = data.goals || [];

      if (goals.length === 0) {
        console.log("Es wurden keine Ziele definiert");
        const mainElement = document.querySelector(
          ".style-scope.ytd-page-manager[role='main']"
        );

        const searchResults = document.querySelector("#primary");
        if (searchResults) {
          searchResults.style.display = "none";
        }

        const container = document.querySelector(".style-scope.ytd-search");
        if (container) {
          container.style.display = "none";
        }

        const header = document.querySelector(
          ".style-scope.ytd-page-manager[role='main']"
        );
        if (header) {
          header.style.height = "50vh";
        }

        const filterButton = document.querySelector(
          '.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--text[aria-label="Suchfilter"]'
        );
        if (filterButton) {
          filterButton.style.display = "none";
        }

        const existingWarning = document.querySelector(".goal-warning");
        if (mainElement && !existingWarning) {
          const warningDiv = document.createElement("div");
          warningDiv.className = "goal-warning";
          warningDiv.style.cssText = `
              text-align: center;
              margin-top: auto;
              margin-bottom: auto;
            `;

          const h1Element = document.createElement("h1");
          h1Element.textContent = "Please define your goals first.";
          h1Element.style.cssText = `
              color: white;
              font-size: 30px;
            `;

          const defineGoalsButton = document.createElement("button");
          defineGoalsButton.textContent = "Define Goals";
          defineGoalsButton.style.cssText = `
              background-color: blue;
              color: white;
              padding: 18px 32px;
              cursor: pointer;
              border: none;
              box-shadow: 0px 0px 29px 0px rgba(255, 255, 255, 0.8);
              font-size: 15px;
              margin-top: 20px;
              transition-duration: 0.5s;
            `;

          defineGoalsButton.title = "Click here to define your goals";

          defineGoalsButton.addEventListener("mouseover", function () {
            defineGoalsButton.style.backgroundColor = "white";
            defineGoalsButton.style.color = "blue";
            defineGoalsButton.style.transform = "scale(1.05)";
          });

          defineGoalsButton.addEventListener("mouseout", function () {
            defineGoalsButton.style.backgroundColor = "blue";
            defineGoalsButton.style.color = "white";
            defineGoalsButton.style.transform = "scale(1)";
          });

          defineGoalsButton.addEventListener("click", function () {
            chrome.runtime.sendMessage({ action: "openGoalsPage" });
          });

          warningDiv.appendChild(h1Element);
          warningDiv.appendChild(defineGoalsButton);
          mainElement.insertBefore(warningDiv, mainElement.firstChild);
        }
      } else {
        const searchResults = document.querySelector("#primary");
        if (searchResults) {
          searchResults.style.display = "block";
        }

        const filterButton = document.querySelector(
          '.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--text[aria-label="Suchfilter"]'
        );
        if (filterButton) {
          filterButton.style.display = "inline-block";
        }

        const existingWarning = document.querySelector(".goal-warning");
        if (existingWarning) {
          existingWarning.remove();
        }
      }
    });

    // Prüfen, ob die URL die Suchseite verlässt
    if (!window.location.href.includes("https://www.youtube.com/results")) {
      clearInterval(intervalId);
      intervalId = null; // Setze es zurück
      console.log("Stopped noGoalStopper interval due to URL change.");
      const searchResults = document.querySelector("#primary");
      if (searchResults) {
        searchResults.style.display = "none";
      }
    }
  }, 1000);
}
